import os
import re
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import utc_now
from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_startup
from app.crud import evaluator_assignment as crud_assignment
from app.crud import pilot as crud_pilot
from app.crud import pilot_submission as crud_pilot_submission
from app.models.activity_log import ActivityAction
from app.models.pilot import PilotStatus
from app.models.pilot_submission import PilotSubmission, PilotSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.pilot_submission import (
    PilotSubmissionCreate,
    PilotSubmissionResponse,
    PilotSubmissionUpdate,
)
from app.services.activity import record_activity
from app.services.notifications import (
    notify_submission_submitted,
    notify_submission_under_evaluation,
)

router = APIRouter(prefix="/pilot-submissions", tags=["Pilot Submissions"])


async def _auto_assign_evaluator_if_needed(db: AsyncSession, submission, pilot) -> None:
    """
    Automatically assign an active evaluator to a submission when the challenge already
    holds metadata for a preferred evaluator or when no explicit assignment exists yet.
    """
    challenge = pilot.challenge if pilot and pilot.challenge else None
    if not challenge:
        return

    evaluator_id = None
    requirements = challenge.requirements or {}
    if isinstance(requirements, dict):
        assigned_evaluator = requirements.get("assigned_evaluator")
        if isinstance(assigned_evaluator, dict):
            evaluator_id = assigned_evaluator.get("id")

    if not evaluator_id:
        result = await db.execute(
            select(User)
            .where(User.role == UserRole.EVALUATOR, User.is_active.is_(True))
            .order_by(User.id)
        )
        evaluator = result.scalar_one_or_none()
        if evaluator:
            evaluator_id = evaluator.id

    if not evaluator_id:
        return

    existing_assignment = await crud_assignment.get_assignment_by_submission_and_evaluator(
        db=db,
        pilot_submission_id=submission.id,
        evaluator_id=evaluator_id,
    )
    if existing_assignment:
        return

    await crud_assignment.create_assignment(
        db=db,
        pilot_submission_id=submission.id,
        evaluator_id=evaluator_id,
    )


@router.post(
    "",
    response_model=PilotSubmissionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pilot_submission(
    submission_in: PilotSubmissionCreate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new pilot submission in DRAFT status.
    - STARTUP only.
    - Pilot must exist and belong to the authenticated startup (pilot.startup_id == current_user.id).
    - Pilot status must be IN_PROGRESS.
    - Only 1 submission allowed per pilot (returns HTTP 409 if duplicate).
    """
    pilot = await crud_pilot.get_pilot_by_id(db, submission_in.pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    if pilot.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create submissions for your own assigned pilots",
        )

    if pilot.status == PilotStatus.ASSIGNED:
        # Automatically transition pilot to IN_PROGRESS upon first submission creation
        pilot.status = PilotStatus.IN_PROGRESS
        pilot.updated_at = utc_now()
        db.add(pilot)
        await db.flush()
    elif pilot.status != PilotStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Submissions can only be created when Pilot status is ASSIGNED or IN_PROGRESS (current status: '{pilot.status.value}')",
        )

    existing = await crud_pilot_submission.get_submission_by_pilot_id(db, submission_in.pilot_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission already exists for this pilot project",
        )

    try:
        submission = await crud_pilot_submission.create_pilot_submission(
            db=db,
            submission_in=submission_in,
            startup_id=current_user.id,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A submission already exists for this pilot project",
        )

    await _auto_assign_evaluator_if_needed(db=db, submission=submission, pilot=pilot)

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.SUBMISSION_CREATED,
        resource_type="pilot_submission",
        resource_id=submission.id,
        description=f"Pilot submission created for pilot ID {pilot.id}.",
    )
    await db.commit()
    await db.refresh(submission)
    return submission


def get_upload_dir() -> str:
    custom_dir = os.getenv("UPLOADS_DIR")
    if custom_dir:
        os.makedirs(custom_dir, exist_ok=True)
        return custom_dir
    default_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "evidence")
    os.makedirs(default_dir, exist_ok=True)
    return default_dir


@router.post(
    "/upload-evidence",
    status_code=status.HTTP_201_CREATED,
)
async def upload_submission_evidence(
    request: Request,
    current_user: User = Depends(require_startup),
):
    """
    Upload actual device evidence / telemetry document.
    - STARTUP only.
    - Uses pure Python multipart MIME parser (zero external packages required).
    - Saves file safely in backend uploads storage outside repository tracking.
    - Returns accessible file metadata and download URL.
    """
    upload_dir = get_upload_dir()

    content_type = request.headers.get("content-type", "")
    body = await request.body()

    max_size = 25 * 1024 * 1024  # 25MB
    if len(body) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds the 25MB maximum limit",
        )

    original_filename = "evidence_document"
    file_bytes = b""
    detected_mime = "application/octet-stream"

    if "multipart/form-data" in content_type:
        import email
        msg_bytes = f"Content-Type: {content_type}\r\nMIME-Version: 1.0\r\n\r\n".encode("utf-8") + body
        msg = email.message_from_bytes(msg_bytes)
        if msg.is_multipart():
            for part in msg.get_payload():
                cd = part.get("Content-Disposition", "")
                if "filename=" in cd:
                    m = re.search(r'filename="?([^";\r\n]+)"?', cd)
                    if m:
                        original_filename = m.group(1).strip()
                    detected_mime = part.get_content_type()
                    payload = part.get_payload(decode=True)
                    if payload is not None:
                        file_bytes = payload
                    break
        if not file_bytes:
            file_bytes = body
    else:
        original_filename = request.headers.get("x-filename", "evidence_document")
        detected_mime = content_type or "application/octet-stream"
        file_bytes = body

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file content received in upload payload",
        )

    # Sanitize and unique filename
    safe_name = re.sub(r"[^a-zA-Z0-9_.-]", "_", original_filename)
    unique_filename = f"{uuid.uuid4().hex[:10]}_{safe_name}"
    file_path = os.path.join(upload_dir, unique_filename)

    with open(file_path, "wb") as f:
        f.write(file_bytes)

    file_url = f"/pilot-submissions/evidence-files/{unique_filename}"
    return {
        "filename": original_filename,
        "saved_name": unique_filename,
        "url": file_url,
        "size_bytes": len(file_bytes),
        "content_type": detected_mime,
        "uploaded_at": utc_now().isoformat(),
    }


def find_evidence_file_on_disk(filename: str) -> Optional[str]:
    """
    Safely find an evidence file on disk across potential upload directories.
    Prevents directory traversal attacks while correctly locating files.
    """
    import urllib.parse
    decoded_name = urllib.parse.unquote(filename)
    safe_filename = os.path.basename(decoded_name)
    if not safe_filename:
        return None

    # Base candidate directories
    candidate_dirs = [
        get_upload_dir(),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "evidence"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "evidence"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads"),
    ]

    for bdir in candidate_dirs:
        if not os.path.exists(bdir):
            continue
        direct_path = os.path.join(bdir, safe_filename)
        if os.path.isfile(direct_path):
            return os.path.abspath(direct_path)
        for root, _, files in os.walk(bdir):
            if safe_filename in files:
                return os.path.abspath(os.path.join(root, safe_filename))

    return None


@router.get(
    "/evidence-files/{filename:path}",
    status_code=status.HTTP_200_OK,
)
async def download_evidence_file(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Securely download/view an uploaded pilot evidence document with strict role- and assignment-based authorization.
    - Accessible only to authorized users (Admin, owner Startup, challenge Government, assigned Evaluator).
    - Prevents unauthorized evaluators or external parties from accessing documents (returns HTTP 403).
    """
    import mimetypes
    import urllib.parse
    from fastapi.responses import FileResponse
    from sqlalchemy.orm import selectinload
    from app.models.pilot import Pilot
    from app.crud.challenge import is_challenge_assigned_to_evaluator
    from app.crud.evaluator_assignment import get_assignment_by_submission_and_evaluator

    safe_filename = os.path.basename(urllib.parse.unquote(filename))
    file_path = find_evidence_file_on_disk(filename)

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested evidence file not found on server",
        )

    # Authorization verification
    if current_user.role != UserRole.ADMIN:
        result = await db.execute(
            select(PilotSubmission).options(
                selectinload(PilotSubmission.pilot).selectinload(Pilot.challenge),
                selectinload(PilotSubmission.evaluator_assignments),
            )
        )
        all_submissions = list(result.scalars().all())

        matching_submission = None
        decoded_name = urllib.parse.unquote(filename)
        for sub in all_submissions:
            evidence_data = sub.evidence
            if evidence_data:
                evidence_str = str(evidence_data)
                if (
                    safe_filename in evidence_str
                    or filename in evidence_str
                    or decoded_name in evidence_str
                ):
                    matching_submission = sub
                    break
                if isinstance(evidence_data, dict):
                    found = False
                    for k, v in evidence_data.items():
                        if isinstance(v, dict):
                            if (
                                v.get("saved_name") == safe_filename
                                or v.get("filename") == safe_filename
                                or safe_filename in str(v.get("url", ""))
                            ):
                                matching_submission = sub
                                found = True
                                break
                        elif isinstance(v, str) and (safe_filename in v or decoded_name in v):
                            matching_submission = sub
                            found = True
                            break
                    if found:
                        break

        if matching_submission:
            if current_user.role == UserRole.STARTUP:
                if matching_submission.startup_id != current_user.id:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access this evidence document",
                    )
            elif current_user.role == UserRole.GOVERNMENT:
                if (
                    not matching_submission.pilot
                    or not matching_submission.pilot.challenge
                    or matching_submission.pilot.challenge.government_user_id != current_user.id
                ):
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You do not have permission to access evidence documents for this challenge",
                    )
            elif current_user.role == UserRole.EVALUATOR:
                assigned_directly = any(
                    a.evaluator_id == current_user.id for a in matching_submission.evaluator_assignments
                )
                if not assigned_directly:
                    direct_check = await get_assignment_by_submission_and_evaluator(
                        db=db,
                        pilot_submission_id=matching_submission.id,
                        evaluator_id=current_user.id,
                    )
                    assigned_directly = direct_check is not None

                assigned_challenge = False
                if matching_submission.pilot and matching_submission.pilot.challenge:
                    assigned_challenge = await is_challenge_assigned_to_evaluator(
                        db, matching_submission.pilot.challenge, current_user.id
                    )

                if not assigned_directly and not assigned_challenge:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="You are not authorized to view evidence for this submission",
                    )
        else:
            if current_user.role not in (UserRole.STARTUP, UserRole.ADMIN):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access this evidence file",
                )

    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = "application/pdf" if safe_filename.lower().endswith(".pdf") else "application/octet-stream"

    return FileResponse(
        path=file_path,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


@router.get(
    "/{submission_id}/evidence/{filename:path}",
    status_code=status.HTTP_200_OK,
)
async def download_submission_evidence_file(
    submission_id: int,
    filename: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Download evidence file scoping directly by submission ID for strict resource authorization.
    """
    import mimetypes
    import urllib.parse
    from fastapi.responses import FileResponse
    from app.crud.challenge import is_challenge_assigned_to_evaluator
    from app.crud.evaluator_assignment import get_assignment_by_submission_and_evaluator

    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    # Authorization verification
    if current_user.role != UserRole.ADMIN:
        if current_user.role == UserRole.STARTUP:
            if submission.startup_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access evidence for this submission",
                )
        elif current_user.role == UserRole.GOVERNMENT:
            if (
                not submission.pilot
                or not submission.pilot.challenge
                or submission.pilot.challenge.government_user_id != current_user.id
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You do not have permission to access evidence for this challenge",
                )
        elif current_user.role == UserRole.EVALUATOR:
            direct_check = await get_assignment_by_submission_and_evaluator(
                db=db,
                pilot_submission_id=submission.id,
                evaluator_id=current_user.id,
            )
            assigned_directly = direct_check is not None
            assigned_challenge = False
            if submission.pilot and submission.pilot.challenge:
                assigned_challenge = await is_challenge_assigned_to_evaluator(
                    db, submission.pilot.challenge, current_user.id
                )
            if not assigned_directly and not assigned_challenge:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not authorized to view evidence for this submission",
                )

    safe_filename = os.path.basename(urllib.parse.unquote(filename))
    file_path = find_evidence_file_on_disk(filename)

    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Requested evidence file not found on server",
        )

    content_type, _ = mimetypes.guess_type(file_path)
    if not content_type:
        content_type = "application/pdf" if safe_filename.lower().endswith(".pdf") else "application/octet-stream"

    return FileResponse(
        path=file_path,
        media_type=content_type,
        headers={
            "Content-Disposition": f'inline; filename="{safe_filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )



@router.get(
    "",
    response_model=List[PilotSubmissionResponse],
)
async def list_pilot_submissions(
    pilot_id: Optional[int] = Query(None, description="Filter by pilot ID"),
    status_filter: Optional[PilotSubmissionStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve pilot submissions filtered according to user role:
    - STARTUP: Only submissions belonging to startup's pilots.
    - GOVERNMENT: Only submissions for government user's challenges.
    - EVALUATOR: Read-only access to submitted/evaluated submissions.
    - ADMIN: Sees all.
    """
    return await crud_pilot_submission.get_submissions_for_user(
        db=db,
        current_user=current_user,
        pilot_id=pilot_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{submission_id}",
    response_model=PilotSubmissionResponse,
)
async def get_pilot_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a single pilot submission with role authorization checks.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if current_user.role == UserRole.STARTUP and submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this submission",
        )

    if current_user.role == UserRole.GOVERNMENT and submission.pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view submissions for this challenge",
        )

    if current_user.role == UserRole.EVALUATOR:
        if submission.status == PilotSubmissionStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Evaluators cannot view draft pilot submissions",
            )
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        assignment = await crud_assignment.get_assignment_by_submission_and_evaluator(
            db=db,
            pilot_submission_id=submission.id,
            evaluator_id=current_user.id,
        )
        assigned_challenge = (
            submission.pilot
            and submission.pilot.challenge
            and await is_challenge_assigned_to_evaluator(db, submission.pilot.challenge, current_user.id)
        )
        if not assignment and not assigned_challenge:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to view this pilot submission",
            )

    return submission


@router.put(
    "/{submission_id}",
    response_model=PilotSubmissionResponse,
)
async def update_pilot_submission(
    submission_id: int,
    submission_in: PilotSubmissionUpdate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a DRAFT pilot submission.
    - STARTUP only for its own submission.
    - Only DRAFT submissions can be edited.
    - Cannot modify pilot_id, startup_id, or status.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own submissions",
        )

    if submission.status != PilotSubmissionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only DRAFT submissions can be edited (current status: '{submission.status.value}')",
        )

    return await crud_pilot_submission.update_pilot_submission(
        db=db,
        db_submission=submission,
        submission_in=submission_in,
    )


@router.post(
    "/{submission_id}/submit",
    response_model=PilotSubmissionResponse,
)
async def submit_pilot_submission(
    submission_id: int,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a DRAFT pilot submission.
    - STARTUP only for its own submission.
    - Changes status DRAFT -> SUBMITTED.
    - Sets submitted_at timestamp.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own pilot submissions",
        )

    if submission.status != PilotSubmissionStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Only DRAFT submissions can be submitted (current status: '{submission.status.value}')",
        )

    if submission.pilot.status != PilotStatus.IN_PROGRESS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Submissions can only be submitted while the pilot project is IN_PROGRESS",
        )

    challenge_title = submission.pilot.challenge.title
    government_user_id = submission.pilot.challenge.government_user_id

    updated = await crud_pilot_submission.update_submission_status(
        db=db,
        db_submission=submission,
        new_status=PilotSubmissionStatus.SUBMITTED,
    )

    await _auto_assign_evaluator_if_needed(db=db, submission=updated, pilot=submission.pilot)

    await notify_submission_submitted(
        db=db,
        government_user_id=government_user_id,
        challenge_title=challenge_title,
        submission_id=submission.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.SUBMISSION_SUBMITTED,
        resource_type="pilot_submission",
        resource_id=submission.id,
        description=f"Pilot submission submitted for challenge '{challenge_title}'.",
    )
    await db.commit()
    await db.refresh(updated)
    return updated

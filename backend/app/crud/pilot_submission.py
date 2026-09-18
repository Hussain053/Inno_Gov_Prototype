from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge
from app.models.pilot import Pilot
from app.models.pilot_submission import PilotSubmission, PilotSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.pilot_submission import PilotSubmissionCreate, PilotSubmissionUpdate


async def create_pilot_submission(
    db: AsyncSession,
    submission_in: PilotSubmissionCreate,
    startup_id: int,
) -> PilotSubmission:
    """
    Create a new pilot submission in DRAFT status for a pilot.
    """
    new_submission = PilotSubmission(
        pilot_id=submission_in.pilot_id,
        startup_id=startup_id,
        results=submission_in.results,
        kpi_results=submission_in.kpi_results,
        evidence=submission_in.evidence,
        status=PilotSubmissionStatus.DRAFT,
    )
    db.add(new_submission)
    await db.commit()
    await db.refresh(new_submission)
    return new_submission


async def get_submission_by_id(
    db: AsyncSession,
    submission_id: int,
) -> Optional[PilotSubmission]:
    """
    Fetch a single submission by ID with pilot and challenge relationships loaded.
    """
    result = await db.execute(
        select(PilotSubmission)
        .options(
            selectinload(PilotSubmission.pilot).selectinload(Pilot.challenge)
        )
        .where(PilotSubmission.id == submission_id)
    )
    return result.scalar_one_or_none()


async def get_submission_by_pilot_id(
    db: AsyncSession,
    pilot_id: int,
) -> Optional[PilotSubmission]:
    """
    Fetch submission by pilot_id to enforce 1-to-1 uniqueness constraint.
    """
    result = await db.execute(
        select(PilotSubmission).where(PilotSubmission.pilot_id == pilot_id)
    )
    return result.scalar_one_or_none()


async def get_submissions_for_user(
    db: AsyncSession,
    current_user: User,
    pilot_id: Optional[int] = None,
    status: Optional[PilotSubmissionStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[PilotSubmission]:
    """
    Retrieve pilot submissions based on user role and permissions.
    - STARTUP: Submissions belonging to pilots owned by current startup.
    - GOVERNMENT: Submissions for pilots associated with government user's challenges.
    - EVALUATOR: Read-only access to submissions in SUBMITTED / UNDER_EVALUATION / ACCEPTED / REJECTED status.
    - ADMIN: All.
    """
    query = select(PilotSubmission).options(
        selectinload(PilotSubmission.pilot).selectinload(Pilot.challenge),
        selectinload(PilotSubmission.evaluator_assignments),
    )

    if current_user.role == UserRole.STARTUP:
        query = query.where(PilotSubmission.startup_id == current_user.id)
    elif current_user.role == UserRole.GOVERNMENT:
        query = query.join(PilotSubmission.pilot).join(Pilot.challenge).where(
            Challenge.government_user_id == current_user.id
        )
    elif current_user.role == UserRole.EVALUATOR:
        query = query.where(PilotSubmission.status != PilotSubmissionStatus.DRAFT)
    # ADMIN sees all

    if pilot_id is not None:
        query = query.where(PilotSubmission.pilot_id == pilot_id)
    if status is not None:
        query = query.where(PilotSubmission.status == status)

    query = query.order_by(PilotSubmission.created_at.desc())
    result = await db.execute(query)
    all_subs = list(result.scalars().all())

    if current_user.role == UserRole.EVALUATOR:
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        filtered = []
        for s in all_subs:
            assigned_directly = any(a.evaluator_id == current_user.id for a in s.evaluator_assignments)
            if assigned_directly:
                filtered.append(s)
            elif s.pilot and s.pilot.challenge and await is_challenge_assigned_to_evaluator(db, s.pilot.challenge, current_user.id):
                filtered.append(s)
        return filtered[skip : skip + limit]

    return all_subs[skip : skip + limit]


async def update_pilot_submission(
    db: AsyncSession,
    db_submission: PilotSubmission,
    submission_in: PilotSubmissionUpdate,
) -> PilotSubmission:
    """
    Update details of a DRAFT pilot submission.
    """
    update_data = submission_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_submission, field, value)

    db_submission.updated_at = utc_now()
    await db.commit()
    await db.refresh(db_submission)
    return db_submission


async def update_submission_status(
    db: AsyncSession,
    db_submission: PilotSubmission,
    new_status: PilotSubmissionStatus,
) -> PilotSubmission:
    """
    Update submission status and set submitted_at if submitting.
    """
    db_submission.status = new_status
    if new_status == PilotSubmissionStatus.SUBMITTED and not db_submission.submitted_at:
        db_submission.submitted_at = datetime.utcnow()

    db_submission.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(db_submission)
    return db_submission

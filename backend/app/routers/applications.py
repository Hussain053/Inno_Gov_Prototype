from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_government, require_startup
from app.crud import application as crud_application
from app.crud import challenge as crud_challenge
from app.models.activity_log import ActivityAction
from app.models.application import Application, ApplicationStatus
from app.models.challenge import ChallengeStatus
from app.models.user import User, UserRole
from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    ApplicationUpdate,
)
from app.services.activity import record_activity
from app.services.notifications import (
    notify_application_status_changed,
    notify_application_submitted,
    notify_application_withdrawn,
)

router = APIRouter(prefix="/applications", tags=["Applications"])

VALID_TRANSITIONS = {
    ApplicationStatus.DRAFT: {ApplicationStatus.SUBMITTED},
    ApplicationStatus.SUBMITTED: {
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.WITHDRAWN,
    },
    ApplicationStatus.UNDER_REVIEW: {
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
        ApplicationStatus.WITHDRAWN,
    },
    ApplicationStatus.SHORTLISTED: set(),
    ApplicationStatus.REJECTED: set(),
    ApplicationStatus.WITHDRAWN: set(),
}


def serialize_application_response(application: Application) -> ApplicationResponse:
    startup = application.startup
    challenge = application.challenge
    startup_profile = startup.startup_profile if startup else None

    return ApplicationResponse(
        id=application.id,
        challenge_id=application.challenge_id,
        startup_id=application.startup_id,
        status=application.status,
        submitted_at=application.submitted_at,
        created_at=application.created_at,
        updated_at=application.updated_at,
        startup_name=(startup_profile.company_name if startup_profile and startup_profile.company_name else startup.name if startup else None),
        challenge_title=challenge.title if challenge else None,
        startup_industry=startup_profile.industry if startup_profile else None,
    )


@router.post(
    "",
    response_model=ApplicationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_application(
    application_in: ApplicationCreate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new application for an OPEN challenge.
    - STARTUP only.
    - startup_id set automatically from authenticated user.
    - Initial status = DRAFT.
    - Returns HTTP 409 if application already exists for this startup/challenge pair.
    """
    challenge = await crud_challenge.get_challenge_by_id(db, application_in.challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if challenge.status != ChallengeStatus.OPEN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Applications can only be created for OPEN challenges",
        )

    if challenge.application_deadline and date.today() > challenge.application_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application deadline for this challenge has passed",
        )

    existing = await crud_application.get_application_by_challenge_and_startup(
        db=db,
        challenge_id=application_in.challenge_id,
        startup_id=current_user.id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Application for this challenge already exists",
        )

    try:
        application = await crud_application.create_application(
            db=db,
            application_in=application_in,
            startup_id=current_user.id,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Application for this challenge already exists",
        )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.APPLICATION_CREATED,
        resource_type="application",
        resource_id=application.id,
        description=f"Application created for challenge '{challenge.title}'.",
    )
    await db.commit()
    refreshed_application = await crud_application.get_application_by_id(db, application.id)
    return serialize_application_response(refreshed_application)


@router.get(
    "",
    response_model=List[ApplicationResponse],
)
async def list_applications(
    challenge_id: Optional[int] = Query(None, description="Filter by challenge ID"),
    status_filter: Optional[ApplicationStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve applications filtered according to role permissions.
    - STARTUP: Only sees own applications.
    - GOVERNMENT: Only sees applications for challenges owned by government user.
    - EVALUATOR: Sees submitted / under-review applications.
    - ADMIN: Sees all applications.
    """
    applications = await crud_application.get_applications_for_user(
        db=db,
        current_user=current_user,
        challenge_id=challenge_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )
    return [serialize_application_response(app) for app in applications]


@router.get(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def get_application(
    application_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get application by ID with role-based visibility checks.
    """
    application = await crud_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if current_user.role == UserRole.STARTUP and application.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this application",
        )

    if current_user.role == UserRole.GOVERNMENT and application.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view applications for this challenge",
        )

    if current_user.role == UserRole.EVALUATOR:
        if application.status == ApplicationStatus.DRAFT:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Evaluators cannot view draft applications",
            )
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        is_assigned = await is_challenge_assigned_to_evaluator(db, application.challenge, current_user.id)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this application",
            )

    return serialize_application_response(application)


@router.put(
    "/{application_id}",
    response_model=ApplicationResponse,
)
async def update_application(
    application_id: int,
    application_in: ApplicationUpdate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a DRAFT application.
    - STARTUP only.
    - Only DRAFT applications can be edited.
    - Cannot change startup_id or challenge_id.
    """
    application = await crud_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own applications",
        )

    if application.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DRAFT applications can be edited",
        )

    updated = await crud_application.update_application(db=db, db_application=application)
    return serialize_application_response(updated)


@router.post(
    "/{application_id}/submit",
    response_model=ApplicationResponse,
)
async def submit_application(
    application_id: int,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit a DRAFT application.
    - STARTUP only.
    - Must own application.
    - Changes status to SUBMITTED and sets submitted_at timestamp.
    """
    application = await crud_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only submit your own applications",
        )

    if application.status != ApplicationStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DRAFT applications can be submitted",
        )

    updated = await crud_application.update_application_status(
        db=db,
        db_application=application,
        new_status=ApplicationStatus.SUBMITTED,
    )

    challenge_title = application.challenge.title
    government_user_id = application.challenge.government_user_id

    await notify_application_submitted(
        db=db,
        government_user_id=government_user_id,
        challenge_id=application.challenge_id,
        challenge_title=challenge_title,
        application_id=application.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.APPLICATION_SUBMITTED,
        resource_type="application",
        resource_id=application.id,
        description=f"Application submitted for challenge '{challenge_title}'.",
    )
    await db.commit()
    refreshed_updated = await crud_application.get_application_by_id(db, updated.id)
    return serialize_application_response(refreshed_updated)


@router.post(
    "/{application_id}/withdraw",
    response_model=ApplicationResponse,
)
async def withdraw_application(
    application_id: int,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Withdraw an application.
    - STARTUP only.
    - Must own application.
    - Allowed only from DRAFT, SUBMITTED, or UNDER_REVIEW states.
    - Changes status to WITHDRAWN.
    """
    application = await crud_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only withdraw your own applications",
        )

    allowed_withdrawal_states = {
        ApplicationStatus.DRAFT,
        ApplicationStatus.SUBMITTED,
        ApplicationStatus.UNDER_REVIEW,
    }

    if application.status not in allowed_withdrawal_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Application cannot be withdrawn when in status '{application.status.value}'",
        )

    challenge_title = application.challenge.title
    government_user_id = application.challenge.government_user_id

    updated = await crud_application.update_application_status(
        db=db,
        db_application=application,
        new_status=ApplicationStatus.WITHDRAWN,
    )

    await notify_application_withdrawn(
        db=db,
        government_user_id=government_user_id,
        challenge_title=challenge_title,
        application_id=application.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.APPLICATION_WITHDRAWN,
        resource_type="application",
        resource_id=application.id,
        description=f"Application withdrawn from challenge '{challenge_title}'.",
    )
    await db.commit()
    refreshed_updated = await crud_application.get_application_by_id(db, updated.id)
    return serialize_application_response(refreshed_updated)


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse,
)
async def change_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Update application status in the procurement workflow.
    - GOVERNMENT and ADMIN only.
    - Government users can modify applications only for challenges they own.
    - ADMIN can modify any application.
    - Enforces valid state transitions.
    """
    application = await crud_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if current_user.role != UserRole.ADMIN and application.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify applications for this challenge",
        )

    current_status = application.status
    target_status = status_update.status

    allowed_targets = VALID_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status transition from '{current_status.value}' to '{target_status.value}'",
        )

    startup_user_id = application.startup_id
    challenge_title = application.challenge.title

    updated = await crud_application.update_application_status(
        db=db,
        db_application=application,
        new_status=target_status,
    )

    # Notify startup of status change (UNDER_REVIEW, SHORTLISTED, REJECTED)
    if target_status in {
        ApplicationStatus.UNDER_REVIEW,
        ApplicationStatus.SHORTLISTED,
        ApplicationStatus.REJECTED,
    }:
        await notify_application_status_changed(
            db=db,
            startup_user_id=startup_user_id,
            new_status=target_status.value,
            challenge_title=challenge_title,
            application_id=application.id,
        )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.APPLICATION_STATUS_CHANGED,
        resource_type="application",
        resource_id=application.id,
        description=f"Application status changed from '{current_status.value}' to '{target_status.value}' for challenge '{challenge_title}'.",
    )
    await db.commit()
    refreshed_updated = await crud_application.get_application_by_id(db, updated.id)
    return serialize_application_response(refreshed_updated)


@router.post(
    "/{application_id}/respond-invite",
    response_model=ApplicationResponse,
)
async def respond_to_challenge_invite(
    application_id: int,
    payload: dict,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Startup accepts or rejects a government tender invitation.
    - STARTUP only for its own application.
    - action: "ACCEPT" -> transitions application to SUBMITTED or UNDER_REVIEW.
    - action: "REJECT" -> transitions application to WITHDRAWN.
    - Notifies the government challenge owner.
    """
    application = await crud_application.get_application_by_id(db, application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only respond to invitations for your own startup",
        )

    action = (payload.get("action") or "").upper()
    if action not in {"ACCEPT", "REJECT"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Action must be either 'ACCEPT' or 'REJECT'",
        )

    challenge_title = application.challenge.title
    government_user_id = application.challenge.government_user_id

    if action == "ACCEPT":
        new_status = ApplicationStatus.SUBMITTED
        notif_msg = f"Startup '{current_user.name}' has ACCEPTED your invitation for challenge '{challenge_title}'."
    else:
        new_status = ApplicationStatus.WITHDRAWN
        notif_msg = f"Startup '{current_user.name}' has DECLINED your invitation for challenge '{challenge_title}'."

    updated = await crud_application.update_application_status(
        db=db,
        db_application=application,
        new_status=new_status,
    )

    # Notify Government
    from app.crud import notification as crud_notif
    from app.models.notification import NotificationType
    await crud_notif.create_notification(
        db=db,
        user_id=government_user_id,
        notification_type=NotificationType.APPLICATION_SUBMITTED if action == "ACCEPT" else NotificationType.APPLICATION_WITHDRAWN,
        title="Startup Tender Invite Response",
        message=notif_msg,
        resource_type="application",
        resource_id=application.id,
    )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.APPLICATION_SUBMITTED if action == "ACCEPT" else ActivityAction.APPLICATION_WITHDRAWN,
        resource_type="application",
        resource_id=application.id,
        description=notif_msg,
    )

    await db.commit()
    refreshed_updated = await crud_application.get_application_by_id(db, updated.id)
    return serialize_application_response(refreshed_updated)


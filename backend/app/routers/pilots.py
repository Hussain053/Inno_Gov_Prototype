from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_government
from app.crud import application as crud_application
from app.crud import pilot as crud_pilot
from app.models.activity_log import ActivityAction
from app.models.application import ApplicationStatus
from app.models.pilot import PilotStatus
from app.models.user import User, UserRole
from app.schemas.pilot import (
    PilotCreate,
    PilotResponse,
    PilotStatusUpdate,
    PilotUpdate,
)
from app.services.activity import record_activity
from app.services.notifications import notify_pilot_assigned, notify_pilot_status_changed

router = APIRouter(prefix="/pilots", tags=["Pilots"])

VALID_PILOT_TRANSITIONS = {
    PilotStatus.ASSIGNED: {PilotStatus.IN_PROGRESS},
    PilotStatus.IN_PROGRESS: {PilotStatus.COMPLETED, PilotStatus.FAILED},
    PilotStatus.COMPLETED: set(),
    PilotStatus.FAILED: set(),
}


@router.post(
    "",
    response_model=PilotResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_pilot(
    pilot_in: PilotCreate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new pilot project from a SHORTLISTED application.
    - GOVERNMENT and ADMIN only.
    - Application must exist and be in SHORTLISTED status.
    - Government user can only create a pilot for their own challenge.
    - Derives challenge_id and startup_id directly from the application.
    """
    application = await crud_application.get_application_by_id(db, pilot_in.application_id)
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    if application.status != ApplicationStatus.SHORTLISTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Pilots can only be created for SHORTLISTED applications (current status: '{application.status.value}')",
        )

    if current_user.role != UserRole.ADMIN and application.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create a pilot for this challenge",
        )

    existing_pilot = await crud_pilot.get_pilot_by_challenge_and_startup(
        db=db,
        challenge_id=application.challenge_id,
        startup_id=application.startup_id,
    )
    if existing_pilot:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A pilot project already exists for this application",
        )

    pilot = await crud_pilot.create_pilot(
        db=db,
        pilot_in=pilot_in,
        challenge_id=application.challenge_id,
        startup_id=application.startup_id,
    )

    challenge_title = application.challenge.title
    startup_user_id = application.startup_id

    await notify_pilot_assigned(
        db=db,
        startup_user_id=startup_user_id,
        challenge_title=challenge_title,
        pilot_id=pilot.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.PILOT_CREATED,
        resource_type="pilot",
        resource_id=pilot.id,
        description=f"Pilot '{pilot.title}' created for challenge '{challenge_title}'.",
    )
    await db.commit()
    await db.refresh(pilot)
    return pilot


@router.get(
    "",
    response_model=List[PilotResponse],
)
async def list_pilots(
    challenge_id: Optional[int] = Query(None, description="Filter by challenge ID"),
    startup_id: Optional[int] = Query(None, description="Filter by startup ID"),
    status_filter: Optional[PilotStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve pilots filtered according to user role:
    - STARTUP: Sees only pilots belonging to their startup.
    - GOVERNMENT: Sees only pilots for challenges they created.
    - EVALUATOR: Read-only access to all pilots.
    - ADMIN: Sees all pilots.
    """
    return await crud_pilot.get_pilots_for_user(
        db=db,
        current_user=current_user,
        challenge_id=challenge_id,
        startup_id=startup_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{pilot_id}",
    response_model=PilotResponse,
)
async def get_pilot(
    pilot_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single pilot project by ID with visibility authorization checks.
    """
    pilot = await crud_pilot.get_pilot_by_id(db, pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    if current_user.role == UserRole.STARTUP and pilot.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this pilot",
        )

    if current_user.role == UserRole.GOVERNMENT and pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access pilots for this challenge",
        )

    if current_user.role == UserRole.EVALUATOR:
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        is_assigned = await is_challenge_assigned_to_evaluator(db, pilot.challenge, current_user.id)
        if not is_assigned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this pilot",
            )

    return pilot


@router.put(
    "/{pilot_id}",
    response_model=PilotResponse,
)
async def update_pilot(
    pilot_id: int,
    pilot_in: PilotUpdate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Update pilot project details.
    - GOVERNMENT and ADMIN only.
    - Government users can modify only pilots belonging to challenges they created.
    - ADMIN can modify any pilot.
    - Cannot modify challenge_id or startup_id.
    """
    pilot = await crud_pilot.get_pilot_by_id(db, pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    if current_user.role != UserRole.ADMIN and pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this pilot",
        )

    updated = await crud_pilot.update_pilot(
        db=db,
        db_pilot=pilot,
        pilot_in=pilot_in,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.PILOT_UPDATED,
        resource_type="pilot",
        resource_id=pilot.id,
        description=f"Pilot '{pilot.title}' updated.",
    )
    await db.commit()
    await db.refresh(updated)
    return updated


@router.patch(
    "/{pilot_id}/status",
    response_model=PilotResponse,
)
async def change_pilot_status(
    pilot_id: int,
    status_update: PilotStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update status of a pilot project.
    - STARTUP: Can transition their own pilot from ASSIGNED → IN_PROGRESS only.
    - GOVERNMENT and ADMIN: Can perform all valid transitions for their challenges.
    - Enforces valid status transitions:
      ASSIGNED -> IN_PROGRESS  (startup or government/admin)
      IN_PROGRESS -> COMPLETED | FAILED  (government/admin only)
    """
    pilot = await crud_pilot.get_pilot_by_id(db, pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    target_status = status_update.status

    if current_user.role == UserRole.STARTUP:
        # Startups may only start their own pilot (ASSIGNED → IN_PROGRESS)
        if pilot.startup_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to modify this pilot",
            )
        if target_status != PilotStatus.IN_PROGRESS:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Startups may only transition their pilot to IN_PROGRESS",
            )
    elif current_user.role != UserRole.ADMIN and pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify status for this pilot",
        )

    current_status = pilot.status
    target_status = status_update.status

    allowed_targets = VALID_PILOT_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid pilot status transition from '{current_status.value}' to '{target_status.value}'",
        )

    challenge_title = pilot.challenge.title
    startup_user_id = pilot.startup_id

    updated = await crud_pilot.update_pilot_status(
        db=db,
        db_pilot=pilot,
        new_status=target_status,
    )

    await notify_pilot_status_changed(
        db=db,
        startup_user_id=startup_user_id,
        new_status=target_status.value,
        challenge_title=challenge_title,
        pilot_id=pilot.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.PILOT_STATUS_CHANGED,
        resource_type="pilot",
        resource_id=pilot.id,
        description=f"Pilot '{pilot.title}' status changed from '{current_status.value}' to '{target_status.value}'.",
    )
    await db.commit()
    await db.refresh(updated)
    return updated


@router.delete(
    "/{pilot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_pilot(
    pilot_id: int,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Delete a pilot project.
    - GOVERNMENT and ADMIN only.
    - Government users can delete only pilots for challenges they created.
    - ADMIN can delete any pilot.
    """
    pilot = await crud_pilot.get_pilot_by_id(db, pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    if current_user.role != UserRole.ADMIN and pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this pilot",
        )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.PILOT_DELETED,
        resource_type="pilot",
        resource_id=pilot.id,
        description=f"Pilot '{pilot.title}' deleted.",
    )
    await crud_pilot.delete_pilot(db=db, db_pilot=pilot)
    return None

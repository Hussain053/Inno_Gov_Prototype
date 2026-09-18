from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_roles
from app.crud import evaluator_assignment as crud_assignment
from app.crud import pilot_submission as crud_submission
from app.models.activity_log import ActivityAction
from app.models.evaluator_assignment import AssignmentStatus
from app.models.user import User, UserRole
from app.schemas.evaluator_assignment import (
    EvaluatorAssignmentCreate,
    EvaluatorAssignmentResponse,
    EvaluatorAssignmentStatusUpdate,
)
from app.services.activity import record_activity

router = APIRouter(prefix="/evaluator-assignments", tags=["Evaluator Assignments"])


@router.get(
    "/evaluators",
    status_code=status.HTTP_200_OK,
)
async def list_evaluator_users(
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT, UserRole.ADMIN, UserRole.EVALUATOR)),
    db: AsyncSession = Depends(get_db),
):
    """
    List all registered active evaluators from the database.
    - Used by Government dropdown to assign evaluators.
    """
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.EVALUATOR, User.is_active.is_(True))
        .order_by(User.name)
    )
    evaluators = list(result.scalars().all())
    return [
        {
            "id": ev.id,
            "name": ev.name,
            "email": ev.email,
            "organization": ev.organization,
            "role": ev.role.value if hasattr(ev.role, "value") else str(ev.role),
            "is_active": ev.is_active,
        }
        for ev in evaluators
    ]


@router.post(
    "",
    response_model=EvaluatorAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_evaluator_assignment(
    assignment_in: EvaluatorAssignmentCreate,
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Assign an evaluator to a pilot submission.
    - Restricted to GOVERNMENT and ADMIN users.
    - Government user must own the challenge associated with the pilot submission.
    - Validates that the assigned user exists, has role EVALUATOR, and is active.
    - Enforces 1 assignment per evaluator per submission (HTTP 409 duplicate check).
    """
    # 1. Fetch submission and check ownership
    submission = await crud_submission.get_submission_by_id(
        db, assignment_in.pilot_submission_id
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if (
        current_user.role != UserRole.ADMIN
        and submission.pilot.challenge.government_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to assign evaluators for this challenge",
        )

    # 2. Verify target evaluator user exists, active, and has EVALUATOR role
    eval_user_res = await db.execute(
        select(User).where(User.id == assignment_in.evaluator_id)
    )
    target_evaluator = eval_user_res.scalar_one_or_none()

    if not target_evaluator:
        raise HTTPException(
            status_code=status.HTTP_440_NOT_FOUND if hasattr(status, "HTTP_440_NOT_FOUND") else status.HTTP_404_NOT_FOUND,
            detail="Evaluator user not found",
        )

    if target_evaluator.role != UserRole.EVALUATOR:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target user does not have the EVALUATOR role",
        )

    if not target_evaluator.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target evaluator user account is inactive",
        )

    # 3. Check duplicate assignment
    existing = await crud_assignment.get_assignment_by_submission_and_evaluator(
        db=db,
        pilot_submission_id=assignment_in.pilot_submission_id,
        evaluator_id=assignment_in.evaluator_id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This evaluator is already assigned to this pilot submission",
        )

    # 4. Create assignment
    assignment = await crud_assignment.create_assignment(
        db=db,
        pilot_submission_id=assignment_in.pilot_submission_id,
        evaluator_id=assignment_in.evaluator_id,
    )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.EVALUATION_CREATED,
        resource_type="evaluator_assignment",
        resource_id=assignment.id,
        description=f"Evaluator ID {target_evaluator.id} assigned to pilot submission ID {submission.id}.",
    )
    await db.commit()
    await db.refresh(assignment)
    return assignment


@router.get(
    "",
    response_model=List[EvaluatorAssignmentResponse],
)
async def list_evaluator_assignments(
    submission_id: Optional[int] = Query(None, description="Filter by submission ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve evaluator assignments based on user role permissions:
    - EVALUATOR: Only own assignments.
    - GOVERNMENT: Assignments for challenges owned by government user.
    - ADMIN: All assignments.
    - STARTUP: 403 Forbidden.
    """
    if current_user.role == UserRole.STARTUP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Startups are not permitted to access evaluator assignments",
        )

    return await crud_assignment.get_assignments_for_user(
        db=db,
        current_user=current_user,
        submission_id=submission_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{assignment_id}",
    response_model=EvaluatorAssignmentResponse,
)
async def get_evaluator_assignment(
    assignment_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single evaluator assignment with role authorization checks.
    """
    if current_user.role == UserRole.STARTUP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Startups are not permitted to access evaluator assignments",
        )

    assignment = await crud_assignment.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluator assignment not found",
        )

    if current_user.role == UserRole.EVALUATOR and assignment.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own evaluator assignments",
        )

    if (
        current_user.role == UserRole.GOVERNMENT
        and assignment.pilot_submission.pilot.challenge.government_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view assignments for this challenge",
        )

    return assignment


@router.patch(
    "/{assignment_id}/status",
    response_model=EvaluatorAssignmentResponse,
)
async def update_evaluator_assignment_status(
    assignment_id: int,
    status_update: EvaluatorAssignmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update status of an evaluator assignment (ASSIGNED -> IN_PROGRESS -> COMPLETED).
    - EVALUATORS can update status for their own assignments.
    - GOVERNMENT/ADMIN can update status for their challenge assignments.
    """
    assignment = await crud_assignment.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluator assignment not found",
        )

    if current_user.role == UserRole.EVALUATOR and assignment.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own evaluator assignment status",
        )

    if (
        current_user.role == UserRole.GOVERNMENT
        and assignment.pilot_submission.pilot.challenge.government_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to update assignments for this challenge",
        )

    if current_user.role == UserRole.STARTUP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Startups cannot modify evaluator assignments",
        )

    updated = await crud_assignment.update_assignment_status(
        db=db,
        assignment=assignment,
        new_status=status_update.status,
    )
    await db.commit()
    await db.refresh(updated)
    return updated


@router.delete(
    "/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_evaluator_assignment(
    assignment_id: int,
    current_user: User = Depends(require_roles(UserRole.GOVERNMENT, UserRole.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove an evaluator assignment.
    - GOVERNMENT (owner of challenge) and ADMIN only.
    """
    assignment = await crud_assignment.get_assignment_by_id(db, assignment_id)
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluator assignment not found",
        )

    if (
        current_user.role != UserRole.ADMIN
        and assignment.pilot_submission.pilot.challenge.government_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete assignments for this challenge",
        )

    await crud_assignment.delete_assignment(db=db, assignment=assignment)
    await db.commit()
    return None

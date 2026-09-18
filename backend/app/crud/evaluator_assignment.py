from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.datetime_utils import utc_now
from app.models.challenge import Challenge
from app.models.evaluator_assignment import AssignmentStatus, EvaluatorAssignment
from app.models.pilot import Pilot
from app.models.pilot_submission import PilotSubmission
from app.models.user import User, UserRole


async def create_assignment(
    db: AsyncSession,
    pilot_submission_id: int,
    evaluator_id: int,
) -> EvaluatorAssignment:
    """
    Create a new evaluator assignment in ASSIGNED status.
    Flushes session for ID generation; caller manages transaction commit.
    """
    assignment = EvaluatorAssignment(
        pilot_submission_id=pilot_submission_id,
        evaluator_id=evaluator_id,
        status=AssignmentStatus.ASSIGNED,
        assigned_at=utc_now(),
    )
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


async def get_assignment_by_id(
    db: AsyncSession,
    assignment_id: int,
) -> Optional[EvaluatorAssignment]:
    """
    Fetch evaluator assignment by ID with relationships loaded.
    """
    result = await db.execute(
        select(EvaluatorAssignment)
        .options(
            selectinload(EvaluatorAssignment.pilot_submission)
            .selectinload(PilotSubmission.pilot)
            .selectinload(Pilot.challenge),
            selectinload(EvaluatorAssignment.pilot_submission)
            .selectinload(PilotSubmission.startup),
        )
        .where(EvaluatorAssignment.id == assignment_id)
    )
    return result.scalar_one_or_none()


async def get_assignment_by_submission_and_evaluator(
    db: AsyncSession,
    pilot_submission_id: int,
    evaluator_id: int,
) -> Optional[EvaluatorAssignment]:
    """
    Check if an assignment already exists for submission + evaluator.
    """
    result = await db.execute(
        select(EvaluatorAssignment).where(
            EvaluatorAssignment.pilot_submission_id == pilot_submission_id,
            EvaluatorAssignment.evaluator_id == evaluator_id,
        )
    )
    return result.scalar_one_or_none()


async def get_assignments_for_user(
    db: AsyncSession,
    current_user: User,
    submission_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[EvaluatorAssignment]:
    """
    Retrieve assignments based on role permissions:
    - EVALUATOR: Sees only own assignments.
    - GOVERNMENT: Sees assignments for submissions under own challenges.
    - ADMIN: Sees all assignments.
    - STARTUP: No access (empty list).
    """
    if current_user.role == UserRole.STARTUP:
        return []

    query = select(EvaluatorAssignment).options(
        selectinload(EvaluatorAssignment.pilot_submission)
        .selectinload(PilotSubmission.pilot)
        .selectinload(Pilot.challenge),
        selectinload(EvaluatorAssignment.pilot_submission)
        .selectinload(PilotSubmission.startup),
    )

    if current_user.role == UserRole.EVALUATOR:
        query = query.where(EvaluatorAssignment.evaluator_id == current_user.id)
    elif current_user.role == UserRole.GOVERNMENT:
        query = (
            query.join(EvaluatorAssignment.pilot_submission)
            .join(PilotSubmission.pilot)
            .join(Pilot.challenge)
            .where(Challenge.government_user_id == current_user.id)
        )
    # ADMIN sees all

    if submission_id is not None:
        query = query.where(EvaluatorAssignment.pilot_submission_id == submission_id)

    query = query.order_by(EvaluatorAssignment.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_assignment_status(
    db: AsyncSession,
    assignment: EvaluatorAssignment,
    new_status: AssignmentStatus,
) -> EvaluatorAssignment:
    """
    Update assignment status. Sets completed_at timestamp if status becomes COMPLETED.
    """
    assignment.status = new_status
    if new_status == AssignmentStatus.COMPLETED and not assignment.completed_at:
        assignment.completed_at = utc_now()

    assignment.updated_at = utc_now()
    await db.flush()
    await db.refresh(assignment)
    return assignment


async def delete_assignment(
    db: AsyncSession,
    assignment: EvaluatorAssignment,
) -> None:
    """
    Remove an evaluator assignment.
    """
    await db.delete(assignment)
    await db.flush()

from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import utc_now
from app.models.challenge import Challenge, ChallengeStatus
from app.schemas.challenge import ChallengeCreate, ChallengeUpdate


async def create_challenge(
    db: AsyncSession,
    challenge_in: ChallengeCreate,
    government_user_id: int,
) -> Challenge:
    """
    Create a new challenge in the database with government_user_id set from authenticated user.
    Flushes to assign an ID; caller is responsible for committing.
    """
    challenge_data = challenge_in.model_dump()
    new_challenge = Challenge(
        **challenge_data,
        government_user_id=government_user_id,
    )
    db.add(new_challenge)
    await db.flush()
    await db.refresh(new_challenge)
    return new_challenge


async def get_challenge_by_id(
    db: AsyncSession,
    challenge_id: int,
) -> Optional[Challenge]:
    """
    Fetch a single challenge by its primary key ID.
    """
    result = await db.execute(
        select(Challenge).where(Challenge.id == challenge_id)
    )
    return result.scalar_one_or_none()


async def is_challenge_assigned_to_evaluator(
    db: AsyncSession,
    challenge: Challenge,
    evaluator_id: int,
) -> bool:
    """
    Check if a challenge is assigned to an evaluator either via challenge metadata
    or via an EvaluatorAssignment on any of its pilot submissions.
    """
    if challenge.requirements and isinstance(challenge.requirements, dict):
        assigned = challenge.requirements.get("assigned_evaluator")
        if isinstance(assigned, dict) and assigned.get("id") == evaluator_id:
            return True

    from app.models.evaluator_assignment import EvaluatorAssignment
    from app.models.pilot import Pilot
    from app.models.pilot_submission import PilotSubmission

    result = await db.execute(
        select(EvaluatorAssignment)
        .join(EvaluatorAssignment.pilot_submission)
        .join(PilotSubmission.pilot)
        .where(
            Pilot.challenge_id == challenge.id,
            EvaluatorAssignment.evaluator_id == evaluator_id,
        )
    )
    return result.scalar_one_or_none() is not None


async def get_challenges(
    db: AsyncSession,
    status: Optional[ChallengeStatus] = None,
    category: Optional[str] = None,
    government_user_id: Optional[int] = None,
    evaluator_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Challenge]:
    """
    Retrieve challenges with optional filtering by status, category, or government user creator.
    If evaluator_id is specified, only returns challenges assigned to that evaluator.
    """
    query = select(Challenge)

    if status is not None:
        query = query.where(Challenge.status == status)
    if category is not None:
        query = query.where(Challenge.category == category)
    if government_user_id is not None:
        query = query.where(Challenge.government_user_id == government_user_id)

    query = query.order_by(Challenge.created_at.desc())
    result = await db.execute(query)
    all_challenges = list(result.scalars().all())

    if evaluator_id is not None:
        filtered = []
        for ch in all_challenges:
            if await is_challenge_assigned_to_evaluator(db, ch, evaluator_id):
                filtered.append(ch)
        return filtered[skip : skip + limit]

    return all_challenges[skip : skip + limit]


async def update_challenge(
    db: AsyncSession,
    db_challenge: Challenge,
    challenge_in: ChallengeUpdate,
) -> Challenge:
    """
    Update fields of an existing challenge.
    Flushes; caller is responsible for committing.
    """
    update_data = challenge_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_challenge, field, value)

    db_challenge.updated_at = utc_now()
    await db.flush()
    await db.refresh(db_challenge)
    return db_challenge


async def delete_challenge(
    db: AsyncSession,
    db_challenge: Challenge,
) -> None:
    """
    Delete a challenge record from the database.
    Caller is responsible for committing.
    """
    await db.delete(db_challenge)
    await db.flush()

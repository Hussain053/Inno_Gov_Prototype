from app.core.datetime_utils import utc_now
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge
from app.models.pilot import Pilot, PilotStatus
from app.models.user import User, UserRole
from app.schemas.pilot import PilotCreate, PilotUpdate


async def create_pilot(
    db: AsyncSession,
    pilot_in: PilotCreate,
    challenge_id: int,
    startup_id: int,
) -> Pilot:
    """
    Create a new pilot record in ASSIGNED status.
    challenge_id and startup_id are derived from the validated shortlisted application.
    Flushes to assign an ID; caller is responsible for committing.
    """
    pilot_data = pilot_in.model_dump(exclude={"application_id", "status"})
    new_pilot = Pilot(
        **pilot_data,
        challenge_id=challenge_id,
        startup_id=startup_id,
        status=pilot_in.status or PilotStatus.ASSIGNED,
    )
    db.add(new_pilot)
    await db.flush()
    await db.refresh(new_pilot)
    return new_pilot


async def get_pilot_by_id(
    db: AsyncSession,
    pilot_id: int,
) -> Optional[Pilot]:
    """
    Fetch a single pilot by ID with challenge and submission relationships eagerly loaded.
    """
    result = await db.execute(
        select(Pilot)
        .options(selectinload(Pilot.challenge), selectinload(Pilot.submission))
        .where(Pilot.id == pilot_id)
    )
    return result.scalar_one_or_none()


async def get_pilot_by_challenge_and_startup(
    db: AsyncSession,
    challenge_id: int,
    startup_id: int,
) -> Optional[Pilot]:
    """
    Fetch a pilot by challenge_id and startup_id to prevent duplicate pilots for the same application.
    """
    result = await db.execute(
        select(Pilot).where(
            Pilot.challenge_id == challenge_id,
            Pilot.startup_id == startup_id,
        )
    )
    return result.scalar_one_or_none()


async def get_pilots_for_user(
    db: AsyncSession,
    current_user: User,
    challenge_id: Optional[int] = None,
    startup_id: Optional[int] = None,
    status: Optional[PilotStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Pilot]:
    """
    Retrieve pilots filtered according to user role:
    - STARTUP: Only pilots where startup_id == current_user.id.
    - GOVERNMENT: Only pilots for challenges owned by current_user.id.
    - EVALUATOR: Read-only access to all pilots.
    - ADMIN: All pilots.
    """
    query = select(Pilot).options(selectinload(Pilot.challenge))

    if current_user.role == UserRole.STARTUP:
        query = query.where(Pilot.startup_id == current_user.id)
    elif current_user.role == UserRole.GOVERNMENT:
        query = query.join(Pilot.challenge).where(
            Challenge.government_user_id == current_user.id
        )
    # ADMIN and EVALUATOR handled

    if challenge_id is not None:
        query = query.where(Pilot.challenge_id == challenge_id)
    if startup_id is not None and current_user.role in (UserRole.ADMIN, UserRole.GOVERNMENT):
        query = query.where(Pilot.startup_id == startup_id)
    if status is not None:
        query = query.where(Pilot.status == status)

    query = query.order_by(Pilot.created_at.desc())
    result = await db.execute(query)
    all_pilots = list(result.scalars().all())

    if current_user.role == UserRole.EVALUATOR:
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        filtered = []
        for p in all_pilots:
            if p.challenge and await is_challenge_assigned_to_evaluator(db, p.challenge, current_user.id):
                filtered.append(p)
        return filtered[skip : skip + limit]

    return all_pilots[skip : skip + limit]


async def update_pilot(
    db: AsyncSession,
    db_pilot: Pilot,
    pilot_in: PilotUpdate,
) -> Pilot:
    """
    Update fields of an existing pilot.
    Flushes; caller is responsible for committing.
    """
    update_data = pilot_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_pilot, field, value)

    utc_now()
    await db.flush()
    await db.refresh(db_pilot)
    return db_pilot


async def update_pilot_status(
    db: AsyncSession,
    db_pilot: Pilot,
    new_status: PilotStatus,
) -> Pilot:
    """
    Update pilot status.
    Flushes; caller is responsible for committing.
    """
    db_pilot.status = new_status
    db_pilot.updated_at = utc_now()
    await db.flush()
    await db.refresh(db_pilot)
    return db_pilot


async def delete_pilot(
    db: AsyncSession,
    db_pilot: Pilot,
) -> None:
    """
    Delete a pilot record.
    Caller is responsible for committing.
    """
    await db.delete(db_pilot)
    await db.flush()

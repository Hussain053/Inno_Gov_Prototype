from datetime import datetime
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.startup import StartupProfile
from app.schemas.startup import StartupProfileUpdate


async def get_startup_profile_by_user_id(
    db: AsyncSession,
    user_id: int,
) -> Optional[StartupProfile]:
    """
    Retrieve startup profile associated with a specific user ID.
    """
    result = await db.execute(
        select(StartupProfile).where(StartupProfile.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def get_startup_profile_by_id(
    db: AsyncSession,
    profile_id: int,
) -> Optional[StartupProfile]:
    """
    Retrieve startup profile by its primary key ID.
    """
    result = await db.execute(
        select(StartupProfile).where(StartupProfile.id == profile_id)
    )
    return result.scalar_one_or_none()


async def update_or_create_startup_profile(
    db: AsyncSession,
    user_id: int,
    profile_in: StartupProfileUpdate,
) -> StartupProfile:
    """
    Update an existing startup profile for the user, or create one if none exists.
    Identity user_id comes strictly from current_user.id.
    """
    profile = await get_startup_profile_by_user_id(db, user_id)

    if profile:
        update_data = profile_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(profile, field, value)
        profile.updated_at = datetime.utcnow()
    else:
        create_data = profile_in.model_dump(exclude_unset=True)
        company_name = create_data.pop("company_name", None) or "Registered Startup"
        profile = StartupProfile(
            user_id=user_id,
            company_name=company_name,
            **create_data,
        )
        db.add(profile)

    await db.commit()
    await db.refresh(profile)
    return profile

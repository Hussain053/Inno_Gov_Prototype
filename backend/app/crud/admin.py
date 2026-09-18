from app.core.datetime_utils import utc_now
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole


async def get_all_users(
    db: AsyncSession,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[User]:
    """
    Retrieve all users with optional role and active status filters.
    """
    query = select(User)
    if role is not None:
        query = query.where(User.role == role)
    if is_active is not None:
        query = query.where(User.is_active == is_active)

    query = query.order_by(User.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_user_by_id(
    db: AsyncSession,
    user_id: int,
) -> Optional[User]:
    """
    Fetch user by primary key ID.
    """
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def update_user_status(
    db: AsyncSession,
    db_user: User,
    is_active: bool,
) -> User:
    """
    Activate or deactivate user account.
    """
    db_user.is_active = is_active
    utc_now()
    await db.flush()
    await db.refresh(db_user)
    return db_user


async def update_user_role(
    db: AsyncSession,
    db_user: User,
    new_role: UserRole,
) -> User:
    """
    Update database user role.
    """
    db_user.role = new_role
    utc_now()
    await db.flush()
    await db.refresh(db_user)
    return db_user

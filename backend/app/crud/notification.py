from app.core.datetime_utils import utc_now
from typing import List, Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationType


async def create_notification(
    db: AsyncSession,
    user_id: int,
    notification_type: NotificationType,
    title: str,
    message: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
) -> Notification:
    """
    Persist a new notification for a specific user.
    user_id must always be derived from the authenticated user or the
    target user of the workflow event — never from client input.
    """
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        resource_type=resource_type,
        resource_id=resource_id,
        is_read=False,
    )
    db.add(notification)
    # Caller is responsible for committing the encompassing transaction.
    # We flush so the object gets an ID if needed within the same session.
    await db.flush()
    return notification


async def get_user_notifications(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> List[Notification]:
    """
    Retrieve all notifications for the specified user, newest first.
    Ownership is enforced via the user_id parameter which must come
    from current_user.id in the calling router.
    """
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def get_unread_notifications(
    db: AsyncSession,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> List[Notification]:
    """
    Retrieve unread notifications for the specified user.
    """
    result = await db.execute(
        select(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
        .order_by(Notification.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_unread_notifications(
    db: AsyncSession,
    user_id: int,
) -> int:
    """
    Count unread notifications for a user.
    """
    from sqlalchemy import func
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
    )
    return result.scalar() or 0


async def get_user_notification(
    db: AsyncSession,
    notification_id: int,
    user_id: int,
) -> Optional[Notification]:
    """
    Fetch a single notification by ID only if it belongs to the given user.
    Never call without user_id — this is the ownership boundary.
    """
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def mark_notification_read(
    db: AsyncSession,
    notification: Notification,
) -> Notification:
    """
    Mark a single notification as read and set read_at timestamp.
    Caller must have already verified ownership before passing the object.
    """
    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        await db.flush()
    return notification


async def mark_all_notifications_read(
    db: AsyncSession,
    user_id: int,
) -> int:
    """
    Mark all unread notifications belonging to the user as read.
    Returns the number of notifications updated.
    Scoped entirely by user_id — never touches other users' notifications.
    """
    result = await db.execute(
        update(Notification)
        .where(
            Notification.user_id == user_id,
            Notification.is_read == False,  # noqa: E712
        )
        .values(is_read=True, read_at=datetime.utcnow())
    )
    await db.flush()
    return result.rowcount

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.crud import notification as crud_notification
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get(
    "",
    response_model=List[NotificationResponse],
)
async def list_notifications(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all notifications for the authenticated user, newest first.
    Only the calling user's own notifications are returned.
    """
    return await crud_notification.get_user_notifications(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/unread/count",
    response_model=UnreadCountResponse,
)
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the count of unread notifications for the authenticated user.
    """
    count = await crud_notification.count_unread_notifications(
        db=db,
        user_id=current_user.id,
    )
    return UnreadCountResponse(unread_count=count)


@router.get(
    "/unread",
    response_model=List[NotificationResponse],
)
async def list_unread_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get unread notifications for the authenticated user, newest first.
    """
    return await crud_notification.get_unread_notifications(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=limit,
    )


@router.patch(
    "/read-all",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark all notifications belonging to the authenticated user as read.
    Other users' notifications are never modified.
    """
    await crud_notification.mark_all_notifications_read(
        db=db,
        user_id=current_user.id,
    )
    await db.commit()
    return None


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationResponse,
)
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a single notification as read.

    Security: Returns 404 if the notification does not exist OR if it belongs
    to a different user — this prevents information leakage about other users'
    notification IDs.
    """
    notification = await crud_notification.get_user_notification(
        db=db,
        notification_id=notification_id,
        user_id=current_user.id,
    )
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found",
        )

    updated = await crud_notification.mark_notification_read(
        db=db,
        notification=notification,
    )
    await db.commit()
    await db.refresh(updated)
    return updated

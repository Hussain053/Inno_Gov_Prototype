"""
Activity / Audit Service
========================
Reusable function for recording meaningful procurement actions to the audit log.

Usage pattern:
    await record_activity(
        db=db,
        actor_user_id=current_user.id,  # ALWAYS from current_user
        action=ActivityAction.APPLICATION_SUBMITTED,
        resource_type="application",
        resource_id=application.id,
        description="Startup submitted application for challenge 'Digital Health RFP'.",
    )

Rules:
  - actor_user_id must always come from current_user.id in the router.
  - Only meaningful state-changing business events are recorded.
  - GET requests are NOT recorded.
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import activity as crud_activity
from app.models.activity_log import ActivityAction, ActivityLog


async def record_activity(
    db: AsyncSession,
    *,
    actor_user_id: int,
    action: ActivityAction,
    resource_type: str,
    resource_id: Optional[int],
    description: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> ActivityLog:
    """
    Record a single audit/activity log entry within the current DB session.

    The caller is responsible for the encompassing commit.
    This integrates with the business transaction so that if the
    business operation fails, the activity log is also rolled back.
    """
    return await crud_activity.create_activity_log(
        db=db,
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        metadata=metadata,
    )

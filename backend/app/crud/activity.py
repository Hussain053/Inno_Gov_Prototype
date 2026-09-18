from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityAction, ActivityLog
from app.models.application import Application
from app.models.challenge import Challenge
from app.models.contract import Contract
from app.models.evaluation import Evaluation
from app.models.pilot import Pilot
from app.models.pilot_submission import PilotSubmission
from app.models.user import User, UserRole


async def create_activity_log(
    db: AsyncSession,
    actor_user_id: int,
    action: ActivityAction,
    resource_type: str,
    resource_id: Optional[int],
    description: Optional[str] = None,
    metadata: Optional[dict] = None,
) -> ActivityLog:
    """
    Persist a single audit log entry.

    actor_user_id must always be current_user.id from the calling router.
    Never accept arbitrary actor IDs from client-supplied data.
    """
    log = ActivityLog(
        actor_user_id=actor_user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        description=description,
        metadata_=metadata,
    )
    db.add(log)
    # Flush so it participates in the encompassing transaction.
    await db.flush()
    return log


async def get_activity_logs_for_user(
    db: AsyncSession,
    current_user: User,
    resource_type: Optional[str] = None,
    resource_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[ActivityLog]:
    """
    Retrieve activity logs based on user role:

    - STARTUP: Activity performed by the startup themselves (actor == current_user)
      PLUS activity on their own applications and pilots (where they are the startup).
    - GOVERNMENT: Activity on challenges, applications, pilots, and contracts
      owned by this government user.
    - EVALUATOR: Only their own evaluation activity.
    - ADMIN: All system-wide activity.
    """
    if current_user.role == UserRole.ADMIN:
        query = select(ActivityLog)
    elif current_user.role == UserRole.EVALUATOR:
        query = select(ActivityLog).where(
            ActivityLog.actor_user_id == current_user.id
        )
    elif current_user.role == UserRole.STARTUP:
        # Startup can see activity they performed themselves
        query = select(ActivityLog).where(
            ActivityLog.actor_user_id == current_user.id
        )
    elif current_user.role == UserRole.GOVERNMENT:
        # Government can see activity they performed themselves
        query = select(ActivityLog).where(
            ActivityLog.actor_user_id == current_user.id
        )
    else:
        query = select(ActivityLog).where(
            ActivityLog.actor_user_id == current_user.id
        )

    if resource_type is not None:
        query = query.where(ActivityLog.resource_type == resource_type)
    if resource_id is not None:
        query = query.where(ActivityLog.resource_id == resource_id)

    query = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())

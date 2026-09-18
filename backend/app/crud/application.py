from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.datetime_utils import utc_now
from app.models.application import Application, ApplicationStatus
from app.models.challenge import Challenge
from app.models.user import User, UserRole
from app.schemas.application import ApplicationCreate


async def create_application(
    db: AsyncSession,
    application_in: ApplicationCreate,
    startup_id: int,
) -> Application:
    """
    Create a new application in DRAFT status for a startup.
    Flushes to assign an ID; caller is responsible for committing.
    """
    new_application = Application(
        challenge_id=application_in.challenge_id,
        startup_id=startup_id,
        status=ApplicationStatus.DRAFT,
    )
    db.add(new_application)
    await db.flush()
    await db.refresh(new_application)
    return new_application


async def get_application_by_id(
    db: AsyncSession,
    application_id: int,
) -> Optional[Application]:
    """
    Fetch an application by ID with challenge relationship eagerly loaded.
    """
    result = await db.execute(
        select(Application)
        .options(
            selectinload(Application.challenge),
            selectinload(Application.startup).selectinload(User.startup_profile),
        )
        .where(Application.id == application_id)
    )
    return result.scalar_one_or_none()


async def get_application_by_challenge_and_startup(
    db: AsyncSession,
    challenge_id: int,
    startup_id: int,
) -> Optional[Application]:
    """
    Fetch application by challenge_id and startup_id to check for duplicate submission.
    """
    result = await db.execute(
        select(Application).where(
            Application.challenge_id == challenge_id,
            Application.startup_id == startup_id,
        )
    )
    return result.scalar_one_or_none()


async def get_applications_for_user(
    db: AsyncSession,
    current_user: User,
    challenge_id: Optional[int] = None,
    status: Optional[ApplicationStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Application]:
    """
    Retrieve applications based on user role and permissions.
    - STARTUP: Only applications created by this startup.
    - GOVERNMENT: Applications for challenges created by this government user.
    - EVALUATOR: Read-only access to non-draft applications.
    - ADMIN: All applications.
    """
    query = select(Application).options(
        selectinload(Application.challenge),
        selectinload(Application.startup).selectinload(User.startup_profile),
    )

    if current_user.role == UserRole.STARTUP:
        query = query.where(Application.startup_id == current_user.id)
    elif current_user.role == UserRole.GOVERNMENT:
        query = query.join(Application.challenge).where(
            Challenge.government_user_id == current_user.id
        )
    elif current_user.role == UserRole.EVALUATOR:
        query = query.where(Application.status != ApplicationStatus.DRAFT)
    # ADMIN sees all

    if challenge_id is not None:
        query = query.where(Application.challenge_id == challenge_id)
    if status is not None:
        query = query.where(Application.status == status)

    query = query.order_by(Application.created_at.desc())
    result = await db.execute(query)
    all_apps = list(result.scalars().all())

    if current_user.role == UserRole.EVALUATOR:
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        filtered = []
        for app in all_apps:
            if app.challenge and await is_challenge_assigned_to_evaluator(db, app.challenge, current_user.id):
                filtered.append(app)
        return filtered[skip : skip + limit]

    return all_apps[skip : skip + limit]


async def update_application_status(
    db: AsyncSession,
    db_application: Application,
    new_status: ApplicationStatus,
) -> Application:
    """
    Update application status and set submitted_at timestamp if submitting.
    Flushes; caller is responsible for committing.
    """
    db_application.status = new_status
    if new_status == ApplicationStatus.SUBMITTED and not db_application.submitted_at:
        db_application.submitted_at = utc_now()
    db_application.updated_at = utc_now()

    await db.flush()
    await db.refresh(db_application)
    return db_application


async def update_application(
    db: AsyncSession,
    db_application: Application,
) -> Application:
    """
    Save general updates to an application.
    Flushes; caller is responsible for committing.
    """
    db_application.updated_at = utc_now()
    await db.flush()
    await db.refresh(db_application)
    return db_application

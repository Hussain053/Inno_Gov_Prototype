from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_startup
from app.crud import startup as crud_startup
from app.models.application import Application
from app.models.challenge import Challenge
from app.models.evaluator_assignment import EvaluatorAssignment
from app.models.pilot import Pilot
from app.models.pilot_submission import PilotSubmission
from app.models.user import User, UserRole
from app.schemas.startup import StartupProfileResponse, StartupProfileUpdate

router = APIRouter(prefix="/startups", tags=["Startup Profiles"])


@router.get(
    "/me",
    response_model=StartupProfileResponse,
)
async def get_my_startup_profile(
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Get the authenticated user's startup profile.
    - STARTUP role required.
    - Returns 404 if profile has not been created yet.
    """
    profile = await crud_startup.get_startup_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup profile not found for the current user",
        )
    return profile


@router.put(
    "/me",
    response_model=StartupProfileResponse,
)
async def update_my_startup_profile(
    profile_in: StartupProfileUpdate,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Create or update the authenticated user's startup profile.
    - STARTUP role required.
    - User ID derived strictly from JWT authentication token (current_user.id).
    """
    return await crud_startup.update_or_create_startup_profile(
        db=db,
        user_id=current_user.id,
        profile_in=profile_in,
    )


@router.get(
    "/{startup_id}",
    response_model=StartupProfileResponse,
)
async def get_startup_profile(
    startup_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    View a startup profile by ID with object-level authorization.
    - ADMIN: Full access.
    - STARTUP: Can only view own profile.
    - GOVERNMENT: Can view profiles for startups that applied to or have pilots in their challenges.
    - EVALUATOR: Can view profiles for startups in assigned pilot submissions.
    """
    profile = await crud_startup.get_startup_profile_by_id(db, startup_id)
    if not profile:
        profile = await crud_startup.get_startup_profile_by_user_id(db, startup_id)

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup profile not found",
        )

    # Object-level authorization checks
    if current_user.role == UserRole.STARTUP:
        if profile.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view other startup profiles",
            )
    elif current_user.role == UserRole.GOVERNMENT:
        # Check if startup has applied to or has a pilot for a challenge owned by this government user
        app_check = await db.execute(
            select(Application.id)
            .join(Challenge, Application.challenge_id == Challenge.id)
            .where(
                Application.startup_id == profile.user_id,
                Challenge.government_user_id == current_user.id,
            )
            .limit(1)
        )
        has_application = app_check.scalar_one_or_none() is not None

        pilot_check = await db.execute(
            select(Pilot.id)
            .join(Challenge, Pilot.challenge_id == Challenge.id)
            .where(
                Pilot.startup_id == profile.user_id,
                Challenge.government_user_id == current_user.id,
            )
            .limit(1)
        )
        has_pilot = pilot_check.scalar_one_or_none() is not None

        # Government can also view startups during matching for challenges they own
        gov_challenge_check = await db.execute(
            select(Challenge.id).where(Challenge.government_user_id == current_user.id).limit(1)
        )
        has_gov_challenges = gov_challenge_check.scalar_one_or_none() is not None

        if not (has_application or has_pilot or has_gov_challenges):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view this startup profile",
            )
    elif current_user.role == UserRole.EVALUATOR:
        # Check if evaluator is assigned to a submission from this startup
        eval_check = await db.execute(
            select(EvaluatorAssignment.id)
            .join(PilotSubmission, EvaluatorAssignment.pilot_submission_id == PilotSubmission.id)
            .where(
                PilotSubmission.startup_id == profile.user_id,
                EvaluatorAssignment.evaluator_id == current_user.id,
            )
            .limit(1)
        )
        has_eval_assignment = eval_check.scalar_one_or_none() is not None

        if not has_eval_assignment:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to evaluate work from this startup",
            )

    return profile

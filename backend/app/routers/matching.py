from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_government, require_startup
from app.crud import challenge as crud_challenge
from app.crud import startup as crud_startup
from app.models.startup import StartupProfile
from app.models.user import User, UserRole
from app.schemas.matching import MatchResponse
from app.services.matching import calculate_match

router = APIRouter(prefix="/matching", tags=["KPI Matching"])


@router.get(
    "/challenges/{challenge_id}",
    response_model=MatchResponse,
)
async def match_startup_to_challenge(
    challenge_id: int,
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Match the authenticated startup against a specified challenge.
    - STARTUP role required.
    - Uses deterministic rule-based matching engine.
    - Startup identity derived strictly from current_user.id.
    """
    challenge = await crud_challenge.get_challenge_by_id(db, challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    profile = await crud_startup.get_startup_profile_by_user_id(db, current_user.id)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup profile not found. Please complete your startup profile first.",
        )

    m = calculate_match(startup_profile=profile, challenge=challenge)
    m.startup_name = profile.company_name
    m.industry = profile.industry
    return m


@router.get(
    "/challenges/{challenge_id}/startups",
    response_model=List[MatchResponse],
)
async def match_all_startups_for_challenge(
    challenge_id: int,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Match all registered startups against a challenge.
    - GOVERNMENT (for owned challenges) and ADMIN only.
    - Returns match scores ordered from highest to lowest.
    """
    challenge = await crud_challenge.get_challenge_by_id(db, challenge_id)
    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if current_user.role != UserRole.ADMIN and challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view matches for this challenge",
        )

    result = await db.execute(select(StartupProfile))
    profiles = list(result.scalars().all())

    matches = []
    for p in profiles:
        if not p.company_name:
            continue

        if not (
            p.description
            or p.experience
            or p.industry
            or p.location
            or p.kpi_data
        ):
            continue

        m = calculate_match(p, challenge)
        m.startup_name = p.company_name
        m.industry = p.industry
        matches.append(m)

    matches.sort(key=lambda m: (m.match_score, m.startup_name or ""), reverse=True)
    return matches

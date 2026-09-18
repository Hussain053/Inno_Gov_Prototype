from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.permissions import (
    require_admin,
    require_government,
    require_roles,
    require_startup,
)
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    AdminDashboardResponse,
    EvaluatorDashboardResponse,
    GovernmentDashboardResponse,
    StartupDashboardResponse,
)
from app.services import dashboard as service_dashboard

router = APIRouter(prefix="/dashboard", tags=["Dashboards"])


@router.get(
    "/startup",
    response_model=StartupDashboardResponse,
)
async def get_startup_dashboard_metrics(
    current_user: User = Depends(require_startup),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve read-only dashboard metrics for the authenticated startup.
    - STARTUP role required.
    - Strictly scoped to current_user.id.
    """
    return await service_dashboard.get_startup_dashboard(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/government",
    response_model=GovernmentDashboardResponse,
)
async def get_government_dashboard_metrics(
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve read-only dashboard metrics for the authenticated government department.
    - GOVERNMENT and ADMIN roles allowed.
    - Government metrics strictly scoped to challenges owned by current_user.id.
    """
    return await service_dashboard.get_government_dashboard(
        db=db,
        government_user_id=current_user.id,
    )


@router.get(
    "/evaluator",
    response_model=EvaluatorDashboardResponse,
)
async def get_evaluator_dashboard_metrics(
    current_user: User = Depends(require_roles(UserRole.EVALUATOR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve read-only dashboard metrics for the authenticated evaluator.
    - EVALUATOR role required.
    - Scoped to evaluations created by current_user.id.
    """
    return await service_dashboard.get_evaluator_dashboard(
        db=db,
        evaluator_id=current_user.id,
    )


@router.get(
    "/admin",
    response_model=AdminDashboardResponse,
)
async def get_admin_dashboard_metrics(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve system-wide aggregated dashboard metrics.
    - ADMIN role required.
    """
    return await service_dashboard.get_admin_dashboard(db=db)

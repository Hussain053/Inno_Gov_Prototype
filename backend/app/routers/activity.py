from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.crud import activity as crud_activity
from app.models.user import User
from app.schemas.activity import ActivityLogResponse

router = APIRouter(prefix="/activity", tags=["Activity Log"])


@router.get(
    "",
    response_model=List[ActivityLogResponse],
)
async def list_activity(
    resource_type: Optional[str] = Query(None, description="Filter by resource type (e.g. 'challenge', 'application')"),
    resource_id: Optional[int] = Query(None, description="Filter by resource ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve activity/audit log entries for the authenticated user.

    Role-based visibility:
    - STARTUP: Activity performed by the startup user themselves.
    - GOVERNMENT: Activity performed by the government user themselves.
    - EVALUATOR: Activity performed by the evaluator themselves.
    - ADMIN: All system-wide activity.

    Only state-changing business events are recorded (no GET requests).
    Sensitive details are not included in activity descriptions.
    """
    return await crud_activity.get_activity_logs_for_user(
        db=db,
        current_user=current_user,
        resource_type=resource_type,
        resource_id=resource_id,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/report/pdf",
    status_code=status.HTTP_200_OK,
)
async def download_activity_audit_pdf(
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Download a statutory, government-formatted audit log report as a PDF.
    - ADMIN sees all platform records; GOVERNMENT/EVALUATOR see authorized logs.
    """
    from fastapi.responses import Response
    from app.services.pdf_generator import generate_admin_audit_report_pdf

    logs = await crud_activity.get_activity_logs_for_user(
        db=db,
        current_user=current_user,
        resource_type=resource_type,
        skip=0,
        limit=500,
    )

    log_dicts = [
        {
            "id": l.id,
            "created_at": str(l.created_at),
            "actor_user_id": l.actor_user_id,
            "action": l.action.value if hasattr(l.action, "value") else str(l.action),
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "description": l.description,
        }
        for l in logs
    ]

    pdf_bytes = generate_admin_audit_report_pdf(logs=log_dicts, admin_user=current_user)

    filename = f"innogov_statutory_audit_report_{current_user.id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition",
        },
    )


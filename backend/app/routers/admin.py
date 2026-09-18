from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.core.permissions import require_admin
from app.crud import admin as crud_admin
from app.models.activity_log import ActivityAction
from app.models.user import User, UserRole
from app.schemas.admin import (
    AdminUserResponse,
    AdminUserRoleUpdate,
    AdminUserStatusUpdate,
)
from app.services.activity import record_activity

router = APIRouter(prefix="/admin", tags=["Admin Management"])


@router.get(
    "/users",
    response_model=List[AdminUserResponse],
)
async def list_users(
    role: Optional[UserRole] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    List all system users.
    - ADMIN only.
    - Never exposes password hashes or tokens.
    """
    return await crud_admin.get_all_users(
        db=db,
        role=role,
        is_active=is_active,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/users/{user_id}",
    response_model=AdminUserResponse,
)
async def get_user_detail(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Get user details by ID.
    - ADMIN only.
    """
    target_user = await crud_admin.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return target_user


@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserResponse,
)
async def change_user_status(
    user_id: int,
    status_in: AdminUserStatusUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Activate or deactivate a user account.
    - ADMIN only.
    - Deactivated users are immediately blocked at get_current_user token verification.
    - Admin cannot deactivate their own account to prevent accidental lockout.
    """
    if user_id == current_user.id and not status_in.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own admin account",
        )

    target_user = await crud_admin.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    updated_user = await crud_admin.update_user_status(
        db=db,
        db_user=target_user,
        is_active=status_in.is_active,
    )

    action_str = "activated" if status_in.is_active else "deactivated"
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.USER_STATUS_CHANGED,
        resource_type="user",
        resource_id=target_user.id,
        description=f"User ID {target_user.id} ({target_user.email}) was {action_str} by admin.",
    )
    await db.commit()
    await db.refresh(updated_user)
    return updated_user


@router.patch(
    "/users/{user_id}/role",
    response_model=AdminUserResponse,
)
async def change_user_role(
    user_id: int,
    role_in: AdminUserRoleUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a user's role in the database.
    - ADMIN only.
    - Admin cannot demote their own account to prevent lockout.
    - Future requests will enforce the updated database role.
    """
    if user_id == current_user.id and role_in.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own admin role",
        )

    target_user = await crud_admin.get_user_by_id(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    old_role = target_user.role
    updated_user = await crud_admin.update_user_role(
        db=db,
        db_user=target_user,
        new_role=role_in.role,
    )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.USER_ROLE_CHANGED,
        resource_type="user",
        resource_id=target_user.id,
        description=f"User ID {target_user.id} ({target_user.email}) role changed from {old_role.value} to {role_in.role.value}.",
    )
    await db.commit()
    await db.refresh(updated_user)
    return updated_user

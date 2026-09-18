from typing import Callable

from fastapi import Depends, HTTPException, status

from app.core.dependencies import get_current_user
from app.models.user import User, UserRole


def require_roles(*allowed_roles: UserRole) -> Callable:
    """
    Dependency factory that verifies if the authenticated user possesses one of the specified roles.

    Rule Matrix:
    - ADMIN: Granted full administrative access across all role-restricted operations.
    - GOVERNMENT: Allowed for government operations.
    - EVALUATOR: Allowed for evaluation operations.
    - STARTUP: Allowed for startup operations.

    Response Codes:
    - Missing / Invalid / Expired JWT or Nonexistent User -> HTTP 401 Unauthorized (handled by get_current_user).
    - Unpermitted Role -> HTTP 403 Forbidden.
    """
    async def role_checker(
        current_user: User = Depends(get_current_user),
    ) -> User:
        if current_user.role != UserRole.ADMIN and current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )
        return current_user

    return role_checker


# Reusable role-protected dependencies for route authorization
require_admin = require_roles(UserRole.ADMIN)
require_government = require_roles(UserRole.GOVERNMENT)
require_evaluator = require_roles(UserRole.EVALUATOR)
require_startup = require_roles(UserRole.STARTUP)

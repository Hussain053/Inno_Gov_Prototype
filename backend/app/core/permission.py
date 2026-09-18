"""
Alias for app.core.permissions to maintain backwards compatibility.
"""
from app.core.permissions import (
    require_admin,
    require_evaluator,
    require_government,
    require_roles,
    require_startup,
)

__all__ = [
    "require_roles",
    "require_admin",
    "require_government",
    "require_evaluator",
    "require_startup",
]
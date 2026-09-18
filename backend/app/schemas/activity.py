from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, ConfigDict

from app.models.activity_log import ActivityAction


class ActivityLogResponse(BaseModel):
    id: int
    actor_user_id: int
    action: ActivityAction
    resource_type: str
    resource_id: Optional[int] = None
    description: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

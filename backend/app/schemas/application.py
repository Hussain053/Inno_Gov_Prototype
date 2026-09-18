from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.application import ApplicationStatus


class ApplicationCreate(BaseModel):
    challenge_id: int = Field(..., description="ID of the target OPEN challenge")


class ApplicationUpdate(BaseModel):
    pass


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus = Field(..., description="Target status for the application")


class ApplicationResponse(BaseModel):
    id: int
    challenge_id: int
    startup_id: int
    status: ApplicationStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    startup_name: Optional[str] = None
    challenge_title: Optional[str] = None
    startup_industry: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

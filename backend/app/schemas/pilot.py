from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.pilot import PilotStatus


class PilotCreate(BaseModel):
    application_id: int = Field(..., description="ID of the SHORTLISTED application")
    title: str = Field(..., max_length=255, description="Title of the pilot project")
    task_description: str = Field(..., description="Detailed description of pilot tasks")
    requirements: Optional[Any] = None
    success_criteria: Optional[Any] = None
    kpis: Optional[Any] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[PilotStatus] = PilotStatus.ASSIGNED


class PilotUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    task_description: Optional[str] = None
    requirements: Optional[Any] = None
    success_criteria: Optional[Any] = None
    kpis: Optional[Any] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[PilotStatus] = None


class PilotStatusUpdate(BaseModel):
    status: PilotStatus = Field(..., description="Target status for the pilot")


class PilotResponse(BaseModel):
    id: int
    challenge_id: int
    startup_id: int
    title: str
    task_description: str
    requirements: Optional[Any] = None
    success_criteria: Optional[Any] = None
    kpis: Optional[Any] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: PilotStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

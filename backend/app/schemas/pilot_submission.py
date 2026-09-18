from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.pilot_submission import PilotSubmissionStatus


class PilotSubmissionCreate(BaseModel):
    pilot_id: int = Field(..., description="ID of the IN_PROGRESS pilot project")
    results: Optional[str] = Field(None, description="Detailed pilot test results")
    kpi_results: Optional[Any] = None
    evidence: Optional[Any] = None


class PilotSubmissionUpdate(BaseModel):
    results: Optional[str] = None
    kpi_results: Optional[Any] = None
    evidence: Optional[Any] = None


class PilotSubmissionResponse(BaseModel):
    id: int
    pilot_id: int
    startup_id: int
    results: Optional[str] = None
    kpi_results: Optional[Any] = None
    evidence: Optional[Any] = None
    status: PilotSubmissionStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

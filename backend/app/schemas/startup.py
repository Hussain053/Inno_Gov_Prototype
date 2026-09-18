from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class StartupProfileCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255, description="Registered company name")
    description: Optional[str] = Field(None, description="Overview of the startup")
    industry: Optional[str] = Field(None, max_length=100, description="Industry sector")
    location: Optional[str] = Field(None, max_length=255, description="HQ or operating location")
    website: Optional[str] = Field(None, max_length=500, description="Company website URL")
    team_size: Optional[int] = Field(None, ge=0, description="Number of team members")
    experience: Optional[str] = Field(None, description="Relevant track record or experience")
    kpi_data: Optional[Any] = Field(None, description="Structured KPI or capability metrics")


class StartupProfileUpdate(BaseModel):
    company_name: Optional[str] = Field(None, min_length=1, max_length=255, description="Registered company name")
    description: Optional[str] = None
    industry: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    website: Optional[str] = Field(None, max_length=500)
    team_size: Optional[int] = Field(None, ge=0)
    experience: Optional[str] = None
    kpi_data: Optional[Any] = None


class StartupProfileResponse(BaseModel):
    id: int
    user_id: int
    company_name: str
    description: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    website: Optional[str] = None
    team_size: Optional[int] = None
    experience: Optional[str] = None
    kpi_data: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.challenge import ChallengeStatus


class ChallengeCreate(BaseModel):
    title: str = Field(..., max_length=255, description="Title of the challenge")
    description: str = Field(..., description="Detailed description of the challenge")
    problem_statement: str = Field(..., description="Core problem statement")
    category: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    budget: Optional[float] = Field(None, ge=0)
    application_deadline: Optional[date] = None
    status: Optional[ChallengeStatus] = ChallengeStatus.DRAFT
    requirements: Optional[Any] = None
    kpis: Optional[Any] = None


class ChallengeUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    problem_statement: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    location: Optional[str] = Field(None, max_length=255)
    budget: Optional[float] = Field(None, ge=0)
    application_deadline: Optional[date] = None
    status: Optional[ChallengeStatus] = None
    requirements: Optional[Any] = None
    kpis: Optional[Any] = None


class ChallengeResponse(BaseModel):
    id: int
    government_user_id: int
    title: str
    description: str
    problem_statement: str
    category: Optional[str] = None
    location: Optional[str] = None
    budget: Optional[float] = None
    application_deadline: Optional[date] = None
    status: ChallengeStatus
    requirements: Optional[Any] = None
    kpis: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

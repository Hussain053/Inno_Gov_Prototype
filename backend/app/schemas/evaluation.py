from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.evaluation import EvaluationRecommendation, EvaluationStatus


class EvaluationCreate(BaseModel):
    pilot_submission_id: int = Field(..., description="ID of the submitted pilot submission")
    technical_score: float = Field(..., ge=0, le=100, description="Technical score (0-100)")
    kpi_score: float = Field(..., ge=0, le=100, description="KPI score (0-100)")
    innovation_score: float = Field(..., ge=0, le=100, description="Innovation score (0-100)")
    feasibility_score: float = Field(..., ge=0, le=100, description="Feasibility score (0-100)")
    impact_score: float = Field(..., ge=0, le=100, description="Impact score (0-100)")
    comments: Optional[str] = None
    recommendation: EvaluationRecommendation = Field(..., description="RECOMMEND or DO_NOT_RECOMMEND")


class EvaluationUpdate(BaseModel):
    technical_score: Optional[float] = Field(None, ge=0, le=100)
    kpi_score: Optional[float] = Field(None, ge=0, le=100)
    innovation_score: Optional[float] = Field(None, ge=0, le=100)
    feasibility_score: Optional[float] = Field(None, ge=0, le=100)
    impact_score: Optional[float] = Field(None, ge=0, le=100)
    comments: Optional[str] = None
    recommendation: Optional[EvaluationRecommendation] = None


class EvaluationResponse(BaseModel):
    id: int
    pilot_submission_id: int
    evaluator_id: int
    technical_score: Optional[float] = None
    kpi_score: Optional[float] = None
    innovation_score: Optional[float] = None
    feasibility_score: Optional[float] = None
    impact_score: Optional[float] = None
    overall_score: Optional[float] = None
    comments: Optional[str] = None
    recommendation: Optional[EvaluationRecommendation] = None
    status: EvaluationStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

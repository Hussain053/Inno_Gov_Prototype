from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.evaluator_assignment import AssignmentStatus
from app.models.pilot_submission import PilotSubmissionStatus


class EvaluatorAssignmentCreate(BaseModel):
    pilot_submission_id: int
    evaluator_id: int


class EvaluatorAssignmentStatusUpdate(BaseModel):
    status: AssignmentStatus


class EvaluatorAssignmentChallengeSummary(BaseModel):
    id: int
    title: str
    problem_statement: Optional[str] = None
    category: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EvaluatorAssignmentPilotSummary(BaseModel):
    id: int
    title: str
    challenge_id: int
    challenge: Optional[EvaluatorAssignmentChallengeSummary] = None

    model_config = ConfigDict(from_attributes=True)


class EvaluatorAssignmentUserSummary(BaseModel):
    id: int
    name: str
    organization: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class EvaluatorAssignmentSubmissionSummary(BaseModel):
    id: int
    pilot_id: int
    startup_id: int
    status: PilotSubmissionStatus
    pilot: Optional[EvaluatorAssignmentPilotSummary] = None
    startup: Optional[EvaluatorAssignmentUserSummary] = None

    model_config = ConfigDict(from_attributes=True)


class EvaluatorAssignmentResponse(BaseModel):
    id: int
    pilot_submission_id: int
    evaluator_id: int
    status: AssignmentStatus
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    pilot_submission: Optional[EvaluatorAssignmentSubmissionSummary] = None

    model_config = ConfigDict(from_attributes=True)

from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict, Field


class StartupDashboardResponse(BaseModel):
    profile_completed: bool = Field(..., description="Whether startup profile has been created")
    total_applications: int = Field(0, description="Total applications created")
    submitted_applications: int = Field(0, description="Applications submitted")
    shortlisted_applications: int = Field(0, description="Applications shortlisted")
    rejected_applications: int = Field(0, description="Applications rejected")
    withdrawn_applications: int = Field(0, description="Applications withdrawn")
    active_pilots: int = Field(0, description="Active or in-progress pilot projects")
    completed_pilots: int = Field(0, description="Successfully completed pilots")
    total_submissions: int = Field(0, description="Total pilot submissions created")
    total_contracts: int = Field(0, description="Total awarded contracts")
    total_contract_value: float = Field(0.0, description="Total value of awarded contracts")

    model_config = ConfigDict(from_attributes=True)


class GovernmentDashboardResponse(BaseModel):
    total_challenges: int = Field(0, description="Total challenges created")
    open_challenges: int = Field(0, description="Currently OPEN challenges")
    closed_challenges: int = Field(0, description="CLOSED challenges")
    draft_challenges: int = Field(0, description="DRAFT challenges")
    total_applications_received: int = Field(0, description="Total applications received across challenges")
    applications_under_review: int = Field(0, description="Applications currently under review")
    shortlisted_applications: int = Field(0, description="Applications shortlisted")
    active_pilots: int = Field(0, description="Active pilot projects underway")
    completed_pilots: int = Field(0, description="Completed pilot projects")
    contracts_awarded: int = Field(0, description="Total contracts awarded")
    total_contract_value: float = Field(0.0, description="Aggregate value of awarded contracts")

    model_config = ConfigDict(from_attributes=True)


class EvaluatorDashboardResponse(BaseModel):
    evaluations_completed: int = Field(0, description="Evaluations completed by this evaluator")
    evaluations_pending: int = Field(0, description="Evaluations currently pending")
    submissions_available_for_evaluation: int = Field(0, description="Submissions available for evaluation")
    average_overall_score: Optional[float] = Field(None, description="Average score awarded across evaluations")
    recommendations_breakdown: Dict[str, int] = Field(default_factory=dict, description="Breakdown of recommendations made")

    model_config = ConfigDict(from_attributes=True)


class AdminDashboardResponse(BaseModel):
    total_users: int = Field(0, description="Total registered users")
    users_by_role: Dict[str, int] = Field(default_factory=dict, description="User count breakdown by role")
    total_startups: int = Field(0, description="Total startup profiles")
    total_challenges: int = Field(0, description="Total challenges system-wide")
    open_challenges: int = Field(0, description="Total OPEN challenges")
    total_applications: int = Field(0, description="Total applications system-wide")
    active_pilots: int = Field(0, description="Active pilots system-wide")
    completed_pilots: int = Field(0, description="Completed pilots system-wide")
    total_evaluations: int = Field(0, description="Total evaluations system-wide")
    contracts_awarded: int = Field(0, description="Total contracts system-wide")
    total_contract_value: float = Field(0.0, description="Aggregate system-wide contract value")

    model_config = ConfigDict(from_attributes=True)

from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MatchResponse(BaseModel):
    challenge_id: int = Field(..., description="ID of the matched challenge")
    startup_id: int = Field(..., description="User ID of the startup")
    match_score: float = Field(..., ge=0, le=100, description="Match score from 0 to 100")
    matched_domains: List[str] = Field(default_factory=list, description="Relevant domains/sectors matched")
    matched_skills: List[str] = Field(default_factory=list, description="Relevant skills/capabilities matched")
    matched_technologies: List[str] = Field(default_factory=list, description="Relevant technologies matched")
    matched_kpis: List[str] = Field(default_factory=list, description="KPI keys or criteria that matched")
    explanation: List[str] = Field(default_factory=list, description="Human-readable score breakdown bullet points")
    breakdown: Dict[str, float] = Field(default_factory=dict, description="Detailed point breakdown by dimension")
    startup_name: Optional[str] = Field(None, description="Name of the startup company")
    industry: Optional[str] = Field(None, description="Industry sector of the startup")

    model_config = ConfigDict(from_attributes=True)

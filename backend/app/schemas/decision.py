import enum
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class GovernmentDecisionEnum(str, enum.Enum):
    PENDING = "PENDING"
    AWARDED = "AWARDED"
    NOT_AWARDED = "NOT_AWARDED"


class GovernmentDecisionCreate(BaseModel):
    pilot_id: int
    decision: GovernmentDecisionEnum
    notes: Optional[str] = Field(None, description="Rationale for final government procurement decision")


class GovernmentDecisionResponse(BaseModel):
    challenge_id: int
    pilot_id: int
    decision: GovernmentDecisionEnum
    notes: Optional[str] = None
    decided_at: datetime
    contract_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

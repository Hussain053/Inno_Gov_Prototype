from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.contract import ContractStatus


class ContractCreate(BaseModel):
    pilot_id: int = Field(..., description="ID of the COMPLETED pilot project")
    contract_value: Optional[float] = Field(None, ge=0, description="Total monetary contract value")
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[ContractStatus] = ContractStatus.DRAFT


class ContractUpdate(BaseModel):
    contract_value: Optional[float] = Field(None, ge=0)
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class ContractStatusUpdate(BaseModel):
    status: ContractStatus = Field(..., description="Target status for the contract")


class ContractResponse(BaseModel):
    id: int
    challenge_id: int
    startup_id: int
    pilot_id: int
    government_user_id: int
    contract_value: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: ContractStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

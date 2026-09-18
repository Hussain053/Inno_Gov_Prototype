from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models.user import UserRole


class UserRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the user")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 chars)")
    role: Optional[UserRole] = Field(default=UserRole.STARTUP, description="Default assigned role")
    organization: Optional[str] = Field(None, max_length=255, description="Organization or company name")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if v:
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if len(v) > 128:
            raise ValueError("Password must not exceed 128 characters")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        if not any(c.isalpha() for c in v):
            raise ValueError("Password must contain at least one letter")
        return v


class GovernmentRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of government official")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 chars)")
    organization: str = Field(..., min_length=1, max_length=255, description="Government agency or institutional organization")
    department: Optional[str] = Field(None, max_length=255, description="Department name")
    government_service_id: str = Field(..., min_length=1, max_length=255, description="Government Service or Verification ID")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if v:
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return UserRegister.validate_password(v)


class EvaluatorRegister(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of evaluator")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 chars)")
    organization: Optional[str] = Field(None, max_length=255, description="Organization or institutional affiliation")
    evaluator_service_id: str = Field(..., min_length=1, max_length=255, description="Evaluator Verification or Invitation ID")

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if v:
            return v.strip().lower()
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return UserRegister.validate_password(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        if v:
            return v.strip().lower()
        return v


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    organization: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

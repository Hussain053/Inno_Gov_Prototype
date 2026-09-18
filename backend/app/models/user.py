from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.datetime_utils import utc_now
from app.database import Base

import enum


class UserRole(str, enum.Enum):
    STARTUP = "STARTUP"
    GOVERNMENT = "GOVERNMENT"
    EVALUATOR = "EVALUATOR"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        nullable=False,
    )

    organization: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )

    startup_profile = relationship(
    "StartupProfile",
    back_populates="user",
    uselist=False,
    )

    challenges = relationship(
    "Challenge",
    back_populates="government_user",
    )

    applications = relationship(
    "Application",
    back_populates="startup",
    )

    pilots = relationship(
    "Pilot",
    back_populates="startup",
    )

    pilot_submissions = relationship(
    "PilotSubmission",
    back_populates="startup",
    )

    evaluations = relationship(
    "Evaluation",
    back_populates="evaluator",
    )

    contracts_as_startup = relationship(
    "Contract",
    foreign_keys="Contract.startup_id",
    back_populates="startup",
    )

    contracts_as_government = relationship(
    "Contract",
    foreign_keys="Contract.government_user_id",
    back_populates="government_user",
    )

    notifications = relationship(
    "Notification",
    back_populates="user",
    cascade="all, delete-orphan",
    )

    activity_logs = relationship(
    "ActivityLog",
    back_populates="actor",
    cascade="all, delete-orphan",
    )

    evaluator_assignments = relationship(
    "EvaluatorAssignment",
    back_populates="evaluator",
    cascade="all, delete-orphan",
    )
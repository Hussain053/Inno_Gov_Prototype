import enum
from datetime import date, datetime

from app.core.datetime_utils import utc_now
from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONType = JSONB().with_variant(JSON, "sqlite")

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChallengeStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    CLOSED = "CLOSED"
    IN_REVIEW = "IN_REVIEW"
    AWARDED = "AWARDED"
    COMPLETED = "COMPLETED"


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    government_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    problem_statement: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    budget: Mapped[float | None] = mapped_column(
        Numeric(15, 2),
        nullable=True,
    )

    application_deadline: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[ChallengeStatus] = mapped_column(
        Enum(ChallengeStatus),
        default=ChallengeStatus.DRAFT,
        nullable=False,
    )

    requirements: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
    )

    kpis: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
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

    government_user = relationship(
        "User",
        back_populates="challenges",
    )

    applications = relationship(
    "Application",
    back_populates="challenge",
    cascade="all, delete-orphan",
    )

    pilots = relationship(
    "Pilot",
    back_populates="challenge",
    cascade="all, delete-orphan",
    )

    contracts = relationship(
    "Contract",
    back_populates="challenge",
    cascade="all, delete-orphan",
    )
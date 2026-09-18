import enum
from datetime import date, datetime
from app.core.datetime_utils import utc_now

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONType = JSONB().with_variant(JSON, "sqlite")

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PilotStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class Pilot(Base):
    __tablename__ = "pilots"
    __table_args__ = (
        UniqueConstraint("challenge_id", "startup_id", name="uq_pilots_challenge_startup"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    challenge_id: Mapped[int] = mapped_column(
        ForeignKey("challenges.id", ondelete="CASCADE"),
        nullable=False,
    )

    startup_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    task_description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    requirements: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
    )

    success_criteria: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
    )

    kpis: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
    )

    start_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    end_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    status: Mapped[PilotStatus] = mapped_column(
        Enum(PilotStatus),
        default=PilotStatus.ASSIGNED,
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

    challenge = relationship(
        "Challenge",
        back_populates="pilots",
    )

    startup = relationship(
        "User",
        back_populates="pilots",
    )

    submission = relationship(
    "PilotSubmission",
    back_populates="pilot",
    uselist=False,
    cascade="all, delete-orphan",
    )

    contract = relationship(
    "Contract",
    back_populates="pilot",
    uselist=False,
    cascade="all, delete-orphan",
    )
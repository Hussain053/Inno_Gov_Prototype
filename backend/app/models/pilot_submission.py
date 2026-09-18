import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONType = JSONB().with_variant(JSON, "sqlite")

from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class PilotSubmissionStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_EVALUATION = "UNDER_EVALUATION"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class PilotSubmission(Base):
    __tablename__ = "pilot_submissions"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    startup_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    results: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    kpi_results: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
    )

    evidence: Mapped[dict | None] = mapped_column(
        JSONType,
        nullable=True,
    )

    status: Mapped[PilotSubmissionStatus] = mapped_column(
        Enum(PilotSubmissionStatus),
        default=PilotSubmissionStatus.DRAFT,
        nullable=False,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    pilot = relationship(
        "Pilot",
        back_populates="submission",
    )

    startup = relationship(
        "User",
        back_populates="pilot_submissions",
    )

    evaluations = relationship(
        "Evaluation",
        back_populates="pilot_submission",
        cascade="all, delete-orphan",
    )

    evaluator_assignments = relationship(
        "EvaluatorAssignment",
        back_populates="pilot_submission",
        cascade="all, delete-orphan",
    )
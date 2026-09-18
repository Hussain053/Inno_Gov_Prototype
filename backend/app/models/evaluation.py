import enum
from datetime import datetime
from app.core.datetime_utils import utc_now

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class EvaluationRecommendation(str, enum.Enum):
    RECOMMEND = "RECOMMEND"
    DO_NOT_RECOMMEND = "DO_NOT_RECOMMEND"


class EvaluationStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"


class Evaluation(Base):
    __tablename__ = "evaluations"
    __table_args__ = (
        UniqueConstraint("pilot_submission_id", "evaluator_id", name="uq_evaluations_submission_evaluator"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    pilot_submission_id: Mapped[int] = mapped_column(
        ForeignKey("pilot_submissions.id", ondelete="CASCADE"),
        nullable=False,
    )

    evaluator_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    technical_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    kpi_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    innovation_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    feasibility_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    impact_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    overall_score: Mapped[float | None] = mapped_column(
        Numeric(5, 2),
        nullable=True,
    )

    comments: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommendation: Mapped[EvaluationRecommendation | None] = mapped_column(
        Enum(EvaluationRecommendation),
        nullable=True,
    )

    status: Mapped[EvaluationStatus] = mapped_column(
        Enum(EvaluationStatus),
        default=EvaluationStatus.PENDING,
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

    pilot_submission = relationship(
        "PilotSubmission",
        back_populates="evaluations",
    )

    evaluator = relationship(
        "User",
        back_populates="evaluations",
    )
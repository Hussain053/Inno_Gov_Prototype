import enum
from datetime import datetime
from app.core.datetime_utils import utc_now

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AssignmentStatus(str, enum.Enum):
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class EvaluatorAssignment(Base):
    __tablename__ = "evaluator_assignments"

    __table_args__ = (
        UniqueConstraint(
            "pilot_submission_id",
            "evaluator_id",
            name="uq_evaluator_assignments_submission_evaluator",
        ),
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

    status: Mapped[AssignmentStatus] = mapped_column(
        Enum(AssignmentStatus),
        default=AssignmentStatus.ASSIGNED,
        nullable=False,
    )

    assigned_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    completed_at: Mapped[datetime | None] = mapped_column(
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

    pilot_submission = relationship(
        "PilotSubmission",
        back_populates="evaluator_assignments",
    )

    evaluator = relationship(
        "User",
        back_populates="evaluator_assignments",
    )

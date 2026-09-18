import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class NotificationType(str, enum.Enum):
    # Application events
    APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED"
    APPLICATION_UNDER_REVIEW = "APPLICATION_UNDER_REVIEW"
    APPLICATION_SHORTLISTED = "APPLICATION_SHORTLISTED"
    APPLICATION_REJECTED = "APPLICATION_REJECTED"
    APPLICATION_WITHDRAWN = "APPLICATION_WITHDRAWN"

    # Pilot events
    PILOT_ASSIGNED = "PILOT_ASSIGNED"
    PILOT_STARTED = "PILOT_STARTED"
    PILOT_COMPLETED = "PILOT_COMPLETED"
    PILOT_FAILED = "PILOT_FAILED"

    # Submission events
    SUBMISSION_SUBMITTED = "SUBMISSION_SUBMITTED"
    SUBMISSION_UNDER_EVALUATION = "SUBMISSION_UNDER_EVALUATION"
    SUBMISSION_ACCEPTED = "SUBMISSION_ACCEPTED"
    SUBMISSION_REJECTED = "SUBMISSION_REJECTED"

    # Evaluation events
    EVALUATION_COMPLETED = "EVALUATION_COMPLETED"

    # Contract events
    CONTRACT_AWARDED = "CONTRACT_AWARDED"
    CONTRACT_ACTIVE = "CONTRACT_ACTIVE"
    CONTRACT_COMPLETED = "CONTRACT_COMPLETED"
    CONTRACT_TERMINATED = "CONTRACT_TERMINATED"

    # Challenge events
    CHALLENGE_CREATED = "CHALLENGE_CREATED"
    CHALLENGE_CLOSED = "CHALLENGE_CLOSED"


class Notification(Base):
    __tablename__ = "notifications"

    __table_args__ = (
        Index("ix_notifications_user_created_at", "user_id", "created_at"),
        Index("ix_notifications_user_is_read", "user_id", "is_read"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    notification_type: Mapped[NotificationType] = mapped_column(
        Enum(NotificationType),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    resource_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    resource_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    is_read: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    user = relationship(
        "User",
        back_populates="notifications",
    )

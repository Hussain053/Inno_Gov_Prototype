import enum
from datetime import datetime
from app.core.datetime_utils import utc_now

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, Text, JSON
from sqlalchemy.dialects.postgresql import JSONB

JSONType = JSONB().with_variant(JSON, "sqlite")
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ActivityAction(str, enum.Enum):
    # Challenge actions
    CHALLENGE_CREATED = "CHALLENGE_CREATED"
    CHALLENGE_UPDATED = "CHALLENGE_UPDATED"
    CHALLENGE_STATUS_CHANGED = "CHALLENGE_STATUS_CHANGED"
    CHALLENGE_DELETED = "CHALLENGE_DELETED"

    # Application actions
    APPLICATION_CREATED = "APPLICATION_CREATED"
    APPLICATION_SUBMITTED = "APPLICATION_SUBMITTED"
    APPLICATION_STATUS_CHANGED = "APPLICATION_STATUS_CHANGED"
    APPLICATION_WITHDRAWN = "APPLICATION_WITHDRAWN"

    # Pilot actions
    PILOT_CREATED = "PILOT_CREATED"
    PILOT_UPDATED = "PILOT_UPDATED"
    PILOT_STATUS_CHANGED = "PILOT_STATUS_CHANGED"
    PILOT_DELETED = "PILOT_DELETED"

    # Submission actions
    SUBMISSION_CREATED = "SUBMISSION_CREATED"
    SUBMISSION_SUBMITTED = "SUBMISSION_SUBMITTED"

    # Evaluation actions
    EVALUATION_CREATED = "EVALUATION_CREATED"
    EVALUATION_COMPLETED = "EVALUATION_COMPLETED"

    # Contract actions
    CONTRACT_CREATED = "CONTRACT_CREATED"
    CONTRACT_STATUS_CHANGED = "CONTRACT_STATUS_CHANGED"

    # User actions
    USER_STATUS_CHANGED = "USER_STATUS_CHANGED"
    USER_ROLE_CHANGED = "USER_ROLE_CHANGED"


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    __table_args__ = (
        Index("ix_activity_logs_actor_created_at", "actor_user_id", "created_at"),
        Index("ix_activity_logs_resource", "resource_type", "resource_id"),
        Index("ix_activity_logs_created_at", "created_at"),
    )

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
    )

    actor_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    action: Mapped[ActivityAction] = mapped_column(
        Enum(ActivityAction),
        nullable=False,
    )

    resource_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    resource_id: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    metadata_: Mapped[dict | None] = mapped_column(
        "metadata",
        JSONType,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=utc_now,
        nullable=False,
    )

    actor = relationship(
        "User",
        back_populates="activity_logs",
    )

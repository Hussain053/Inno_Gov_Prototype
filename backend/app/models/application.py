import enum
from datetime import datetime
from app.core.datetime_utils import utc_now

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ApplicationStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    SHORTLISTED = "SHORTLISTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class Application(Base):
    __tablename__ = "applications"

    __table_args__ = (
        UniqueConstraint(
            "challenge_id",
            "startup_id",
            name="uq_application_challenge_startup",
        ),
    )

    @property
    def startup_name(self) -> str | None:
        if self.startup:
            if self.startup.startup_profile and self.startup.startup_profile.company_name:
                return self.startup.startup_profile.company_name
            return self.startup.name
        return None

    @property
    def challenge_title(self) -> str | None:
        if self.challenge:
            return self.challenge.title
        return None

    @property
    def startup_industry(self) -> str | None:
        if self.startup and self.startup.startup_profile:
            return self.startup.startup_profile.industry
        return None

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

    status: Mapped[ApplicationStatus] = mapped_column(
        Enum(ApplicationStatus),
        default=ApplicationStatus.DRAFT,
        nullable=False,
    )

    submitted_at: Mapped[datetime | None] = mapped_column(
        DateTime,
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

    challenge = relationship(
        "Challenge",
        back_populates="applications",
    )

    startup = relationship(
        "User",
        back_populates="applications",
    )
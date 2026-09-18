import enum
from datetime import date, datetime
from app.core.datetime_utils import utc_now

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ContractStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    AWARDED = "AWARDED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    TERMINATED = "TERMINATED"


class Contract(Base):
    __tablename__ = "contracts"
    __table_args__ = (
        UniqueConstraint("pilot_id", name="uq_contracts_pilot"),
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

    pilot_id: Mapped[int] = mapped_column(
        ForeignKey("pilots.id", ondelete="CASCADE"),
        nullable=False,
    )

    government_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )

    contract_value: Mapped[float | None] = mapped_column(
        Numeric(15, 2),
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

    status: Mapped[ContractStatus] = mapped_column(
        Enum(ContractStatus),
        default=ContractStatus.DRAFT,
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
        back_populates="contracts",
    )

    startup = relationship(
        "User",
        foreign_keys=[startup_id],
        back_populates="contracts_as_startup",
    )

    pilot = relationship(
        "Pilot",
        back_populates="contract",
    )

    government_user = relationship(
        "User",
        foreign_keys=[government_user_id],
        back_populates="contracts_as_government",
    )
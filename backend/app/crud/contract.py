from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.datetime_utils import utc_now
from app.models.challenge import Challenge, ChallengeStatus
from app.models.contract import Contract, ContractStatus
from app.models.pilot import Pilot
from app.models.pilot_submission import PilotSubmission, PilotSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.contract import ContractCreate, ContractUpdate


async def create_contract(
    db: AsyncSession,
    contract_in: ContractCreate,
    pilot: Pilot,
    government_user_id: Optional[int] = None,
) -> Contract:
    """
    Create a new contract representing the Government's final award decision.
    Derives all relationship identifiers server-side:
    - challenge_id = pilot.challenge_id
    - startup_id = pilot.startup_id
    - government_user_id = government_user_id or pilot.challenge.government_user_id
    Also updates associated submission status to ACCEPTED and challenge status to AWARDED.
    """
    gov_id = government_user_id if government_user_id is not None else pilot.challenge.government_user_id
    new_contract = Contract(
        challenge_id=pilot.challenge_id,
        startup_id=pilot.startup_id,
        pilot_id=pilot.id,
        government_user_id=gov_id,
        contract_value=contract_in.contract_value,
        start_date=contract_in.start_date,
        end_date=contract_in.end_date,
        status=contract_in.status if contract_in.status is not None else ContractStatus.DRAFT,
    )
    db.add(new_contract)

    # Update associated submission to ACCEPTED
    if pilot.submission:
        pilot.submission.status = PilotSubmissionStatus.ACCEPTED
        pilot.submission.updated_at = utc_now()

    # Update associated challenge to AWARDED
    if pilot.challenge:
        pilot.challenge.status = ChallengeStatus.AWARDED
        pilot.challenge.updated_at = utc_now()

    await db.commit()
    await db.refresh(new_contract)
    return new_contract


async def get_contract_by_id(
    db: AsyncSession,
    contract_id: int,
) -> Optional[Contract]:
    """
    Fetch a contract by ID with relationships eagerly loaded.
    """
    result = await db.execute(
        select(Contract)
        .options(selectinload(Contract.challenge), selectinload(Contract.pilot))
        .where(Contract.id == contract_id)
    )
    return result.scalar_one_or_none()


async def get_contract_by_pilot_id(
    db: AsyncSession,
    pilot_id: int,
) -> Optional[Contract]:
    """
    Fetch contract by pilot_id to prevent duplicate contracts for the same pilot project.
    """
    result = await db.execute(
        select(Contract).where(Contract.pilot_id == pilot_id)
    )
    return result.scalar_one_or_none()


async def get_contracts_for_user(
    db: AsyncSession,
    current_user: User,
    challenge_id: Optional[int] = None,
    pilot_id: Optional[int] = None,
    startup_id: Optional[int] = None,
    status: Optional[ContractStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Contract]:
    """
    Retrieve contracts based on user role:
    - STARTUP: Contracts where startup_id == current_user.id.
    - GOVERNMENT: Contracts for challenges owned by government user.
    - EVALUATOR: Read-only access to relevant contracts.
    - ADMIN: All contracts.
    """
    query = select(Contract).options(
        selectinload(Contract.challenge), selectinload(Contract.pilot)
    )

    if current_user.role == UserRole.STARTUP:
        query = query.where(Contract.startup_id == current_user.id)
    elif current_user.role == UserRole.GOVERNMENT:
        query = query.where(Contract.government_user_id == current_user.id)
    # EVALUATOR and ADMIN see all contracts

    if challenge_id is not None:
        query = query.where(Contract.challenge_id == challenge_id)
    if pilot_id is not None:
        query = query.where(Contract.pilot_id == pilot_id)
    if startup_id is not None and current_user.role in (UserRole.ADMIN, UserRole.GOVERNMENT, UserRole.EVALUATOR):
        query = query.where(Contract.startup_id == startup_id)
    if status is not None:
        query = query.where(Contract.status == status)

    query = query.order_by(Contract.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_contract(
    db: AsyncSession,
    db_contract: Contract,
    contract_in: ContractUpdate,
) -> Contract:
    """
    Update metadata fields of an existing contract.
    """
    update_data = contract_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_contract, field, value)

    db_contract.updated_at = utc_now()
    await db.commit()
    await db.refresh(db_contract)
    return db_contract


async def update_contract_status(
    db: AsyncSession,
    db_contract: Contract,
    new_status: ContractStatus,
) -> Contract:
    """
    Update status of a contract.
    """
    db_contract.status = new_status
    db_contract.updated_at = utc_now()
    await db.commit()
    await db.refresh(db_contract)
    return db_contract

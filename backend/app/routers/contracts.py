from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_government
from app.crud import contract as crud_contract
from app.crud import pilot as crud_pilot
from app.models.activity_log import ActivityAction
from app.models.contract import ContractStatus
from app.models.pilot import PilotStatus
from app.models.user import User, UserRole
from app.schemas.contract import (
    ContractCreate,
    ContractResponse,
    ContractStatusUpdate,
    ContractUpdate,
)
from app.services.activity import record_activity
from app.services.notifications import notify_contract_awarded, notify_contract_status_changed

router = APIRouter(prefix="/contracts", tags=["Contracts"])

VALID_CONTRACT_TRANSITIONS = {
    ContractStatus.DRAFT: {ContractStatus.AWARDED},
    ContractStatus.AWARDED: {ContractStatus.ACTIVE},
    ContractStatus.ACTIVE: {ContractStatus.COMPLETED, ContractStatus.TERMINATED},
    ContractStatus.COMPLETED: set(),
    ContractStatus.TERMINATED: set(),
}


@router.post(
    "",
    response_model=ContractResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_contract(
    contract_in: ContractCreate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new contract for a completed pilot.
    - GOVERNMENT and ADMIN only.
    - Pilot must exist and be in COMPLETED status.
    - Government user can only create contracts for their own challenges.
    - Only 1 contract allowed per pilot (returns HTTP 409 for duplicates).
    - government_user_id is set automatically from the authenticated user.
    """
    pilot = await crud_pilot.get_pilot_by_id(db, contract_in.pilot_id)
    if not pilot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot not found",
        )

    if pilot.status != PilotStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contracts can only be created for COMPLETED pilots (current status: '{pilot.status.value}')",
        )

    if current_user.role != UserRole.ADMIN and pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to create contracts for this challenge",
        )

    try:
        contract = await crud_contract.create_contract(
            db=db,
            contract_in=contract_in,
            pilot=pilot,
            government_user_id=current_user.id,
        )
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A contract already exists for this pilot",
        )

    startup_user_id = pilot.startup_id
    challenge_title = pilot.challenge.title

    await notify_contract_awarded(
        db=db,
        startup_user_id=startup_user_id,
        challenge_title=challenge_title,
        contract_id=contract.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.CONTRACT_CREATED,
        resource_type="contract",
        resource_id=contract.id,
        description=f"Contract created for challenge '{challenge_title}', pilot ID {pilot.id}.",
    )
    await db.commit()
    await db.refresh(contract)
    return contract


@router.get(
    "",
    response_model=List[ContractResponse],
)
async def list_contracts(
    status_filter: Optional[ContractStatus] = Query(None, alias="status", description="Filter by status"),
    challenge_id: Optional[int] = Query(None, description="Filter by challenge ID"),
    pilot_id: Optional[int] = Query(None, description="Filter by pilot ID"),
    startup_id: Optional[int] = Query(None, description="Filter by startup ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve contracts filtered according to user role:
    - STARTUP: Only sees contracts where startup_id == current_user.id.
    - GOVERNMENT: Only sees contracts created by current government user.
    - EVALUATOR: Not permitted to access contracts.
    - ADMIN: All contracts.
    """
    if current_user.role == UserRole.EVALUATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Evaluators are not permitted to view contracts",
        )

    return await crud_contract.get_contracts_for_user(
        db=db,
        current_user=current_user,
        challenge_id=challenge_id,
        pilot_id=pilot_id,
        startup_id=startup_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{contract_id}",
    response_model=ContractResponse,
)
async def get_contract(
    contract_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get a specific contract by ID with role authorization checks.
    - STARTUP: Visible only if startup_id == current_user.id.
    - GOVERNMENT: Visible only if government_user_id == current_user.id.
    - EVALUATOR: Not permitted.
    - ADMIN: Can view any contract.
    """
    if current_user.role == UserRole.EVALUATOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Evaluators are not permitted to view contracts",
        )

    contract = await crud_contract.get_contract_by_id(db, contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    if current_user.role == UserRole.STARTUP and contract.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this contract",
        )

    if current_user.role == UserRole.GOVERNMENT and contract.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this contract",
        )

    return contract


@router.put(
    "/{contract_id}",
    response_model=ContractResponse,
)
async def update_contract(
    contract_id: int,
    contract_in: ContractUpdate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Update contract details (not status).
    - GOVERNMENT and ADMIN only.
    - Government users can only update contracts they created.
    - Cannot modify contract status through this endpoint.
    """
    contract = await crud_contract.get_contract_by_id(db, contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    if current_user.role != UserRole.ADMIN and contract.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify this contract",
        )

    return await crud_contract.update_contract(
        db=db,
        db_contract=contract,
        contract_in=contract_in,
    )


@router.patch(
    "/{contract_id}/status",
    response_model=ContractResponse,
)
async def change_contract_status(
    contract_id: int,
    status_update: ContractStatusUpdate,
    current_user: User = Depends(require_government),
    db: AsyncSession = Depends(get_db),
):
    """
    Update contract status via valid state transitions.
    - GOVERNMENT and ADMIN only.
    - Government users can only change status for their own contracts.
    - Enforces valid status transitions:
        DRAFT -> AWARDED
        AWARDED -> ACTIVE
        ACTIVE -> COMPLETED | TERMINATED
    """
    contract = await crud_contract.get_contract_by_id(db, contract_id)
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contract not found",
        )

    if current_user.role != UserRole.ADMIN and contract.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to modify status for this contract",
        )

    current_status = contract.status
    target_status = status_update.status

    allowed_targets = VALID_CONTRACT_TRANSITIONS.get(current_status, set())
    if target_status not in allowed_targets:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid contract status transition from '{current_status.value}' to '{target_status.value}'",
        )

    startup_user_id = contract.startup_id
    challenge_title = contract.pilot.challenge.title

    updated = await crud_contract.update_contract_status(
        db=db,
        db_contract=contract,
        new_status=target_status,
    )

    # Notify startup of significant status changes
    if target_status in {
        ContractStatus.AWARDED,
        ContractStatus.ACTIVE,
        ContractStatus.COMPLETED,
        ContractStatus.TERMINATED,
    }:
        if target_status == ContractStatus.AWARDED:
            await notify_contract_awarded(
                db=db,
                startup_user_id=startup_user_id,
                challenge_title=challenge_title,
                contract_id=contract.id,
            )
        else:
            await notify_contract_status_changed(
                db=db,
                startup_user_id=startup_user_id,
                new_status=target_status.value,
                challenge_title=challenge_title,
                contract_id=contract.id,
            )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.CONTRACT_STATUS_CHANGED,
        resource_type="contract",
        resource_id=contract.id,
        description=f"Contract status changed from '{current_status.value}' to '{target_status.value}' for challenge '{challenge_title}'.",
    )
    await db.commit()
    await db.refresh(updated)
    return updated

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.permissions import require_roles
from app.crud import evaluation as crud_evaluation
from app.crud import evaluator_assignment as crud_assignment
from app.crud import pilot_submission as crud_pilot_submission
from app.models.activity_log import ActivityAction
from app.models.evaluation import EvaluationStatus
from app.models.evaluator_assignment import AssignmentStatus
from app.models.pilot_submission import PilotSubmissionStatus
from app.models.user import User, UserRole
from app.schemas.evaluation import (
    EvaluationCreate,
    EvaluationResponse,
    EvaluationUpdate,
)
from app.services.activity import record_activity
from app.services.evaluation import EvaluationSummary, get_evaluation_summary_for_submission
from app.services.notifications import (
    notify_evaluation_completed,
    notify_startup_evaluation_completed,
    notify_submission_under_evaluation,
)

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


@router.post(
    "",
    response_model=EvaluationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_evaluation(
    evaluation_in: EvaluationCreate,
    current_user: User = Depends(require_roles(UserRole.EVALUATOR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a new evaluation for a pilot submission.
    - EVALUATOR only.
    - Evaluator must have an active EvaluatorAssignment for this submission.
    - Submission must exist and be in SUBMITTED or UNDER_EVALUATION status.
    - Enforces 1 evaluation per evaluator per submission (HTTP 409 for duplicates).
    - Calculates overall_score server-side.
    - Automatically transitions submission status to UNDER_EVALUATION if currently SUBMITTED.
    """
    # Check assignment requirement first to prevent submission enumeration
    assignment = await crud_assignment.get_assignment_by_submission_and_evaluator(
        db=db,
        pilot_submission_id=evaluation_in.pilot_submission_id,
        evaluator_id=current_user.id,
    )
    if not assignment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to evaluate this pilot submission",
        )

    submission = await crud_pilot_submission.get_submission_by_id(
        db, evaluation_in.pilot_submission_id
    )
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    allowed_submission_states = {
        PilotSubmissionStatus.SUBMITTED,
        PilotSubmissionStatus.UNDER_EVALUATION,
    }
    if submission.status not in allowed_submission_states:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Evaluations can only be submitted for SUBMITTED or UNDER_EVALUATION submissions (current status: '{submission.status.value}')",
        )

    existing = await crud_evaluation.get_evaluation_by_submission_and_evaluator(
        db=db,
        pilot_submission_id=evaluation_in.pilot_submission_id,
        evaluator_id=current_user.id,
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already evaluated this submission",
        )

    new_eval = await crud_evaluation.create_evaluation(
        db=db,
        evaluation_in=evaluation_in,
        evaluator_id=current_user.id,
    )

    # Update assignment status to IN_PROGRESS
    await crud_assignment.update_assignment_status(
        db=db,
        assignment=assignment,
        new_status=AssignmentStatus.IN_PROGRESS,
    )

    challenge_title = submission.pilot.challenge.title
    startup_user_id = submission.startup_id
    transitioned_to_under_evaluation = False

    # Transition submission status to UNDER_EVALUATION if it was SUBMITTED
    if submission.status == PilotSubmissionStatus.SUBMITTED:
        await crud_pilot_submission.update_submission_status(
            db=db,
            db_submission=submission,
            new_status=PilotSubmissionStatus.UNDER_EVALUATION,
        )
        transitioned_to_under_evaluation = True

    # Notify startup their submission is now under evaluation
    if transitioned_to_under_evaluation:
        await notify_submission_under_evaluation(
            db=db,
            startup_user_id=startup_user_id,
            challenge_title=challenge_title,
            submission_id=submission.id,
        )

    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.EVALUATION_CREATED,
        resource_type="evaluation",
        resource_id=new_eval.id,
        description=f"Evaluation created for pilot submission ID {submission.id}.",
    )
    await db.commit()
    await db.refresh(new_eval)
    return new_eval


@router.get(
    "",
    response_model=List[EvaluationResponse],
)
async def list_evaluations(
    submission_id: Optional[int] = Query(None, description="Filter by pilot submission ID"),
    status_filter: Optional[EvaluationStatus] = Query(None, alias="status", description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve evaluations according to user role:
    - EVALUATOR: Only evaluations created by current evaluator.
    - GOVERNMENT: Only evaluations for submissions under government user's challenges.
    - STARTUP: Only evaluations for startup's own submissions.
    - ADMIN: Sees all evaluations.
    """
    return await crud_evaluation.get_evaluations_for_user(
        db=db,
        current_user=current_user,
        submission_id=submission_id,
        status=status_filter,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/summary/{submission_id}",
    response_model=EvaluationSummary,
)
async def get_evaluation_summary(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get aggregated score summary and recommendation breakdown for a submission.
    - GOVERNMENT (challenge owner), EVALUATOR, and ADMIN permitted.
    - STARTUP forbidden.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if current_user.role == UserRole.STARTUP:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Startups are not permitted to view evaluation summaries",
        )

    if (
        current_user.role == UserRole.GOVERNMENT
        and submission.pilot.challenge.government_user_id != current_user.id
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view evaluation summary for this challenge",
        )

    return await get_evaluation_summary_for_submission(db, submission_id)


@router.get(
    "/submission/{submission_id}",
    response_model=List[EvaluationResponse],
)
async def get_evaluations_by_submission(
    submission_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all evaluations associated with a specific submission.
    Verifies that the caller has authorization to view the underlying submission.
    """
    submission = await crud_pilot_submission.get_submission_by_id(db, submission_id)
    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pilot submission not found",
        )

    if current_user.role == UserRole.STARTUP and submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view evaluations for this submission",
        )

    if current_user.role == UserRole.GOVERNMENT and submission.pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view evaluations for this submission",
        )

    if current_user.role == UserRole.EVALUATOR:
        from app.crud.challenge import is_challenge_assigned_to_evaluator
        assignment = await crud_assignment.get_assignment_by_submission_and_evaluator(
            db=db,
            pilot_submission_id=submission.id,
            evaluator_id=current_user.id,
        )
        assigned_challenge = (
            submission.pilot
            and submission.pilot.challenge
            and await is_challenge_assigned_to_evaluator(db, submission.pilot.challenge, current_user.id)
        )
        if not assignment and not assigned_challenge:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to view evaluations for this submission",
            )

    return await crud_evaluation.get_evaluations_for_submission(db, submission_id)


@router.get(
    "/{evaluation_id}",
    response_model=EvaluationResponse,
)
async def get_evaluation(
    evaluation_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Get details of a single evaluation with visibility checks.
    """
    evaluation = await crud_evaluation.get_evaluation_by_id(db, evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only access evaluations created by you",
        )

    if current_user.role == UserRole.STARTUP and evaluation.pilot_submission.startup_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this evaluation",
        )

    if current_user.role == UserRole.GOVERNMENT and evaluation.pilot_submission.pilot.challenge.government_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to view this evaluation",
        )

    return evaluation


@router.put(
    "/{evaluation_id}",
    response_model=EvaluationResponse,
)
async def update_evaluation(
    evaluation_id: int,
    evaluation_in: EvaluationUpdate,
    current_user: User = Depends(require_roles(UserRole.EVALUATOR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Update a PENDING evaluation.
    - EVALUATOR only for their own evaluation.
    - Allowed ONLY while status is PENDING (completed evaluations are immutable).
    - Recalculates overall_score server-side.
    """
    evaluation = await crud_evaluation.get_evaluation_by_id(db, evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    if evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only edit your own evaluations",
        )

    if evaluation.status != EvaluationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completed evaluations cannot be edited",
        )

    return await crud_evaluation.update_evaluation(
        db=db,
        db_evaluation=evaluation,
        evaluation_in=evaluation_in,
    )


@router.post(
    "/{evaluation_id}/complete",
    response_model=EvaluationResponse,
)
async def complete_evaluation(
    evaluation_id: int,
    current_user: User = Depends(require_roles(UserRole.EVALUATOR)),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete an evaluation (PENDING -> COMPLETED).
    - EVALUATOR only for their own evaluation.
    - Requires all scoring fields and recommendation to be non-null.
    - Updates associated EvaluatorAssignment status to COMPLETED.
    - After completion, evaluation becomes immutable.
    """
    evaluation = await crud_evaluation.get_evaluation_by_id(db, evaluation_id)
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Evaluation not found",
        )

    if evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own evaluations",
        )

    if evaluation.status != EvaluationStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Evaluation is already in '{evaluation.status.value}' status",
        )

    if (
        evaluation.technical_score is None
        or evaluation.kpi_score is None
        or evaluation.innovation_score is None
        or evaluation.feasibility_score is None
        or evaluation.impact_score is None
        or evaluation.recommendation is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All scoring fields and recommendation must be filled before completing evaluation",
        )

    completed = await crud_evaluation.complete_evaluation(db=db, db_evaluation=evaluation)

    # Update evaluator assignment status to COMPLETED
    assignment = await crud_assignment.get_assignment_by_submission_and_evaluator(
        db=db,
        pilot_submission_id=evaluation.pilot_submission_id,
        evaluator_id=current_user.id,
    )
    if assignment:
        await crud_assignment.update_assignment_status(
            db=db,
            assignment=assignment,
            new_status=AssignmentStatus.COMPLETED,
        )

    submission = evaluation.pilot_submission
    challenge_title = submission.pilot.challenge.title
    government_user_id = submission.pilot.challenge.government_user_id
    startup_user_id = submission.startup_id

    # Notify government user (generic message)
    await notify_evaluation_completed(
        db=db,
        government_user_id=government_user_id,
        challenge_title=challenge_title,
        evaluation_id=evaluation.id,
    )
    # Notify startup (generic message)
    await notify_startup_evaluation_completed(
        db=db,
        startup_user_id=startup_user_id,
        challenge_title=challenge_title,
        submission_id=submission.id,
    )
    await record_activity(
        db=db,
        actor_user_id=current_user.id,
        action=ActivityAction.EVALUATION_COMPLETED,
        resource_type="evaluation",
        resource_id=evaluation.id,
        description=f"Evaluation completed for pilot submission ID {submission.id}.",
    )
    await db.commit()
    await db.refresh(completed)
    return completed

from app.core.datetime_utils import utc_now
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.challenge import Challenge
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.pilot import Pilot
from app.models.pilot_submission import PilotSubmission
from app.models.user import User, UserRole
from app.schemas.evaluation import EvaluationCreate, EvaluationUpdate


def calculate_overall_score(
    technical: float,
    kpi: float,
    innovation: float,
    feasibility: float,
    impact: float,
) -> float:
    """
    Calculate deterministic overall score using equal weighting across 5 dimension scores.
    """
    return round((technical + kpi + innovation + feasibility + impact) / 5.0, 2)


async def create_evaluation(
    db: AsyncSession,
    evaluation_in: EvaluationCreate,
    evaluator_id: int,
) -> Evaluation:
    """
    Create a new evaluation in PENDING status.
    Calculates overall_score server-side.
    """
    overall = calculate_overall_score(
        technical=evaluation_in.technical_score,
        kpi=evaluation_in.kpi_score,
        innovation=evaluation_in.innovation_score,
        feasibility=evaluation_in.feasibility_score,
        impact=evaluation_in.impact_score,
    )

    new_evaluation = Evaluation(
        pilot_submission_id=evaluation_in.pilot_submission_id,
        evaluator_id=evaluator_id,
        technical_score=evaluation_in.technical_score,
        kpi_score=evaluation_in.kpi_score,
        innovation_score=evaluation_in.innovation_score,
        feasibility_score=evaluation_in.feasibility_score,
        impact_score=evaluation_in.impact_score,
        overall_score=overall,
        comments=evaluation_in.comments,
        recommendation=evaluation_in.recommendation,
        status=EvaluationStatus.PENDING,
    )

    db.add(new_evaluation)
    await db.commit()
    await db.refresh(new_evaluation)
    return new_evaluation


async def get_evaluation_by_id(
    db: AsyncSession,
    evaluation_id: int,
) -> Optional[Evaluation]:
    """
    Fetch evaluation by ID with relationships loaded.
    """
    result = await db.execute(
        select(Evaluation)
        .options(
            selectinload(Evaluation.pilot_submission)
            .selectinload(PilotSubmission.pilot)
            .selectinload(Pilot.challenge)
        )
        .where(Evaluation.id == evaluation_id)
    )
    return result.scalar_one_or_none()


async def get_evaluation_by_submission_and_evaluator(
    db: AsyncSession,
    pilot_submission_id: int,
    evaluator_id: int,
) -> Optional[Evaluation]:
    """
    Enforce logical 1-evaluation-per-evaluator-per-submission rule.
    """
    result = await db.execute(
        select(Evaluation).where(
            Evaluation.pilot_submission_id == pilot_submission_id,
            Evaluation.evaluator_id == evaluator_id,
        )
    )
    return result.scalar_one_or_none()


async def get_evaluations_for_submission(
    db: AsyncSession,
    pilot_submission_id: int,
) -> List[Evaluation]:
    """
    Fetch all evaluations for a specific pilot submission.
    """
    result = await db.execute(
        select(Evaluation)
        .options(selectinload(Evaluation.evaluator))
        .where(Evaluation.pilot_submission_id == pilot_submission_id)
        .order_by(Evaluation.created_at.desc())
    )
    return list(result.scalars().all())


async def get_evaluations_for_user(
    db: AsyncSession,
    current_user: User,
    submission_id: Optional[int] = None,
    status: Optional[EvaluationStatus] = None,
    skip: int = 0,
    limit: int = 100,
) -> List[Evaluation]:
    """
    Retrieve evaluations based on role:
    - EVALUATOR: Sees evaluations created by current evaluator.
    - GOVERNMENT: Sees evaluations for submissions belonging to challenges created by government user.
    - STARTUP: Sees evaluation results for its own pilot submissions.
    - ADMIN: All evaluations.
    """
    query = select(Evaluation).options(
        selectinload(Evaluation.pilot_submission)
        .selectinload(PilotSubmission.pilot)
        .selectinload(Pilot.challenge),
        selectinload(Evaluation.evaluator),
    )

    if current_user.role == UserRole.EVALUATOR:
        query = query.where(Evaluation.evaluator_id == current_user.id)
    elif current_user.role == UserRole.GOVERNMENT:
        query = (
            query.join(Evaluation.pilot_submission)
            .join(PilotSubmission.pilot)
            .join(Pilot.challenge)
            .where(Challenge.government_user_id == current_user.id)
        )
    elif current_user.role == UserRole.STARTUP:
        query = query.join(Evaluation.pilot_submission).where(
            PilotSubmission.startup_id == current_user.id
        )
    # ADMIN sees all

    if submission_id is not None:
        query = query.where(Evaluation.pilot_submission_id == submission_id)
    if status is not None:
        query = query.where(Evaluation.status == status)

    query = query.order_by(Evaluation.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().all())


async def update_evaluation(
    db: AsyncSession,
    db_evaluation: Evaluation,
    evaluation_in: EvaluationUpdate,
) -> Evaluation:
    """
    Update fields of a PENDING evaluation and recalculate overall_score.
    """
    update_data = evaluation_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_evaluation, field, value)

    # Recalculate overall score using updated or existing scores
    t = db_evaluation.technical_score or 0.0
    k = db_evaluation.kpi_score or 0.0
    inn = db_evaluation.innovation_score or 0.0
    f = db_evaluation.feasibility_score or 0.0
    imp = db_evaluation.impact_score or 0.0

    db_evaluation.overall_score = calculate_overall_score(t, k, inn, f, imp)
    utc_now()

    await db.commit()
    await db.refresh(db_evaluation)
    return db_evaluation


async def complete_evaluation(
    db: AsyncSession,
    db_evaluation: Evaluation,
) -> Evaluation:
    """
    Mark evaluation as COMPLETED.
    """
    db_evaluation.status = EvaluationStatus.COMPLETED
    utc_now()
    await db.commit()
    await db.refresh(db_evaluation)
    return db_evaluation

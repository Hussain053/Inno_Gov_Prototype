from typing import Dict, Optional

from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.evaluation import Evaluation, EvaluationRecommendation, EvaluationStatus
from app.models.evaluator_assignment import EvaluatorAssignment


class EvaluationSummary(BaseModel):
    pilot_submission_id: int
    total_evaluators_assigned: int
    completed_evaluations_count: int
    pending_evaluations_count: int
    avg_technical_score: Optional[float] = None
    avg_kpi_score: Optional[float] = None
    avg_innovation_score: Optional[float] = None
    avg_feasibility_score: Optional[float] = None
    avg_impact_score: Optional[float] = None
    avg_overall_score: Optional[float] = None
    recommendations_summary: Dict[str, int]

    model_config = ConfigDict(from_attributes=True)


async def get_evaluation_summary_for_submission(
    db: AsyncSession,
    pilot_submission_id: int,
) -> EvaluationSummary:
    """
    Calculate server-side deterministic aggregation metrics for all evaluations on a pilot submission.
    Provides government decision-makers with average dimension scores and recommendation counts.
    """
    # 1. Total assigned evaluators
    assigned_count_res = await db.execute(
        select(func.count(EvaluatorAssignment.id)).where(
            EvaluatorAssignment.pilot_submission_id == pilot_submission_id
        )
    )
    total_assigned = assigned_count_res.scalar() or 0

    # 2. Evaluations metrics
    eval_query = select(
        Evaluation.status,
        func.count(Evaluation.id),
        func.avg(Evaluation.technical_score),
        func.avg(Evaluation.kpi_score),
        func.avg(Evaluation.innovation_score),
        func.avg(Evaluation.feasibility_score),
        func.avg(Evaluation.impact_score),
        func.avg(Evaluation.overall_score),
    ).where(
        Evaluation.pilot_submission_id == pilot_submission_id
    ).group_by(Evaluation.status)

    eval_result = await db.execute(eval_query)
    rows = eval_result.all()

    completed_cnt = 0
    pending_cnt = 0
    avg_tech: Optional[float] = None
    avg_kpi: Optional[float] = None
    avg_inn: Optional[float] = None
    avg_feas: Optional[float] = None
    avg_imp: Optional[float] = None
    avg_overall: Optional[float] = None

    for row in rows:
        st_val = row[0].value if hasattr(row[0], "value") else str(row[0])
        cnt = row[1]
        if st_val == EvaluationStatus.COMPLETED.value:
            completed_cnt = cnt
            avg_tech = round(float(row[2]), 2) if row[2] is not None else None
            avg_kpi = round(float(row[3]), 2) if row[3] is not None else None
            avg_inn = round(float(row[4]), 2) if row[4] is not None else None
            avg_feas = round(float(row[5]), 2) if row[5] is not None else None
            avg_imp = round(float(row[6]), 2) if row[6] is not None else None
            avg_overall = round(float(row[7]), 2) if row[7] is not None else None
        elif st_val == EvaluationStatus.PENDING.value:
            pending_cnt = cnt

    # 3. Recommendations breakdown
    rec_query = select(
        Evaluation.recommendation,
        func.count(Evaluation.id),
    ).where(
        Evaluation.pilot_submission_id == pilot_submission_id,
        Evaluation.status == EvaluationStatus.COMPLETED,
        Evaluation.recommendation.isnot(None),
    ).group_by(Evaluation.recommendation)

    rec_res = await db.execute(rec_query)
    recs: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in rec_res.all()
    }

    # Ensure key counts exist
    if EvaluationRecommendation.RECOMMEND.value not in recs:
        recs[EvaluationRecommendation.RECOMMEND.value] = 0
    if EvaluationRecommendation.DO_NOT_RECOMMEND.value not in recs:
        recs[EvaluationRecommendation.DO_NOT_RECOMMEND.value] = 0

    return EvaluationSummary(
        pilot_submission_id=pilot_submission_id,
        total_evaluators_assigned=total_assigned,
        completed_evaluations_count=completed_cnt,
        pending_evaluations_count=pending_cnt,
        avg_technical_score=avg_tech,
        avg_kpi_score=avg_kpi,
        avg_innovation_score=avg_inn,
        avg_feasibility_score=avg_feas,
        avg_impact_score=avg_imp,
        avg_overall_score=avg_overall,
        recommendations_summary=recs,
    )

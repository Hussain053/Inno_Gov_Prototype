from typing import Dict, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.application import Application, ApplicationStatus
from app.models.challenge import Challenge, ChallengeStatus
from app.models.contract import Contract
from app.models.evaluation import Evaluation, EvaluationStatus
from app.models.pilot import Pilot, PilotStatus
from app.models.pilot_submission import PilotSubmission, PilotSubmissionStatus
from app.models.startup import StartupProfile
from app.models.user import User, UserRole
from app.schemas.dashboard import (
    AdminDashboardResponse,
    EvaluatorDashboardResponse,
    GovernmentDashboardResponse,
    StartupDashboardResponse,
)


async def get_startup_dashboard(
    db: AsyncSession,
    user_id: int,
) -> StartupDashboardResponse:
    """
    Calculate aggregated read-only metrics for a startup user.
    Strictly scoped to current_user.id.
    """
    # 1. Profile completion check
    profile_result = await db.execute(
        select(StartupProfile).where(StartupProfile.user_id == user_id)
    )
    profile_exists = profile_result.scalar_one_or_none() is not None

    # 2. Applications counts by status
    app_counts_query = (
        select(Application.status, func.count(Application.id))
        .where(Application.startup_id == user_id)
        .group_by(Application.status)
    )
    app_counts_result = await db.execute(app_counts_query)
    app_counts: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in app_counts_result.all()
    }

    total_apps = sum(app_counts.values())
    submitted_apps = app_counts.get(ApplicationStatus.SUBMITTED.value, 0)
    shortlisted_apps = app_counts.get(ApplicationStatus.SHORTLISTED.value, 0)
    rejected_apps = app_counts.get(ApplicationStatus.REJECTED.value, 0)
    withdrawn_apps = app_counts.get(ApplicationStatus.WITHDRAWN.value, 0)

    # 3. Pilots counts
    pilot_counts_query = (
        select(Pilot.status, func.count(Pilot.id))
        .where(Pilot.startup_id == user_id)
        .group_by(Pilot.status)
    )
    pilot_counts_result = await db.execute(pilot_counts_query)
    pilot_counts: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in pilot_counts_result.all()
    }

    active_pilots = (
        pilot_counts.get(PilotStatus.ASSIGNED.value, 0)
        + pilot_counts.get(PilotStatus.IN_PROGRESS.value, 0)
    )
    completed_pilots = pilot_counts.get(PilotStatus.COMPLETED.value, 0)

    # 4. Pilot Submissions count
    sub_count_query = select(func.count(PilotSubmission.id)).where(
        PilotSubmission.startup_id == user_id
    )
    sub_count_result = await db.execute(sub_count_query)
    total_submissions = sub_count_result.scalar() or 0

    # 5. Contracts count & value
    contract_query = select(
        func.count(Contract.id),
        func.coalesce(func.sum(Contract.contract_value), 0.0),
    ).where(Contract.startup_id == user_id)
    contract_result = await db.execute(contract_query)
    contract_row = contract_result.one()
    total_contracts = contract_row[0] or 0
    total_contract_value = float(contract_row[1] or 0.0)

    return StartupDashboardResponse(
        profile_completed=profile_exists,
        total_applications=total_apps,
        submitted_applications=submitted_apps,
        shortlisted_applications=shortlisted_apps,
        rejected_applications=rejected_apps,
        withdrawn_applications=withdrawn_apps,
        active_pilots=active_pilots,
        completed_pilots=completed_pilots,
        total_submissions=total_submissions,
        total_contracts=total_contracts,
        total_contract_value=total_contract_value,
    )


async def get_government_dashboard(
    db: AsyncSession,
    government_user_id: int,
) -> GovernmentDashboardResponse:
    """
    Calculate aggregated metrics for a government user.
    Strictly scoped to challenges created by current_user.id.
    """
    # 1. Challenges breakdown
    ch_query = (
        select(Challenge.status, func.count(Challenge.id))
        .where(Challenge.government_user_id == government_user_id)
        .group_by(Challenge.status)
    )
    ch_result = await db.execute(ch_query)
    ch_counts: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in ch_result.all()
    }

    total_challenges = sum(ch_counts.values())
    open_challenges = ch_counts.get(ChallengeStatus.OPEN.value, 0)
    closed_challenges = ch_counts.get(ChallengeStatus.CLOSED.value, 0)
    draft_challenges = ch_counts.get(ChallengeStatus.DRAFT.value, 0)

    # 2. Applications breakdown on government challenges
    app_query = (
        select(Application.status, func.count(Application.id))
        .join(Challenge, Application.challenge_id == Challenge.id)
        .where(Challenge.government_user_id == government_user_id)
        .group_by(Application.status)
    )
    app_result = await db.execute(app_query)
    app_counts: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in app_result.all()
    }

    total_apps = sum(app_counts.values())
    under_review_apps = app_counts.get(ApplicationStatus.UNDER_REVIEW.value, 0)
    shortlisted_apps = app_counts.get(ApplicationStatus.SHORTLISTED.value, 0)

    # 3. Pilots breakdown
    pilot_query = (
        select(Pilot.status, func.count(Pilot.id))
        .join(Challenge, Pilot.challenge_id == Challenge.id)
        .where(Challenge.government_user_id == government_user_id)
        .group_by(Pilot.status)
    )
    pilot_result = await db.execute(pilot_query)
    pilot_counts: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in pilot_result.all()
    }

    active_pilots = (
        pilot_counts.get(PilotStatus.ASSIGNED.value, 0)
        + pilot_counts.get(PilotStatus.IN_PROGRESS.value, 0)
    )
    completed_pilots = pilot_counts.get(PilotStatus.COMPLETED.value, 0)

    # 4. Contracts breakdown
    contract_query = select(
        func.count(Contract.id),
        func.coalesce(func.sum(Contract.contract_value), 0.0),
    ).where(Contract.government_user_id == government_user_id)
    contract_result = await db.execute(contract_query)
    contract_row = contract_result.one()
    contracts_awarded = contract_row[0] or 0
    total_contract_value = float(contract_row[1] or 0.0)

    return GovernmentDashboardResponse(
        total_challenges=total_challenges,
        open_challenges=open_challenges,
        closed_challenges=closed_challenges,
        draft_challenges=draft_challenges,
        total_applications_received=total_apps,
        applications_under_review=under_review_apps,
        shortlisted_applications=shortlisted_apps,
        active_pilots=active_pilots,
        completed_pilots=completed_pilots,
        contracts_awarded=contracts_awarded,
        total_contract_value=total_contract_value,
    )


async def get_evaluator_dashboard(
    db: AsyncSession,
    evaluator_id: int,
) -> EvaluatorDashboardResponse:
    """
    Calculate metrics for an evaluator user.
    """
    # 1. Evaluations by status created by evaluator
    eval_query = (
        select(
            Evaluation.status,
            func.count(Evaluation.id),
            func.avg(Evaluation.overall_score),
        )
        .where(Evaluation.evaluator_id == evaluator_id)
        .group_by(Evaluation.status)
    )
    eval_result = await db.execute(eval_query)
    eval_rows = eval_result.all()

    completed_evals = 0
    pending_evals = 0
    scores: list[float] = []

    for row in eval_rows:
        st_val = row[0].value if hasattr(row[0], "value") else str(row[0])
        cnt = row[1]
        if st_val == EvaluationStatus.COMPLETED.value:
            completed_evals = cnt
            if row[2] is not None:
                scores.append(float(row[2]))
        elif st_val == EvaluationStatus.PENDING.value:
            pending_evals = cnt

    avg_score: Optional[float] = None
    if scores:
        avg_score = round(sum(scores) / len(scores), 2)

    # 2. Submissions available for evaluation (SUBMITTED / UNDER_EVALUATION)
    sub_avail_query = select(func.count(PilotSubmission.id)).where(
        PilotSubmission.status.in_(
            [PilotSubmissionStatus.SUBMITTED, PilotSubmissionStatus.UNDER_EVALUATION]
        )
    )
    sub_avail_result = await db.execute(sub_avail_query)
    available_subs = sub_avail_result.scalar() or 0

    # 3. Recommendations breakdown
    rec_query = (
        select(Evaluation.recommendation, func.count(Evaluation.id))
        .where(
            Evaluation.evaluator_id == evaluator_id,
            Evaluation.recommendation.isnot(None),
        )
        .group_by(Evaluation.recommendation)
    )
    rec_result = await db.execute(rec_query)
    recs: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in rec_result.all()
    }

    return EvaluatorDashboardResponse(
        evaluations_completed=completed_evals,
        evaluations_pending=pending_evals,
        submissions_available_for_evaluation=available_subs,
        average_overall_score=avg_score,
        recommendations_breakdown=recs,
    )


async def get_admin_dashboard(
    db: AsyncSession,
) -> AdminDashboardResponse:
    """
    Calculate system-wide aggregated metrics for admin dashboard.
    """
    # 1. Total users & role breakdown
    users_query = select(User.role, func.count(User.id)).group_by(User.role)
    users_result = await db.execute(users_query)
    users_by_role: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in users_result.all()
    }
    total_users = sum(users_by_role.values())

    # 2. Total startups
    startups_query = select(func.count(StartupProfile.id))
    startups_result = await db.execute(startups_query)
    total_startups = startups_result.scalar() or 0

    # 3. Challenges
    ch_total_query = select(func.count(Challenge.id))
    ch_total_res = await db.execute(ch_total_query)
    total_challenges = ch_total_res.scalar() or 0

    ch_open_query = select(func.count(Challenge.id)).where(
        Challenge.status == ChallengeStatus.OPEN
    )
    ch_open_res = await db.execute(ch_open_query)
    open_challenges = ch_open_res.scalar() or 0

    # 4. Total applications
    app_query = select(func.count(Application.id))
    app_result = await db.execute(app_query)
    total_apps = app_result.scalar() or 0

    # 5. Pilots breakdown
    pilot_query = (
        select(Pilot.status, func.count(Pilot.id)).group_by(Pilot.status)
    )
    pilot_result = await db.execute(pilot_query)
    pilot_counts: Dict[str, int] = {
        row[0].value if hasattr(row[0], "value") else str(row[0]): row[1]
        for row in pilot_result.all()
    }
    active_pilots = (
        pilot_counts.get(PilotStatus.ASSIGNED.value, 0)
        + pilot_counts.get(PilotStatus.IN_PROGRESS.value, 0)
    )
    completed_pilots = pilot_counts.get(PilotStatus.COMPLETED.value, 0)

    # 6. Total evaluations
    eval_query = select(func.count(Evaluation.id))
    eval_result = await db.execute(eval_query)
    total_evals = eval_result.scalar() or 0

    # 7. Contracts
    contract_query = select(
        func.count(Contract.id),
        func.coalesce(func.sum(Contract.contract_value), 0.0),
    )
    contract_result = await db.execute(contract_query)
    contract_row = contract_result.one()
    contracts_awarded = contract_row[0] or 0
    total_contract_value = float(contract_row[1] or 0.0)

    return AdminDashboardResponse(
        total_users=total_users,
        users_by_role=users_by_role,
        total_startups=total_startups,
        total_challenges=total_challenges,
        open_challenges=open_challenges,
        total_applications=total_apps,
        active_pilots=active_pilots,
        completed_pilots=completed_pilots,
        total_evaluations=total_evals,
        contracts_awarded=contracts_awarded,
        total_contract_value=total_contract_value,
    )

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unassigned_evaluator_rejected(client: AsyncClient, create_test_token):
    eval_token = await create_test_token(user_id=30, role="EVALUATOR")

    # Evaluation attempt without assignment returns 403 Forbidden
    res = await client.post(
        "/evaluations",
        headers={"Authorization": f"Bearer {eval_token}"},
        json={
            "pilot_submission_id": 1,
            "technical_score": 85.0,
            "kpi_score": 80.0,
            "innovation_score": 90.0,
            "feasibility_score": 85.0,
            "impact_score": 88.0,
            "comments": "Great progress",
            "recommendation": "RECOMMEND",
        },
    )
    assert res.status_code == 403

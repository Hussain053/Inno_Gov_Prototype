import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_evaluator_assignment_permissions(client: AsyncClient, create_test_token):
    startup_token = await create_test_token(user_id=20, role="STARTUP")

    # Startup cannot assign evaluators (403)
    res = await client.post(
        "/evaluator-assignments",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"pilot_submission_id": 1, "evaluator_id": 30},
    )
    assert res.status_code == 403

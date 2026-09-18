import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_pilot_creation_requires_shortlisted_app(client: AsyncClient, create_test_token):
    gov_token = await create_test_token(user_id=10, role="GOVERNMENT")

    # Creating pilot for non-existent application fails 404
    res = await client.post(
        "/pilots",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={
            "application_id": 99999,
            "title": "Pilot Test",
            "task_description": "Test task description",
        },
    )
    assert res.status_code == 404

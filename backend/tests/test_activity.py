import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_activity_log_retrieval(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=10, role="GOVERNMENT")

    res = await client.get("/activity", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

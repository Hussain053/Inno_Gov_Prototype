import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_matching_requires_startup_profile(client: AsyncClient, create_test_token):
    startup_token = await create_test_token(user_id=99, role="STARTUP")

    # Startup without profile returns 404
    res = await client.get("/matching/challenges/1", headers={"Authorization": f"Bearer {startup_token}"})
    assert res.status_code == 404

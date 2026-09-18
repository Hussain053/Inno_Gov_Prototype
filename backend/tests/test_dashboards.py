import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_dashboard_endpoints(client: AsyncClient, create_test_token):
    startup_token = await create_test_token(user_id=20, role="STARTUP")
    gov_token = await create_test_token(user_id=10, role="GOVERNMENT")

    # Startup dashboard
    r1 = await client.get("/dashboard/startup", headers={"Authorization": f"Bearer {startup_token}"})
    assert r1.status_code == 200

    # Government dashboard
    r2 = await client.get("/dashboard/government", headers={"Authorization": f"Bearer {gov_token}"})
    assert r2.status_code == 200

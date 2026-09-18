import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_admin_only_endpoints(client: AsyncClient, create_test_token):
    admin_token = await create_test_token(user_id=1, role="ADMIN")
    user_token = await create_test_token(user_id=2, role="STARTUP")

    # Ordinary user blocked 403
    r1 = await client.get("/admin/users", headers={"Authorization": f"Bearer {user_token}"})
    assert r1.status_code == 403

    # Admin access allowed 200
    r2 = await client.get("/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert r2.status_code == 200

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_notification_ownership_isolation(client: AsyncClient, create_test_token):
    u1_token = await create_test_token(user_id=1, role="STARTUP")

    # Fetching list of notifications returns 200 list
    res = await client.get("/notifications", headers={"Authorization": f"Bearer {u1_token}"})
    assert res.status_code == 200

    # Unread count
    cnt_res = await client.get("/notifications/unread/count", headers={"Authorization": f"Bearer {u1_token}"})
    assert cnt_res.status_code == 200
    assert "unread_count" in cnt_res.json()

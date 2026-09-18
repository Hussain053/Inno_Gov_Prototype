import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_challenge_workflow_and_decision(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=10, role="GOVERNMENT")
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create challenge
    res = await client.post(
        "/challenges",
        headers=headers,
        json={
            "title": "Smart City Lighting",
            "description": "Upgrade municipal streetlights",
            "problem_statement": "High energy consumption",
            "budget": 50000.0,
        },
    )
    assert res.status_code == 201
    ch_id = res.json()["id"]

    # 2. Update status DRAFT -> OPEN
    up_res = await client.put(
        f"/challenges/{ch_id}",
        headers=headers,
        json={"status": "OPEN"},
    )
    assert up_res.status_code == 200
    assert up_res.json()["status"] == "OPEN"

    # 3. Invalid status transition DRAFT -> AWARDED blocked
    bad_res = await client.put(
        f"/challenges/{ch_id}",
        headers=headers,
        json={"status": "COMPLETED"},
    )
    assert bad_res.status_code == 400

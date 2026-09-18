import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    response = await client.get("/challenges")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_startup_cannot_create_challenge(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=1, role="STARTUP")
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.post(
        "/challenges",
        headers=headers,
        json={
            "title": "Unauthorized Challenge",
            "description": "Desc",
            "problem_statement": "Problem",
        },
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_evaluator_cannot_access_contracts(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=2, role="EVALUATOR")
    headers = {"Authorization": f"Bearer {token}"}
    response = await client.get("/contracts", headers=headers)
    assert response.status_code == 403

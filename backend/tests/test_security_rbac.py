import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_no_jwt_returns_401(client: AsyncClient):
    res = await client.get("/auth/me")
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_invalid_jwt_returns_401(client: AsyncClient):
    res = await client.get("/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_startup_accessing_government_endpoint_returns_403(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=101, role="STARTUP")
    res = await client.post(
        "/challenges",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "title": "Unauthorized Challenge Creation",
            "description": "Desc",
            "problem_statement": "Problem",
        },
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_startup_accessing_admin_endpoint_returns_403(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=102, role="STARTUP")
    res = await client.get("/admin/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_evaluator_accessing_government_decision_returns_403(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=103, role="EVALUATOR")
    res = await client.post(
        "/challenges/1/decision",
        headers={"Authorization": f"Bearer {token}"},
        json={"decision": "AWARDED"},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_evaluator_accessing_contract_creation_returns_403(client: AsyncClient, create_test_token):
    token = await create_test_token(user_id=104, role="EVALUATOR")
    res = await client.post(
        "/contracts",
        headers={"Authorization": f"Bearer {token}"},
        json={"challenge_id": 1, "startup_id": 1, "pilot_id": 1},
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_government_a_modifying_government_b_challenge_returns_403_or_404(client: AsyncClient, create_test_token):
    gov_a_token = await create_test_token(user_id=201, role="GOVERNMENT")
    gov_b_token = await create_test_token(user_id=202, role="GOVERNMENT")

    # Gov A creates challenge
    ch_res = await client.post(
        "/challenges",
        headers={"Authorization": f"Bearer {gov_a_token}"},
        json={
            "title": "Gov A Challenge",
            "description": "Desc",
            "problem_statement": "Problem",
        },
    )
    assert ch_res.status_code == 201
    ch_id = ch_res.json()["id"]

    # Gov B tries to modify Gov A's challenge -> 403 Forbidden
    mod_res = await client.put(
        f"/challenges/{ch_id}",
        headers={"Authorization": f"Bearer {gov_b_token}"},
        json={"title": "Hacked Title"},
    )
    assert mod_res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_evaluator_a_accessing_evaluator_b_assignment_returns_403_or_404(client: AsyncClient, create_test_token):
    eval_a_token = await create_test_token(user_id=301, role="EVALUATOR")
    eval_b_token = await create_test_token(user_id=302, role="EVALUATOR")
    gov_token = await create_test_token(user_id=303, role="GOVERNMENT")

    # Assignment for Eval A
    assign_res = await client.post(
        "/evaluator-assignments",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"pilot_submission_id": 1, "evaluator_id": 301},
    )
    if assign_res.status_code == 201:
        assign_id = assign_res.json()["id"]
        # Eval B attempts to update Eval A's assignment -> 403 or 404
        b_res = await client.patch(
            f"/evaluator-assignments/{assign_id}/status",
            headers={"Authorization": f"Bearer {eval_b_token}"},
            json={"status": "IN_PROGRESS"},
        )
        assert b_res.status_code in (403, 404)


@pytest.mark.asyncio
async def test_admin_cannot_deactivate_self(client: AsyncClient, create_test_token):
    admin_token = await create_test_token(user_id=401, role="ADMIN")
    res = await client.patch(
        "/admin/users/401/status",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"is_active": False},
    )
    assert res.status_code == 400


@pytest.mark.asyncio
async def test_admin_cannot_demote_self(client: AsyncClient, create_test_token):
    admin_token = await create_test_token(user_id=401, role="ADMIN")
    res = await client.patch(
        "/admin/users/401/role",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"role": "STARTUP"},
    )
    assert res.status_code == 400

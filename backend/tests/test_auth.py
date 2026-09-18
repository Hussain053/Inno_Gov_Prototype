import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_startup_success(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={
            "name": "Test Startup",
            "email": "STARTUP1@example.com",
            "password": "Password123!",
            "organization": "Innovators Inc",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "startup1@example.com"  # Normalization test
    assert data["role"] == "STARTUP"


@pytest.mark.asyncio
async def test_register_forces_startup_role(client: AsyncClient):
    # Attempting to register as ADMIN must be overridden to STARTUP
    response = await client.post(
        "/auth/register",
        json={
            "name": "Attacker",
            "email": "attacker@example.com",
            "password": "Password123!",
            "role": "ADMIN",
        },
    )
    assert response.status_code == 201
    assert response.json()["role"] == "STARTUP"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    payload = {
        "name": "Dup User",
        "email": "dup@example.com",
        "password": "Password123!",
    }
    r1 = await client.post("/auth/register", json=payload)
    assert r1.status_code == 201
    r2 = await client.post("/auth/register", json=payload)
    assert r2.status_code == 409


@pytest.mark.asyncio
async def test_weak_password_rejection(client: AsyncClient):
    response = await client.post(
        "/auth/register",
        json={
            "name": "Weak User",
            "email": "weak@example.com",
            "password": "weak",
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    # Register first
    await client.post(
        "/auth/register",
        json={
            "name": "Login User",
            "email": "loginuser@example.com",
            "password": "Password123!",
        },
    )
    # Login
    login_res = await client.post(
        "/auth/login",
        json={
            "email": "LOGINUSER@example.com",
            "password": "Password123!",
        },
    )
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_government_success(client: AsyncClient):
    response = await client.post(
        "/auth/register/government",
        json={
            "name": "Gov Official",
            "email": "official@gov.example.com",
            "password": "Password123!",
            "organization": "Department of Energy",
            "department": "Clean Tech Division",
            "government_service_id": "GOV-TEST-12345",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "GOVERNMENT"
    assert data["email"] == "official@gov.example.com"


@pytest.mark.asyncio
async def test_register_government_unverified_rejected(client: AsyncClient):
    response = await client.post(
        "/auth/register/government",
        json={
            "name": "Fake Gov",
            "email": "fakegov@example.com",
            "password": "Password123!",
            "organization": "Unknown Org",
            "government_service_id": "INVALID-GOV-ID-999",
        },
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_register_evaluator_success(client: AsyncClient):
    response = await client.post(
        "/auth/register/evaluator",
        json={
            "name": "Expert Evaluator",
            "email": "evaluator@expert.org",
            "password": "Password123!",
            "organization": "Tech Evaluation Panel",
            "evaluator_service_id": "EVAL-TEST-12345",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "EVALUATOR"
    assert data["email"] == "evaluator@expert.org"


@pytest.mark.asyncio
async def test_register_evaluator_unverified_rejected(client: AsyncClient):
    response = await client.post(
        "/auth/register/evaluator",
        json={
            "name": "Fake Evaluator",
            "email": "fakeeval@example.com",
            "password": "Password123!",
            "evaluator_service_id": "INVALID-EVAL-ID-999",
        },
    )
    assert response.status_code == 400

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_application_lifecycle_and_isolation(client: AsyncClient, create_test_token):
    gov_token = await create_test_token(user_id=10, role="GOVERNMENT")
    startup_token = await create_test_token(user_id=20, role="STARTUP")

    # Government creates OPEN challenge
    ch_res = await client.post(
        "/challenges",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={
            "title": "Clean Water RFP",
            "description": "Filtration systems",
            "problem_statement": "Contaminants",
            "status": "OPEN",
        },
    )
    ch_id = ch_res.json()["id"]

    # Startup applies
    app_res = await client.post(
        "/applications",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"challenge_id": ch_id},
    )
    assert app_res.status_code == 201
    app_id = app_res.json()["id"]

    # Submit application
    sub_res = await client.post(
        f"/applications/{app_id}/submit",
        headers={"Authorization": f"Bearer {startup_token}"},
    )
    assert sub_res.status_code == 200
    assert sub_res.json()["status"] == "SUBMITTED"

    # Government shortlists
    st_res = await client.patch(
        f"/applications/{app_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "UNDER_REVIEW"},
    )
    assert st_res.status_code == 200


@pytest.mark.asyncio
async def test_application_listing_returns_startup_and_challenge_details(client: AsyncClient, create_test_token):
    gov_token = await create_test_token(user_id=10, role="GOVERNMENT")
    startup_token = await create_test_token(user_id=20, role="STARTUP")

    ch_res = await client.post(
        "/challenges",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={
            "title": "AI-Based Smart Waste Management",
            "description": "Waste classification and route optimization using AI/IoT.",
            "problem_statement": "Municipal waste management requires timely dispatch and analytics.",
            "category": "Waste Management",
            "status": "OPEN",
        },
    )
    challenge_id = ch_res.json()["id"]

    app_res = await client.post(
        "/applications",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"challenge_id": challenge_id},
    )
    assert app_res.status_code == 201

    app_list = await client.get(
        "/applications",
        headers={"Authorization": f"Bearer {gov_token}"},
    )
    assert app_list.status_code == 200

    payload = app_list.json()
    app = next(item for item in payload if item["id"] == app_res.json()["id"])
    assert app["startup_name"] == "SolarTech Innovations"
    assert app["challenge_title"] == "AI-Based Smart Waste Management"

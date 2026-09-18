import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_full_32_step_procurement_workflow(client: AsyncClient):
    # 1. Register startup
    res1 = await client.post(
        "/auth/register",
        json={
            "name": "SolarTech Innovations",
            "email": "startup_a@solartech.io",
            "password": "Password123!",
            "organization": "SolarTech Inc",
        },
    )
    assert res1.status_code == 201
    startup_user = res1.json()
    assert startup_user["role"] == "STARTUP"

    # 2. Register government using a valid FAKE Government Service ID
    res2 = await client.post(
        "/auth/register/government",
        json={
            "name": "Department of Energy Admin",
            "email": "gov_a@energy.gov",
            "password": "Password123!",
            "organization": "Department of Energy",
            "department": "Renewable Energy Division",
            "government_service_id": "GOV-VERIFIED-001",
        },
    )
    assert res2.status_code == 201
    gov_user = res2.json()
    assert gov_user["role"] == "GOVERNMENT"

    # 3. Register evaluator using a valid FAKE Evaluator Verification ID
    res3 = await client.post(
        "/auth/register/evaluator",
        json={
            "name": "Dr. Tech Evaluator",
            "email": "evaluator_a@cleanenergy.org",
            "password": "Password123!",
            "organization": "CleanTech Evaluation Board",
            "evaluator_service_id": "EVAL-VERIFIED-001",
        },
    )
    assert res3.status_code == 201
    eval_user = res3.json()
    assert eval_user["role"] == "EVALUATOR"

    # 4. Verify login for all roles
    l_startup = await client.post("/auth/login", json={"email": "startup_a@solartech.io", "password": "Password123!"})
    assert l_startup.status_code == 200
    startup_token = l_startup.json()["access_token"]

    l_gov = await client.post("/auth/login", json={"email": "gov_a@energy.gov", "password": "Password123!"})
    assert l_gov.status_code == 200
    gov_token = l_gov.json()["access_token"]

    l_eval = await client.post("/auth/login", json={"email": "evaluator_a@cleanenergy.org", "password": "Password123!"})
    assert l_eval.status_code == 200
    eval_token = l_eval.json()["access_token"]

    # 5. Verify /auth/me
    me_startup = await client.get("/auth/me", headers={"Authorization": f"Bearer {startup_token}"})
    assert me_startup.status_code == 200
    assert me_startup.json()["email"] == "startup_a@solartech.io"

    me_gov = await client.get("/auth/me", headers={"Authorization": f"Bearer {gov_token}"})
    assert me_gov.status_code == 200
    assert me_gov.json()["email"] == "gov_a@energy.gov"

    me_eval = await client.get("/auth/me", headers={"Authorization": f"Bearer {eval_token}"})
    assert me_eval.status_code == 200
    assert me_eval.json()["email"] == "evaluator_a@cleanenergy.org"

    # 6. Government creates challenge
    ch_create = await client.post(
        "/challenges",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={
            "title": "Solar Grid Optimization Pilot",
            "description": "Deploy smart solar micro-grids for rural public facilities",
            "problem_statement": "High grid outage rates in remote municipalities",
            "category": "Solar Energy",
            "budget": 250000.00,
            "requirements": {"min_team_size": 5, "domain": "Solar Energy"},
            "kpis": {"efficiency": "90%", "uptime": "99.9%"},
        },
    )
    assert ch_create.status_code == 201
    challenge = ch_create.json()
    challenge_id = challenge["id"]
    assert challenge["status"] == "DRAFT"

    # 7. Government opens challenge
    ch_open = await client.put(
        f"/challenges/{challenge_id}",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "OPEN"},
    )
    assert ch_open.status_code == 200
    assert ch_open.json()["status"] == "OPEN"

    # 8. Startup creates profile
    st_prof = await client.put(
        "/startups/me",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={
            "company_name": "SolarTech Innovations",
            "description": "Next-gen solar micro-grid provider",
            "industry": "Solar Energy",
            "location": "Innovation Park, Hub 1",
            "website": "https://solartech.io",
            "team_size": 10,
            "experience": "Successfully deployed 5 municipal solar micro-grid installations",
            "kpi_data": {"efficiency": "92%", "uptime": "99.95%"},
        },
    )
    assert st_prof.status_code == 200
    assert st_prof.json()["company_name"] == "SolarTech Innovations"

    # 9. Startup sees challenge
    ch_list = await client.get("/challenges", headers={"Authorization": f"Bearer {startup_token}"})
    assert ch_list.status_code == 200
    assert any(c["id"] == challenge_id for c in ch_list.json())

    # 10. Matching returns sensible result
    match_res = await client.get(f"/matching/challenges/{challenge_id}", headers={"Authorization": f"Bearer {startup_token}"})
    assert match_res.status_code == 200
    match_data = match_res.json()
    assert match_data["match_score"] > 50.0

    # 11. Startup applies
    app_create = await client.post(
        "/applications",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"challenge_id": challenge_id},
    )
    assert app_create.status_code == 201
    application_id = app_create.json()["id"]

    # 12. Startup submits application
    app_sub = await client.post(
        f"/applications/{application_id}/submit",
        headers={"Authorization": f"Bearer {startup_token}"},
    )
    assert app_sub.status_code == 200
    assert app_sub.json()["status"] == "SUBMITTED"

    # 13. Government sees application
    gov_apps = await client.get(f"/applications?challenge_id={challenge_id}", headers={"Authorization": f"Bearer {gov_token}"})
    assert gov_apps.status_code == 200
    assert len(gov_apps.json()) >= 1

    # 14. Government moves application under review
    app_ur = await client.patch(
        f"/applications/{application_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "UNDER_REVIEW"},
    )
    assert app_ur.status_code == 200
    assert app_ur.json()["status"] == "UNDER_REVIEW"

    # 15. Government shortlists startup
    app_sl = await client.patch(
        f"/applications/{application_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "SHORTLISTED"},
    )
    assert app_sl.status_code == 200
    assert app_sl.json()["status"] == "SHORTLISTED"

    # 16. Government creates pilot
    pilot_create = await client.post(
        "/pilots",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={
            "application_id": application_id,
            "title": "Solar Grid 90-Day Municipal Pilot",
            "task_description": "Install pilot micro-grid at Municipal Facility #4",
            "requirements": {"hardware": "Inverter v3", "capacity": "50kW"},
            "success_criteria": {"efficiency": ">=90%", "uptime": ">=99%"},
            "kpis": {"efficiency": "90%", "uptime": "99%"},
        },
    )
    assert pilot_create.status_code == 201
    pilot = pilot_create.json()
    pilot_id = pilot["id"]
    assert pilot["status"] == "ASSIGNED"

    # 17. Startup sees pilot
    st_pilots = await client.get("/pilots", headers={"Authorization": f"Bearer {startup_token}"})
    assert st_pilots.status_code == 200
    assert any(p["id"] == pilot_id for p in st_pilots.json())

    # 18. Startup starts pilot
    p_start = await client.patch(
        f"/pilots/{pilot_id}/status",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"status": "IN_PROGRESS"},
    )
    assert p_start.status_code == 200
    assert p_start.json()["status"] == "IN_PROGRESS"

    # 19. Startup creates submission
    ps_create = await client.post(
        "/pilot-submissions",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={
            "pilot_id": pilot_id,
            "results": "Deployed 50kW microgrid; recorded 93% efficiency and 99.9% uptime",
            "kpi_results": {"efficiency": "93%", "uptime": "99.9%"},
            "evidence": {"log_url": "https://solartech.io/evidence/pilot-4.pdf"},
        },
    )
    assert ps_create.status_code == 201
    submission = ps_create.json()
    submission_id = submission["id"]
    assert submission["status"] == "DRAFT"

    # 20. Evaluator should be auto-assigned on pilot submission creation when challenge metadata includes a preferred evaluator
    gov_assigns = await client.get(
        "/evaluator-assignments",
        headers={"Authorization": f"Bearer {gov_token}"},
    )
    assert gov_assigns.status_code == 200
    assert any(a["pilot_submission_id"] == submission_id for a in gov_assigns.json())

    # 21. Startup submits submission
    ps_sub = await client.post(
        f"/pilot-submissions/{submission_id}/submit",
        headers={"Authorization": f"Bearer {startup_token}"},
    )
    assert ps_sub.status_code == 200
    assert ps_sub.json()["status"] == "SUBMITTED"

    # 22. Evaluator sees the auto-assigned evaluator task
    ev_assigns = await client.get("/evaluator-assignments", headers={"Authorization": f"Bearer {eval_token}"})
    assert ev_assigns.status_code == 200
    assignment = next(a for a in ev_assigns.json() if a["pilot_submission_id"] == submission_id)
    assignment_id = assignment["id"]

    # 23. Evaluator starts assignment
    ea_start = await client.patch(
        f"/evaluator-assignments/{assignment_id}/status",
        headers={"Authorization": f"Bearer {eval_token}"},
        json={"status": "IN_PROGRESS"},
    )
    assert ea_start.status_code == 200

    # 24. Evaluator creates evaluation
    eval_create = await client.post(
        "/evaluations",
        headers={"Authorization": f"Bearer {eval_token}"},
        json={
            "pilot_submission_id": submission_id,
            "technical_score": 90.0,
            "kpi_score": 95.0,
            "innovation_score": 85.0,
            "feasibility_score": 90.0,
            "impact_score": 90.0,
            "comments": "Outstanding technical performance and high efficiency.",
            "recommendation": "RECOMMEND",
        },
    )
    assert eval_create.status_code == 201
    evaluation_id = eval_create.json()["id"]
    # Overall score = (90 + 95 + 85 + 90 + 90) / 5 = 90.0
    assert float(eval_create.json()["overall_score"]) == 90.0

    # 25. Evaluator completes evaluation
    eval_comp = await client.post(
        f"/evaluations/{evaluation_id}/complete",
        headers={"Authorization": f"Bearer {eval_token}"},
    )
    assert eval_comp.status_code == 200
    assert eval_comp.json()["status"] == "COMPLETED"

    # Complete pilot as COMPLETED
    await client.patch(
        f"/pilots/{pilot_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "COMPLETED"},
    )

    # 26. Evaluation summary is correct
    eval_summary = await client.get(
        f"/evaluations/summary/{submission_id}",
        headers={"Authorization": f"Bearer {gov_token}"},
    )
    assert eval_summary.status_code == 200
    sum_data = eval_summary.json()
    assert sum_data["completed_evaluations_count"] == 1
    assert float(sum_data["avg_overall_score"]) == 90.0

    # 27. Government sees completed evaluation
    gov_evals = await client.get(
        f"/evaluations/submission/{submission_id}",
        headers={"Authorization": f"Bearer {gov_token}"},
    )
    assert gov_evals.status_code == 200
    assert len(gov_evals.json()) == 1

    # 28. Government makes AWARDED decision
    decision_res = await client.post(
        f"/challenges/{challenge_id}/decision",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"pilot_id": pilot_id, "decision": "AWARDED"},
    )
    assert decision_res.status_code == 200
    assert decision_res.json()["decision"] == "AWARDED"

    # Mark submission ACCEPTED
    await client.put(
        f"/pilot-submissions/{submission_id}",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "ACCEPTED"},
    )

    # 29. Contract creation succeeds
    contract_create = await client.post(
        "/contracts",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={
            "challenge_id": challenge_id,
            "startup_id": startup_user["id"],
            "pilot_id": pilot_id,
            "contract_value": 240000.00,
        },
    )
    assert contract_create.status_code == 201
    contract_id = contract_create.json()["id"]

    # 30. Contract lifecycle works (DRAFT -> AWARDED -> ACTIVE -> COMPLETED)
    c_awarded = await client.patch(
        f"/contracts/{contract_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "AWARDED"},
    )
    assert c_awarded.status_code == 200

    c_active = await client.patch(
        f"/contracts/{contract_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "ACTIVE"},
    )
    assert c_active.status_code == 200

    c_completed = await client.patch(
        f"/contracts/{contract_id}/status",
        headers={"Authorization": f"Bearer {gov_token}"},
        json={"status": "COMPLETED"},
    )
    assert c_completed.status_code == 200
    assert c_completed.json()["status"] == "COMPLETED"

    # 31. Notifications exist for appropriate users
    startup_notifs = await client.get("/notifications", headers={"Authorization": f"Bearer {startup_token}"})
    assert startup_notifs.status_code == 200
    assert len(startup_notifs.json()) > 0

    gov_notifs = await client.get("/notifications", headers={"Authorization": f"Bearer {gov_token}"})
    assert gov_notifs.status_code == 200
    assert len(gov_notifs.json()) > 0

    # 32. Activity logs exist for state-changing actions
    activity_logs = await client.get("/activity", headers={"Authorization": f"Bearer {gov_token}"})
    assert activity_logs.status_code == 200
    assert len(activity_logs.json()) > 0

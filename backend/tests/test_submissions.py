import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submission_lifecycle(client: AsyncClient, create_test_token):
    startup_token = await create_test_token(user_id=20, role="STARTUP")

    # Creating submission for non-existent pilot returns 404
    res = await client.post(
        "/pilot-submissions",
        headers={"Authorization": f"Bearer {startup_token}"},
        json={"pilot_id": 99999, "results": "Sample results"},
    )
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_cross_role_evidence_view_download_and_authorization(client: AsyncClient):
    # 1. Register users
    s_res = await client.post(
        "/auth/register",
        json={"name": "Evidence Startup", "email": "ev_startup@test.io", "password": "Password123!", "organization": "EvStartup"},
    )
    assert s_res.status_code == 201
    s_token = (await client.post("/auth/login", json={"email": "ev_startup@test.io", "password": "Password123!"})).json()["access_token"]

    g_res = await client.post(
        "/auth/register/government",
        json={
            "name": "Gov Officer",
            "email": "gov_officer@energy.gov",
            "password": "Password123!",
            "organization": "Department of Energy",
            "department": "IT Dept",
            "government_service_id": "GOV-TEST-12345",
        },
    )
    assert g_res.status_code == 201
    g_token = (await client.post("/auth/login", json={"email": "gov_officer@energy.gov", "password": "Password123!"})).json()["access_token"]

    e1_res = await client.post(
        "/auth/register/evaluator",
        json={
            "name": "Assigned Evaluator",
            "email": "assigned_eval@cleanenergy.org",
            "password": "Password123!",
            "organization": "Board A",
            "evaluator_service_id": "EVAL-TEST-12345",
        },
    )
    assert e1_res.status_code == 201
    e1_id = e1_res.json()["id"]
    e1_token = (await client.post("/auth/login", json={"email": "assigned_eval@cleanenergy.org", "password": "Password123!"})).json()["access_token"]

    e2_res = await client.post(
        "/auth/register/evaluator",
        json={
            "name": "Unassigned Evaluator",
            "email": "unassigned_eval@board.org",
            "password": "Password123!",
            "organization": "Board B",
            "evaluator_service_id": "EVAL-TEST-67890",
        },
    )
    assert e2_res.status_code == 201
    e2_token = (await client.post("/auth/login", json={"email": "unassigned_eval@board.org", "password": "Password123!"})).json()["access_token"]

    # 2. Government creates and opens challenge
    ch = (await client.post(
        "/challenges",
        headers={"Authorization": f"Bearer {g_token}"},
        json={
            "title": "Evidence Challenge",
            "description": "Test challenge for evidence flow",
            "problem_statement": "Testing evidence viewing",
            "category": "Testing",
            "budget": 50000.0,
            "requirements": {},
            "kpis": {"target": "100%"},
        },
    )).json()
    ch_id = ch["id"]
    await client.put(f"/challenges/{ch_id}", headers={"Authorization": f"Bearer {g_token}"}, json={"status": "OPEN"})

    # 3. Startup applies, submits application, Government shortlists & creates pilot
    app = (await client.post(
        "/applications",
        headers={"Authorization": f"Bearer {s_token}"},
        json={"challenge_id": ch_id, "proposal_text": "Evidence proposal", "budget_ask": 50000.0},
    )).json()
    app_id = app["id"]

    await client.post(f"/applications/{app_id}/submit", headers={"Authorization": f"Bearer {s_token}"})
    await client.patch(f"/applications/{app_id}/status", headers={"Authorization": f"Bearer {g_token}"}, json={"status": "UNDER_REVIEW"})
    await client.patch(f"/applications/{app_id}/status", headers={"Authorization": f"Bearer {g_token}"}, json={"status": "SHORTLISTED"})
    pilot_res = await client.post(
        "/pilots",
        headers={"Authorization": f"Bearer {g_token}"},
        json={
            "application_id": app_id,
            "title": "Evidence Pilot",
            "task_description": "Execute pilot and attach PDF telemetry",
            "success_criteria": {"doc": "valid"},
            "kpis": {"uptime": "100%"},
            "requirements": {},
        },
    )
    assert pilot_res.status_code == 201
    pilot = pilot_res.json()
    pilot_id = pilot["id"]
    await client.patch(f"/pilots/{pilot_id}/status", headers={"Authorization": f"Bearer {s_token}"}, json={"status": "IN_PROGRESS"})

    # 4. Startup uploads evidence PDF file
    pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n00000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF\n"
    boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="test-evidence.pdf"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + pdf_content + f"\r\n--{boundary}--\r\n".encode("utf-8")

    upload_res = await client.post(
        "/pilot-submissions/upload-evidence",
        headers={
            "Authorization": f"Bearer {s_token}",
            "Content-Type": f"multipart/form-data; boundary={boundary}",
        },
        content=body,
    )
    assert upload_res.status_code == 201
    upload_data = upload_res.json()
    saved_name = upload_data["saved_name"]
    assert "test-evidence.pdf" in saved_name or upload_data["filename"] == "test-evidence.pdf"

    # 5. Startup creates submission with the uploaded evidence
    sub_res = await client.post(
        "/pilot-submissions",
        headers={"Authorization": f"Bearer {s_token}"},
        json={
            "pilot_id": pilot_id,
            "results": "Field trial completed with attached PDF telemetry.",
            "kpi_results": {"uptime": "100%"},
            "evidence": {
                "document_1": {
                    "filename": "test-evidence.pdf",
                    "saved_name": saved_name,
                    "url": upload_data["url"],
                    "size_bytes": len(pdf_content),
                }
            },
        },
    )
    assert sub_res.status_code == 201
    sub_id = sub_res.json()["id"]

    # Submit the submission
    await client.post(f"/pilot-submissions/{sub_id}/submit", headers={"Authorization": f"Bearer {s_token}"})

    # 6. Verify Evaluator 1 is assigned (either via auto-assignment or manual assignment)
    assignments = (await client.get("/evaluator-assignments", headers={"Authorization": f"Bearer {g_token}"})).json()
    is_already_assigned = any(a["pilot_submission_id"] == sub_id and a["evaluator_id"] == e1_id for a in assignments)
    if not is_already_assigned:
        assign_res = await client.post(
            "/evaluator-assignments",
            headers={"Authorization": f"Bearer {g_token}"},
            json={"pilot_submission_id": sub_id, "evaluator_id": e1_id},
        )
        assert assign_res.status_code in (200, 201)

    # 7. Verification: Startup can view/download
    s_file_res = await client.get(f"/pilot-submissions/evidence-files/{saved_name}", headers={"Authorization": f"Bearer {s_token}"})
    assert s_file_res.status_code == 200
    assert "application/pdf" in s_file_res.headers.get("content-type", "")
    assert "inline" in s_file_res.headers.get("content-disposition", "")
    assert s_file_res.content == pdf_content

    # 8. Verification: Government can view/download
    g_file_res = await client.get(f"/pilot-submissions/evidence-files/{saved_name}", headers={"Authorization": f"Bearer {g_token}"})
    assert g_file_res.status_code == 200
    assert "application/pdf" in g_file_res.headers.get("content-type", "")
    assert g_file_res.content == pdf_content

    # 9. Verification: Assigned Evaluator 1 can view/download
    e1_file_res = await client.get(f"/pilot-submissions/evidence-files/{saved_name}", headers={"Authorization": f"Bearer {e1_token}"})
    assert e1_file_res.status_code == 200
    assert "application/pdf" in e1_file_res.headers.get("content-type", "")
    assert e1_file_res.content == pdf_content

    # 10. Verification: Unauthorized Evaluator 2 receives 403 Forbidden
    e2_file_res = await client.get(f"/pilot-submissions/evidence-files/{saved_name}", headers={"Authorization": f"Bearer {e2_token}"})
    assert e2_file_res.status_code == 403

    # 11. Verification: Non-existent file returns 404 Not Found
    non_existent_res = await client.get("/pilot-submissions/evidence-files/non_existent_file.pdf", headers={"Authorization": f"Bearer {g_token}"})
    assert non_existent_res.status_code == 404

    # 12. Verification: Scoped submission endpoint (/pilot-submissions/{id}/evidence/{filename})
    scoped_g = await client.get(f"/pilot-submissions/{sub_id}/evidence/{saved_name}", headers={"Authorization": f"Bearer {g_token}"})
    assert scoped_g.status_code == 200
    assert scoped_g.content == pdf_content

    scoped_e1 = await client.get(f"/pilot-submissions/{sub_id}/evidence/{saved_name}", headers={"Authorization": f"Bearer {e1_token}"})
    assert scoped_e1.status_code == 200
    assert scoped_e1.content == pdf_content

    scoped_e2 = await client.get(f"/pilot-submissions/{sub_id}/evidence/{saved_name}", headers={"Authorization": f"Bearer {e2_token}"})
    assert scoped_e2.status_code == 403


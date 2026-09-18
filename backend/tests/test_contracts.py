import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_contract_permissions(client: AsyncClient, create_test_token):
    eval_token = await create_test_token(user_id=30, role="EVALUATOR")

    # Evaluator cannot view contracts (403)
    res = await client.get("/contracts", headers={"Authorization": f"Bearer {eval_token}"})
    assert res.status_code == 403

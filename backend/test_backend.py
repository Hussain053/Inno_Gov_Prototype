import asyncio
import httpx
from app.main import app

async def test():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url='http://localhost:8000') as client:
        # Test root
        r = await client.get('/')
        assert r.status_code == 200, f'Root failed: {r.text}'
        print('[PASS] Root API: OK')

        # Test gov login
        r = await client.post('/auth/login', json={'email': 'gov_a@energy.gov', 'password': 'Password123!'})
        assert r.status_code == 200, f'Gov login failed: {r.text}'
        gov_token = r.json()['access_token']
        gov_headers = {'Authorization': f'Bearer {gov_token}'}
        print('[PASS] Gov Login: OK')

        # Test challenges list
        r = await client.get('/challenges', headers=gov_headers)
        assert r.status_code == 200, f'Challenges list failed: {r.text}'
        challenges = r.json()
        print(f'[PASS] Challenges count: {len(challenges)}')
        assert len(challenges) >= 2, 'Expected at least 2 challenges'

        # Test challenge creation (publish problem statement)
        payload = {
            'title': 'Autonomous AI Drones for Rural Medical Delivery',
            'description': 'Deliver urgent blood units and antivenoms across isolated hilly primary healthcare sub-centers.',
            'problem_statement': 'Road connectivity disruptions in monsoon seasons cutting off medical access.',
            'category': 'Healthcare Logistics',
            'location': 'Uttara Kannada & Kodagu Wards',
            'budget': 400000.0,
            'application_deadline': '2026-12-31',
            'status': 'OPEN',
            'requirements': {'payload_kg': 5, 'range_km': 40},
            'kpis': {'delivery_time_minutes': '<30', 'gps_accuracy_meters': '<2'}
        }
        r = await client.post('/challenges', json=payload, headers=gov_headers)
        assert r.status_code == 201, f'Create challenge failed: {r.text}'
        new_ch = r.json()
        new_id = new_ch['id']
        print(f'[PASS] Create Challenge (Publish Problem Statement): OK, ID #{new_id}')

        # Test matching engine
        r = await client.get('/matching/challenges/1/startups', headers=gov_headers)
        assert r.status_code == 200, f'Matching failed: {r.text}'
        matches = r.json()
        print(f'[PASS] AI Matches for Challenge #1: {len(matches)} matches found!')
        for m in matches:
            s_name = m.get('startup_name')
            score = m['match_score']
            kpis = m['matched_kpis']
            print(f'   - Startup: {s_name} | Score: {score} | KPIs: {kpis}')

        # Test admin login and admin dashboard
        r = await client.post('/auth/login', json={'email': 'admin@innogov.gov.in', 'password': 'Password123!'})
        assert r.status_code == 200, f'Admin login failed: {r.text}'
        admin_token = r.json()['access_token']
        admin_headers = {'Authorization': f'Bearer {admin_token}'}
        print('[PASS] Admin Login: OK')

        r = await client.get('/dashboard/admin', headers=admin_headers)
        assert r.status_code == 200, f'Admin dashboard failed: {r.text}'
        admin_data = r.json()
        total_u = admin_data['total_users']
        total_c = admin_data['total_challenges']
        total_s = admin_data['total_startups']
        print(f'[PASS] Admin Dashboard Metrics: Total Users={total_u}, Challenges={total_c}, Startups={total_s}')

        r = await client.get('/admin/users', headers=admin_headers)
        assert r.status_code == 200, f'Admin users list failed: {r.text}'
        users = r.json()
        print(f'[PASS] Admin Users List: {len(users)} users found')

        # Test startup login and challenge visibility
        r = await client.post('/auth/login', json={'email': 'startup_a@solartech.io', 'password': 'Password123!'})
        assert r.status_code == 200, f'Startup login failed: {r.text}'
        startup_token = r.json()['access_token']
        startup_headers = {'Authorization': f'Bearer {startup_token}'}
        print('[PASS] Startup Login: OK')

        r = await client.get('/challenges', headers=startup_headers)
        assert r.status_code == 200, f'Startup challenge list failed: {r.text}'
        vis_count = len(r.json())
        print(f'[PASS] Startup viewing published challenges: {vis_count} visible!')

        r = await client.get('/dashboard/startup', headers=startup_headers)
        assert r.status_code == 200, f'Startup dashboard failed: {r.text}'
        print('[PASS] Startup Dashboard: OK')

        # Test evaluator
        r = await client.post('/auth/login', json={'email': 'evaluator_a@cleanenergy.org', 'password': 'Password123!'})
        assert r.status_code == 200, f'Evaluator login failed: {r.text}'
        eval_headers = {'Authorization': f'Bearer {r.json()["access_token"]}'}
        r = await client.get('/dashboard/evaluator', headers=eval_headers)
        assert r.status_code == 200, f'Evaluator dashboard failed: {r.text}'
        print('[PASS] Evaluator Dashboard: OK')

    print('\n=========================================')
    print('ALL CRITICAL BACKEND TESTS PASSED 100%!!')
    print('=========================================')

if __name__ == '__main__':
    asyncio.run(test())

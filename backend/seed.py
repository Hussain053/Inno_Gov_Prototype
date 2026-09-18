import asyncio
from datetime import date, datetime
from app.database import AsyncSessionLocal, engine, Base
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.startup import StartupProfile
from app.models.challenge import Challenge, ChallengeStatus
from app.models.application import Application, ApplicationStatus
from app.models.pilot import Pilot, PilotStatus
from app.models.pilot_submission import PilotSubmission, PilotSubmissionStatus
from app.models.evaluator_assignment import EvaluatorAssignment, AssignmentStatus
from app.models.evaluation import Evaluation, EvaluationRecommendation, EvaluationStatus
from app.models.contract import Contract, ContractStatus
from app.models.notification import Notification, NotificationType
from app.models.activity_log import ActivityLog, ActivityAction

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if users exist
        from sqlalchemy import select
        res = await session.execute(select(User))
        if res.scalars().first():
            print("Database already seeded with users. Skipping.")
            return

        print("Seeding InnoGov database with comprehensive SIH 26136 test dataset...")

        # 1. Users
        pwd_hash = hash_password("Password123!")

        startup1 = User(
            name="SolarTech Innovations",
            email="navya@gmail.com",
            password_hash=hash_password("Password123"),
            role=UserRole.STARTUP,
            organization="SolarTech Inc",
            is_active=True,
        )
        startup2 = User(
            name="AquaPure Labs",
            email="startup_b@aquapure.io",
            password_hash=pwd_hash,
            role=UserRole.STARTUP,
            organization="AquaPure Systems Pvt Ltd",
            is_active=True,
        )
        gov = User(
            name="R. K. Sharma",
            email="dd@gmail.com",
            password_hash=pwd_hash,
            role=UserRole.GOVERNMENT,
            organization="Ministry of Power & Energy",
            is_active=True,
        )
        evaluator = User(
            name="Dr. Anita Verma",
            email="neel@gmail.com",
            password_hash=pwd_hash,
            role=UserRole.EVALUATOR,
            organization="National Clean Energy Council",
            is_active=True,
        )
        admin = User(
            name="InnoGov Mission Director",
            email="admin@innogov.gov.in",
            password_hash=pwd_hash,
            role=UserRole.ADMIN,
            organization="InnoGov Public Procurement Cell",
            is_active=True,
        )

        session.add_all([startup1, startup2, gov, evaluator, admin])
        await session.flush()

        # 2. Startup Profiles
        profile1 = StartupProfile(
            user_id=startup1.id,
            company_name="SolarTech Innovations",
            description="Next-generation IoT-connected solar microgrids with sub-5 second automatic failover and 99.95% empirical operational uptime.",
            industry="Solar Energy",
            location="Hubballi, Karnataka",
            website="https://solartech.io",
            team_size=8,
            experience="5 years deploying municipal clean energy and IoT monitoring microgrids",
            kpi_data={
                "efficiency": ">=93%",
                "uptime": ">=99.9%",
                "failover_seconds": "<5",
                "remote_telemetry": True,
                "solar_capacity_kw": 25
            },
        )
        profile2 = StartupProfile(
            user_id=startup2.id,
            company_name="AquaPure Labs",
            description="Acoustic IoT and edge sensor networks for subterranean municipal pipeline leak detection and real-time flow telemetry.",
            industry="Water Management",
            location="Bengaluru, Karnataka",
            website="https://aquapure.io",
            team_size=6,
            experience="3 years in smart urban water grid telemetry and acoustic leak detection",
            kpi_data={
                "leakage_detection_minutes": "<3",
                "sensor_accuracy": ">=99%",
                "remote_telemetry": True,
                "flow_capacity_lph": 20000
            },
        )
        session.add_all([profile1, profile2])
        await session.flush()

        # 3. Government Challenges
        challenge1 = Challenge(
            government_user_id=gov.id,
            title="Smart IoT Solar Microgrid Deployment for Public Health Centers",
            description="Deploy smart IoT-controlled solar microgrids across municipal public health and educational facilities to guarantee 99.9% uptime during grid interruptions.",
            problem_statement="High frequency of distribution grid outages causing operational loss and cold chain spoilage in remote municipal healthcare centers.",
            category="Solar Energy",
            location="Dharwad & Hubballi Municipal Zones, Karnataka",
            budget=250000.00,
            application_deadline=date(2026, 11, 30),
            status=ChallengeStatus.OPEN,
            requirements={
                "min_team_size": 5,
                "domain": "Solar Energy",
                "trl_required": 7,
                "hardware_warranty_years": 3
            },
            kpis={
                "efficiency": ">=90%",
                "uptime": ">=99.9%",
                "failover_seconds": "<5",
                "remote_telemetry": True
            },
        )
        challenge2 = Challenge(
            government_user_id=gov.id,
            title="Subterranean Water Pipeline Leak Detection & Real-time Flow Telemetry",
            description="Install acoustic and pressure sensor IoT nodes to isolate pipeline ruptures within 5 minutes of occurrence across municipal water supply networks.",
            problem_statement="Unaccounted-for water (UFW) loss exceeding 38% due to undetected subterranean distribution pipe bursts across urban wards.",
            category="Water Management",
            location="Mysuru Urban Development Area",
            budget=350000.00,
            application_deadline=date(2026, 12, 15),
            status=ChallengeStatus.OPEN,
            requirements={
                "domain": "Water Management",
                "trl_required": 6,
                "battery_life_years": 5
            },
            kpis={
                "leakage_detection_minutes": "<5",
                "sensor_accuracy": ">=98%",
                "remote_telemetry": True
            },
        )
        session.add_all([challenge1, challenge2])
        await session.flush()

        # 4. Applications
        app1 = Application(
            challenge_id=challenge1.id,
            startup_id=startup1.id,
            status=ApplicationStatus.SHORTLISTED,
        )
        app2 = Application(
            challenge_id=challenge2.id,
            startup_id=startup2.id,
            status=ApplicationStatus.UNDER_REVIEW,
        )
        session.add_all([app1, app2])
        await session.flush()

        # 5. Sandbox Pilot
        pilot1 = Pilot(
            challenge_id=challenge1.id,
            startup_id=startup1.id,
            status=PilotStatus.IN_PROGRESS,
            title="SolarTech Sandbox Pilot - Primary Health Center Dharwad",
            task_description="Deploy and evaluate 15kW smart solar microgrid testbed at PHC Dharwad North Ward.",
            start_date=date(2026, 8, 1),
            end_date=date(2026, 9, 30),
            success_criteria={
                "min_uptime": "99.9%",
                "failover_seconds": "<5",
                "telemetry_frequency": "1_minute"
            },
        )
        session.add(pilot1)
        await session.flush()

        # 6. Pilot Submission
        sub1 = PilotSubmission(
            pilot_id=pilot1.id,
            startup_id=startup1.id,
            results="Successfully deployed 15kW IoT solar microgrid at PHC Dharwad. Maintained 99.98% continuous uptime over 45 days of testing with under 2.4 second failover during 14 simulated grid trips.",
            kpi_results={
                "efficiency": "94.2%",
                "uptime": "99.98%",
                "failover_seconds": "2.4s",
                "remote_telemetry": True
            },
            evidence={
                "telemetry_report": "https://solartech.io/reports/dharwad-phc-telemetry.pdf",
                "lab_certification": "https://solartech.io/cert/iec-61215.pdf",
                "live_dashboard_url": "https://scada.solartech.io/phc-dharwad"
            },
            status=PilotSubmissionStatus.UNDER_EVALUATION,
        )
        session.add(sub1)
        await session.flush()

        # 7. Evaluator Assignment
        assignment1 = EvaluatorAssignment(
            pilot_submission_id=sub1.id,
            evaluator_id=evaluator.id,
            status=AssignmentStatus.COMPLETED,
        )
        session.add(assignment1)
        await session.flush()

        # 8. Evaluation
        eval1 = Evaluation(
            pilot_submission_id=sub1.id,
            evaluator_id=evaluator.id,
            technical_score=94.0,
            kpi_score=96.0,
            innovation_score=92.0,
            feasibility_score=90.0,
            impact_score=95.0,
            overall_score=93.4,
            recommendation=EvaluationRecommendation.RECOMMEND,
            comments="Outstanding execution of automatic grid failover and cloud SCADA telemetry. Solution meets and exceeds all GFR Rule 149 pilot benchmarks. Recommended for full-scale municipal procurement.",
            status=EvaluationStatus.COMPLETED,
        )
        session.add(eval1)
        await session.flush()

        # 9. Procurement Contract
        contract1 = Contract(
            challenge_id=challenge1.id,
            startup_id=startup1.id,
            pilot_id=pilot1.id,
            government_user_id=gov.id,
            contract_value=250000.00,
            start_date=date(2026, 10, 1),
            end_date=date(2027, 3, 31),
            status=ContractStatus.ACTIVE,
        )
        session.add(contract1)
        await session.flush()

        # 10. Notifications
        notif1 = Notification(
            user_id=startup1.id,
            notification_type=NotificationType.APPLICATION_SHORTLISTED,
            title="Application Shortlisted for Pilot",
            message="Your proposal for 'Smart IoT Solar Microgrid' has been shortlisted for sandbox pilot deployment.",
            resource_type="challenge",
            resource_id=challenge1.id,
            is_read=False,
        )
        notif2 = Notification(
            user_id=startup1.id,
            notification_type=NotificationType.PILOT_ASSIGNED,
            title="Pilot Contract Authorized",
            message="Department of Energy authorized sandbox pilot execution under GFR 149 relaxation.",
            resource_type="pilot",
            resource_id=pilot1.id,
            is_read=False,
        )
        notif3 = Notification(
            user_id=gov.id,
            notification_type=NotificationType.EVALUATION_COMPLETED,
            title="Evaluation Scorecard Published",
            message="CleanTech Evaluation Board submitted RECOMMEND decision with 93.4% composite score.",
            resource_type="evaluation",
            resource_id=eval1.id,
            is_read=False,
        )
        session.add_all([notif1, notif2, notif3])

        # 11. Activity Log
        log1 = ActivityLog(
            actor_user_id=gov.id,
            action=ActivityAction.CHALLENGE_CREATED,
            resource_type="challenge",
            resource_id=challenge1.id,
            description=f"Challenge '{challenge1.title}' created and published.",
        )
        log2 = ActivityLog(
            actor_user_id=startup1.id,
            action=ActivityAction.APPLICATION_SUBMITTED,
            resource_type="application",
            resource_id=app1.id,
            description="Application submitted for Solar Microgrid challenge.",
        )
        log3 = ActivityLog(
            actor_user_id=evaluator.id,
            action=ActivityAction.EVALUATION_COMPLETED,
            resource_type="evaluation",
            resource_id=eval1.id,
            description="Evaluator completed evaluation with score 93.4% (RECOMMEND).",
        )
        session.add_all([log1, log2, log3])

        await session.commit()
        print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())

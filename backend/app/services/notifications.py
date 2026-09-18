"""
Notification Service
====================
Reusable business-level functions that create persistent in-app notifications.

Architecture:
    Router → Business Operation → Notification Service → CRUD → Database

This layer:
  - Selects the correct notification type for each workflow event.
  - Constructs safe, generic titles and messages (no sensitive scores/comments).
  - Decides WHICH user(s) receive the notification.
  - Delegates persistence to crud.notification.create_notification.

External delivery channels (email, SMS, push) are intentionally NOT implemented.
When those channels are needed, new adapter functions can be added below each
database-persist call without changing the caller interface.

Example future extension:
    await db_notify(...)          # ← already implemented
    await email_adapter.send(...)  # ← future adapter
    await sms_adapter.send(...)    # ← future adapter
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import notification as crud_notification
from app.models.notification import NotificationType


# ---------------------------------------------------------------------------
# Application notifications
# ---------------------------------------------------------------------------

async def notify_application_submitted(
    db: AsyncSession,
    *,
    government_user_id: int,
    challenge_id: int,
    challenge_title: str,
    application_id: int,
) -> None:
    """
    Notify the government user when a startup submits an application.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=government_user_id,
        notification_type=NotificationType.APPLICATION_SUBMITTED,
        title="New Application Submitted",
        message=f"A startup has submitted an application for your challenge: '{challenge_title}'.",
        resource_type="application",
        resource_id=application_id,
    )


async def notify_application_status_changed(
    db: AsyncSession,
    *,
    startup_user_id: int,
    new_status: str,
    challenge_title: str,
    application_id: int,
) -> None:
    """
    Notify the startup when the government changes their application status.
    Covers: UNDER_REVIEW, SHORTLISTED, REJECTED.
    """
    status_map = {
        "UNDER_REVIEW": (
            NotificationType.APPLICATION_UNDER_REVIEW,
            "Application Under Review",
            f"Your application for '{challenge_title}' is now under review.",
        ),
        "SHORTLISTED": (
            NotificationType.APPLICATION_SHORTLISTED,
            "Application Shortlisted",
            f"Congratulations! Your application for '{challenge_title}' has been shortlisted.",
        ),
        "REJECTED": (
            NotificationType.APPLICATION_REJECTED,
            "Application Not Progressed",
            f"Your application for '{challenge_title}' has not been progressed further.",
        ),
    }
    entry = status_map.get(new_status)
    if entry is None:
        return
    notification_type, title, message = entry
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        resource_type="application",
        resource_id=application_id,
    )


async def notify_application_withdrawn(
    db: AsyncSession,
    *,
    government_user_id: int,
    challenge_title: str,
    application_id: int,
) -> None:
    """
    Notify the government user when a startup withdraws their application.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=government_user_id,
        notification_type=NotificationType.APPLICATION_WITHDRAWN,
        title="Application Withdrawn",
        message=f"A startup has withdrawn their application for your challenge: '{challenge_title}'.",
        resource_type="application",
        resource_id=application_id,
    )


# ---------------------------------------------------------------------------
# Pilot notifications
# ---------------------------------------------------------------------------

async def notify_pilot_assigned(
    db: AsyncSession,
    *,
    startup_user_id: int,
    challenge_title: str,
    pilot_id: int,
) -> None:
    """
    Notify the startup when a pilot project is assigned to them.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=NotificationType.PILOT_ASSIGNED,
        title="Pilot Project Assigned",
        message=f"You have been assigned a pilot project for the challenge: '{challenge_title}'. Please log in to review the requirements.",
        resource_type="pilot",
        resource_id=pilot_id,
    )


async def notify_pilot_status_changed(
    db: AsyncSession,
    *,
    startup_user_id: int,
    new_status: str,
    challenge_title: str,
    pilot_id: int,
) -> None:
    """
    Notify the startup when pilot status changes to IN_PROGRESS, COMPLETED, or FAILED.
    """
    status_map = {
        "IN_PROGRESS": (
            NotificationType.PILOT_STARTED,
            "Pilot Project Started",
            f"Your pilot project for '{challenge_title}' has been marked as in progress.",
        ),
        "COMPLETED": (
            NotificationType.PILOT_COMPLETED,
            "Pilot Project Completed",
            f"Your pilot project for '{challenge_title}' has been marked as completed.",
        ),
        "FAILED": (
            NotificationType.PILOT_FAILED,
            "Pilot Project Closed",
            f"Your pilot project for '{challenge_title}' has been closed.",
        ),
    }
    entry = status_map.get(new_status)
    if entry is None:
        return
    notification_type, title, message = entry
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        resource_type="pilot",
        resource_id=pilot_id,
    )


# ---------------------------------------------------------------------------
# Pilot submission notifications
# ---------------------------------------------------------------------------

async def notify_submission_submitted(
    db: AsyncSession,
    *,
    government_user_id: int,
    challenge_title: str,
    submission_id: int,
) -> None:
    """
    Notify the government/challenge owner when a startup submits their pilot results.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=government_user_id,
        notification_type=NotificationType.SUBMISSION_SUBMITTED,
        title="Pilot Submission Received",
        message=f"A startup has submitted pilot results for your challenge: '{challenge_title}'.",
        resource_type="pilot_submission",
        resource_id=submission_id,
    )


async def notify_submission_under_evaluation(
    db: AsyncSession,
    *,
    startup_user_id: int,
    challenge_title: str,
    submission_id: int,
) -> None:
    """
    Notify the startup when their submission enters evaluation.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=NotificationType.SUBMISSION_UNDER_EVALUATION,
        title="Submission Under Evaluation",
        message=f"Your pilot submission for '{challenge_title}' is now being evaluated.",
        resource_type="pilot_submission",
        resource_id=submission_id,
    )


async def notify_submission_accepted(
    db: AsyncSession,
    *,
    startup_user_id: int,
    challenge_title: str,
    submission_id: int,
) -> None:
    """
    Notify the startup when their submission is accepted (contract awarded).
    """
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=NotificationType.SUBMISSION_ACCEPTED,
        title="Submission Accepted",
        message=f"Your pilot submission for '{challenge_title}' has been accepted.",
        resource_type="pilot_submission",
        resource_id=submission_id,
    )


# ---------------------------------------------------------------------------
# Evaluation notifications
# ---------------------------------------------------------------------------

async def notify_evaluation_completed(
    db: AsyncSession,
    *,
    government_user_id: int,
    challenge_title: str,
    evaluation_id: int,
) -> None:
    """
    Notify the government/challenge owner when an evaluation is completed.
    Generic message — does NOT include evaluator scores or comments.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=government_user_id,
        notification_type=NotificationType.EVALUATION_COMPLETED,
        title="Evaluation Completed",
        message=f"An evaluation has been completed for a pilot submission under your challenge: '{challenge_title}'.",
        resource_type="evaluation",
        resource_id=evaluation_id,
    )


async def notify_startup_evaluation_completed(
    db: AsyncSession,
    *,
    startup_user_id: int,
    challenge_title: str,
    submission_id: int,
) -> None:
    """
    Notify the startup that their submission has received an evaluation.
    Message is generic — no scores or evaluator comments are exposed.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=NotificationType.EVALUATION_COMPLETED,
        title="Evaluation Completed for Your Submission",
        message=f"An evaluation has been completed for your pilot submission under '{challenge_title}'.",
        resource_type="pilot_submission",
        resource_id=submission_id,
    )


# ---------------------------------------------------------------------------
# Contract notifications
# ---------------------------------------------------------------------------

async def notify_contract_awarded(
    db: AsyncSession,
    *,
    startup_user_id: int,
    challenge_title: str,
    contract_id: int,
) -> None:
    """
    Notify the startup that a contract has been awarded to them.
    """
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=NotificationType.CONTRACT_AWARDED,
        title="Contract Awarded",
        message=f"Congratulations! A procurement contract has been awarded to you for: '{challenge_title}'.",
        resource_type="contract",
        resource_id=contract_id,
    )


async def notify_contract_status_changed(
    db: AsyncSession,
    *,
    startup_user_id: int,
    new_status: str,
    challenge_title: str,
    contract_id: int,
) -> None:
    """
    Notify the startup when contract status changes to ACTIVE, COMPLETED, or TERMINATED.
    """
    status_map = {
        "ACTIVE": (
            NotificationType.CONTRACT_ACTIVE,
            "Contract Now Active",
            f"Your contract for '{challenge_title}' is now active.",
        ),
        "COMPLETED": (
            NotificationType.CONTRACT_COMPLETED,
            "Contract Completed",
            f"Your contract for '{challenge_title}' has been marked as completed.",
        ),
        "TERMINATED": (
            NotificationType.CONTRACT_TERMINATED,
            "Contract Terminated",
            f"Your contract for '{challenge_title}' has been terminated.",
        ),
    }
    entry = status_map.get(new_status)
    if entry is None:
        return
    notification_type, title, message = entry
    await crud_notification.create_notification(
        db=db,
        user_id=startup_user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        resource_type="contract",
        resource_id=contract_id,
    )

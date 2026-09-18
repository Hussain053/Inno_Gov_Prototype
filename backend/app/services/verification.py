from typing import Optional, Set


class GovernmentVerificationService:
    """
    Verification service for Government identity registration.
    In production, this service delegates to official government identity providers.
    For hackathon/test environment, uses configured test verification records.
    """
    _VERIFIED_SERVICE_IDS: Set[str] = {
        "GOV-TEST-12345",
        "GOV-TEST-67890",
        "GOV-VERIFIED-001",
        "GOV-ADMIN-TEST",
    }

    @classmethod
    def verify_government_id(cls, government_service_id: str, email: Optional[str] = None) -> bool:
        if not government_service_id or not isinstance(government_service_id, str):
            return False
        clean_id = government_service_id.strip().upper()
        return clean_id in cls._VERIFIED_SERVICE_IDS


class EvaluatorVerificationService:
    """
    Verification service for Evaluator identity registration.
    In production, this service delegates to institutional evaluator invitation/credentials lookup.
    For hackathon/test environment, uses configured test verification records.
    """
    _VERIFIED_SERVICE_IDS: Set[str] = {
        "EVAL-TEST-12345",
        "EVAL-TEST-67890",
        "EVAL-VERIFIED-001",
        "EVAL-INVITE-2026",
    }

    @classmethod
    def verify_evaluator_id(cls, evaluator_service_id: str, email: Optional[str] = None) -> bool:
        if not evaluator_service_id or not isinstance(evaluator_service_id, str):
            return False
        clean_id = evaluator_service_id.strip().upper()
        return clean_id in cls._VERIFIED_SERVICE_IDS

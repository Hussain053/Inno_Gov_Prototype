from datetime import datetime, timezone


def utc_now() -> datetime:
    """
    Return current naive UTC datetime.
    Replaces deprecated datetime.utcnow() in Python 3.12+.
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)

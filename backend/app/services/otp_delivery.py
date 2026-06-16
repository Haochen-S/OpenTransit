import logging

from app.config import settings
from app.services.email_service import send_login_code_email

logger = logging.getLogger(__name__)


def deliver_otp_email(to_email: str, code: str) -> None:
    """Send OTP email outside the request thread (FastAPI BackgroundTasks)."""
    try:
        send_login_code_email(to_email, code)
    except Exception:
        logger.exception("Failed to deliver OTP email to %s", to_email)
        if settings.environment != "development":
            logger.error(
                "OTP for %s remains valid in DB — user may retry if email never arrived",
                to_email,
            )

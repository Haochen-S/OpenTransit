import logging
import smtplib
from email.message import EmailMessage

from app.config import settings

logger = logging.getLogger(__name__)

SMTP_TIMEOUT_SECONDS = 15


def _build_otp_message(to_email: str, code: str) -> EmailMessage:
    message = EmailMessage()
    message["Subject"] = "Your OpenTransit Sydney login code"
    message["From"] = settings.smtp_from
    message["To"] = to_email
    message.set_content(
        f"Your login code is: {code}\n\n"
        f"This code expires in {settings.otp_expire_minutes} minutes.\n"
        "If you did not request this, you can ignore this email."
    )
    return message


def _send_via_smtp(message: EmailMessage) -> None:
    if settings.smtp_use_tls:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_SECONDS) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)
    else:
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=SMTP_TIMEOUT_SECONDS) as smtp:
            smtp.ehlo()
            if settings.smtp_user:
                smtp.login(settings.smtp_user, settings.smtp_password)
            smtp.send_message(message)


def send_login_code_email(to_email: str, code: str) -> None:
    if not settings.smtp_configured():
        if settings.environment == "development":
            logger.warning("SMTP not configured — login code for %s: %s", to_email, code)
            return
        raise RuntimeError("Email service is not configured")

    message = _build_otp_message(to_email, code)
    _send_via_smtp(message)
    logger.info("Login code email sent to %s", to_email)

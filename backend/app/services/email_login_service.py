from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.auth.otp import generate_otp_code, hash_otp, normalize_email, verify_otp
from app.auth.security import create_access_token
from app.config import settings
from app.models import EmailOtpChallenge, EmailOtpSendLog, User
from app.services.captcha_service import verify_captcha

SEND_CODE_MESSAGE = "If this email address is valid, a login code has been sent."


class EmailLoginService:
    def __init__(self, db: Session) -> None:
        self._db = db

    def prepare_otp_delivery(
        self, email: str, captcha_id: str, captcha_answer: str
    ) -> tuple[str, str]:
        """
        Validate captcha, persist OTP + send log, return (email, plain_code) for async delivery.
        Does not block on SMTP.
        """
        if not verify_captcha(captcha_id, captcha_answer):
            raise ValueError("Captcha verification failed")

        normalized = normalize_email(email)
        self._enforce_send_rate_limit(normalized)

        code = generate_otp_code()
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes)

        self._db.query(EmailOtpChallenge).filter(EmailOtpChallenge.email == normalized).delete(
            synchronize_session=False
        )

        self._db.add(
            EmailOtpChallenge(
                email=normalized,
                code_hash=hash_otp(code),
                expires_at=expires_at,
                max_attempts=settings.otp_max_attempts,
            )
        )
        self._db.add(EmailOtpSendLog(email=normalized))
        self._db.commit()

        return normalized, code

    def verify_and_login(self, email: str, code: str) -> tuple[User, str]:
        normalized = normalize_email(email)
        cleaned_code = code.strip()

        if not cleaned_code.isdigit() or len(cleaned_code) != 6:
            raise ValueError("Invalid or expired login code")

        challenge = (
            self._db.query(EmailOtpChallenge)
            .filter(EmailOtpChallenge.email == normalized)
            .order_by(EmailOtpChallenge.created_at.desc())
            .first()
        )

        if challenge is None:
            raise ValueError("Invalid or expired login code")

        now = datetime.now(timezone.utc)
        if challenge.expires_at <= now:
            self._db.delete(challenge)
            self._db.commit()
            raise ValueError("Invalid or expired login code")

        if challenge.attempt_count >= challenge.max_attempts:
            self._db.delete(challenge)
            self._db.commit()
            raise ValueError("Invalid or expired login code")

        if not verify_otp(cleaned_code, challenge.code_hash):
            challenge.attempt_count += 1
            if challenge.attempt_count >= challenge.max_attempts:
                self._db.delete(challenge)
            self._db.commit()
            raise ValueError("Invalid or expired login code")

        self._db.delete(challenge)

        user = self._db.query(User).filter(User.email == normalized).first()
        if user is None:
            user = User(email=normalized, password_hash=None)
            self._db.add(user)
            self._db.flush()

        self._db.commit()
        self._db.refresh(user)

        token = create_access_token(user.email)
        return user, token

    def _enforce_send_rate_limit(self, email: str) -> None:
        since = datetime.now(timezone.utc) - timedelta(hours=1)
        recent_count = (
            self._db.query(EmailOtpSendLog)
            .filter(EmailOtpSendLog.email == email, EmailOtpSendLog.sent_at >= since)
            .count()
        )
        if recent_count >= settings.otp_send_limit_per_hour:
            raise ValueError("Too many code requests. Please try again later.")

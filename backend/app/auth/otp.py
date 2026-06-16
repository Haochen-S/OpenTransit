import hashlib
import hmac
import secrets

from app.config import settings


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_otp(code: str) -> str:
    pepper = settings.otp_pepper_value()
    return hmac.new(pepper.encode(), code.encode("utf-8"), hashlib.sha256).hexdigest()


def verify_otp(code: str, code_hash: str) -> bool:
    expected = hash_otp(code)
    return hmac.compare_digest(expected, code_hash)


def generate_otp_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"

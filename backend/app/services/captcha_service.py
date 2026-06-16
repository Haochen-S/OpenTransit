import random
import secrets
import threading
import time
from dataclasses import dataclass

from app.auth.otp import hash_otp, verify_otp
from app.config import settings


@dataclass
class _CaptchaEntry:
    answer_hash: str
    expires_at: float


_lock = threading.Lock()
_store: dict[str, _CaptchaEntry] = {}


def _purge_expired() -> None:
    now = time.time()
    expired = [key for key, entry in _store.items() if entry.expires_at <= now]
    for key in expired:
        _store.pop(key, None)


def _normalize_answer(value: str) -> str:
    return value.strip().lower().replace(" ", "")


def create_captcha() -> tuple[str, str]:
    """Return (captcha_id, question text)."""
    with _lock:
        _purge_expired()

        kind = random.choice(["math", "chars"])
        if kind == "math":
            a, b = random.randint(2, 12), random.randint(2, 12)
            question = f"What is {a} + {b}?"
            answer = str(a + b)
        else:
            chars = "".join(random.choices("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", k=5))
            question = f"Type these characters: {chars}"
            answer = chars.lower()

        captcha_id = secrets.token_urlsafe(16)
        _store[captcha_id] = _CaptchaEntry(
            answer_hash=hash_otp(_normalize_answer(answer)),
            expires_at=time.time() + settings.captcha_ttl_seconds,
        )
        return captcha_id, question


def verify_captcha(captcha_id: str, captcha_answer: str) -> bool:
    normalized = _normalize_answer(captcha_answer)
    if not normalized:
        return False

    with _lock:
        entry = _store.get(captcha_id)
        if entry is None or entry.expires_at <= time.time():
            _store.pop(captcha_id, None)
            return False

        if not verify_otp(normalized, entry.answer_hash):
            return False

        _store.pop(captcha_id, None)
        return True

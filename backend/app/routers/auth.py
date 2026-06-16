from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models import User
from app.rate_limit import limiter
from app.schemas.auth import (
    CaptchaResponse,
    SendCodeRequest,
    SendCodeResponse,
    TokenResponse,
    UserResponse,
    VerifyCodeRequest,
)
from app.services.captcha_service import create_captcha
from app.services.email_login_service import EmailLoginService, SEND_CODE_MESSAGE
from app.services.otp_delivery import deliver_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/captcha", response_model=CaptchaResponse)
def get_captcha(request: Request):
    captcha_id, question = create_captcha()
    return CaptchaResponse(captcha_id=captcha_id, question=question)


@router.post("/send-code", response_model=SendCodeResponse)
@limiter.limit(settings.rate_limit_auth)
def send_login_code(
    request: Request,
    payload: SendCodeRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = EmailLoginService(db)
    try:
        to_email, code = service.prepare_otp_delivery(
            payload.email, payload.captcha_id, payload.captcha_answer
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    background_tasks.add_task(deliver_otp_email, to_email, code)
    return SendCodeResponse(message=SEND_CODE_MESSAGE)


@router.post("/login", response_model=TokenResponse)
@limiter.limit(settings.rate_limit_auth)
def login_with_code(request: Request, payload: VerifyCodeRequest, db: Session = Depends(get_db)):
    service = EmailLoginService(db)
    try:
        _, token = service.verify_and_login(payload.email, payload.code)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user

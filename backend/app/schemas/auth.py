from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    id: int
    email: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class CaptchaResponse(BaseModel):
    captcha_id: str
    question: str


class SendCodeRequest(BaseModel):
    email: EmailStr
    captcha_id: str = Field(min_length=8, max_length=128)
    captcha_answer: str = Field(min_length=1, max_length=32)


class SendCodeResponse(BaseModel):
    message: str


class VerifyCodeRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")

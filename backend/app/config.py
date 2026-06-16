from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = Field(default="development", description="development or production")
    database_url: str = Field(
        default="postgresql://opentransit:opentransit@db:5432/opentransit",
        description="PostgreSQL connection string (set via DATABASE_URL)",
    )
    jwt_secret: str = Field(min_length=32, description="JWT signing secret (set via JWT_SECRET)")
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24
    tfnsw_api_key: str = Field(default="")
    tfnsw_base_url: str = "https://api.transport.nsw.gov.au/v1/tp"
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:3000,http://frontend:5173",
        description="Comma-separated allowed browser origins (CORS_ORIGINS)",
    )
    rate_limit_enabled: bool = Field(default=True, description="Enable API rate limiting (RATE_LIMIT_ENABLED)")
    rate_limit_default: str = Field(
        default="120/minute",
        description="Default per-IP limit for API routes (RATE_LIMIT_DEFAULT)",
    )
    rate_limit_auth: str = Field(
        default="10/minute",
        description="Per-IP limit for login and register (RATE_LIMIT_AUTH)",
    )
    rate_limit_schedule: str = Field(
        default="90/minute",
        description="Per-IP limit for schedule lookups (RATE_LIMIT_SCHEDULE)",
    )
    trust_proxy_headers: bool = Field(
        default=True,
        description="Use X-Forwarded-For / X-Real-IP for rate-limit keys (TRUST_PROXY_HEADERS)",
    )
    smtp_host: str = Field(default="", description="SMTP server host (SMTP_HOST)")
    smtp_port: int = Field(default=587, description="SMTP server port (SMTP_PORT)")
    smtp_user: str = Field(default="", description="SMTP username (SMTP_USER)")
    smtp_password: str = Field(default="", description="SMTP password (SMTP_PASSWORD)")
    smtp_from: str = Field(default="", description="From email address (SMTP_FROM)")
    smtp_use_tls: bool = Field(default=True, description="Use STARTTLS for SMTP (SMTP_USE_TLS)")
    otp_expire_minutes: int = Field(default=10, description="Login code lifetime (OTP_EXPIRE_MINUTES)")
    otp_max_attempts: int = Field(default=5, description="Max verify attempts per code (OTP_MAX_ATTEMPTS)")
    otp_send_limit_per_hour: int = Field(
        default=5,
        description="Max codes sent per email per hour (OTP_SEND_LIMIT_PER_HOUR)",
    )
    captcha_ttl_seconds: int = Field(default=300, description="Captcha lifetime (CAPTCHA_TTL_SECONDS)")
    otp_pepper: str = Field(
        default="",
        description="Optional HMAC pepper for OTP hashing (OTP_PEPPER); defaults to JWT_SECRET",
    )

    @field_validator("environment")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.strip().lower()

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def smtp_configured(self) -> bool:
        return bool(self.smtp_host.strip() and self.smtp_from.strip())

    def otp_pepper_value(self) -> str:
        return self.otp_pepper.strip() or self.jwt_secret

    def validate_production(self) -> None:
        if self.environment != "production":
            return

        weak_secret_markers = ("replace-with", "changeme", "your-", "example")
        secret_lower = self.jwt_secret.lower()
        if any(marker in secret_lower for marker in weak_secret_markers):
            raise RuntimeError("JWT_SECRET must be a strong unique value in production")

        if not self.tfnsw_api_key.strip():
            raise RuntimeError("TFNSW_API_KEY is required in production")

        if not self.smtp_configured():
            raise RuntimeError("SMTP_HOST and SMTP_FROM are required in production")


settings = Settings()

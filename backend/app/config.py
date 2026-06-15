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

    @field_validator("environment")
    @classmethod
    def normalize_environment(cls, value: str) -> str:
        return value.strip().lower()

    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    def validate_production(self) -> None:
        if self.environment != "production":
            return

        weak_secret_markers = ("replace-with", "changeme", "your-", "example")
        secret_lower = self.jwt_secret.lower()
        if any(marker in secret_lower for marker in weak_secret_markers):
            raise RuntimeError("JWT_SECRET must be a strong unique value in production")

        if not self.tfnsw_api_key.strip():
            raise RuntimeError("TFNSW_API_KEY is required in production")


settings = Settings()

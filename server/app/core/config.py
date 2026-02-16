from pydantic_settings import BaseSettings
from pydantic import computed_field

class Settings(BaseSettings):
    # Cloudinary
    cloudinary_api_key: int
    cloudinary_api_secret: str
    cloudinary_cloud_name: str

    # Auth
    algorithm: str
    secret_key: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int = 7

    #oauth
    client_id : str
    client_secret : str
    redirect_uri : str

    # Database
    db_user: str
    db_password: str
    db_host: str
    db_port: int
    db_name: str

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0
    redis_ssl: bool = False

    # OTP
    otp_expire_seconds: int = 300  # 5 minutes

    # Brevo SMTP (Email)
    brevo_smtp_host: str = "smtp-relay.brevo.com"
    brevo_smtp_port: int = 587
    brevo_smtp_user: str = ""
    brevo_smtp_password: str = ""
    brevo_sender_email: str = "noreply@example.com"
    brevo_sender_name: str = "BookBind"

    @computed_field
    @property
    def cloudinary_url(self) -> str:
        return (
            f"cloudinary://{self.cloudinary_api_key}:"
            f"{self.cloudinary_api_secret}@"
            f"{self.cloudinary_cloud_name}"
        )

    @computed_field
    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.db_user}:"
            f"{self.db_password}@"
            f"{self.db_host}:{self.db_port}/"
            f"{self.db_name}"
        )

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()

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

    # Database
    db_user: str
    db_password: str
    db_host: str
    db_port: int
    db_name: str

    # Brevo SMTP
    brevo_smtp_api_key: str
    brevo_sender_email: str = "noreply@yourcompany.com"
    brevo_login_email: str

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""


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


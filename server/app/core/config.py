from pydantic_settings import BaseSettings
from pydantic import computed_field

class Settings(BaseSettings):
    # Cloudinary
    cloudinary_api_key: str
    cloudinary_api_secret: str
    cloudinary_cloud_name: str

    # Auth
    algorithm: str
    secret_key: str
    refresh_secret_key: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int = 7

    #oauth
    client_id : str
    client_secret : str
    redirect_uri : str

    # Database
    db_url: str | None = None
    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "postgres"

    # Redis
    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_password: str = ""
    redis_db: int = 0
    redis_ssl: bool = False

    # Razorpay (Payment Gateway)
    razorpay_key_id: str = ""
    razorpay_key_secret: str = ""
    razorpay_webhook_secret: str = ""

    # OTP
    otp_expire_seconds: int = 300  # 5 minutes

    # Company Details (invoices, emails, etc.)
    company_name: str = "Navart"
    company_address: str = ""
    company_phone: str = ""
    company_email: str = ""
    company_gstin: str = ""
    company_upi_id: str = ""
    company_website: str = ""

    # Rate Limiter
    rate_limit_requests: int = 200
    rate_limit_window_seconds: int = 60

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173,http://localhost:5174"

    # Brevo API (REST)
    brevo_api_key: str | None = None

    # Brevo SMTP (Email - Fallback)
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

    @property
    def async_database_url(self) -> str:
        if self.db_url:
            url = self.db_url
            # Replace prefix
            if url.startswith("postgresql://"):
                url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
            
            # Remove parameters not supported by asyncpg
            if "?" in url:
                base, params = url.split("?", 1)
                param_list = params.split("&")
                
                # Filter out unsupported params
                # asyncpg uses 'ssl=true/false/...' instead of 'sslmode'
                # but often 'ssl=require' works too if driver handles it.
                # However, for Neon, we often just need to ensure the driver is asyncpg.
                filtered_params = [
                    p for p in param_list 
                    if not p.startswith("sslmode=") and not p.startswith("channel_binding=")
                ]
                
                # Add ssl=require if it was there as sslmode
                if "sslmode=require" in params and not any(p.startswith("ssl=") for p in filtered_params):
                    filtered_params.append("ssl=require")
                
                if filtered_params:
                    url = f"{base}?{'&'.join(filtered_params)}"
                else:
                    url = base
            return url
        
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

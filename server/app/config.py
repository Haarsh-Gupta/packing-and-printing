import os
from pydantic_settings import BaseSettings
from pydantic import computed_field
from dotenv import load_dotenv
load_dotenv()

class Settings(BaseSettings):
    cloudinary_api_key : int = os.getenv("CLOUDINARY_API_KEY")
    cloudinary_api_secret : str = os.getenv("CLOUDINARY_API_SECRET")
    cloudinary_cloud_name : str = os.getenv("CLOUDINARY_CLOUD_NAME")
    algorithm : str = os.getenv("ALGORITHM")
    secret_key : str = os.getenv("SECRET_KEY")
    access_token_expire_minutes : int = os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")
    db_user : str = os.getenv("DB_USER")
    db_password : str = os.getenv("DB_PASSWORD")
    db_host : str = os.getenv("DB_HOST")
    db_port : int = os.getenv("DB_PORT")     
    db_name : str = os.getenv("DB_NAME")


    @computed_field
    @property
    def cloudinary_url(self) -> str:
        return f"cloudinary://{self.cloudinary_api_key}:{self.cloudinary_api_secret}@{self.cloudinary_cloud_name}"
    
    @computed_field
    @property
    def database_url(self) -> str:
        return f"postgresql+asyncpg://{self.db_user}:{self.db_password}@{self.db_host}:{self.db_port}/{self.db_name}"


settings = Settings()

from authlib.integrations.starlette_client import OAuth
from app.core.config import settings

oauth = OAuth()

oauth.register(
    name="google",
    client_id=settings.client_id,
    client_secret=settings.client_secret,
    client_kwargs={"scope": "openid email profile"},
)
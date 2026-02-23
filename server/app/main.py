from fastapi import FastAPI 
from fastapi.responses import HTMLResponse 
from app.core.database import engine , Base , get_db
from app.modules.users.routes import router as user_router
from app.modules.auth.routes import router as auth_router
from app.modules.products.routes import router as product_router
from app.modules.inquiry.routes import router as inquiry_router
from app.modules.services.routes import router as service_router
from app.modules.orders.routes import router as order_router
from app.modules.otps.routes import router as otp_router
from app.modules.uploads.routes import router as upload_router
from app.modules.admin_email.routes import router as admin_email_router
from app.modules.admin_dashboard.routes import router as dashboard_router
from app.modules.payments.routes import router as payment_router
from app.modules.notifications.routes import router as notification_router
from app.modules.tickets.routes import router as ticket_router

from starlette.middleware.sessions import SessionMiddleware

from contextlib import asynccontextmanager
from app import modules
from app.core.config import settings
from app.core.middleware import RateLimitMiddleware

from app.core.database import check_db_connection
from app.core.redis import check_redis_connection, redis_client
from app.core.email.service import check_smtp_connection

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("\n--------- STARTUP CHECKS ---------")

    await check_db_connection()
    await check_redis_connection()
    await check_smtp_connection()
    
    print("----------------------------------\n")
    
    yield
    
    print("Shutting down...")
    await redis_client.close()
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
    allow_origin_regex=r"http://localhost:\d+",
    allow_credentials=True, # Critical for setting the refresh_token cookie!
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(RateLimitMiddleware, limit=200, window=60)
app.add_middleware(SessionMiddleware , secret_key=settings.secret_key)

app.include_router(user_router , prefix="/users" , tags=["Users"])
app.include_router(auth_router , prefix="/auth" , tags=["Authentication"])
app.include_router(product_router , prefix="/products" , tags=["Products"])
app.include_router(inquiry_router , prefix="/inquiries" , tags=["Inquiries"])
app.include_router(service_router , prefix="/services" , tags=["Services"])
app.include_router(order_router , prefix="/orders" , tags=["Orders"])
app.include_router(otp_router , prefix="/otp" , tags=["OTP"])
app.include_router(upload_router, prefix="/upload", tags=["Uploads"])
app.include_router(admin_email_router, prefix="/admin/email", tags=["Admin Email"])
app.include_router(dashboard_router, prefix="/admin/dashboard", tags=["Admin Dashboard"])
app.include_router(payment_router, prefix="/payments", tags=["Payments"])
app.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
app.include_router(ticket_router, prefix="/tickets", tags=["Tickets"])


from app.modules.orders.utils.whatsapp_messenger import link

from fastapi.responses import HTMLResponse

@app.get("/link")
async def get_link():
    return HTMLResponse(
        f"""
        <html>
          <body>
            <h3>Open WhatsApp</h3>
            <a href="{link}" target="_blank">Send Message</a>
          </body>
        </html>
        """
    )


@app.get("/")
async def root():
    return {"message" : "Hello World"}

@app.get("/health")
async def health():
    return {"message" : "I am alive"}

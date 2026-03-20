import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.core.database import engine, check_db_connection
from app.core.middleware import RateLimitMiddleware, UserActivityMiddleware
from app.core.redis import check_redis_connection, redis_client
from app.core.email.service import check_smtp_connection
from app.core.sse import sse_manager
from app.core.websockets import ws_manager
from app.core.task_registry import cancel_all, pending_count


from app.modules.users.routes import router as user_router
from app.modules.users.admin_routes import router as admin_user_router

from app.modules.products.routes import router as product_router
from app.modules.products.admin_routes import router as admin_product_router

from app.modules.inquiry.routes import router as inquiry_router
from app.modules.inquiry.admin_routes import router as admin_inquiry_router

from app.modules.services.routes import router as service_router
from app.modules.services.admin_routes import router as admin_service_router

from app.modules.orders.routes import router as order_router
from app.modules.orders.admin_routes import router as admin_order_router

from app.modules.notifications.routes import router as notification_router
from app.modules.notifications.admin_routes import router as admin_notification_router

from app.modules.tickets.routes import router as ticket_router
from app.modules.tickets.admin_routes import router as admin_ticket_router

from app.modules.reviews.routes import router as review_router
from app.modules.reviews.admin_routes import router as admin_review_router

from app.modules.auth.routes import router as auth_router
from app.modules.otps.routes import router as otp_router
from app.modules.uploads.routes import router as upload_router
from app.modules.admin_email.routes import router as admin_email_router
from app.modules.admin_dashboard.routes import router as dashboard_router
from app.modules.payments.routes import router as payment_router
from app.modules.wishlist.routes import router as wishlist_router
from app.modules.wishlist.admin_routes import router as admin_wishlist_router
from app.modules.events.routes import router as events_router

logger = logging.getLogger("app.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()

    # logger.info("--------- STARTUP CHECKS ---------")
    print("--------- STARTUP CHECKS ---------")
    await check_db_connection()
    await check_redis_connection()
    await check_smtp_connection()
    
    # logger.info("--------- STARTUP COMPLETE ---------")
    print("--------- STARTUP COMPLETE ---------")
    
    yield
    
    # logger.info("--------- SHUTDOWN STARTED ---------")

    await cancel_all(timeout=3.0)

    try:
        print("⏳ Closing Redis client...")
        await asyncio.wait_for(redis_client.aclose(), timeout=2.0)
        print("✅ Redis client closed")
    except Exception as e:
        logger.warning("Redis close error: %s", e)

    try:
        print("⏳ Disposing Database Engine...")
        await asyncio.wait_for(engine.dispose(), timeout=3.0)
        print("✅ Database Engine disposed")
    except Exception as e:
        logger.warning("DB engine dispose error: %s", e)
    
    logger.info("--------- SHUTDOWN COMPLETE ---------")

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
    allow_credentials=True, # Critical for setting the refresh_token cookie!
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(SessionMiddleware, secret_key=settings.secret_key)
app.add_middleware(UserActivityMiddleware)
app.add_middleware(RateLimitMiddleware, limit=200, window=60)
# RateLimitMiddleware is now the outermost — runs first on every request

app.include_router(user_router , prefix="/users" , tags=["Users"])
app.include_router(admin_user_router, prefix="/admin/users", tags=["Admin Users"])

app.include_router(auth_router , prefix="/auth" , tags=["Authentication"])

app.include_router(product_router , prefix="/products" , tags=["Products"])
app.include_router(admin_product_router, prefix="/admin/products", tags=["Admin Products"])

app.include_router(inquiry_router , prefix="/inquiries" , tags=["Inquiries"])
app.include_router(admin_inquiry_router, prefix="/admin/inquiries", tags=["Admin Inquiries"])

app.include_router(service_router , prefix="/services" , tags=["Services"])
app.include_router(admin_service_router, prefix="/admin/services", tags=["Admin Services"])

app.include_router(order_router , prefix="/orders" , tags=["Orders"])
app.include_router(admin_order_router, prefix="/admin/orders", tags=["Admin Orders"])

app.include_router(ticket_router, prefix="/tickets", tags=["Tickets"])
app.include_router(admin_ticket_router, prefix="/admin/tickets", tags=["Admin Tickets"])

app.include_router(review_router, prefix="/reviews", tags=["Reviews"])
app.include_router(admin_review_router, prefix="/admin/reviews", tags=["Admin Reviews"])

app.include_router(wishlist_router, prefix="/wishlist", tags=["Wishlist"])
app.include_router(admin_wishlist_router, prefix="/admin/wishlist", tags=["Admin Wishlist"])

app.include_router(otp_router , prefix="/otp" , tags=["OTP"])
app.include_router(upload_router, prefix="/upload", tags=["Uploads"])
app.include_router(admin_email_router, prefix="/admin/email", tags=["Admin Email"])
app.include_router(dashboard_router, prefix="/admin/dashboard", tags=["Admin Dashboard"])
app.include_router(payment_router, prefix="/payments", tags=["Payments"])
app.include_router(notification_router, prefix="/notifications", tags=["Notifications"])
app.include_router(admin_notification_router, prefix="/admin/notifications", tags=["Admin Notifications"])
app.include_router(events_router, prefix="/events", tags=["SSE Events"])



@app.get("/")
async def root():
    return {"message" : "Hello World"}

@app.get("/health")
async def health():
    return {"message" : "I am alive"}

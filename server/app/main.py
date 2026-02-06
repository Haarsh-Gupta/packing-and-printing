from fastapi import FastAPI , APIRouter,Depends , HTTPException 
from app.db.database import engine , Base , get_db
from app.modules.users.routes import router as user_router
from app.modules.auth.routes import router as auth_router
from app.modules.products.routes import router as product_router
from app.modules.inquiry.routes import router as inquiry_router

from contextlib import asynccontextmanager
from app import modules

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Creating tables ...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    print("Tables created")

app = FastAPI(lifespan=lifespan)

app.include_router(user_router , prefix="/users" , tags=["Users"])
app.include_router(auth_router , prefix="/auth" , tags=["Authentication"])
app.include_router(product_router , prefix="/products" , tags=["Products"])
app.include_router(inquiry_router , prefix="/inquiries" , tags=["Inquiries"])


@app.get("/")
async def root():
    return {"message" : "Hello World"}

@app.get("/health")
async def health():
    return {"message" : "I am alive"}





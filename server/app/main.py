from fastapi import FastAPI , APIRouter,Depends , HTTPException 
from app.db.database import engine , Base , get_db
from app.modules.users.routes import router as user_router
from app.modules.auth.routes import router as auth_router

app = FastAPI()

app.include_router(user_router , prefix="/users" , tags=["Users"])
app.include_router(auth_router , prefix="/auth" , tags=["Authentication"])


@app.get("/")
async def root():
    return {"message" : "Hello World"}

@app.get("/health")
async def health():
    return {"message" : "I am alive"}





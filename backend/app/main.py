from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.database import create_db_and_tables
from .api import auth, tasks, users, rewards
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Family Tasks API",
    description="API for managing family household tasks with credit and rewards system",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://family.triky.app",
        "http://family.triky.app",
        "http://localhost:4110",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    expose_headers=["*"],
)

# Debug middleware for mobile requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    user_agent = request.headers.get("user-agent", "")
    origin = request.headers.get("origin", "")
    logger.info(f"Request: {request.method} {request.url} - Origin: {origin} - User-Agent: {user_agent[:50]}...")

    response = await call_next(request)
    logger.info(f"Response: {response.status_code}")
    return response

# Include routers
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(users.router)
app.include_router(rewards.router)


@app.on_event("startup")
def on_startup():
    create_db_and_tables()


@app.get("/")
def read_root():
    return {"message": "Family Tasks API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

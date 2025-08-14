from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .core.config import settings
from .core.database import create_db_and_tables
from .api import auth, tasks_crud, tasks_management, tasks_admin, users, rewards, photos
from .utils.file_handler import ensure_upload_directories
import logging
import os

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
        "http://localhost:5173",
        "http://127.0.0.1:4110"
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
app.include_router(tasks_crud.router)
app.include_router(tasks_management.router)
app.include_router(tasks_admin.router)
app.include_router(users.router)
app.include_router(rewards.router)
app.include_router(photos.router)

# Mount static files for serving uploaded images
ensure_upload_directories()
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


@app.on_event("startup")
def on_startup():
    create_db_and_tables()
    ensure_upload_directories()


@app.get("/")
def read_root():
    return {"message": "Family Tasks API is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}

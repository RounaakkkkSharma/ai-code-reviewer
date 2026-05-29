from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.vector_store import initialise_knowledge_base
from app.api.routes import health, review

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    initialise_knowledge_base()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="ReviewAI API",
    description="Multi-agent LLM-powered code reviewer",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api/v1")
app.include_router(review.router, prefix="/api/v1")

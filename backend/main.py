from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import logging
import os

from api.routes import analysis, results, stats, reports, status, websocket, insights
from database.connection import engine, Base
from core.detection.model_loader import ModelLoader
from utils.config import settings

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting PCB Anomaly Detection API...")
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.RESULTS_DIR, exist_ok=True)
    ModelLoader.instance().load(settings.MODEL_PATH)
    logger.info("API ready")
    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="PCB Anomaly Detection API",
    description="Computer vision API for detecting PCB defects using YOLOv8",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for results/uploads
if os.path.exists(settings.RESULTS_DIR):
    app.mount("/static/results", StaticFiles(directory=settings.RESULTS_DIR), name="results")
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/static/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Register routers
app.include_router(analysis.router, prefix="/api/v1", tags=["Analysis"])
app.include_router(results.router, prefix="/api/v1", tags=["Results"])
app.include_router(stats.router, prefix="/api/v1", tags=["Stats"])
app.include_router(reports.router, prefix="/api/v1", tags=["Reports"])
app.include_router(status.router, prefix="/api/v1", tags=["Status"])
app.include_router(websocket.router, tags=["WebSocket"])
app.include_router(insights.router, prefix="/api/v1", tags=["insights"])



@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0"}

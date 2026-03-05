from fastapi import APIRouter
from core.detection.model_loader import ModelLoader
import psutil
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status")
def get_status():
    loader = ModelLoader.instance()
    model_status = "online" if loader.is_loaded else "offline"

    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        memory_pct = mem.percent
    except Exception:
        cpu = 0
        memory_pct = 0

    return {
        "api": "online",
        "model": model_status,
        "model_loaded": loader.is_loaded,
        "cpu_percent": cpu,
        "memory_percent": memory_pct,
    }

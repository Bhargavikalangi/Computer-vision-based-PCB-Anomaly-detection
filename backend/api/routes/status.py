from fastapi import APIRouter
import psutil
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/status")
def get_status():
    """API health and host metrics. Detection is OpenCV rule-based (no separate ML model status)."""
    try:
        cpu = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        memory_pct = mem.percent
    except Exception:
        cpu = 0
        memory_pct = 0

    return {
        "api": "online",
        "detection_engine": "OpenCV Rule-Based",
        "cpu_percent": cpu,
        "memory_percent": memory_pct,
    }

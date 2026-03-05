from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
import aiofiles
import os
import uuid
import logging
from pathlib import Path

from database.connection import get_db
from database.schemas.models import Analysis, Defect
from core.detection.pcb_detector import PCBDetector
from core.preprocessing.image_processor import validate_image
from utils.config import settings
from api.middleware.response_models import AnalysisResponse

router = APIRouter()
logger = logging.getLogger(__name__)
detector = PCBDetector()

ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_pcb(
    file: UploadFile = File(...),
    model: str = Form("yolov8n"),
    confidence: float = Form(0.5),
    annotate: bool = Form(True),
    db: Session = Depends(get_db),
):
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(400, f"Unsupported file type: {ext}")

    contents = await file.read()
    valid, msg = validate_image(contents, settings.MAX_FILE_SIZE_MB)
    if not valid:
        raise HTTPException(422, msg)

    file_id = str(uuid.uuid4())
    safe_filename = f"{file_id}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    async with aiofiles.open(upload_path, "wb") as f:
        await f.write(contents)

    # Create pending analysis record
    analysis = Analysis(
        id=file_id,
        filename=file.filename,
        original_path=upload_path,
        status="processing",
        model_used=model,
        confidence_threshold=confidence,
    )
    db.add(analysis)
    db.commit()

    try:
        result = detector.detect(
            image_path=upload_path,
            confidence=confidence,
            model_name=model,
            annotate=annotate,
            result_dir=settings.RESULTS_DIR,
        )

        # Persist defects
        for d in result["defects"]:
            defect = Defect(
                id=d["id"],
                analysis_id=file_id,
                defect_type=d["type"],
                severity=d["severity"],
                confidence=d["confidence"],
                bbox_x=d["bbox"][0], bbox_y=d["bbox"][1],
                bbox_w=d["bbox"][2], bbox_h=d["bbox"][3],
                location_label=d.get("location"),
                description=d.get("description"),
            )
            db.add(defect)

        annotated_url = None
        original_url = f"http://localhost:8000/static/uploads/{Path(upload_path).name}"

        if result.get("annotated_path"):
            fname = Path(result["annotated_path"]).name
            annotated_url = f"http://localhost:8000/static/results/{fname}"

        analysis.status = result["status"]
        analysis.processing_time = result["processing_time"]
        analysis.overall_confidence = result["overall_confidence"]
        analysis.image_width = result["image_width"]
        analysis.image_height = result["image_height"]
        analysis.total_defects = result["total_defects"]
        analysis.annotated_path = result.get("annotated_path")
        db.commit()

        return {**result, "id": file_id, "filename": file.filename, "annotated_image_url": annotated_url}

    except Exception as e:
        logger.error(f"Analysis failed: {e}")
        analysis.status = "error"
        analysis.error_message = str(e)
        db.commit()
        raise HTTPException(500, f"Analysis failed: {str(e)}")

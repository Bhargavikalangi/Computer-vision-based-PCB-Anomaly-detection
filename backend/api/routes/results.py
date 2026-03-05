from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import Optional, List
import logging

from database.connection import get_db
from database.schemas.models import Analysis, Defect

router = APIRouter()
logger = logging.getLogger(__name__)


def analysis_to_dict(analysis: Analysis) -> dict:
    return {
        "id": analysis.id,
        "filename": analysis.filename,
        "status": analysis.status,
        "model_used": analysis.model_used,
        "confidence_threshold": analysis.confidence_threshold,
        "processing_time": analysis.processing_time,
        "overall_confidence": analysis.overall_confidence,
        "image_width": analysis.image_width,
        "image_height": analysis.image_height,
        "total_defects": analysis.total_defects,
        "annotated_image_url": f"http://localhost:8000/static/results/{analysis.id}_annotated.jpg" if analysis.annotated_path else None,
        "original_image_url": f"http://localhost:8000/static/uploads/{Path(analysis.original_path).name}" if analysis.original_path else None,  
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None,
        "defects": [
            {
                "id": d.id,
                "type": d.defect_type,
                "severity": d.severity,
                "confidence": d.confidence,
                "bbox": [d.bbox_x, d.bbox_y, d.bbox_w, d.bbox_h],
                "location": d.location_label,
                "description": d.description,
            } for d in analysis.defects
        ],
    }


@router.get("/results")
def list_results(
    status: Optional[str] = None,
    limit: int = Query(default=20, le=100),
    offset: int = 0,
    sort: str = "desc",
    db: Session = Depends(get_db),
):
    query = db.query(Analysis)
    if status and status != "all":
        query = query.filter(Analysis.status == status)

    order = desc(Analysis.created_at) if sort == "desc" else Analysis.created_at
    total = query.count()
    items = query.order_by(order).offset(offset).limit(limit).all()

    return {
        "total": total,
        "items": [analysis_to_dict(a) for a in items],
        "limit": limit,
        "offset": offset,
    }


@router.get("/results/{analysis_id}")
def get_result(analysis_id: str, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    return analysis_to_dict(analysis)


@router.delete("/results/{analysis_id}")
def delete_result(analysis_id: str, db: Session = Depends(get_db)):
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    db.delete(analysis)
    db.commit()
    return {"message": "Deleted", "id": analysis_id}

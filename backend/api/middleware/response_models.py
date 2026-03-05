from pydantic import BaseModel
from typing import List, Optional


class DefectResponse(BaseModel):
    id: str
    type: str
    severity: str
    confidence: float
    bbox: List[float]
    location: Optional[str] = None
    description: Optional[str] = None


class AnalysisResponse(BaseModel):
    id: str
    filename: str
    status: str
    defects: List[DefectResponse]
    total_defects: int
    processing_time: float
    overall_confidence: float
    image_width: int
    image_height: int
    annotated_image_url: Optional[str] = None
    model_used: str

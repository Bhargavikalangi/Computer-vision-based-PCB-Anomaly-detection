from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, JSON, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from database.connection import Base


def gen_uuid():
    return str(uuid.uuid4())


class AnalysisStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    pass_ = "pass"
    fail = "fail"
    error = "error"


class DefectSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=gen_uuid)
    filename = Column(String(255), nullable=False)
    original_path = Column(String(500))
    annotated_path = Column(String(500))
    status = Column(String(20), default="pending")
    model_used = Column(String(50))
    confidence_threshold = Column(Float, default=0.5)
    processing_time = Column(Float)
    overall_confidence = Column(Float)
    image_width = Column(Integer)
    image_height = Column(Integer)
    total_defects = Column(Integer, default=0)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    defects = relationship("Defect", back_populates="analysis", cascade="all, delete-orphan")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(String, primary_key=True, default=gen_uuid)
    analysis_id = Column(String, ForeignKey("analyses.id"), nullable=False)
    defect_type = Column(String(100), nullable=False)
    severity = Column(String(20))
    confidence = Column(Float)
    bbox_x = Column(Float)
    bbox_y = Column(Float)
    bbox_w = Column(Float)
    bbox_h = Column(Float)
    location_label = Column(String(200))
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    analysis = relationship("Analysis", back_populates="defects")


class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=gen_uuid)
    title = Column(String(255))
    report_type = Column(String(50))
    file_path = Column(String(500))
    file_size = Column(Integer)
    analysis_count = Column(Integer)
    pass_rate = Column(Float)
    date_from = Column(DateTime(timezone=True))
    date_to = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

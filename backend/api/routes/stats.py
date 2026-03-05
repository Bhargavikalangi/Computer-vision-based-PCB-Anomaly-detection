from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from datetime import datetime, timedelta
import logging

from database.connection import get_db
from database.schemas.models import Analysis, Defect

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/stats/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Analysis.id)).scalar() or 0
    passed = db.query(func.count(Analysis.id)).filter(Analysis.status == "pass").scalar() or 0
    failed = db.query(func.count(Analysis.id)).filter(Analysis.status == "fail").scalar() or 0
    total_defects = db.query(func.sum(Analysis.total_defects)).scalar() or 0
    avg_conf = db.query(func.avg(Analysis.overall_confidence)).filter(Analysis.overall_confidence.isnot(None)).scalar() or 0.0

    pass_rate = round((passed / total * 100), 2) if total > 0 else 0.0

    # Last 30 days trend
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    trend_raw = db.execute(text("""
        SELECT DATE(created_at) as day, COUNT(*) as analyses,
               SUM(CASE WHEN status = 'fail' THEN 1 ELSE 0 END) as defective
        FROM analyses
        WHERE created_at >= :start
        GROUP BY DATE(created_at)
        ORDER BY day
    """), {"start": thirty_days_ago}).fetchall()

    trend = [{"day": str(r[0]), "analyses": r[1], "defects": r[2]} for r in trend_raw]

    # Defect type distribution
    dist_raw = db.query(Defect.defect_type, func.count(Defect.id)).group_by(Defect.defect_type).all()
    total_d = sum(c for _, c in dist_raw) or 1
    distribution = [{"name": t, "value": round(c / total_d * 100, 1)} for t, c in dist_raw]

    return {
        "total_analyses": total,
        "pass_count": passed,
        "fail_count": failed,
        "total_defects": total_defects,
        "pass_rate": pass_rate,
        "avg_confidence": round(avg_conf, 2),
        "trend": trend,
        "defect_distribution": distribution,
    }

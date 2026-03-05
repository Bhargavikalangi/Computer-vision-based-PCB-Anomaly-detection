from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from pathlib import Path
import uuid
import os
import logging

from database.connection import get_db
from database.schemas.models import Analysis, Defect, Report
from utils.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


def generate_pdf_report(analyses, report_title, output_path):
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image as RLImage, HRFlowable
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch

        doc = SimpleDocTemplate(output_path, pagesize=letter,
                                leftMargin=0.75*inch, rightMargin=0.75*inch,
                                topMargin=0.75*inch, bottomMargin=0.75*inch)
        styles = getSampleStyleSheet()
        story = []

        # Title
        title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=20, spaceAfter=4)
        story.append(Paragraph(report_title, title_style))
        story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}", styles["Normal"]))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#cccccc"), spaceAfter=12))

        # Summary stats
        total = len(analyses)
        passed = sum(1 for a in analyses if a.status == "pass")
        failed = total - passed
        pass_rate = round(passed / total * 100, 1) if total else 0

        summary_data = [
            ["Total Analyses", "Passed", "Failed", "Pass Rate"],
            [str(total), str(passed), str(failed), f"{pass_rate}%"],
        ]
        t = Table(summary_data, colWidths=[1.5*inch]*4)
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d3748")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#f7fafc")),
            ("ALIGN", (0, 0), (-1, -1), "CENTER"),
            ("FONTSIZE", (0, 0), (-1, 0), 9),
            ("FONTSIZE", (0, 1), (-1, 1), 14),
            ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("TOPPADDING", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ]))
        story.append(t)
        story.append(Spacer(1, 20))

        # Per-analysis sections with annotated images
        for a in analyses:
            story.append(Paragraph(f"Analysis: {a.filename}", styles["Heading2"]))

            status_color = "#48bb78" if a.status == "pass" else "#fc8181"
            meta_text = (
                f"<font color='{status_color}'><b>{a.status.upper()}</b></font> &nbsp;|&nbsp; "
                f"Defects: {a.total_defects or 0} &nbsp;|&nbsp; "
                f"Confidence: {a.overall_confidence or 0:.1f}% &nbsp;|&nbsp; "
                f"Model: {a.model_used or 'N/A'} &nbsp;|&nbsp; "
                f"Time: {a.processing_time or 0:.2f}s"
            )
            story.append(Paragraph(meta_text, styles["Normal"]))
            story.append(Spacer(1, 8))

            # Annotated image
            img_path = a.annotated_path or a.original_path
            if img_path and os.path.exists(str(img_path)):
                try:
                    max_w = 6 * inch
                    max_h = 3.5 * inch
                    from PIL import Image as PILImage
                    with PILImage.open(str(img_path)) as pil_img:
                        iw, ih = pil_img.size
                    ratio = min(max_w / iw, max_h / ih)
                    rl_img = RLImage(str(img_path), width=iw*ratio, height=ih*ratio)
                    story.append(rl_img)
                    story.append(Spacer(1, 8))
                except Exception as e:
                    logger.warning(f"Could not embed image {img_path}: {e}")

            # Defects table for this analysis
            if a.defects:
                defect_data = [["Type", "Severity", "Confidence", "Location"]]
                for d in a.defects:
                    defect_data.append([
                        str(d.defect_type),
                        str(d.severity or "").upper(),
                        f"{d.confidence or 0:.1f}%",
                        str(d.location_label or "N/A"),
                    ])
                dt = Table(defect_data, colWidths=[2.2*inch, 1.1*inch, 1.1*inch, 2.1*inch])
                sev_colors = {"CRITICAL": "#fc8181", "HIGH": "#ed8936", "MEDIUM": "#f6e05e", "LOW": "#48bb78"}
                dt.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#2d3748")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                    ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
                    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9f9f9")]),
                    ("TOPPADDING", (0, 0), (-1, -1), 5),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ]))
                story.append(dt)
            else:
                story.append(Paragraph("✓ No defects detected — PCB passed quality check.", styles["Normal"]))

            story.append(Spacer(1, 16))
            story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#e2e8f0"), spaceAfter=16))

        doc.build(story)
        return True
    except Exception as e:
        logger.error(f"PDF generation error: {e}")
        return False


@router.post("/reports/generate")
def generate_report(payload: dict, db: Session = Depends(get_db)):
    report_type = payload.get("type", "weekly")
    analysis_id = payload.get("analysis_id")
    now = datetime.utcnow()

    if analysis_id:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            raise HTTPException(404, "Analysis not found")
        # Eager load defects
        analysis.defects  
        analyses = [analysis]
        title = f"PCB Inspection Report — {analysis.filename}"
    elif report_type == "monthly":
        date_from = now - timedelta(days=30)
        title = f"Monthly Report — {now.strftime('%B %Y')}"
        analyses = db.query(Analysis).filter(Analysis.created_at >= date_from).all()
    else:
        date_from = now - timedelta(days=7)
        title = f"Weekly Report — {now.strftime('%B %d, %Y')}"
        analyses = db.query(Analysis).filter(Analysis.created_at >= date_from).all()

    if not analyses:
        raise HTTPException(400, "No analyses found for this period")

    report_id = str(uuid.uuid4())
    output_path = os.path.join(settings.RESULTS_DIR, f"report_{report_id}.pdf")
    Path(settings.RESULTS_DIR).mkdir(parents=True, exist_ok=True)

    success = generate_pdf_report(analyses, title, output_path)
    if not success or not os.path.exists(output_path):
        raise HTTPException(500, "Failed to generate PDF")

    size = os.path.getsize(output_path)
    passed = sum(1 for a in analyses if a.status == "pass")
    pass_rate = round(passed / len(analyses) * 100, 1) if analyses else 0.0

    try:
        report = Report(
            id=report_id, title=title, report_type=report_type,
            file_path=output_path, file_size=size,
            analysis_count=len(analyses), pass_rate=pass_rate,
            date_from=now - timedelta(days=7), date_to=now
        )
        db.add(report)
        db.commit()
    except Exception as e:
        logger.warning(f"Could not save report record: {e}")

    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename=f"pcb_report_{report_id[:8]}.pdf",
        headers={"Access-Control-Allow-Origin": "*"}
    )


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(Report).order_by(Report.created_at.desc()).limit(20).all()
    return [
        {
            "id": r.id, "title": r.title, "type": r.report_type,
            "size": r.file_size, "analyses": r.analysis_count,
            "pass_rate": r.pass_rate,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in reports
    ]
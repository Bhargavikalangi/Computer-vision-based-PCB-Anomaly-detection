import cv2
import numpy as np
import time
import uuid
from pathlib import Path
import logging
from typing import List, Dict, Any, Optional

from core.detection.model_loader import ModelLoader
from core.preprocessing.image_processor import preprocess_image, annotate_image

logger = logging.getLogger(__name__)


class PCBDetector:
    def __init__(self):
        self.loader = ModelLoader.instance()

    def detect(self, image_path, confidence=0.5, iou=0.45, model_name="yolov8n", annotate=True, result_dir=None):
        start = time.time()
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot read image: {image_path}")
        h, w = img.shape[:2]
        defects = self._opencv_detect(img, confidence)
        annotated_path = None
        if annotate and result_dir:
            annotated_path = self._save_annotated(img, defects, image_path, result_dir)
        elapsed = round(time.time() - start, 3)
        status = "fail" if defects else "pass"
        avg_conf = float(np.mean([d["confidence"] for d in defects])) if defects else 99.5
        return {
            "status": status,
            "defects": defects,
            "total_defects": len(defects),
            "processing_time": elapsed,
            "overall_confidence": round(avg_conf, 2),
            "image_width": w,
            "image_height": h,
            "annotated_path": annotated_path,
            "model_used": model_name,
        }

    def _opencv_detect(self, img, confidence):
        defects = []
        # Normalize lighting/noise first so dark regions are not over-detected on clean boards.
        proc = preprocess_image(img)
        gray = cv2.cvtColor(proc, cv2.COLOR_BGR2GRAY)
        h, w = img.shape[:2]
        total_area = w * h
        min_conf_pct = float(np.clip(confidence * 100.0, 0.0, 100.0))

        def touches_border(x, y, bw, bh, margin=4):
            return x <= margin or y <= margin or (x + bw) >= (w - margin) or (y + bh) >= (h - margin)

        def overlap_with_tracked(x, y, bw, bh, tracked_boxes, iou_thresh=0.2):
            x2, y2 = x + bw, y + bh
            for tx, ty, tw, th in tracked_boxes:
                tx2, ty2 = tx + tw, ty + th
                ix1, iy1 = max(x, tx), max(y, ty)
                ix2, iy2 = min(x2, tx2), min(y2, ty2)
                iw, ih = max(0, ix2 - ix1), max(0, iy2 - iy1)
                inter = iw * ih
                if inter == 0:
                    continue
                union = (bw * bh) + (tw * th) - inter
                if union > 0 and (inter / union) >= iou_thresh:
                    return True
            return False

        # --- Burn / Char (very dark regions) ---
        burn_thresh = int(np.clip(np.percentile(gray, 7), 18, 60))
        _, burn_mask = cv2.threshold(gray, burn_thresh, 255, cv2.THRESH_BINARY_INV)
        burn_mask = cv2.morphologyEx(burn_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        burn_mask = cv2.morphologyEx(burn_mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        burn_mask = cv2.morphologyEx(burn_mask, cv2.MORPH_DILATE, np.ones((3, 3), np.uint8))
        for cnt in cv2.findContours(burn_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(cnt)
            if area < max(180, total_area * 0.00015) or area > total_area * 0.30:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if touches_border(x, y, bw, bh):
                continue
            hull = cv2.convexHull(cnt)
            hull_area = max(cv2.contourArea(hull), 1.0)
            solidity = area / hull_area
            extent = area / max(float(bw * bh), 1.0)
            if solidity < 0.55 or extent < 0.35:
                continue
            roi = gray[y:y+bh, x:x+bw]
            if roi.size == 0:
                continue
            mean_dark = float(np.mean(roi))
            # Reject normal dark pads/tracks that are not abnormally dark.
            if mean_dark > max(52, burn_thresh + 5):
                continue
            conf_score = round(min(96.0, 62.0 + (area / 700.0) + max(0.0, (55.0 - mean_dark) * 0.7)), 2)
            if conf_score < min_conf_pct:
                continue
            defects.append({
                "id": str(uuid.uuid4()),
                "type": "Burn Damage",
                "severity": "critical" if area > 1500 else "high",
                "confidence": conf_score,
                "bbox": [int(x), int(y), int(bw), int(bh)],
                "location": f"Region ({x+bw//2}, {y+bh//2})",
                "description": "Thermal damage detected. Burnt or charred area indicating overheating or ESD damage.",
            })

        # --- Corrosion / discoloration (brown/rust tones) ---
        hsv = cv2.cvtColor(proc, cv2.COLOR_BGR2HSV)
        rust_mask = cv2.inRange(hsv, np.array([5, 50, 30]), np.array([35, 255, 220]))
        rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        rust_mask = cv2.morphologyEx(rust_mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        tracked = [(d["bbox"][0], d["bbox"][1], d["bbox"][2], d["bbox"][3]) for d in defects]
        for cnt in cv2.findContours(rust_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(cnt)
            if area < max(250, total_area * 0.0002) or area > total_area * 0.25:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if touches_border(x, y, bw, bh):
                continue
            if overlap_with_tracked(x, y, bw, bh, tracked):
                continue
            conf_score = round(min(91.0, 58.0 + area / 550), 2)
            if conf_score < min_conf_pct:
                continue
            defects.append({
                "id": str(uuid.uuid4()),
                "type": "Corrosion",
                "severity": "high" if area > 1200 else "medium",
                "confidence": conf_score,
                "bbox": [int(x), int(y), int(bw), int(bh)],
                "location": f"Region ({x+bw//2}, {y+bh//2})",
                "description": "Corrosion or oxidation detected. Moisture or chemical damage on PCB surface.",
            })
            tracked.append((x, y, bw, bh))

        # --- ESD / Surface damage (high texture variance in dark patches) ---
        esd_thresh = int(np.clip(np.percentile(gray, 12), 25, 75))
        _, dark_mask = cv2.threshold(gray, esd_thresh, 255, cv2.THRESH_BINARY_INV)
        dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, np.ones((8, 8), np.uint8))
        dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        for cnt in cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(cnt)
            if area < max(350, total_area * 0.00025) or area > total_area * 0.22:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if touches_border(x, y, bw, bh):
                continue
            if overlap_with_tracked(x, y, bw, bh, tracked):
                continue
            roi = img[y:y+bh, x:x+bw]
            if roi.size == 0:
                continue
            std_dev = float(np.std(roi))
            mean_dark = float(np.mean(gray[y:y+bh, x:x+bw]))
            if std_dev > 38 and mean_dark < 70:
                conf_score = round(min(92.0, 54.0 + std_dev / 2.2), 2)
                if conf_score < min_conf_pct:
                    continue
                defects.append({
                    "id": str(uuid.uuid4()),
                    "type": "ESD / Surface Damage",
                    "severity": "critical" if std_dev > 60 else "high",
                    "confidence": conf_score,
                    "bbox": [int(x), int(y), int(bw), int(bh)],
                    "location": f"Region ({x+bw//2}, {y+bh//2})",
                    "description": "Electrostatic discharge or surface damage detected. Irregular texture indicating component damage.",
                })
                tracked.append((x, y, bw, bh))

        # --- Physical holes (dark circles) ---
        blurred = cv2.GaussianBlur(gray, (9,9), 2)
        circles = cv2.HoughCircles(blurred, cv2.HOUGH_GRADIENT, dp=1.2, minDist=20,
                                   param1=50, param2=22, minRadius=5, maxRadius=100)
        if circles is not None:
            for (cx, cy, r) in np.round(circles[0,:]).astype(int)[:4]:
                x, y = max(0, int(cx-r)), max(0, int(cy-r))
                bw = int(min(2 * r, w - x))
                bh = int(min(2 * r, h - y))
                if touches_border(x, y, bw, bh):
                    continue
                if overlap_with_tracked(x, y, bw, bh, tracked):
                    continue
                roi = gray[y:y+bh, x:x+bw]
                if roi.size > 0 and np.mean(roi) < 50:
                    conf_score = 87.5
                    if conf_score < min_conf_pct:
                        continue
                    defects.append({
                        "id": str(uuid.uuid4()),
                        "type": "Physical Hole / Puncture",
                        "severity": "critical",
                        "confidence": conf_score,
                        "bbox": [x, y, bw, bh],
                        "location": f"Region ({cx}, {cy})",
                        "description": "Physical hole or puncture. Structural integrity of PCB compromised.",
                    })
                    tracked.append((x, y, bw, bh))

        return defects

    def _save_annotated(self, img, defects, original_path, result_dir):
        Path(result_dir).mkdir(parents=True, exist_ok=True)
        stem = Path(original_path).stem
        out_path = str(Path(result_dir) / f"{stem}_annotated.jpg")
        from core.preprocessing.image_processor import annotate_image
        annotated = annotate_image(img.copy(), defects)
        cv2.imwrite(out_path, annotated)
        return out_path

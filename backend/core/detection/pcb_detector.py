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
        """Initialize detector dependencies (model loader singleton)."""
        self.loader = ModelLoader.instance()

    def detect(self, image_path, confidence=0.5, iou=0.45, model_name="yolov8n", annotate=True, result_dir=None):
        """
        Run full PCB inspection on one image and return a normalized result payload.

        This function reads the image, runs OpenCV-based defect detection, optionally
        saves an annotated image, and returns status/metrics used by the API and UI.
        """
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
        """
        Detect defect candidates using handcrafted OpenCV rules.

        The pipeline checks for burn-like dark regions, corrosion-like color regions,
        ESD/surface texture anomalies, and puncture-like circles. It also applies
        overlap suppression and scene-level sanity filtering to reduce false positives.
        """
        defects = []
        gray_raw = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Preprocess normalizes lighting for corrosion / HSV; use gray from proc for hsv/gray downstream.
        proc = preprocess_image(img)
        gray = cv2.cvtColor(proc, cv2.COLOR_BGR2GRAY)
        hsv = cv2.cvtColor(proc, cv2.COLOR_BGR2HSV)
        h, w = img.shape[:2]
        total_area = w * h
        min_conf_pct = float(np.clip(confidence * 100.0, 0.0, 100.0))

        def touches_border(x, y, bw, bh, margin=4):
            """Return True if a candidate box touches image borders (often artifacts)."""
            return x <= margin or y <= margin or (x + bw) >= (w - margin) or (y + bh) >= (h - margin)

        def overlap_with_tracked(x, y, bw, bh, tracked_boxes, iou_thresh=0.2):
            """Return True if candidate overlaps previous detections by IoU threshold."""
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

        # --- Burn / Char (very dark regions; thresholds on raw gray to match true char/carbon) ---
        burn_thresh = int(np.clip(np.percentile(gray_raw, 7), 18, 60))
        _, burn_mask = cv2.threshold(gray_raw, burn_thresh, 255, cv2.THRESH_BINARY_INV)
        burn_mask = cv2.morphologyEx(burn_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        burn_mask = cv2.morphologyEx(burn_mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
        burn_mask = cv2.morphologyEx(burn_mask, cv2.MORPH_DILATE, np.ones((3, 3), np.uint8))
        max_burn_area = total_area * 0.65
        large_border_ok = max(600.0, total_area * 0.0018)

        def _append_burn(x, y, bw, bh, area, mean_dark, tracked_boxes):
            conf_score = round(min(96.0, 62.0 + (area / 700.0) + max(0.0, (55.0 - mean_dark) * 0.7)), 2)
            if conf_score < min_conf_pct:
                return False
            if overlap_with_tracked(x, y, bw, bh, tracked_boxes):
                return False
            defects.append({
                "id": str(uuid.uuid4()),
                "type": "Burn Damage",
                "severity": "critical" if area > 1500 else "high",
                "confidence": conf_score,
                "bbox": [int(x), int(y), int(bw), int(bh)],
                "location": f"Region ({x+bw//2}, {y+bh//2})",
                "description": "Thermal damage detected. Burnt or charred area indicating overheating or ESD damage.",
            })
            tracked_boxes.append((x, y, bw, bh))
            return True

        burn_tracked = []
        for cnt in cv2.findContours(burn_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(cnt)
            if area < max(180, total_area * 0.00015) or area > max_burn_area:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if touches_border(x, y, bw, bh) and area <= large_border_ok:
                continue
            hull = cv2.convexHull(cnt)
            hull_area = max(cv2.contourArea(hull), 1.0)
            solidity = area / hull_area
            extent = area / max(float(bw * bh), 1.0)
            min_sol = 0.35 if area > 3000 else 0.55
            min_ext = 0.28 if area > 3000 else 0.35
            if solidity < min_sol or extent < min_ext:
                continue
            aspect = bw / max(float(bh), 1.0)
            if (aspect > 2.8 or aspect < 0.35) and area > 800:
                continue
            # Reject regular package-like boxes and pin strips.
            if extent > 0.80 and solidity > 0.90 and area > 500:
                continue
            roi = gray_raw[y:y+bh, x:x+bw]
            if roi.size == 0:
                continue
            mean_dark = float(np.mean(roi))
            # Reject normal dark pads/tracks that are not abnormally dark.
            if mean_dark > max(52, burn_thresh + 5):
                continue
            hsv_roi = hsv[y:y+bh, x:x+bw]
            if hsv_roi.size == 0:
                continue
            h_ch = hsv_roi[..., 0]
            s_ch = hsv_roi[..., 1]
            v_ch = hsv_roi[..., 2]
            rust_like_ratio = float(np.mean((h_ch >= 5) & (h_ch <= 35) & (s_ch >= 45) & (v_ch <= 210)))
            black_plastic_ratio = float(np.mean((s_ch < 35) & (v_ch < 95)))
            if rust_like_ratio < 0.08 and black_plastic_ratio > 0.58 and mean_dark >= 38:
                continue
            bbox_area_ratio = (float(bw * bh)) / float(total_area)
            skip_ring_contrast = (
                mean_dark < 38
                or area > total_area * 0.012
                or bbox_area_ratio > 0.006
            )
            # Candidate should be darker than local neighborhood, not just globally dark.
            pad = 8
            x0, y0 = max(0, x - pad), max(0, y - pad)
            x1, y1 = min(w, x + bw + pad), min(h, y + bh + pad)
            outer = gray[y0:y1, x0:x1]
            if outer.size > roi.size and not skip_ring_contrast:
                ring = outer.copy()
                ring[(y - y0):(y - y0 + bh), (x - x0):(x - x0 + bw)] = 0
                ring_vals = ring[ring > 0]
                if ring_vals.size > 0 and (float(np.mean(ring_vals)) - mean_dark) < 8.0:
                    continue
            _append_burn(x, y, bw, bh, area, mean_dark, burn_tracked)

        # Second pass: fixed low threshold for charcoal / carbonized blobs (large thermal damage)
        _, burn_mask2 = cv2.threshold(gray_raw, 38, 255, cv2.THRESH_BINARY_INV)
        burn_mask2 = cv2.morphologyEx(burn_mask2, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
        burn_mask2 = cv2.morphologyEx(burn_mask2, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        for cnt in cv2.findContours(burn_mask2, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(cnt)
            if area < max(350, total_area * 0.00012) or area > max_burn_area:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if touches_border(x, y, bw, bh) and area <= large_border_ok:
                continue
            hull = cv2.convexHull(cnt)
            hull_area = max(cv2.contourArea(hull), 1.0)
            solidity = area / hull_area
            extent = area / max(float(bw * bh), 1.0)
            if solidity < 0.22 or extent < 0.22:
                continue
            roi = gray_raw[y:y+bh, x:x+bw]
            if roi.size == 0:
                continue
            mean_dark = float(np.mean(roi))
            if mean_dark > 72:
                continue
            _append_burn(x, y, bw, bh, area, mean_dark, burn_tracked)

        # --- Corrosion / discoloration (brown/rust tones) ---
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
            roi_gray_raw = gray_raw[y:y+bh, x:x+bw]
            if roi_gray_raw.size == 0:
                continue
            g_mean = float(np.mean(roi_gray_raw))
            # Corrosion is dull/mottled; skip very dark (burn/char) and bright reflective solder.
            if g_mean < 48 or g_mean > 95:
                continue
            extent = area / max(float(bw * bh), 1.0)
            hull = cv2.convexHull(cnt)
            solidity = area / max(cv2.contourArea(hull), 1.0)
            # Ignore large clean rectangular regions (e.g., LCD display area) that match yellow/brown range.
            if area > 5000 and extent > 0.78 and solidity > 0.90:
                continue
            hsv_roi = hsv[y:y+bh, x:x+bw]
            if hsv_roi.size == 0:
                continue
            mean_v = float(np.mean(hsv_roi[..., 2]))
            mean_s = float(np.mean(hsv_roi[..., 1]))
            # Corrosion tends to be relatively darker and mottled, not bright, uniformly lit yellow.
            if mean_v > 170 and mean_s > 70:
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
        esd_thresh = int(np.clip(np.percentile(gray_raw, 10), 20, 70))
        _, dark_mask = cv2.threshold(gray_raw, esd_thresh, 255, cv2.THRESH_BINARY_INV)
        dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_OPEN, np.ones((8, 8), np.uint8))
        dark_mask = cv2.morphologyEx(dark_mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
        esd_border_ok = total_area * 0.004
        for cnt in cv2.findContours(dark_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)[0]:
            area = cv2.contourArea(cnt)
            if area < max(350, total_area * 0.00025) or area > total_area * 0.38:
                continue
            x, y, bw, bh = cv2.boundingRect(cnt)
            if touches_border(x, y, bw, bh) and area <= esd_border_ok:
                continue
            if overlap_with_tracked(x, y, bw, bh, tracked):
                continue
            roi = img[y:y+bh, x:x+bw]
            if roi.size == 0:
                continue
            std_dev = float(np.std(roi))
            mean_dark = float(np.mean(gray_raw[y:y+bh, x:x+bw]))
            lap = cv2.Laplacian(gray_raw[y:y+bh, x:x+bw], cv2.CV_64F)
            edge_energy = float(np.mean(np.abs(lap)))
            # ESD / scorch: textured damage; very uniform black char is handled by burn pass.
            esd_ok = (std_dev > 38 and mean_dark < 70) or (
                mean_dark < 55 and area > total_area * 0.008 and (std_dev > 28 or edge_energy > 6.5)
            )
            if esd_ok:
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

        # Scene-level sanity filter:
        # If too many small burn hits are produced, this is usually a clean PCB with dark components.
        burn_like = [d for d in defects if d["type"] == "Burn Damage"]
        if len(burn_like) >= 8:
            area_ratios = [(d["bbox"][2] * d["bbox"][3]) / float(total_area) for d in burn_like]
            any_large_burn = any(r >= 0.015 for r in area_ratios)
            if float(np.median(area_ratios)) < 0.0035 and not any_large_burn:
                defects = [d for d in defects if d["type"] not in {"Burn Damage", "ESD / Surface Damage"}]

        return defects

    def _save_annotated(self, img, defects, original_path, result_dir):
        """Save visualization image with drawn defect boxes and labels."""
        Path(result_dir).mkdir(parents=True, exist_ok=True)
        stem = Path(original_path).stem
        out_path = str(Path(result_dir) / f"{stem}_annotated.jpg")
        from core.preprocessing.image_processor import annotate_image
        annotated = annotate_image(img.copy(), defects)
        cv2.imwrite(out_path, annotated)
        return out_path

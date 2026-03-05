import cv2
import numpy as np
from typing import List, Dict, Tuple


SEVERITY_COLORS = {
    "critical": (100, 100, 252),
    "high": (50, 140, 237),
    "medium": (50, 224, 246),
    "low": (120, 187, 72),
}


def preprocess_image(img: np.ndarray, target_size: int = 640) -> np.ndarray:
    """Preprocess PCB image for model inference."""
    # Enhance contrast using CLAHE
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_ch, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l_ch = clahe.apply(l_ch)
    enhanced = cv2.merge([l_ch, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)

    # Denoise
    denoised = cv2.fastNlMeansDenoisingColored(enhanced, None, 6, 6, 7, 21)
    return denoised


def annotate_image(img: np.ndarray, defects: List[Dict]) -> np.ndarray:
    """Draw bounding boxes and labels on image."""
    overlay = img.copy()

    for defect in defects:
        x, y, w, h = [int(v) for v in defect.get("bbox", [0, 0, 50, 50])]
        severity = defect.get("severity", "medium")
        color = SEVERITY_COLORS.get(severity, (200, 200, 200))
        label = f"{defect['type']} {defect['confidence']:.0f}%"

        # Semi-transparent fill
        cv2.rectangle(overlay, (x, y), (x + w, y + h), color, -1)

        # Draw main box
        cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)

        # Corner marks
        corner_len = min(12, w // 4, h // 4)
        for cx, cy in [(x, y), (x + w, y), (x, y + h), (x + w, y + h)]:
            dx = 1 if cx == x else -1
            dy = 1 if cy == y else -1
            cv2.line(img, (cx, cy), (cx + dx * corner_len, cy), color, 3)
            cv2.line(img, (cx, cy), (cx, cy + dy * corner_len), color, 3)

        # Label background
        (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.45, 1)
        cv2.rectangle(img, (x, y - th - 8), (x + tw + 8, y), color, -1)
        cv2.putText(img, label, (x + 4, y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 0, 0), 1, cv2.LINE_AA)

    # Blend overlay
    cv2.addWeighted(overlay, 0.12, img, 0.88, 0, img)
    return img


def validate_image(file_bytes: bytes, max_size_mb: int = 50) -> Tuple[bool, str]:
    """Validate uploaded image file."""
    if len(file_bytes) > max_size_mb * 1024 * 1024:
        return False, f"File exceeds {max_size_mb}MB limit"
    arr = np.frombuffer(file_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return False, "Invalid or corrupted image file"
    h, w = img.shape[:2]
    if w < 64 or h < 64:
        return False, "Image too small (minimum 64x64)"
    return True, "ok"

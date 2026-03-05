import logging
import os
import numpy as np
from typing import Optional

logger = logging.getLogger(__name__)

# Defect classes and their severity mapping
DEFECT_CLASSES = {
    0: {"name": "Solder Bridge", "severity": "critical"},
    1: {"name": "Missing Component", "severity": "high"},
    2: {"name": "Open Circuit", "severity": "medium"},
    3: {"name": "Short Circuit", "severity": "critical"},
    4: {"name": "Tombstone", "severity": "medium"},
    5: {"name": "Lifted Lead", "severity": "high"},
    6: {"name": "Solder Ball", "severity": "low"},
    7: {"name": "Cold Solder", "severity": "medium"},
}

SEVERITY_DESCRIPTIONS = {
    "Solder Bridge": "Two adjacent pads are connected by excess solder, causing a short circuit.",
    "Missing Component": "A component is absent from its designated pad location.",
    "Open Circuit": "A broken trace or insufficient solder joint is preventing electrical continuity.",
    "Short Circuit": "Unintended connection between two conductors at different potentials.",
    "Tombstone": "One end of a component has lifted from the pad during reflow.",
    "Lifted Lead": "A component lead has lifted from the PCB pad.",
    "Solder Ball": "Small sphere of solder present on the board surface.",
    "Cold Solder": "Poor solder joint caused by insufficient heat during reflow.",
}


class ModelLoader:
    _instance: Optional['ModelLoader'] = None
    _model = None
    _loaded: bool = False

    @classmethod
    def instance(cls) -> 'ModelLoader':
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def load(self, model_path: str):
        try:
            from ultralytics import YOLO
            if os.path.exists(model_path):
                self._model = YOLO(model_path)
                logger.info(f"Loaded custom model from {model_path}")
            else:
                # Fallback: download base YOLOv8 and adapt
                logger.warning(f"Model not found at {model_path}, loading base YOLOv8n")
                self._model = YOLO("yolov8n.pt")
            self._loaded = True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            self._model = None
            self._loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._loaded and self._model is not None

    @property
    def model(self):
        return self._model

    def get_class_info(self, class_id: int) -> dict:
        return DEFECT_CLASSES.get(class_id, {"name": f"Defect-{class_id}", "severity": "medium"})

    def get_description(self, defect_name: str) -> str:
        return SEVERITY_DESCRIPTIONS.get(defect_name, "Anomaly detected on PCB surface.")

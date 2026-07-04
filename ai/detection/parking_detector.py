from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO


@dataclass(frozen=True)
class ParkingSlot:
    code: str
    polygon: list[tuple[int, int]]


@dataclass(frozen=True)
class SlotOccupancy:
    code: str
    status: str
    vehicle_confidence: float


class ParkingDetector:
    def __init__(self, model_path: str | Path, confidence: float = 0.45) -> None:
        self.model = YOLO(str(model_path))
        self.confidence = confidence

    def detect_vehicles(self, frame: np.ndarray) -> list[tuple[float, float, float, float, float, str]]:
        results = self.model.predict(frame, conf=self.confidence, verbose=False)
        detections: list[tuple[float, float, float, float, float, str]] = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                label = self.model.names[class_id]
                if label not in {"car", "bus", "truck", "motorcycle"}:
                    continue
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                detections.append((x1, y1, x2, y2, float(box.conf[0]), label))
        return detections

    def classify_slots(self, frame: np.ndarray, slots: list[ParkingSlot]) -> list[SlotOccupancy]:
        vehicles = self.detect_vehicles(frame)
        output: list[SlotOccupancy] = []
        for slot in slots:
            polygon = np.array(slot.polygon, dtype=np.int32)
            best_confidence = 0.0
            for x1, y1, x2, y2, confidence, _ in vehicles:
                center = (int((x1 + x2) / 2), int((y1 + y2) / 2))
                if cv2.pointPolygonTest(polygon, center, False) >= 0:
                    best_confidence = max(best_confidence, confidence)
            output.append(
                SlotOccupancy(
                    code=slot.code,
                    status="occupied" if best_confidence >= self.confidence else "available",
                    vehicle_confidence=round(best_confidence, 4),
                )
            )
        return output

    @staticmethod
    def draw_overlay(frame: np.ndarray, slots: list[ParkingSlot], occupancy: list[SlotOccupancy]) -> np.ndarray:
        status_by_code = {item.code: item.status for item in occupancy}
        annotated = frame.copy()
        for slot in slots:
            color = (0, 0, 255) if status_by_code.get(slot.code) == "occupied" else (0, 180, 0)
            polygon = np.array(slot.polygon, dtype=np.int32)
            cv2.polylines(annotated, [polygon], True, color, 2)
            x, y = polygon[0]
            cv2.putText(annotated, slot.code, (int(x), int(y) - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)
        return annotated

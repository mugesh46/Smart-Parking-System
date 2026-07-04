from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import DetectionBox, DetectionRequest, DetectionResponse, PredictionResponse
from app.services.analytics import forecast


router = APIRouter(prefix="/ai", tags=["AI"])


@router.post("/detect", response_model=DetectionResponse)
def detect(payload: DetectionRequest) -> DetectionResponse:
    # Production deployments should hand this off to the AI worker in ai/detection.
    return DetectionResponse(
        camera_id=payload.camera_id,
        occupied_slots=0,
        available_slots=0,
        detections=[DetectionBox(x1=0, y1=0, x2=0, y2=0, confidence=0, label="placeholder")],
    )


@router.post("/predict", response_model=PredictionResponse)
def predict(horizon_hours: int = 2, db: Session = Depends(get_db)) -> PredictionResponse:
    return forecast(db, horizon_hours)

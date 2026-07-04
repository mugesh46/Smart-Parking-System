from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2, max_length=160)
    password: str = Field(min_length=8)
    phone: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    role: str


class SlotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    level: str
    zone: str
    status: str
    slot_type: str
    latitude: float | None = None
    longitude: float | None = None


class ReservationRequest(BaseModel):
    slot_id: int
    vehicle_id: int | None = None
    starts_at: datetime
    ends_at: datetime


class ReservationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slot_id: int
    starts_at: datetime
    ends_at: datetime
    status: str
    qr_token: str


class DetectionRequest(BaseModel):
    camera_id: int
    frame_url: str | None = None


class DetectionBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float
    label: str


class DetectionResponse(BaseModel):
    camera_id: int
    occupied_slots: int
    available_slots: int
    detections: list[DetectionBox]


class PredictionResponse(BaseModel):
    horizon_hours: int
    expected_occupancy_percent: float
    expected_available_slots: int
    recommendation: str


class DashboardResponse(BaseModel):
    total_slots: int
    available_slots: int
    occupied_slots: int
    reserved_slots: int
    revenue_today: float
    active_reservations: int

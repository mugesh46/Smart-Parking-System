from datetime import date, datetime, time

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ParkingSlot, Payment, Reservation, ReservationStatus, SlotStatus
from app.schemas import DashboardResponse, PredictionResponse


def dashboard(db: Session) -> DashboardResponse:
    total = db.scalar(select(func.count(ParkingSlot.id))) or 0
    available = db.scalar(select(func.count(ParkingSlot.id)).where(ParkingSlot.status == SlotStatus.available.value)) or 0
    occupied = db.scalar(select(func.count(ParkingSlot.id)).where(ParkingSlot.status == SlotStatus.occupied.value)) or 0
    reserved = db.scalar(select(func.count(ParkingSlot.id)).where(ParkingSlot.status == SlotStatus.reserved.value)) or 0
    today_start = datetime.combine(date.today(), time.min)
    revenue = db.scalar(select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.created_at >= today_start, Payment.status == "paid")) or 0
    active_reservations = db.scalar(select(func.count(Reservation.id)).where(Reservation.status == ReservationStatus.active.value)) or 0
    return DashboardResponse(
        total_slots=total,
        available_slots=available,
        occupied_slots=occupied,
        reserved_slots=reserved,
        revenue_today=float(revenue),
        active_reservations=active_reservations,
    )


def forecast(db: Session, horizon_hours: int = 2) -> PredictionResponse:
    metrics = dashboard(db)
    occupied_like = metrics.occupied_slots + metrics.reserved_slots
    occupancy = (occupied_like / metrics.total_slots * 100) if metrics.total_slots else 0.0
    drift = min(12.0, horizon_hours * 2.5)
    expected_occupancy = min(100.0, occupancy + drift)
    expected_available = max(0, round(metrics.total_slots * (1 - expected_occupancy / 100)))
    recommendation = "Reserve now" if expected_occupancy >= 80 else "Availability is healthy"
    return PredictionResponse(
        horizon_hours=horizon_hours,
        expected_occupancy_percent=round(expected_occupancy, 2),
        expected_available_slots=expected_available,
        recommendation=recommendation,
    )

from datetime import datetime
from secrets import token_urlsafe

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import ParkingSlot, Reservation, ReservationStatus, SlotStatus
from app.schemas import ReservationRequest


def list_slots(db: Session, status_filter: str | None = None) -> list[ParkingSlot]:
    query = select(ParkingSlot).order_by(ParkingSlot.level, ParkingSlot.zone, ParkingSlot.code)
    if status_filter:
        query = query.where(ParkingSlot.status == status_filter)
    return list(db.scalars(query))


def reserve_slot(db: Session, user_id: int, payload: ReservationRequest) -> Reservation:
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="ends_at must be after starts_at")

    slot = db.get(ParkingSlot, payload.slot_id)
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Parking slot not found")
    if slot.status not in {SlotStatus.available.value, SlotStatus.reserved.value}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Parking slot is not available")

    overlap = db.scalar(
        select(Reservation).where(
            Reservation.slot_id == payload.slot_id,
            Reservation.status == ReservationStatus.active.value,
            Reservation.starts_at < payload.ends_at,
            Reservation.ends_at > payload.starts_at,
        )
    )
    if overlap:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Parking slot already reserved")

    reservation = Reservation(
        user_id=user_id,
        slot_id=payload.slot_id,
        vehicle_id=payload.vehicle_id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
        qr_token=token_urlsafe(32),
    )
    slot.status = SlotStatus.reserved.value
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    return reservation


def cancel_reservation(db: Session, reservation_id: int, user_id: int) -> None:
    reservation = db.get(Reservation, reservation_id)
    if reservation is None or reservation.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    reservation.status = ReservationStatus.cancelled.value
    slot = db.get(ParkingSlot, reservation.slot_id)
    if slot:
        active_count = db.scalar(
            select(func.count(Reservation.id)).where(
                Reservation.slot_id == reservation.slot_id,
                Reservation.status == ReservationStatus.active.value,
                Reservation.id != reservation_id,
                Reservation.ends_at > datetime.utcnow(),
            )
        )
        if active_count == 0:
            slot.status = SlotStatus.available.value
    db.commit()

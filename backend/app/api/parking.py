from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import User
from app.schemas import ReservationRequest, ReservationResponse, SlotResponse
from app.services.parking import cancel_reservation, list_slots, reserve_slot


router = APIRouter(prefix="/parking", tags=["Parking"])


@router.get("/slots", response_model=list[SlotResponse])
def get_slots(status_filter: str | None = Query(default=None, alias="status"), db: Session = Depends(get_db)):
    return list_slots(db, status_filter)


@router.get("/available", response_model=list[SlotResponse])
def get_available_slots(db: Session = Depends(get_db)):
    return list_slots(db, "available")


@router.post("/reserve", response_model=ReservationResponse, status_code=status.HTTP_201_CREATED)
def create_reservation(
    payload: ReservationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return reserve_slot(db, current_user.id, payload)


@router.delete("/cancel/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(
    reservation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    cancel_reservation(db, reservation_id, current_user.id)

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import get_current_user
from app.models import Payment, Reservation, User


router = APIRouter(prefix="/payments", tags=["Payments"])


class PaymentRequest(BaseModel):
    reservation_id: int
    amount: float = Field(gt=0)
    provider: str = "razorpay"


@router.post("/payment", status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reservation = db.get(Reservation, payload.reservation_id)
    if reservation is None or reservation.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reservation not found")
    payment = Payment(
        reservation_id=payload.reservation_id,
        amount=payload.amount,
        provider=payload.provider,
        status="paid",
        invoice_number=f"INV-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{payload.reservation_id}",
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return {"id": payment.id, "status": payment.status, "invoice_number": payment.invoice_number}


@router.get("/invoice/{payment_id}")
def invoice(payment_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    payment = db.get(Payment, payment_id)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    return {"invoice_number": payment.invoice_number, "amount": payment.amount, "currency": payment.currency}

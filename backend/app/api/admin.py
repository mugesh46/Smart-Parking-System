from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.dependencies import require_admin
from app.models import User
from app.schemas import DashboardResponse
from app.services.analytics import dashboard


router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/dashboard", response_model=DashboardResponse)
def admin_dashboard(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> DashboardResponse:
    return dashboard(db)


@router.get("/reports")
def reports(_: User = Depends(require_admin)) -> dict[str, list[dict[str, str]]]:
    return {"reports": [{"name": "daily"}, {"name": "weekly"}, {"name": "monthly"}]}


@router.get("/revenue")
def revenue(_: User = Depends(require_admin), db: Session = Depends(get_db)) -> dict[str, float]:
    return {"today": dashboard(db).revenue_today}

"""
Engagement Alert routes.

GET  /api/alerts              — list undismissed alerts (JWT required)
POST /api/alerts/{id}/dismiss — mark alert as dismissed
"""

import os
import sys


from fastapi import APIRouter, Depends

from backend import database as db
from backend.auth import get_current_user

router = APIRouter()


@router.get("/alerts")
async def get_alerts(_user: dict = Depends(get_current_user)):
    alerts = db.get_undismissed_alerts()
    return {"alerts": alerts, "count": len(alerts)}


@router.post("/alerts/{alert_id}/dismiss")
async def dismiss_alert(alert_id: int, _user: dict = Depends(get_current_user)):
    db.dismiss_alert(alert_id)
    return {"ok": True, "id": alert_id}

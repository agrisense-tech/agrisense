# routes/alerts.py — Email/SMS alert subscriptions & sending
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models.tables import AlertSubscription
from utils.notifications import send_email_alert, send_sms_alert, LANGUAGE_NAMES

router = APIRouter(prefix="/api", tags=["Alerts"])


@router.post("/alerts/send")
def send_recommendation_alert(
    farmer_name:  str           = Form(...),
    email:        Optional[str] = Form(None),
    phone:        Optional[str] = Form(None),
    crop:         str           = Form(...),
    emoji:        str           = Form("🌾"),
    confidence:   float         = Form(...),
    yield_t_ha:   float         = Form(0.0),
    sowing_window:str           = Form(""),
    risk_alerts:  str           = Form(""),   # JSON string
    language:     str           = Form("en"),
    subscribe:    bool          = Form(False),
    db: Session = Depends(get_db)
):
    """
    Send a crop recommendation via email and/or SMS.
    Optionally subscribe the farmer to future alerts.
    """
    import json
    risks = []
    try:
        risks = json.loads(risk_alerts) if risk_alerts else []
    except Exception:
        pass

    results = {"email_sent": False, "sms_sent": False}

    if email:
        results["email_sent"] = send_email_alert(
            to_email=email, name=farmer_name,
            crop=crop, emoji=emoji,
            confidence=confidence, yield_=yield_t_ha,
            window=sowing_window, risks=risks, lang=language
        )

    if phone:
        results["sms_sent"] = send_sms_alert(
            phone=phone, crop=crop, confidence=confidence,
            window=sowing_window, risks=risks, lang=language
        )

    # Save subscription
    if subscribe and (email or phone):
        existing = db.query(AlertSubscription).filter(
            AlertSubscription.email == email,
            AlertSubscription.crop_name == crop
        ).first()
        if not existing:
            sub = AlertSubscription(
                farmer_name=farmer_name, email=email,
                phone=phone, crop_name=crop,
                language=language, active=True
            )
            db.add(sub)
            db.commit()
            results["subscribed"] = True

    if not results["email_sent"] and not results["sms_sent"]:
        raise HTTPException(status_code=400, detail="No email or phone provided")

    return {**results, "message": "Alert sent successfully!"}


@router.get("/alerts/languages")
def get_languages():
    """Return supported languages."""
    return [{"code": k, "name": v} for k, v in LANGUAGE_NAMES.items()]

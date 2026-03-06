# routes/recommend.py — Phase 3
import json
from fastapi import APIRouter, Depends, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models.tables import Region, Crop, FieldAnalysis, CropHistory
from utils.gps_utils import find_region
from utils.recommender import recommend
from ml.image_model import analyze_field_image, generate_field_outline

router = APIRouter(prefix="/api", tags=["AgriSense"])


@router.post("/analyze")
async def analyze_field(
    latitude:          float          = Form(...),
    longitude:         float          = Form(...),
    nitrogen:          float          = Form(...),
    phosphorus:        float          = Form(...),
    potassium:         float          = Form(...),
    ph:                float          = Form(...),
    water_table_m:     Optional[float]= Form(None),
    soil_moisture_pct: Optional[float]= Form(None),
    farmer_name:       Optional[str]  = Form(None),
    farmer_email:      Optional[str]  = Form(None),
    farmer_phone:      Optional[str]  = Form(None),
    language:          Optional[str]  = Form("en"),
    send_alert:        Optional[str]  = Form("false"),
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=422, detail="Latitude must be between -90 and 90")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=422, detail="Longitude must be between -180 and 180")
    if not (0 <= ph <= 14):
        raise HTTPException(status_code=422, detail="pH must be between 0 and 14")

    region         = find_region(latitude, longitude, db)
    land_type      = None
    image_analysis = None
    field_outline  = []

    if image and image.filename:
        image_bytes    = await image.read()
        image_analysis = analyze_field_image(image_bytes)
        land_type      = image_analysis["land_type"]
        field_outline  = generate_field_outline(image_bytes)

    result = recommend(
        n=nitrogen, p=phosphorus, k=potassium, ph=ph,
        region=region, land_type=land_type,
        water_table_m=water_table_m,
        soil_moisture_pct=soil_moisture_pct,
        db=db
    )

    record = FieldAnalysis(
        latitude=latitude, longitude=longitude,
        nitrogen=nitrogen, phosphorus=phosphorus,
        potassium=potassium, ph=ph,
        water_table_m=water_table_m,
        soil_moisture_pct=soil_moisture_pct,
        land_type=land_type,
        recommended_crop=result["recommended_crop"],
        confidence_score=result["confidence_score"],
        alternative_crops=json.dumps([a["crop"] for a in result["alternative_crops"]]),
        yield_estimate_t_ha=result["yield_estimate_t_ha"],
        sowing_window=result["sowing_window"],
        risk_alerts=json.dumps(result["risk_alerts"]),
        field_outline_coords=json.dumps(field_outline),
        farmer_name=farmer_name,
        farmer_email=farmer_email,
        farmer_phone=farmer_phone,
        language=language or "en",
    )
    db.add(record)
    db.commit()

    # Auto-send alert if requested
    alert_sent = False
    if send_alert == "true" and (farmer_email or farmer_phone):
        from utils.notifications import send_email_alert, send_sms_alert
        if farmer_email:
            send_email_alert(
                to_email=farmer_email, name=farmer_name or "Farmer",
                crop=result["recommended_crop"], emoji=result["emoji"],
                confidence=result["confidence_score"],
                yield_=result["yield_estimate_t_ha"] or 0,
                window=result["sowing_window"],
                risks=result["risk_alerts"],
                lang=language or "en"
            )
            alert_sent = True
        if farmer_phone:
            send_sms_alert(
                phone=farmer_phone, crop=result["recommended_crop"],
                confidence=result["confidence_score"],
                window=result["sowing_window"],
                risks=result["risk_alerts"],
                lang=language or "en"
            )
            alert_sent = True

    response = {
        **result,
        "field_outline_coordinates": field_outline,
        "image_analysis":            image_analysis,
        "alert_sent":                alert_sent,
        "inputs": {
            "latitude": latitude, "longitude": longitude,
            "nitrogen": nitrogen, "phosphorus": phosphorus,
            "potassium": potassium, "ph": ph,
        }
    }
    return JSONResponse(content=response)


@router.get("/regions")
def list_regions(db: Session = Depends(get_db)):
    return [{"id":r.id,"name":r.name,"country":r.country,"climate":r.climate,
             "avg_temp_c":r.avg_temp_c,"avg_rain_mm":r.avg_rain_mm}
            for r in db.query(Region).all()]


@router.get("/crops")
def list_crops(db: Session = Depends(get_db)):
    return [{"id":c.id,"name":c.name,"emoji":c.emoji,"scientific_name":c.scientific_name,
             "ideal_soil":{"n":[c.n_min,c.n_max],"p":[c.p_min,c.p_max],"k":[c.k_min,c.k_max],"ph":[c.ph_min,c.ph_max]},
             "yield_t_ha":c.avg_yield_t_ha}
            for c in db.query(Crop).all()]


@router.get("/health")
def health_check():
    return {"status":"ok","version":"3.0.0"}

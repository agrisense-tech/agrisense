# routes/recommend.py
# ---------------------------------------------------------
# API ROUTES — These are the URLs your frontend calls.
#
# POST /api/analyze      ← Main: send all data, get crop recommendation
# GET  /api/regions      ← List all regions in DB
# GET  /api/crops        ← List all crops in DB
# POST /api/history      ← Farmer reports actual yield
# ---------------------------------------------------------

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
    # Form fields (sent alongside the optional image file)
    latitude:          float = Form(..., description="GPS latitude"),
    longitude:         float = Form(..., description="GPS longitude"),
    nitrogen:          float = Form(..., description="Nitrogen mg/kg"),
    phosphorus:        float = Form(..., description="Phosphorus mg/kg"),
    potassium:         float = Form(..., description="Potassium mg/kg"),
    ph:                float = Form(..., description="Soil pH 0–14"),
    water_table_m:     Optional[float] = Form(None),
    soil_moisture_pct: Optional[float] = Form(None),
    # Optional image upload
    image: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    """
    🌾 MAIN ENDPOINT — Analyze field and recommend the best crop.

    Send a multipart/form-data request with soil data + optional image.
    Returns a full recommendation with confidence score, alternatives,
    rotation plan, risk alerts, and economic analysis.
    """

    # ── Validate inputs ───────────────────────────────────
    if not (-90 <= latitude <= 90):
        raise HTTPException(status_code=422, detail="Latitude must be between -90 and 90")
    if not (-180 <= longitude <= 180):
        raise HTTPException(status_code=422, detail="Longitude must be between -180 and 180")
    if not (0 <= ph <= 14):
        raise HTTPException(status_code=422, detail="pH must be between 0 and 14")

    # ── GPS → Region ──────────────────────────────────────
    region = find_region(latitude, longitude, db)

    # ── Image Analysis ────────────────────────────────────
    land_type      = None
    image_analysis = None
    field_outline  = []

    if image and image.filename:
        image_bytes    = await image.read()
        image_analysis = analyze_field_image(image_bytes)
        land_type      = image_analysis["land_type"]
        field_outline  = generate_field_outline(image_bytes)

    # ── Run Recommendation Engine ─────────────────────────
    result = recommend(
        n=nitrogen, p=phosphorus, k=potassium, ph=ph,
        region=region,
        land_type=land_type,
        water_table_m=water_table_m,
        soil_moisture_pct=soil_moisture_pct,
        db=db
    )

    # ── Save to Database ──────────────────────────────────
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
    )
    db.add(record)
    db.commit()

    # ── Build Response ────────────────────────────────────
    response = {
        **result,
        "field_outline_coordinates": field_outline,
        "image_analysis":            image_analysis,
        "inputs": {
            "latitude": latitude, "longitude": longitude,
            "nitrogen": nitrogen, "phosphorus": phosphorus,
            "potassium": potassium, "ph": ph,
        }
    }

    return JSONResponse(content=response)


@router.get("/regions")
def list_regions(db: Session = Depends(get_db)):
    """Return all regions in the database."""
    regions = db.query(Region).all()
    return [
        {
            "id": r.id, "name": r.name, "country": r.country,
            "climate": r.climate, "avg_temp_c": r.avg_temp_c,
            "avg_rain_mm": r.avg_rain_mm,
        }
        for r in regions
    ]


@router.get("/crops")
def list_crops(db: Session = Depends(get_db)):
    """Return all crops with their ideal soil conditions."""
    crops = db.query(Crop).all()
    return [
        {
            "id": c.id, "name": c.name, "emoji": c.emoji,
            "scientific_name": c.scientific_name,
            "ideal_soil": {"n": [c.n_min, c.n_max], "p": [c.p_min, c.p_max],
                           "k": [c.k_min, c.k_max], "ph": [c.ph_min, c.ph_max]},
            "yield_t_ha": c.avg_yield_t_ha,
        }
        for c in crops
    ]


@router.post("/history")
def report_yield(
    crop_name:     str   = Form(...),
    latitude:      float = Form(...),
    longitude:     float = Form(...),
    season:        str   = Form(...),
    actual_yield:  float = Form(...),
    notes:         Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Farmer reports their actual yield.
    This data improves our ML model over time.
    """
    crop = db.query(Crop).filter(Crop.name == crop_name).first()
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_name}' not found")

    history = CropHistory(
        crop_id=crop.id, latitude=latitude, longitude=longitude,
        season=season, actual_yield=actual_yield, notes=notes
    )
    db.add(history)
    db.commit()

    return {"message": "Yield reported successfully. Thank you for helping improve AgriSense!"}


@router.get("/health")
def health_check():
    """Simple health check — confirms the API is running."""
    return {"status": "ok", "service": "AgriSense API v1.0"}

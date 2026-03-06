# routes/history.py — Farmer history dashboard API
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from database import get_db
from models.tables import CropHistory, Crop, FieldAnalysis

router = APIRouter(prefix="/api", tags=["History"])


@router.get("/history")
def get_history(
    farmer_name: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get all farmer history entries, optionally filtered by name."""
    q = db.query(CropHistory).order_by(CropHistory.reported_at.desc())
    if farmer_name:
        q = q.filter(CropHistory.farmer_name.ilike(f"%{farmer_name}%"))
    entries = q.limit(limit).all()

    result = []
    for h in entries:
        crop = db.query(Crop).filter(Crop.id == h.crop_id).first()
        result.append({
            "id":           h.id,
            "farmer_name":  h.farmer_name,
            "crop":         crop.name if crop else "Unknown",
            "emoji":        crop.emoji if crop else "🌾",
            "season":       h.season,
            "actual_yield": h.actual_yield,
            "profit_actual":h.profit_actual,
            "rating":       h.rating,
            "region_name":  h.region_name,
            "latitude":     h.latitude,
            "longitude":    h.longitude,
            "notes":        h.notes,
            "reported_at":  h.reported_at.isoformat() if h.reported_at else None,
        })
    return result


@router.get("/history/stats")
def history_stats(db: Session = Depends(get_db)):
    """Aggregate stats for the history dashboard."""
    total = db.query(func.count(CropHistory.id)).scalar() or 0
    avg_yield = db.query(func.avg(CropHistory.actual_yield)).scalar()
    avg_profit = db.query(func.avg(CropHistory.profit_actual)).scalar()
    avg_rating = db.query(func.avg(CropHistory.rating)).scalar()

    # Top crops by count
    top_crops_raw = (
        db.query(Crop.name, Crop.emoji, func.count(CropHistory.id).label("count"))
        .join(CropHistory, CropHistory.crop_id == Crop.id)
        .group_by(Crop.name, Crop.emoji)
        .order_by(func.count(CropHistory.id).desc())
        .limit(5)
        .all()
    )
    top_crops = [{"crop": r[0], "emoji": r[1], "count": r[2]} for r in top_crops_raw]

    # Recent analyses count
    analyses_total = db.query(func.count(FieldAnalysis.id)).scalar() or 0

    return {
        "total_reports":     total,
        "analyses_total":    analyses_total,
        "avg_yield_t_ha":    round(avg_yield, 2) if avg_yield else None,
        "avg_profit_usd":    round(avg_profit, 2) if avg_profit else None,
        "avg_rating":        round(avg_rating, 1) if avg_rating else None,
        "top_crops":         top_crops,
    }


@router.post("/history")
def report_yield(
    crop_name:     str            = Form(...),
    farmer_name:   str            = Form(...),
    latitude:      float          = Form(...),
    longitude:     float          = Form(...),
    season:        str            = Form(...),
    actual_yield:  float          = Form(...),
    profit_actual: Optional[float]= Form(None),
    rating:        Optional[int]  = Form(None),
    region_name:   Optional[str]  = Form(None),
    notes:         Optional[str]  = Form(None),
    db: Session = Depends(get_db)
):
    crop = db.query(Crop).filter(Crop.name == crop_name).first()
    if not crop:
        raise HTTPException(status_code=404, detail=f"Crop '{crop_name}' not found")

    h = CropHistory(
        crop_id=crop.id, farmer_name=farmer_name,
        latitude=latitude, longitude=longitude,
        season=season, actual_yield=actual_yield,
        profit_actual=profit_actual,
        rating=max(1, min(5, rating)) if rating else None,
        region_name=region_name, notes=notes,
    )
    db.add(h)
    db.commit()
    return {"message": "Yield reported successfully!", "id": h.id}


@router.delete("/history/{entry_id}")
def delete_history(entry_id: int, db: Session = Depends(get_db)):
    h = db.query(CropHistory).filter(CropHistory.id == entry_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(h)
    db.commit()
    return {"message": "Entry deleted"}

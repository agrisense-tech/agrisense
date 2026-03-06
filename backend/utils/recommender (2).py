# utils/recommender.py
# ---------------------------------------------------------
# The RECOMMENDATION ENGINE.
# Combines signals from multiple sources:
#   1. ML soil model score     (40% weight)
#   2. Region suitability      (35% weight)
#   3. Water availability      (15% weight)
#   4. Land type from image    (10% weight)
#
# Returns a final ranked list of crops with confidence scores.
# ---------------------------------------------------------

import json
from datetime import date
from sqlalchemy.orm import Session
from models.tables import Crop, Region, RegionCrop
from ml.soil_model import predict_crops, CROP_NAMES


# How much each signal influences the final score
WEIGHTS = {
    "soil_ml":  0.40,
    "region":   0.35,
    "water":    0.15,
    "land":     0.10,
}

# Land type bonus per crop
LAND_BONUSES = {
    "fertile": {"Rice": 1.0, "Maize": 0.9, "Sugarcane": 0.9, "Banana": 0.9, "default": 0.8},
    "wet":     {"Rice": 1.0, "Banana": 0.8, "Turmeric": 0.7, "default": 0.4},
    "dry":     {"Groundnut": 0.9, "Cotton": 0.85, "Chickpea": 0.85, "Wheat": 0.8, "default": 0.5},
    "rocky":   {"Chickpea": 0.8, "Groundnut": 0.7, "default": 0.3},
    None:      {"default": 0.7},  # No image provided
}

# Water table depth (meters): deeper = drier field
def water_score(water_table_m: float | None, moisture_pct: float | None, crop_name: str) -> float:
    """
    Score how well the water availability matches the crop.
    Rice loves water; Chickpea hates waterlogging.
    """
    if water_table_m is None and moisture_pct is None:
        return 0.7  # Neutral if no data

    water_loving = {"Rice", "Sugarcane", "Banana", "Turmeric"}
    drought_tolerant = {"Chickpea", "Groundnut", "Cotton", "Wheat"}

    # Moisture score (0-100% → 0-1)
    m = (moisture_pct or 50) / 100

    if crop_name in water_loving:
        # These crops prefer high moisture
        return min(1.0, m * 1.3)
    elif crop_name in drought_tolerant:
        # These crops prefer drier conditions
        return min(1.0, (1 - m) * 1.3)
    else:
        # Neutral — moderate moisture is fine
        return 1.0 - abs(m - 0.5)


def recommend(
    n: float, p: float, k: float, ph: float,
    region: Region | None,
    land_type: str | None,
    water_table_m: float | None,
    soil_moisture_pct: float | None,
    db: Session
) -> dict:
    """
    Main recommendation function.

    Returns:
    {
      "recommended_crop": "Rice",
      "confidence_score": 0.87,
      "emoji": "🌾",
      "yield_estimate_t_ha": 4.0,
      "profit_score": "HIGH",
      "sowing_window": "June 15 – July 10",
      "water_requirement_mm": 1200,
      "harvest_date_estimate": "October 20",
      "rotation_plan": ["Rice", "Green gram", "Rice"],
      "risk_alerts": ["Monitor for Brown Planthopper in June"],
      "alternative_crops": [{"crop": "Maize", "score": 0.71}, ...],
      "region_name": "Tamil Nadu",
    }
    """

    # ── Signal 1: ML Soil Model ───────────────────────────
    soil_scores = predict_crops(n, p, k, ph)
    # Convert to dict for easy lookup: {"Rice": 0.87, ...}
    soil_map = {s["crop"]: s["score"] for s in soil_scores}

    # ── Signal 2: Region Suitability ─────────────────────
    region_map = {}
    if region:
        links = db.query(RegionCrop).filter(RegionCrop.region_id == region.id).all()
        region_map = {link.crop_id: link.suitability for link in links}
        # Get crop_id → name map
        all_crops = db.query(Crop).all()
        crop_id_map = {c.id: c.name for c in all_crops}
        region_scores = {crop_id_map[cid]: score for cid, score in region_map.items()}
    else:
        region_scores = {}

    # ── Land Type Bonuses ─────────────────────────────────
    land_bonus_table = LAND_BONUSES.get(land_type, LAND_BONUSES[None])

    # ── Combine All Signals ───────────────────────────────
    all_crops_db = db.query(Crop).all()
    final_scores = []

    for crop in all_crops_db:
        soil_s   = soil_map.get(crop.name, 0.1)
        region_s = region_scores.get(crop.name, 0.5)  # Default 0.5 if unknown
        water_s  = water_score(water_table_m, soil_moisture_pct, crop.name)
        land_s   = land_bonus_table.get(crop.name, land_bonus_table["default"])

        combined = (
            WEIGHTS["soil_ml"] * soil_s +
            WEIGHTS["region"]  * region_s +
            WEIGHTS["water"]   * water_s +
            WEIGHTS["land"]    * land_s
        )

        final_scores.append({
            "crop":       crop,
            "score":      round(combined, 3),
            "soil_score": soil_s,
        })

    # Sort best first
    final_scores.sort(key=lambda x: x["score"], reverse=True)

    best    = final_scores[0]
    best_c: Crop = best["crop"]

    # ── Build Sowing Window ───────────────────────────────
    month_names = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    sow_start = month_names[best_c.sow_month_start] if best_c.sow_month_start else "N/A"
    sow_end   = month_names[best_c.sow_month_end]   if best_c.sow_month_end   else "N/A"
    sowing_window = f"{sow_start} 15 – {sow_end} 30"

    # ── Harvest Estimate ──────────────────────────────────
    harvest_estimate = "~" + str(best_c.harvest_days or 120) + " days after sowing"

    # ── Profit Score ──────────────────────────────────────
    if best_c.avg_yield_t_ha and best_c.market_price_usd:
        gross = best_c.avg_yield_t_ha * best_c.market_price_usd
        profit_score = "VERY HIGH" if gross > 2000 else ("HIGH" if gross > 800 else "MEDIUM")
    else:
        profit_score = "MEDIUM"

    # ── Rotation Plan (simple 3-season) ───────────────────
    rotation_map = {
        "Rice":      ["Rice", "Green gram", "Rice"],
        "Wheat":     ["Wheat", "Rice", "Chickpea"],
        "Maize":     ["Maize", "Soybean", "Wheat"],
        "Sugarcane": ["Sugarcane", "Sugarcane", "Legume (rest)"],
        "Cotton":    ["Cotton", "Chickpea", "Sorghum"],
        "Soybean":   ["Soybean", "Wheat", "Maize"],
        "Groundnut": ["Groundnut", "Maize", "Groundnut"],
        "Chickpea":  ["Chickpea", "Wheat", "Mustard"],
        "Banana":    ["Banana", "Banana", "Turmeric (intercrop)"],
        "Turmeric":  ["Turmeric", "Ginger", "Maize"],
    }
    rotation_plan = rotation_map.get(best_c.name, [best_c.name, "Legume", best_c.name])

    # ── Risk Alerts ───────────────────────────────────────
    pest_risks = {
        "Rice":     "Monitor for Brown Planthopper during monsoon season",
        "Wheat":    "Watch for Yellow Rust fungus in humid weather",
        "Maize":    "Fall Armyworm risk — check leaves weekly",
        "Cotton":   "Bollworm pressure high in August–September",
        "Sugarcane": "Pyrilla pest risk after harvest — field hygiene important",
    }
    risk_alerts = []
    if best_c.name in pest_risks:
        risk_alerts.append(pest_risks[best_c.name])
    if ph < 5.5:
        risk_alerts.append("Acidic soil detected — consider lime application before sowing")
    if ph > 8.0:
        risk_alerts.append("Alkaline soil — gypsum or sulfur treatment recommended")
    if n < 40:
        risk_alerts.append("Low Nitrogen — apply urea or compost 3 weeks before sowing")

    # ── Alternative Crops ─────────────────────────────────
    alternatives = [
        {"crop": s["crop"].name, "score": s["score"], "emoji": s["crop"].emoji}
        for s in final_scores[1:4]
    ]

    return {
        "recommended_crop":      best_c.name,
        "scientific_name":       best_c.scientific_name,
        "emoji":                 best_c.emoji,
        "confidence_score":      best["score"],
        "yield_estimate_t_ha":   best_c.avg_yield_t_ha,
        "profit_score":          profit_score,
        "sowing_window":         sowing_window,
        "harvest_estimate":      harvest_estimate,
        "water_requirement_mm":  best_c.water_req_mm,
        "rotation_plan":         rotation_plan,
        "risk_alerts":           risk_alerts,
        "alternative_crops":     alternatives,
        "region_name":           region.name if region else "Unknown Region",
        "climate":               region.climate if region else None,
    }

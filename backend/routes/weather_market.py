# routes/weather_market.py
# ---------------------------------------------------------
# New Phase 2 API endpoints:
#   GET /api/weather?lat=&lon=     → current weather + forecast
#   GET /api/market/{crop_name}    → price + profit data
#   GET /api/market/compare?crops= → compare multiple crops
# ---------------------------------------------------------

from fastapi import APIRouter, Query, HTTPException
from utils.weather import get_current_weather, get_forecast, get_weather_suitability
from utils.market import get_market_data, calculate_profit

router = APIRouter(prefix="/api", tags=["Weather & Market"])


@router.get("/weather")
def weather(
    lat: float = Query(..., description="Latitude"),
    lon: float = Query(..., description="Longitude"),
    crop: str  = Query(None, description="Optional crop name for suitability score"),
):
    """
    Get current weather + 7-day forecast for a location.
    Optionally pass a crop name to get a weather suitability score.
    """
    current  = get_current_weather(lat, lon)
    forecast = get_forecast(lat, lon)

    result = {
        "current":  current,
        "forecast": forecast,
    }

    # Add crop suitability if crop name provided
    if crop:
        result["crop_suitability"] = get_weather_suitability(current, crop)

    return result


@router.get("/market/{crop_name}")
def market(
    crop_name: str,
    area_hectares: float = Query(1.0, description="Farm area in hectares"),
    yield_t_ha: float    = Query(None, description="Override yield estimate"),
):
    """
    Get market price data and profit calculation for a crop.
    """
    # Capitalize first letter to match our database
    crop_name = crop_name.strip().title()

    market_data = get_market_data(crop_name)
    profit_data = calculate_profit(crop_name, area_hectares, yield_t_ha)

    return {
        "crop":   crop_name,
        "market": market_data,
        "profit": profit_data,
    }


@router.get("/market-compare")
def market_compare(
    crops: str = Query(..., description="Comma-separated crop names e.g. Rice,Wheat,Maize"),
    area_hectares: float = Query(1.0),
):
    """
    Compare market data for multiple crops side by side.
    Useful for showing the results dashboard alternatives.
    """
    crop_list = [c.strip().title() for c in crops.split(",")]

    if len(crop_list) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 crops for comparison")

    comparison = []
    for crop in crop_list:
        market = get_market_data(crop)
        profit = calculate_profit(crop, area_hectares)
        comparison.append({
            "crop":        crop,
            "price":       market.get("price_usd_per_tonne"),
            "trend":       market.get("trend_label"),
            "demand":      market.get("demand_label"),
            "net_profit":  profit.get("net_profit"),
            "roi_pct":     profit.get("roi_pct"),
            "grade":       profit.get("profit_grade"),
        })

    # Sort by net profit
    comparison.sort(key=lambda x: x["net_profit"] or 0, reverse=True)
    return {"comparison": comparison, "area_hectares": area_hectares}

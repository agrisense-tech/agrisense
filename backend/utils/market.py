# utils/market.py
# ---------------------------------------------------------
# Crop market prices and profit calculator.
#
# In production, connect to:
#   - agmarknet.gov.in (India)
#   - USDA APIs (USA)
#   - FAO data feeds (global)
#
# For now we use a well-researched static database
# with realistic 2024-2025 prices.
# ---------------------------------------------------------

from datetime import datetime

# Price per tonne in USD (approximate 2024-2025 values)
# Format: crop_name → {price, trend, demand, notes}
MARKET_DATA = {
    "Rice": {
        "price_usd_per_tonne": 420,
        "price_inr_per_quintal": 2200,
        "trend": "stable",          # up / down / stable
        "demand": "very_high",      # very_high / high / medium / low
        "export_potential": True,
        "notes": "Staple crop — always strong domestic demand. Export restrictions may apply.",
        "price_history": [390, 400, 405, 415, 420],  # Last 5 months
    },
    "Wheat": {
        "price_usd_per_tonne": 240,
        "price_inr_per_quintal": 2275,
        "trend": "up",
        "demand": "very_high",
        "export_potential": True,
        "notes": "MSP-supported crop in India. Consistent government procurement.",
        "price_history": [210, 220, 228, 235, 240],
    },
    "Maize": {
        "price_usd_per_tonne": 185,
        "price_inr_per_quintal": 1850,
        "trend": "up",
        "demand": "high",
        "export_potential": True,
        "notes": "Growing demand from poultry feed and ethanol industries.",
        "price_history": [160, 168, 172, 180, 185],
    },
    "Sugarcane": {
        "price_usd_per_tonne": 38,
        "price_inr_per_quintal": 315,
        "trend": "stable",
        "demand": "high",
        "export_potential": False,
        "notes": "FRP (Fair Remunerative Price) set by government. Mill payment delays common.",
        "price_history": [35, 36, 37, 37, 38],
    },
    "Soybean": {
        "price_usd_per_tonne": 490,
        "price_inr_per_quintal": 4600,
        "trend": "down",
        "demand": "high",
        "export_potential": True,
        "notes": "Global prices softening due to Brazil surplus. Oil extraction demand stable.",
        "price_history": [540, 525, 510, 498, 490],
    },
    "Cotton": {
        "price_usd_per_tonne": 1650,
        "price_inr_per_quintal": 6620,
        "trend": "stable",
        "demand": "high",
        "export_potential": True,
        "notes": "Textile industry demand steady. MSP protection available.",
        "price_history": [1600, 1620, 1640, 1645, 1650],
    },
    "Groundnut": {
        "price_usd_per_tonne": 1050,
        "price_inr_per_quintal": 5550,
        "trend": "up",
        "demand": "high",
        "export_potential": True,
        "notes": "Rising demand for groundnut oil. Good export market to Southeast Asia.",
        "price_history": [980, 995, 1010, 1030, 1050],
    },
    "Chickpea": {
        "price_usd_per_tonne": 870,
        "price_inr_per_quintal": 5440,
        "trend": "up",
        "demand": "very_high",
        "export_potential": True,
        "notes": "Dal prices rising. High protein demand driving strong market.",
        "price_history": [800, 820, 840, 858, 870],
    },
    "Banana": {
        "price_usd_per_tonne": 820,
        "price_inr_per_quintal": 1500,
        "trend": "stable",
        "demand": "very_high",
        "export_potential": True,
        "notes": "Year-round demand. Cavendish variety best for export markets.",
        "price_history": [800, 805, 810, 815, 820],
    },
    "Turmeric": {
        "price_usd_per_tonne": 1400,
        "price_inr_per_quintal": 13500,
        "trend": "up",
        "demand": "high",
        "export_potential": True,
        "notes": "Global health food trend boosting demand. Good export to USA and Europe.",
        "price_history": [1100, 1180, 1250, 1330, 1400],
    },
}

DEMAND_LABELS = {
    "very_high": "🔥 Very High",
    "high":      "📈 High",
    "medium":    "➡ Medium",
    "low":       "📉 Low",
}

TREND_LABELS = {
    "up":     "↑ Rising",
    "down":   "↓ Falling",
    "stable": "→ Stable",
}


def get_market_data(crop_name: str) -> dict:
    """Get full market data for a crop."""
    data = MARKET_DATA.get(crop_name)
    if not data:
        return {
            "price_usd_per_tonne": 300,
            "trend": "stable",
            "demand": "medium",
            "notes": "Market data not available for this crop.",
            "price_history": [300, 300, 300, 300, 300],
        }
    return {
        **data,
        "trend_label":  TREND_LABELS.get(data["trend"], "→ Stable"),
        "demand_label": DEMAND_LABELS.get(data["demand"], "➡ Medium"),
        "last_updated": datetime.now().strftime("%B %Y"),
    }


def calculate_profit(
    crop_name: str,
    area_hectares: float = 1.0,
    yield_t_ha: float = None,
) -> dict:
    """
    Calculate estimated profit for growing a crop.

    Args:
        crop_name:       e.g. "Rice"
        area_hectares:   farm size in hectares (default 1)
        yield_t_ha:      override yield estimate

    Returns full profit breakdown.
    """
    market = MARKET_DATA.get(crop_name, {})

    # Input costs per hectare (USD) — approximate Indian averages
    input_costs = {
        "Rice":      {"seeds": 40,  "fertilizer": 80,  "labor": 120, "irrigation": 60,  "other": 40},
        "Wheat":     {"seeds": 35,  "fertilizer": 70,  "labor": 90,  "irrigation": 50,  "other": 30},
        "Maize":     {"seeds": 50,  "fertilizer": 75,  "labor": 80,  "irrigation": 40,  "other": 25},
        "Sugarcane": {"seeds": 80,  "fertilizer": 120, "labor": 200, "irrigation": 100, "other": 60},
        "Soybean":   {"seeds": 45,  "fertilizer": 60,  "labor": 70,  "irrigation": 30,  "other": 20},
        "Cotton":    {"seeds": 60,  "fertilizer": 90,  "labor": 150, "irrigation": 70,  "other": 50},
        "Groundnut": {"seeds": 70,  "fertilizer": 65,  "labor": 100, "irrigation": 45,  "other": 30},
        "Chickpea":  {"seeds": 40,  "fertilizer": 50,  "labor": 60,  "irrigation": 20,  "other": 20},
        "Banana":    {"seeds": 100, "fertilizer": 150, "labor": 250, "irrigation": 120, "other": 80},
        "Turmeric":  {"seeds": 120, "fertilizer": 100, "labor": 200, "irrigation": 80,  "other": 60},
    }

    costs      = input_costs.get(crop_name, {"seeds": 50, "fertilizer": 80, "labor": 100, "irrigation": 50, "other": 30})
    total_cost = sum(costs.values()) * area_hectares

    # Revenue
    price      = market.get("price_usd_per_tonne", 300)
    default_yields = {
        "Rice": 4.0, "Wheat": 3.0, "Maize": 5.0, "Sugarcane": 65,
        "Soybean": 2.5, "Cotton": 1.5, "Groundnut": 2.0,
        "Chickpea": 1.2, "Banana": 25, "Turmeric": 8.0,
    }
    y          = yield_t_ha or default_yields.get(crop_name, 3.0)
    total_yield  = y * area_hectares
    revenue      = total_yield * price
    profit       = revenue - total_cost
    roi_pct      = round((profit / total_cost) * 100, 1) if total_cost > 0 else 0

    return {
        "crop":             crop_name,
        "area_hectares":    area_hectares,
        "yield_tonnes":     round(total_yield, 2),
        "price_per_tonne":  price,
        "gross_revenue":    round(revenue, 2),
        "total_cost":       round(total_cost, 2),
        "net_profit":       round(profit, 2),
        "roi_pct":          roi_pct,
        "cost_breakdown":   {k: round(v * area_hectares, 2) for k, v in costs.items()},
        "profit_grade":     "A" if roi_pct > 80 else ("B" if roi_pct > 40 else ("C" if roi_pct > 10 else "D")),
        "currency":         "USD",
    }

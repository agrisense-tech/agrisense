# utils/weather.py
# ---------------------------------------------------------
# Fetches real weather data from OpenWeatherMap API.
# Free tier allows 1000 calls/day — plenty for development.
#
# Provides:
#   - Current weather (temp, humidity, rainfall, wind)
#   - 5-day forecast
#   - Seasonal suitability score for crops
# ---------------------------------------------------------

import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Get API key from .env file
WEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
WEATHER_BASE    = "https://api.openweathermap.org/data/2.5"


def get_current_weather(lat: float, lon: float) -> dict:
    """
    Fetch current weather for a GPS location.

    Returns:
    {
      "temp_c": 28.5,
      "feels_like_c": 31.0,
      "humidity_pct": 72,
      "rainfall_mm": 3.2,        # Last 1 hour
      "wind_kmh": 12.4,
      "description": "light rain",
      "city": "Chennai",
      "country": "IN",
      "icon": "10d"
    }
    """
    if not WEATHER_API_KEY:
        return _mock_weather(lat, lon)

    try:
        url    = f"{WEATHER_BASE}/weather"
        params = {
            "lat":   lat,
            "lon":   lon,
            "appid": WEATHER_API_KEY,
            "units": "metric",   # Celsius
        }
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        return {
            "temp_c":       round(data["main"]["temp"], 1),
            "feels_like_c": round(data["main"]["feels_like"], 1),
            "humidity_pct": data["main"]["humidity"],
            "rainfall_mm":  data.get("rain", {}).get("1h", 0.0),
            "wind_kmh":     round(data["wind"]["speed"] * 3.6, 1),
            "description":  data["weather"][0]["description"].title(),
            "city":         data.get("name", "Unknown"),
            "country":      data["sys"].get("country", ""),
            "icon":         data["weather"][0]["icon"],
            "source":       "live",
        }

    except Exception as e:
        print(f"Weather API error: {e} — using mock data")
        return _mock_weather(lat, lon)


def get_forecast(lat: float, lon: float) -> list[dict]:
    """
    Fetch 5-day / 3-hour forecast.
    Returns one entry per day (noon reading).

    Returns list of:
    {
      "date": "2025-06-15",
      "day": "Mon",
      "temp_c": 29.0,
      "humidity_pct": 70,
      "rainfall_mm": 5.2,
      "description": "Moderate Rain",
      "icon": "10d"
    }
    """
    if not WEATHER_API_KEY:
        return _mock_forecast()

    try:
        url    = f"{WEATHER_BASE}/forecast"
        params = {
            "lat":   lat,
            "lon":   lon,
            "appid": WEATHER_API_KEY,
            "units": "metric",
            "cnt":   40,   # 5 days × 8 readings per day
        }
        resp = requests.get(url, params=params, timeout=5)
        resp.raise_for_status()
        data = resp.json()

        # Pick one reading per day (the noon one)
        days_seen = set()
        forecast  = []
        day_names = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

        for item in data["list"]:
            from datetime import datetime
            dt   = datetime.fromtimestamp(item["dt"])
            date = dt.strftime("%Y-%m-%d")

            if date in days_seen:
                continue
            if dt.hour < 11 or dt.hour > 14:
                continue

            days_seen.add(date)
            forecast.append({
                "date":         date,
                "day":          day_names[dt.weekday()],
                "temp_c":       round(item["main"]["temp"], 1),
                "humidity_pct": item["main"]["humidity"],
                "rainfall_mm":  round(item.get("rain", {}).get("3h", 0.0), 1),
                "description":  item["weather"][0]["description"].title(),
                "icon":         item["weather"][0]["icon"],
            })

            if len(forecast) >= 7:
                break

        return forecast

    except Exception as e:
        print(f"Forecast API error: {e} — using mock data")
        return _mock_forecast()


def get_weather_suitability(weather: dict, crop_name: str) -> dict:
    """
    Score how well the current weather suits a specific crop.
    Returns a score 0.0–1.0 and a human-readable comment.
    """
    temp     = weather.get("temp_c", 25)
    humidity = weather.get("humidity_pct", 60)

    # Ideal weather ranges per crop
    ideal = {
        "Rice":      {"temp": (20, 35), "humidity": (60, 90)},
        "Wheat":     {"temp": (10, 25), "humidity": (40, 70)},
        "Maize":     {"temp": (18, 33), "humidity": (50, 80)},
        "Sugarcane": {"temp": (20, 35), "humidity": (65, 90)},
        "Soybean":   {"temp": (20, 32), "humidity": (50, 80)},
        "Cotton":    {"temp": (21, 37), "humidity": (40, 70)},
        "Groundnut": {"temp": (22, 35), "humidity": (45, 75)},
        "Chickpea":  {"temp": (10, 29), "humidity": (30, 65)},
        "Banana":    {"temp": (22, 35), "humidity": (65, 90)},
        "Turmeric":  {"temp": (22, 35), "humidity": (60, 85)},
    }

    ranges  = ideal.get(crop_name, {"temp": (15, 35), "humidity": (40, 80)})
    t_min, t_max = ranges["temp"]
    h_min, h_max = ranges["humidity"]

    # Score temperature fit
    if t_min <= temp <= t_max:
        temp_score = 1.0
    else:
        gap        = min(abs(temp - t_min), abs(temp - t_max))
        temp_score = max(0, 1.0 - gap / 10)

    # Score humidity fit
    if h_min <= humidity <= h_max:
        hum_score = 1.0
    else:
        gap       = min(abs(humidity - h_min), abs(humidity - h_max))
        hum_score = max(0, 1.0 - gap / 20)

    score = round((temp_score * 0.6 + hum_score * 0.4), 2)

    # Generate comment
    if score >= 0.8:
        comment = f"Excellent weather conditions for {crop_name}"
    elif score >= 0.6:
        comment = f"Good conditions — minor adjustments may help {crop_name} yield"
    elif score >= 0.4:
        comment = f"Marginal conditions — consider irrigation or shade for {crop_name}"
    else:
        comment = f"Challenging weather for {crop_name} — risk of poor yield"

    return {"score": score, "comment": comment}


# ── Mock data (used when no API key is set) ───────────────
def _mock_weather(lat: float, lon: float) -> dict:
    """Returns realistic mock weather based on latitude."""
    temp = 28 if lat < 25 else (22 if lat < 35 else 15)
    return {
        "temp_c":       temp,
        "feels_like_c": temp + 2,
        "humidity_pct": 68,
        "rainfall_mm":  2.4,
        "wind_kmh":     14.0,
        "description":  "Partly Cloudy",
        "city":         "Your Location",
        "country":      "",
        "icon":         "02d",
        "source":       "mock — add OPENWEATHER_API_KEY to .env for live data",
    }


def _mock_forecast() -> list[dict]:
    """Returns a realistic 7-day mock forecast."""
    from datetime import datetime, timedelta
    days      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    icons     = ["02d","10d","10d","01d","01d","02d","10d"]
    descs     = ["Partly Cloudy","Light Rain","Moderate Rain",
                 "Sunny","Clear Sky","Partly Cloudy","Heavy Rain"]
    temps     = [29, 27, 26, 32, 33, 30, 25]
    rains     = [1.0, 8.5, 15.0, 0.0, 0.0, 2.0, 22.0]
    forecast  = []

    for i in range(7):
        dt = datetime.now() + timedelta(days=i)
        forecast.append({
            "date":         dt.strftime("%Y-%m-%d"),
            "day":          days[dt.weekday()],
            "temp_c":       temps[i],
            "humidity_pct": 65 + i * 2,
            "rainfall_mm":  rains[i],
            "description":  descs[i],
            "icon":         icons[i],
        })

    return forecast

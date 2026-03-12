# main.py — Phase 3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from dotenv import load_dotenv
load_dotenv()

from database import engine, Base
from routes.recommend import router as recommend_router
from routes.weather_market import router as weather_router
from routes.history import router as history_router
from routes.alerts import router as alerts_router
from routes.auth import router as auth_router
from models.user import User
from ml.soil_model import train_model
import os, logging

logging.basicConfig(level=logging.INFO)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="🌱 AgriSense API",
    description="Smart Crop Recommendation System — Phase 3",
    version="3.0.0",
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:5173",
    "https://agrisense-lemon.vercel.app",
    "https://agrisense-git-main-agrisense-techs-projects.vercel.app",
    os.getenv("FRONTEND_URL", "")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(recommend_router)
app.include_router(weather_router)
app.include_router(history_router)
app.include_router(alerts_router)
app.include_router(auth_router)


@app.on_event("startup")
async def startup_event():
    print("🌱 AgriSense API v3.0 starting up...")
    if not os.path.exists(os.path.join("ml", "soil_model.pkl")):
        print("Training ML model...")
        train_model()
    weather_key = os.getenv("OPENWEATHER_API_KEY", "")
    print(f"{'✅' if weather_key else '⚠'} Weather API: {'Connected' if weather_key else 'Mock mode'}")
    smtp = os.getenv("SMTP_HOST", "")
    print(f"{'✅' if smtp else '⚠'} Email alerts: {'Configured' if smtp else 'Dev/log mode'}")
    twilio = os.getenv("TWILIO_ACCOUNT_SID", "")
    print(f"{'✅' if twilio else '⚠'} SMS alerts: {'Configured' if twilio else 'Dev/log mode'}")
    print("✅ AgriSense API v3.0 ready! → http://localhost:8000/docs")


@app.get("/")
def root():
    return {
        "version": "3.0.0",
        "new_in_v3": [
            "POST /api/alerts/send  — email + SMS alerts (multi-language)",
            "GET  /api/history      — farmer yield history",
            "GET  /api/history/stats— dashboard statistics",
            "POST /api/history      — report actual yield",
            "GET  /api/alerts/languages — supported languages",
        ]
    }



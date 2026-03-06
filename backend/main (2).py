# main.py
# ---------------------------------------------------------
# This is the ENTRY POINT of the backend server.
# Run it with: uvicorn main:app --reload
#
# --reload means the server restarts automatically
# whenever you save a file (great for development!).
# ---------------------------------------------------------

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routes.recommend import router
from ml.soil_model import train_model
import os

# Create all database tables on startup (safe to run multiple times)
Base.metadata.create_all(bind=engine)

# Create the FastAPI app
app = FastAPI(
    title="🌱 AgriSense API",
    description="Smart Crop Recommendation System — powered by ML",
    version="1.0.0",
    docs_url="/docs",       # Interactive API docs at http://localhost:8000/docs
    redoc_url="/redoc",
)

# ── CORS Middleware ───────────────────────────────────────
# CORS allows your React frontend (running on port 5173)
# to make requests to this backend (running on port 8000).
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register Routes ───────────────────────────────────────
app.include_router(router)


@app.on_event("startup")
async def startup_event():
    """
    Runs once when the server starts.
    Pre-trains the ML model so the first request isn't slow.
    """
    print("🌱 AgriSense API starting up...")

    # Train model if it doesn't exist yet
    model_path = os.path.join("ml", "soil_model.pkl")
    if not os.path.exists(model_path):
        print("No saved model found — training now...")
        train_model()

    print("✅ AgriSense API ready!")
    print("📖 API docs: http://localhost:8000/docs")


@app.get("/")
def root():
    return {
        "message": "🌱 Welcome to AgriSense API",
        "docs": "http://localhost:8000/docs",
        "endpoints": {
            "analyze":  "POST /api/analyze",
            "regions":  "GET  /api/regions",
            "crops":    "GET  /api/crops",
            "history":  "POST /api/history",
            "health":   "GET  /api/health",
        }
    }

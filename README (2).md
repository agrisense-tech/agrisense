# 🌱 AgriSense — Smart Crop Recommendation System

## Project Structure
```
agrisense/
├── backend/          ← Python FastAPI server
│   ├── main.py       ← App entry point
│   ├── database.py   ← DB connection
│   ├── models/       ← Database table definitions
│   ├── routes/       ← API endpoints
│   ├── ml/           ← Machine learning models
│   └── utils/        ← Helper functions
├── frontend/         ← React dashboard
│   └── src/
│       ├── components/
│       ├── pages/
│       └── utils/
├── database/         ← SQLite file lives here
├── docs/             ← Documentation
└── requirements.txt  ← Python dependencies
```

## Quick Start
1. `cd backend && pip install -r requirements.txt`
2. `python seed_db.py`  ← fills database with sample data
3. `uvicorn main:app --reload`  ← starts backend
4. `cd ../frontend && npm install && npm run dev`  ← starts frontend

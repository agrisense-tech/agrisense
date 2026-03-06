# 🌱 AgriSense — Complete Setup Guide (Beginner Friendly)

## What You Need First (Install These)

| Tool | Why | Download |
|------|-----|----------|
| Python 3.11+ | Runs the backend | python.org |
| Node.js 18+ | Runs the frontend | nodejs.org |
| VS Code | Code editor | code.visualstudio.com |
| Git | Version control | git-scm.com |

Check you have them:
```bash
python --version    # Should say 3.11.x or higher
node --version      # Should say v18.x or higher
npm --version       # Comes with Node
```

---

## Step 1 — Set Up the Backend (Python)

Open your terminal and run these commands ONE BY ONE:

```bash
# 1. Go into the backend folder
cd agrisense/backend

# 2. Create a virtual environment
#    (This is a sandboxed Python just for this project)
python -m venv venv

# 3. Activate the virtual environment
#    On Mac/Linux:
source venv/bin/activate
#    On Windows:
venv\Scripts\activate
#    You'll see (venv) appear in your terminal — that's correct!

# 4. Install all Python packages
pip install -r requirements.txt
#    This takes 2-3 minutes — coffee time ☕

# 5. Seed the database with starter data
python seed_db.py
#    You should see: ✓ Added 6 regions, ✓ Added 10 crops, etc.

# 6. Start the backend server
uvicorn main:app --reload
#    You'll see: Uvicorn running on http://127.0.0.1:8000
```

✅ **Test it works:** Open http://localhost:8000/docs in your browser.
   You'll see a beautiful interactive API documentation page!

---

## Step 2 — Set Up the Frontend (React)

Open a **NEW** terminal window (keep the backend running in the first one):

```bash
# 1. Go into the frontend folder
cd agrisense/frontend

# 2. Install all JavaScript packages
npm install
#    Takes 1-2 minutes

# 3. Start the frontend development server
npm run dev
#    You'll see: Local: http://localhost:5173/
```

✅ **Test it works:** Open http://localhost:5173 in your browser.
   You should see the AgriSense dashboard!

---

## Step 3 — Use the App

1. Open **http://localhost:5173** in your browser
2. Click **"Fill with demo data"** to auto-fill the form
3. Click **"Analyze & Get Crop Recommendation"**
4. See your results! 🌾

---

## Project Folder Explained

```
agrisense/
│
├── backend/
│   ├── main.py          ← START HERE: runs the API server
│   ├── database.py      ← Database connection settings
│   ├── seed_db.py       ← Fills DB with starter data (run once)
│   ├── requirements.txt ← Python packages list
│   │
│   ├── models/
│   │   └── tables.py    ← Database table definitions
│   │
│   ├── routes/
│   │   └── recommend.py ← API endpoints (/api/analyze etc.)
│   │
│   ├── ml/
│   │   ├── soil_model.py   ← RandomForest crop recommendation
│   │   └── image_model.py  ← Field image analysis (OpenCV)
│   │
│   └── utils/
│       ├── gps_utils.py    ← GPS → Region lookup
│       └── recommender.py  ← Combines all signals into 1 score
│
├── frontend/
│   └── src/
│       ├── App.jsx                      ← Root component
│       ├── pages/
│       │   ├── InputForm.jsx            ← Data entry form
│       │   └── ResultsDashboard.jsx     ← Results display
│       └── components/
│           └── Header.jsx               ← Top navigation bar
│
└── database/
    └── agrisense.db     ← Created automatically (SQLite file)
```

---

## API Endpoints

| Method | URL | What it does |
|--------|-----|-------------|
| POST | /api/analyze | Main: analyze field & get recommendation |
| GET | /api/regions | List all geographic regions |
| GET | /api/crops | List all crops with ideal conditions |
| POST | /api/history | Report actual yield (improves ML) |
| GET | /api/health | Check if server is running |

Test any endpoint at: **http://localhost:8000/docs**

---

## Common Errors & Fixes

**"Module not found" error**
→ Make sure your virtual environment is activated (you see `(venv)` in terminal)

**"Port 8000 already in use"**
→ Run: `uvicorn main:app --reload --port 8001`

**"CORS error" in browser console**
→ Make sure the backend is running on port 8000

**Frontend shows blank page**
→ Check the terminal for errors, usually a missing package: `npm install`

**Database errors**
→ Delete `database/agrisense.db` and run `python seed_db.py` again

---

## Phase 2 Coming Next

- 🌤 Real weather API (OpenWeatherMap) integration
- 📊 Market price forecasting
- 🗺 Interactive map with field boundary overlay
- 📱 SMS notifications
- 🔄 Model retraining from farmer feedback

---

*Built with FastAPI + React + SQLite + scikit-learn*

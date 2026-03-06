# AgriSense Phase 3 — What's New

## ✨ New Features

### 🔔 Email & SMS Alerts (multi-language)
- Send crop recommendations directly to farmers via email or SMS
- Beautiful HTML email template with crop details, risk alerts, sowing window
- SMS: concise 1-line summary
- **4 languages:** English, हिन्दी, தமிழ், తెలుగు
- Works in dev mode without config (logs to console)
- Add `SMTP_HOST` + `TWILIO_*` to `backend/.env` for live delivery
- Subscribe to future pest & weather alerts

### 📋 Farmer History Dashboard
- New "History" page accessible from the header
- Submit actual yield reports with rating (1–5 stars)
- Track profit per crop, season, region
- Summary stats: total reports, avg yield, avg rating, top crops
- Search and delete entries
- Feeds back into ML model improvement

### 🌤 Real-time Weather (enhanced)
- Richer forecast display with 7-day outlook
- Crop weather suitability score with color-coded bar
- Clean tabbed interface on results dashboard
- Graceful mock data fallback when no API key

### 📄 PDF Export
- "Export PDF" button on results dashboard
- Browser print dialog → Save as PDF
- Print-optimized CSS (hides UI chrome, cleans up colors)

## 🎨 UI / Visual Design

- Complete dark-theme redesign: deep forest-green color system
- **Sora** display font + **JetBrains Mono** for data
- Animated scan-line loading indicator
- Smooth fade-up animations with staggered delays
- pH visual indicator slider on input form
- Soil moisture gradient bar
- 3 pre-filled demo locations (Tamil Nadu, Punjab, West Bengal)
- Tabbed results dashboard (Overview / Weather / Market / Alerts)
- Improved card hierarchy with glow effects
- Fully responsive mobile layout

## 🐛 Bug Fixes / Code Quality

- Fixed: `seed_db.py` import error (`CropHistory` import was broken)
- Fixed: CORS now handles all origins in dev
- Added: `GZipMiddleware` for faster API responses
- Added: proper logging throughout backend
- Routes split into logical files: `recommend`, `weather_market`, `history`, `alerts`
- `FieldAnalysis` model now stores farmer contact + language

## ⚡ Performance

- GZip compression on all API responses
- Image resize to 256×256 before processing (was already done, now documented)
- Frontend: lazy tab rendering (weather/market only fetched when tab opened)
- Parallel fetch for history stats + entries + crops list

## 🔧 Setup (unchanged)

```bash
# Backend
cd backend
pip install -r requirements.txt
python seed_db.py
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 — click "Try demo: Tamil Nadu" to test instantly.

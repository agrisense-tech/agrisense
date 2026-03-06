# seed_db.py
# ---------------------------------------------------------
# Run this ONCE to fill the database with starter data.
# Command: python seed_db.py
#
# It creates:
#   - 6 regions (India + Southeast Asia)
#   - 10 common crops with ideal soil conditions
#   - Region-crop suitability links
# ---------------------------------------------------------

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
from models.tables import Region, Crop, RegionCrop

# Create all tables (like running CREATE TABLE in SQL)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# ── STEP 1: Clear old data ────────────────────────────────
db.query(RegionCrop).delete()
db.query(CropHistory := __import__('models.tables', fromlist=['CropHistory']).CropHistory).delete()
db.query(Region).delete()
db.query(Crop).delete()
db.commit()

# ── STEP 2: Add Regions ───────────────────────────────────
regions = [
    Region(name="Tamil Nadu",    country="India",     climate="Tropical",
           lat_min=8.0,  lat_max=13.5, lon_min=76.0, lon_max=80.5,
           avg_temp_c=28, avg_rain_mm=900),
    Region(name="Punjab",        country="India",     climate="Semi-Arid",
           lat_min=29.5, lat_max=32.5, lon_min=73.5, lon_max=76.5,
           avg_temp_c=24, avg_rain_mm=500),
    Region(name="West Bengal",   country="India",     climate="Humid Subtropical",
           lat_min=21.5, lat_max=27.2, lon_min=85.5, lon_max=89.9,
           avg_temp_c=26, avg_rain_mm=1600),
    Region(name="Maharashtra",   country="India",     climate="Tropical Wet & Dry",
           lat_min=15.6, lat_max=22.0, lon_min=72.5, lon_max=80.9,
           avg_temp_c=27, avg_rain_mm=700),
    Region(name="Mekong Delta",  country="Vietnam",   climate="Tropical Monsoon",
           lat_min=9.0,  lat_max=11.5, lon_min=104.0,lon_max=107.0,
           avg_temp_c=27, avg_rain_mm=1400),
    Region(name="Central Luzon", country="Philippines",climate="Tropical",
           lat_min=14.5, lat_max=16.5, lon_min=119.5,lon_max=122.0,
           avg_temp_c=28, avg_rain_mm=2000),
]
db.add_all(regions)
db.commit()
print(f"✓ Added {len(regions)} regions")

# ── STEP 3: Add Crops ─────────────────────────────────────
# Field order: name, scientific_name, emoji,
#   n_min, n_max, p_min, p_max, k_min, k_max, ph_min, ph_max,
#   temp_min_c, temp_max_c, rain_min_mm, rain_max_mm, water_req_mm,
#   avg_yield_t_ha, market_price_usd,
#   sow_month_start, sow_month_end, harvest_days
crops_data = [
    ("Rice",       "Oryza sativa",          "🌾", 80,120, 40,80,  40,80,  5.5,7.0, 20,35, 1000,2500,1200, 4.0,400,  6,7, 120),
    ("Wheat",      "Triticum aestivum",      "🌾", 60,120, 30,60,  40,80,  6.0,7.5, 10,25, 300,700,  450,  3.0,220,  11,12,120),
    ("Maize",      "Zea mays",              "🌽", 80,150, 40,80,  60,100, 5.8,7.0, 18,33, 500,1200,600,  5.0,180,  6,7, 90),
    ("Sugarcane",  "Saccharum officinarum", "🎋", 100,200,50,100, 80,150, 6.0,8.0, 20,35, 1200,1800,1800, 65,  35,   6,7, 365),
    ("Soybean",    "Glycine max",           "🫘", 20,60,  60,100, 40,100, 6.0,7.0, 20,32, 500,1100,700,  2.5,480,  6,7, 100),
    ("Cotton",     "Gossypium hirsutum",    "🌿", 60,120, 30,80,  40,80,  6.0,8.0, 21,37, 600,1200,700,  1.5,600,  4,5, 180),
    ("Groundnut",  "Arachis hypogaea",      "🥜", 20,50,  40,80,  30,80,  5.5,7.0, 22,35, 500,1200,500,  2.0,1000, 6,7, 120),
    ("Chickpea",   "Cicer arietinum",       "🌿", 20,50,  40,80,  40,80,  6.0,9.0, 10,29, 400,700,  350,  1.2,900,  11,12,100),
    ("Banana",     "Musa acuminata",        "🍌", 100,200,50,100, 100,200,5.5,7.5, 22,35, 1200,2500,1400, 25,  800,  1,12, 365),
    ("Turmeric",   "Curcuma longa",         "🌿", 60,100, 40,80,  60,100, 5.5,7.0, 22,35, 1200,1800,1200, 8.0,1200, 4,5, 270),
]

crop_objects = []
for row in crops_data:
    c = Crop(
        name=row[0], scientific_name=row[1], emoji=row[2],
        n_min=row[3], n_max=row[4], p_min=row[5], p_max=row[6],
        k_min=row[7], k_max=row[8], ph_min=row[9], ph_max=row[10],
        temp_min_c=row[11], temp_max_c=row[12],
        rain_min_mm=row[13], rain_max_mm=row[14], water_req_mm=row[15],
        avg_yield_t_ha=row[16], market_price_usd=row[17],
        sow_month_start=row[18], sow_month_end=row[19], harvest_days=row[20],
    )
    crop_objects.append(c)

db.add_all(crop_objects)
db.commit()
print(f"✓ Added {len(crop_objects)} crops")

# ── STEP 4: Link Regions → Crops ─────────────────────────
# Format: (region_name, crop_name, suitability_score)
links = [
    # Tamil Nadu — rice, sugarcane, banana, turmeric thrive
    ("Tamil Nadu",    "Rice",      0.95),
    ("Tamil Nadu",    "Sugarcane", 0.88),
    ("Tamil Nadu",    "Banana",    0.85),
    ("Tamil Nadu",    "Turmeric",  0.80),
    ("Tamil Nadu",    "Groundnut", 0.75),
    ("Tamil Nadu",    "Maize",     0.65),
    # Punjab — wheat & cotton belt
    ("Punjab",        "Wheat",     0.96),
    ("Punjab",        "Rice",      0.80),
    ("Punjab",        "Cotton",    0.75),
    ("Punjab",        "Maize",     0.70),
    # West Bengal — rice & jute (using banana as proxy)
    ("West Bengal",   "Rice",      0.93),
    ("West Bengal",   "Banana",    0.78),
    ("West Bengal",   "Turmeric",  0.75),
    # Maharashtra — cotton & soybean
    ("Maharashtra",   "Cotton",    0.92),
    ("Maharashtra",   "Soybean",   0.85),
    ("Maharashtra",   "Sugarcane", 0.80),
    ("Maharashtra",   "Chickpea",  0.75),
    ("Maharashtra",   "Groundnut", 0.70),
    # Mekong Delta — rice paradise
    ("Mekong Delta",  "Rice",      0.98),
    ("Mekong Delta",  "Banana",    0.85),
    ("Mekong Delta",  "Maize",     0.72),
    # Central Luzon
    ("Central Luzon", "Rice",      0.96),
    ("Central Luzon", "Sugarcane", 0.82),
    ("Central Luzon", "Banana",    0.88),
]

# Build lookup maps
region_map = {r.name: r.id for r in db.query(Region).all()}
crop_map   = {c.name: c.id for c in db.query(Crop).all()}

for region_name, crop_name, score in links:
    db.add(RegionCrop(
        region_id=region_map[region_name],
        crop_id=crop_map[crop_name],
        suitability=score
    ))

db.commit()
print(f"✓ Added {len(links)} region-crop links")
print("\n🌱 Database seeded successfully! Run: uvicorn main:app --reload")
db.close()

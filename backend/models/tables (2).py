# models/tables.py
# ---------------------------------------------------------
# This file defines what our DATABASE looks like.
# Think of each class as a spreadsheet tab (table).
# SQLAlchemy lets us write Python instead of raw SQL.
# ---------------------------------------------------------

from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Region(Base):
    """
    Stores known geographic regions.
    When a farmer sends GPS coordinates, we look up which
    region they're in and pull climate info from this table.
    """
    __tablename__ = "regions"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)        # e.g. "Tamil Nadu"
    country     = Column(String, nullable=False)        # e.g. "India"
    climate     = Column(String, nullable=False)        # e.g. "Tropical"
    # Bounding box — the rectangular GPS boundary of this region
    lat_min     = Column(Float, nullable=False)
    lat_max     = Column(Float, nullable=False)
    lon_min     = Column(Float, nullable=False)
    lon_max     = Column(Float, nullable=False)
    avg_temp_c  = Column(Float)                        # Average temperature
    avg_rain_mm = Column(Float)                        # Annual rainfall in mm

    # A region can have many crop records
    crops = relationship("RegionCrop", back_populates="region")


class Crop(Base):
    """
    Master list of all crops with their ideal growing conditions.
    This is our reference table for matching soil data.
    """
    __tablename__ = "crops"

    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False, unique=True)  # e.g. "Rice"
    scientific_name  = Column(String)                               # e.g. "Oryza sativa"
    emoji            = Column(String, default="🌾")

    # Ideal soil conditions (ranges)
    n_min            = Column(Float)   # Nitrogen minimum (mg/kg)
    n_max            = Column(Float)   # Nitrogen maximum
    p_min            = Column(Float)   # Phosphorus minimum
    p_max            = Column(Float)
    k_min            = Column(Float)   # Potassium minimum
    k_max            = Column(Float)
    ph_min           = Column(Float)   # pH minimum (0-14 scale)
    ph_max           = Column(Float)

    # Growing conditions
    temp_min_c       = Column(Float)   # Minimum temperature
    temp_max_c       = Column(Float)
    rain_min_mm      = Column(Float)   # Min annual rainfall needed
    rain_max_mm      = Column(Float)
    water_req_mm     = Column(Float)   # Total water requirement per season

    # Economics
    avg_yield_t_ha   = Column(Float)   # Average yield in tonnes per hectare
    market_price_usd = Column(Float)   # Approximate price per tonne

    # Growing calendar
    sow_month_start  = Column(Integer) # e.g. 6 = June
    sow_month_end    = Column(Integer)
    harvest_days     = Column(Integer) # Days from sowing to harvest

    region_crops = relationship("RegionCrop", back_populates="crop")
    history      = relationship("CropHistory", back_populates="crop")


class RegionCrop(Base):
    """
    Links regions to crops that grow well there.
    Suitability score: 0.0 (poor) → 1.0 (excellent)
    """
    __tablename__ = "region_crops"

    id               = Column(Integer, primary_key=True, index=True)
    region_id        = Column(Integer, ForeignKey("regions.id"))
    crop_id          = Column(Integer, ForeignKey("crops.id"))
    suitability      = Column(Float, default=0.5)  # 0.0 to 1.0

    region = relationship("Region", back_populates="crops")
    crop   = relationship("Crop",   back_populates="region_crops")


class FieldAnalysis(Base):
    """
    Stores every analysis request made by a farmer.
    This is the main log of all recommendations given.
    """
    __tablename__ = "field_analysis"

    id                      = Column(Integer, primary_key=True, index=True)
    created_at              = Column(DateTime, default=datetime.utcnow)

    # Input data
    latitude                = Column(Float)
    longitude               = Column(Float)
    nitrogen                = Column(Float)
    phosphorus              = Column(Float)
    potassium               = Column(Float)
    ph                      = Column(Float)
    water_table_m           = Column(Float)
    soil_moisture_pct       = Column(Float)
    land_type               = Column(String)  # fertile/dry/rocky/wet (from image ML)

    # Output data
    recommended_crop        = Column(String)
    confidence_score        = Column(Float)
    alternative_crops       = Column(Text)    # JSON string: ["Maize", "Soybean"]
    yield_estimate_t_ha     = Column(Float)
    sowing_window           = Column(String)
    risk_alerts             = Column(Text)    # JSON string
    field_outline_coords    = Column(Text)    # JSON string of polygon points


class CropHistory(Base):
    """
    Farmer-reported actual yields.
    This data is used to retrain and improve the ML model over time.
    """
    __tablename__ = "crop_history"

    id              = Column(Integer, primary_key=True, index=True)
    crop_id         = Column(Integer, ForeignKey("crops.id"))
    latitude        = Column(Float)
    longitude       = Column(Float)
    season          = Column(String)   # e.g. "Kharif 2024"
    actual_yield    = Column(Float)    # What the farmer actually got
    reported_at     = Column(DateTime, default=datetime.utcnow)
    notes           = Column(Text)

    crop = relationship("Crop", back_populates="history")

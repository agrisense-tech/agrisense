# models/tables.py — Phase 3 (enhanced)
from sqlalchemy import Column, Integer, Float, String, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Region(Base):
    __tablename__ = "regions"
    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String, nullable=False)
    country     = Column(String, nullable=False)
    climate     = Column(String, nullable=False)
    lat_min     = Column(Float, nullable=False)
    lat_max     = Column(Float, nullable=False)
    lon_min     = Column(Float, nullable=False)
    lon_max     = Column(Float, nullable=False)
    avg_temp_c  = Column(Float)
    avg_rain_mm = Column(Float)
    crops = relationship("RegionCrop", back_populates="region")


class Crop(Base):
    __tablename__ = "crops"
    id               = Column(Integer, primary_key=True, index=True)
    name             = Column(String, nullable=False, unique=True)
    scientific_name  = Column(String)
    emoji            = Column(String, default="🌾")
    n_min            = Column(Float); n_max = Column(Float)
    p_min            = Column(Float); p_max = Column(Float)
    k_min            = Column(Float); k_max = Column(Float)
    ph_min           = Column(Float); ph_max = Column(Float)
    temp_min_c       = Column(Float); temp_max_c = Column(Float)
    rain_min_mm      = Column(Float); rain_max_mm = Column(Float)
    water_req_mm     = Column(Float)
    avg_yield_t_ha   = Column(Float)
    market_price_usd = Column(Float)
    sow_month_start  = Column(Integer)
    sow_month_end    = Column(Integer)
    harvest_days     = Column(Integer)
    region_crops = relationship("RegionCrop", back_populates="crop")
    history      = relationship("CropHistory", back_populates="crop")


class RegionCrop(Base):
    __tablename__ = "region_crops"
    id          = Column(Integer, primary_key=True, index=True)
    region_id   = Column(Integer, ForeignKey("regions.id"))
    crop_id     = Column(Integer, ForeignKey("crops.id"))
    suitability = Column(Float, default=0.5)
    region = relationship("Region", back_populates="crops")
    crop   = relationship("Crop",   back_populates="region_crops")


class FieldAnalysis(Base):
    __tablename__ = "field_analysis"
    id                   = Column(Integer, primary_key=True, index=True)
    created_at           = Column(DateTime, default=datetime.utcnow)
    latitude             = Column(Float); longitude = Column(Float)
    nitrogen             = Column(Float); phosphorus = Column(Float)
    potassium            = Column(Float); ph = Column(Float)
    water_table_m        = Column(Float); soil_moisture_pct = Column(Float)
    land_type            = Column(String)
    recommended_crop     = Column(String)
    confidence_score     = Column(Float)
    alternative_crops    = Column(Text)
    yield_estimate_t_ha  = Column(Float)
    sowing_window        = Column(String)
    risk_alerts          = Column(Text)
    field_outline_coords = Column(Text)
    farmer_name          = Column(String)
    farmer_email         = Column(String)
    farmer_phone         = Column(String)
    language             = Column(String, default="en")


class CropHistory(Base):
    __tablename__ = "crop_history"
    id            = Column(Integer, primary_key=True, index=True)
    crop_id       = Column(Integer, ForeignKey("crops.id"))
    farmer_name   = Column(String)
    latitude      = Column(Float); longitude = Column(Float)
    season        = Column(String)
    actual_yield  = Column(Float)
    reported_at   = Column(DateTime, default=datetime.utcnow)
    notes         = Column(Text)
    region_name   = Column(String)
    profit_actual = Column(Float)
    rating        = Column(Integer)
    crop = relationship("Crop", back_populates="history")


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"
    id          = Column(Integer, primary_key=True, index=True)
    farmer_name = Column(String)
    email       = Column(String)
    phone       = Column(String)
    crop_name   = Column(String)
    latitude    = Column(Float); longitude = Column(Float)
    language    = Column(String, default="en")
    active      = Column(Boolean, default=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

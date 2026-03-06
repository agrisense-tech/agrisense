# utils/gps_utils.py
# ---------------------------------------------------------
# GPS helper functions.
# Given a latitude/longitude, find which region it's in.
# ---------------------------------------------------------

from sqlalchemy.orm import Session
from models.tables import Region


def find_region(lat: float, lon: float, db: Session) -> Region | None:
    """
    Look up which region a GPS coordinate falls inside.

    We check if the coordinate is within each region's
    bounding box (a rectangle defined by min/max lat/lon).

    Args:
        lat: Latitude  (e.g. 13.08)
        lon: Longitude (e.g. 80.27)
        db:  Database session

    Returns:
        Region object if found, else None
    """
    regions = db.query(Region).all()

    for region in regions:
        if (region.lat_min <= lat <= region.lat_max and
                region.lon_min <= lon <= region.lon_max):
            return region

    return None  # Coordinates outside all known regions


def haversine_distance(lat1: float, lon1: float,
                       lat2: float, lon2: float) -> float:
    """
    Calculate the distance in kilometers between two GPS points.
    Uses the Haversine formula (accounts for Earth's curvature).

    Useful for finding the nearest weather station.
    """
    import math

    R = 6371  # Earth's radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)

    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

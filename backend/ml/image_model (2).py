# ml/image_model.py
# ---------------------------------------------------------
# Analyzes a field photo to detect land type:
#   fertile / dry / rocky / wet / mixed
#
# HOW IT WORKS:
#   We use color analysis (HSV color space) as a simple
#   first approach. Green pixels = fertile, brown = dry,
#   gray = rocky, high saturation blue-green = wet.
#
#   In production, you'd replace this with a CNN trained
#   on labeled field images (U-Net or ResNet).
# ---------------------------------------------------------

import numpy as np
from PIL import Image
import io


def analyze_field_image(image_bytes: bytes) -> dict:
    """
    Analyze a field/land image and return land type + confidence.

    Args:
        image_bytes: Raw bytes of the uploaded image file

    Returns:
        {
          "land_type": "fertile",
          "confidence": 0.82,
          "color_breakdown": {"green_pct": 65, "brown_pct": 20, ...},
          "description": "Lush green vegetation detected..."
        }
    """
    # Open image from bytes
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Resize to 256x256 for faster processing
    img = img.resize((256, 256))
    pixels = np.array(img)  # Shape: (256, 256, 3) — rows, cols, R/G/B

    # ── Color Analysis ────────────────────────────────────
    r = pixels[:, :, 0].astype(float)
    g = pixels[:, :, 1].astype(float)
    b = pixels[:, :, 2].astype(float)
    total = 256 * 256  # Total number of pixels

    # Count pixels matching each land type
    # Fertile: green dominates (grass, crops)
    fertile_mask = (g > r + 20) & (g > b + 10) & (g > 60)
    fertile_pct  = int(fertile_mask.sum() / total * 100)

    # Dry/Bare: brownish-yellow tones
    dry_mask = (r > 120) & (g > 80) & (g < r) & (b < g - 10) & (r > b + 20)
    dry_pct  = int(dry_mask.sum() / total * 100)

    # Rocky: gray tones (R ≈ G ≈ B, all mid-range)
    diff_rg  = np.abs(r - g)
    diff_rb  = np.abs(r - b)
    rocky_mask = (diff_rg < 20) & (diff_rb < 20) & (r > 60) & (r < 160)
    rocky_pct  = int(rocky_mask.sum() / total * 100)

    # Wet: dark blue-green (waterlogged fields)
    wet_mask = (b > r) & (b > 80) & (g > 60) & (r < 120)
    wet_pct  = int(wet_mask.sum() / total * 100)

    breakdown = {
        "green_pct": fertile_pct,
        "brown_pct": dry_pct,
        "gray_pct":  rocky_pct,
        "blue_pct":  wet_pct,
    }

    # ── Classify Land Type ────────────────────────────────
    scores = {
        "fertile": fertile_pct,
        "dry":     dry_pct,
        "rocky":   rocky_pct,
        "wet":     wet_pct,
    }

    land_type   = max(scores, key=scores.get)
    top_score   = scores[land_type]
    confidence  = min(0.95, top_score / 80)  # Normalize to max 0.95

    # ── Generate description ──────────────────────────────
    descriptions = {
        "fertile": "Healthy green vegetation detected. Soil appears well-nourished and suitable for most crops.",
        "dry":     "Dry or bare soil detected. Irrigation planning is essential. Drought-resistant crops recommended.",
        "rocky":   "Rocky or hard terrain detected. Consider raised-bed farming or crops like millets that tolerate poor soil.",
        "wet":     "Waterlogged or high-moisture field detected. Rice, jute, or drainage improvement recommended.",
    }

    return {
        "land_type":        land_type,
        "confidence":       round(confidence, 2),
        "color_breakdown":  breakdown,
        "description":      descriptions[land_type],
        "scores":           scores,
    }


def generate_field_outline(image_bytes: bytes) -> list[list[float]]:
    """
    Detect the boundary of agricultural land in an image.
    Returns a list of [x, y] percentage coordinates (0-100).

    Uses edge detection + contour finding (OpenCV).
    """
    try:
        import cv2

        # Decode image
        nparr = np.frombuffer(image_bytes, np.uint8)
        img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        h, w  = img.shape[:2]

        # Convert to grayscale and blur to reduce noise
        gray    = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)

        # Detect edges
        edges = cv2.Canny(blurred, threshold1=30, threshold2=100)

        # Find contours (boundaries between regions)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            # Return a default rectangle outline if no contours found
            return [[10,10],[90,10],[90,90],[10,90],[10,10]]

        # Pick the largest contour (likely the field boundary)
        largest = max(contours, key=cv2.contourArea)

        # Simplify the contour to fewer points
        epsilon   = 0.02 * cv2.arcLength(largest, True)
        approx    = cv2.approxPolyDP(largest, epsilon, True)

        # Convert pixel coords to percentages (easier for frontend to use)
        outline = []
        for point in approx:
            x_pct = round(point[0][0] / w * 100, 1)
            y_pct = round(point[0][1] / h * 100, 1)
            outline.append([x_pct, y_pct])

        return outline

    except Exception as e:
        print(f"Outline generation error: {e}")
        return [[10,10],[90,10],[90,90],[10,90],[10,10]]

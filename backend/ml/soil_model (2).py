# ml/soil_model.py
# ---------------------------------------------------------
# This is the BRAIN of AgriSense.
# It uses a RandomForest model to score how suitable each
# crop is for the given soil conditions (N, P, K, pH).
#
# RandomForest = many decision trees voting together.
# It's great for tabular data like soil readings.
# ---------------------------------------------------------

import numpy as np
import joblib
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler

MODEL_PATH  = os.path.join(os.path.dirname(__file__), "soil_model.pkl")
SCALER_PATH = os.path.join(os.path.dirname(__file__), "soil_scaler.pkl")


def train_model():
    """
    Trains the RandomForest model using synthetic data
    generated from the crop ideal ranges in our database.

    This runs automatically the first time if no saved model exists.
    In production, you'd retrain monthly with real farmer data.
    """
    print("🤖 Training soil model...")

    # Each row: [N, P, K, pH, label]
    # label = crop index (0=Rice, 1=Wheat, 2=Maize, etc.)
    # We generate 200 samples per crop, slightly varied around ideal values

    crop_profiles = [
        # name,      N_mean, P_mean, K_mean, pH_mean
        ("Rice",      100,    60,     60,     6.2),
        ("Wheat",      90,    45,     60,     6.7),
        ("Maize",     115,    60,     80,     6.4),
        ("Sugarcane", 150,    75,    115,     7.0),
        ("Soybean",    40,    80,     70,     6.5),
        ("Cotton",     90,    55,     60,     7.0),
        ("Groundnut",  35,    60,     55,     6.2),
        ("Chickpea",   35,    60,     60,     7.5),
        ("Banana",    150,    75,    150,     6.5),
        ("Turmeric",   80,    60,     80,     6.2),
    ]

    X, y = [], []
    rng = np.random.default_rng(42)

    for idx, (name, n, p, k, ph) in enumerate(crop_profiles):
        for _ in range(200):
            # Add realistic noise to each sample
            sample = [
                rng.normal(n,  n  * 0.15),   # ±15% variation
                rng.normal(p,  p  * 0.15),
                rng.normal(k,  k  * 0.15),
                rng.normal(ph, ph * 0.03),    # pH varies less
            ]
            X.append(sample)
            y.append(idx)

    X = np.array(X)
    y = np.array(y)

    # Scale features so all values are in a similar range
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train the model (100 trees, each sees different data subsets)
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        random_state=42,
        n_jobs=-1  # Use all CPU cores
    )
    model.fit(X_scaled, y)

    # Save model to disk so we don't retrain every time
    joblib.dump(model,  MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print("✓ Model trained and saved!")
    return model, scaler


def load_model():
    """Load the saved model, or train if it doesn't exist."""
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        model  = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
    else:
        model, scaler = train_model()
    return model, scaler


CROP_NAMES = [
    "Rice", "Wheat", "Maize", "Sugarcane", "Soybean",
    "Cotton", "Groundnut", "Chickpea", "Banana", "Turmeric"
]

CROP_EMOJI = {
    "Rice": "🌾", "Wheat": "🌾", "Maize": "🌽", "Sugarcane": "🎋",
    "Soybean": "🫘", "Cotton": "🌿", "Groundnut": "🥜",
    "Chickpea": "🌿", "Banana": "🍌", "Turmeric": "🌿"
}


def predict_crops(n: float, p: float, k: float, ph: float) -> list[dict]:
    """
    Given soil readings, return all crops ranked by suitability.

    Args:
        n:  Nitrogen   (mg/kg)
        p:  Phosphorus (mg/kg)
        k:  Potassium  (mg/kg)
        ph: pH value   (0–14)

    Returns:
        List of dicts like:
        [{"crop": "Rice", "score": 0.87, "emoji": "🌾"}, ...]
        Sorted best → worst
    """
    model, scaler = load_model()

    # Reshape input to 2D array (model expects a batch)
    X = np.array([[n, p, k, ph]])
    X_scaled = scaler.transform(X)

    # Get probability for each crop class
    probas = model.predict_proba(X_scaled)[0]

    # Build result list
    results = []
    for idx, prob in enumerate(probas):
        crop_name = CROP_NAMES[idx]
        results.append({
            "crop":  crop_name,
            "score": round(float(prob), 3),
            "emoji": CROP_EMOJI.get(crop_name, "🌱")
        })

    # Sort by score, highest first
    results.sort(key=lambda x: x["score"], reverse=True)
    return results

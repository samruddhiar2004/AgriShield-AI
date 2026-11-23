import os
import pytest
from backend.app.ml.explainer import MLExplainer
from backend.app.ml.dataset_generator import generate_maharashtra_cotton_dataset

def test_dataset_generation():
    df = generate_maharashtra_cotton_dataset(n_samples=100)
    assert len(df) == 100
    assert "outbreak_label" in df.columns
    assert "conducive_weather_index" in df.columns

def test_ml_model_artifacts_and_explanation():
    model = MLExplainer.load_active_model("XGBoost")
    assert model is not None, "XGBoost model artifact must be persisted."

    sample_features = {
        "temp_avg_3d": 29.5,
        "temp_avg_7d": 29.0,
        "humidity_avg_3d": 82.0,
        "humidity_avg_7d": 80.0,
        "cumulative_rainfall_7d": 45.0,
        "conducive_weather_index": 0.85,
        "stage_susceptibility": 1.6,
        "elevation_m": 310.0,
        "nearby_verified_reports": 3,
        "historical_outbreak_count": 4,
        "spatial_proximity_score": 0.75
    }

    explanations = MLExplainer.explain_prediction(sample_features, "XGBoost")
    assert len(explanations) > 0
    assert explanations[0]["direction"] in ["INCREASES_RISK", "DECREASES_RISK"]

import numpy as np
import pandas as pd
from typing import Tuple

def generate_maharashtra_cotton_dataset(n_samples: int = 1500, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic agro-meteorological dataset for cotton disease outbreak risk
    calibrated against Vidarbha/Marathwada Maharashtra field surveillance patterns.
    """
    np.random.seed(random_state)

    # 1. Weather features
    temp_avg_3d = np.random.normal(loc=28.5, scale=3.5, size=n_samples) # 20 - 38 C
    temp_avg_7d = temp_avg_3d + np.random.normal(loc=0, scale=0.8, size=n_samples)
    
    humidity_avg_3d = np.random.beta(a=5, b=2, size=n_samples) * 50 + 45 # 50 - 95%
    humidity_avg_7d = humidity_avg_3d + np.random.normal(loc=0, scale=3.0, size=n_samples)
    humidity_avg_7d = np.clip(humidity_avg_7d, 40.0, 98.0)
    
    cumulative_rainfall_7d = np.random.exponential(scale=25.0, size=n_samples) # mm
    conducive_weather_index = np.clip(
        (humidity_avg_3d / 100.0) * 0.45 + 
        np.where((temp_avg_3d >= 23) & (temp_avg_3d <= 32), 0.35, 0.1) +
        np.clip(cumulative_rainfall_7d / 50.0, 0, 0.2), 
        0.0, 1.0
    )

    # 2. Crop Growth Stages and Susceptibility (Encoded)
    stages = ["Seedling", "Vegetative", "Squaring", "Flowering", "Boll Formation", "Maturity"]
    stage_weights = [0.10, 0.15, 0.25, 0.30, 0.15, 0.05]
    crop_stages = np.random.choice(stages, size=n_samples, p=stage_weights)
    stage_susceptibility_map = {
        "Seedling": 0.3,
        "Vegetative": 0.4,
        "Squaring": 0.8,
        "Flowering": 1.0,
        "Boll Formation": 0.95,
        "Maturity": 0.2
    }
    stage_susceptibility = np.array([stage_susceptibility_map[s] for s in crop_stages])

    # 3. Spatial & Surveillance features
    elevation_m = np.random.uniform(280.0, 450.0, size=n_samples)
    nearby_verified_reports = np.random.poisson(lam=1.8, size=n_samples)
    historical_outbreak_count = np.random.poisson(lam=2.2, size=n_samples)
    spatial_proximity_score = np.clip(
        nearby_verified_reports * 0.22 + historical_outbreak_count * 0.15, 
        0.0, 1.0
    )

    # 4. Lat/Lon bounds of Maharashtra Cotton Belt
    latitudes = np.random.uniform(19.0, 21.5, size=n_samples)
    longitudes = np.random.uniform(75.0, 79.0, size=n_samples)

    # 5. Outbreak Probability Function (Log-odds based on agronomic interactions)
    # High humidity (>75%), optimal temp (24-32°C), flowering/boll stage, and nearby reports drive outbreaks
    log_odds = (
        -3.5
        + 0.05 * (humidity_avg_7d - 65.0)
        + 0.08 * (temp_avg_7d - 22.0) * (34.0 - temp_avg_7d) / 4.0
        + 0.02 * np.clip(cumulative_rainfall_7d, 0, 60)
        + 1.8 * stage_susceptibility
        + 1.2 * spatial_proximity_score
        + 0.9 * conducive_weather_index
    )
    
    probabilities = 1.0 / (1.0 + np.exp(-log_odds))
    # Generate binary outbreak event
    outbreak_label = (np.random.rand(n_samples) < probabilities).astype(int)

    df = pd.DataFrame({
        "temp_avg_3d": np.round(temp_avg_3d, 2),
        "temp_avg_7d": np.round(temp_avg_7d, 2),
        "humidity_avg_3d": np.round(humidity_avg_3d, 2),
        "humidity_avg_7d": np.round(humidity_avg_7d, 2),
        "cumulative_rainfall_7d": np.round(cumulative_rainfall_7d, 2),
        "conducive_weather_index": np.round(conducive_weather_index, 3),
        "stage_susceptibility": np.round(stage_susceptibility, 2),
        "crop_stage": crop_stages,
        "elevation_m": np.round(elevation_m, 1),
        "nearby_verified_reports": nearby_verified_reports,
        "historical_outbreak_count": historical_outbreak_count,
        "spatial_proximity_score": np.round(spatial_proximity_score, 3),
        "latitude": np.round(latitudes, 4),
        "longitude": np.round(longitudes, 4),
        "outbreak_probability": np.round(probabilities, 3),
        "outbreak_label": outbreak_label
    })

    return df

FEATURE_COLUMNS = [
    "temp_avg_3d",
    "temp_avg_7d",
    "humidity_avg_3d",
    "humidity_avg_7d",
    "cumulative_rainfall_7d",
    "conducive_weather_index",
    "stage_susceptibility",
    "elevation_m",
    "nearby_verified_reports",
    "historical_outbreak_count",
    "spatial_proximity_score"
]

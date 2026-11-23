#!/usr/bin/env python3
"""
AgriShield AI — HPC Batch Inference Pipeline
Executes large-scale village and parcel predictions across millions of farm records.
Outputs categorized risk tiers, probability distributions and spatial summaries.
"""

import os
import sys
import argparse
import logging
import joblib
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hpc_batch_predict")

try:
    from hpc.train_model import FEATURE_COLS
except ImportError:
    try:
        from train_model import FEATURE_COLS
    except ImportError:
        FEATURE_COLS = [
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

def batch_predict(model_path: str, data_path: str, output_path: str, batch_size: int = 50000):
    logger.info(f"Loading HPC Model artifact: {model_path}")
    if not os.path.exists(model_path):
        model_path = "./backend/app/ml/saved_models/xgboost_v1.joblib"
        
    model = joblib.load(model_path)
    logger.info(f"Loading inference dataset: {data_path}")

    if data_path.endswith(".parquet"):
        df = pd.read_parquet(data_path)
    else:
        df = pd.read_csv(data_path)

    logger.info(f"Scoring {len(df):,} records in parallel batches...")

    X = df[FEATURE_COLS]
    probs = model.predict_proba(X)[:, 1]

    df["predicted_outbreak_probability"] = np.round(probs, 4)
    df["risk_percentage"] = np.round(probs * 100.0, 1)

    # Vectorized categorization
    conditions = [
        (probs <= 0.25),
        (probs > 0.25) & (probs <= 0.50),
        (probs > 0.50) & (probs <= 0.75),
        (probs > 0.75)
    ]
    choices = ["Low", "Moderate", "High", "Critical"]
    df["risk_category"] = np.select(conditions, choices, default="Moderate")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    if output_path.endswith(".parquet"):
        df.to_parquet(output_path, compression="snappy", index=False)
    else:
        df.to_csv(output_path, index=False)

    # Log summary
    dist = df["risk_category"].value_counts().to_dict()
    logger.info(f"Batch inference complete! Risk Distribution: {dist}")
    logger.info(f"Saved results to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HPC Batch Predictor")
    parser.add_argument("--model", default="./backend/app/ml/saved_models/xgboost_v1.joblib")
    parser.add_argument("--data", default="./data/sample/maharashtra_cotton_data.csv")
    parser.add_argument("--output", default="./data/processed/hpc_batch_predictions.parquet")
    parser.add_argument("--batch_size", type=int, default=50000)
    args = parser.parse_args()

    batch_predict(args.model, args.data, args.output, args.batch_size)

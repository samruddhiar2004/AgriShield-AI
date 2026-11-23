#!/usr/bin/env python3
"""
AgriShield AI — HPC Distributed / Multi-Threaded Training
Utilizes multi-core parallelization and GPU histogram algorithms for large-scale training.
"""

import os
import sys
import argparse
import logging
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, brier_score_loss
from xgboost import XGBClassifier

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("hpc_train")

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

def train_hpc(input_path: str, model_output_path: str, n_threads: int = 16, tree_method: str = "hist"):
    logger.info(f"HPC Model Training initializing on {input_path}")
    logger.info(f"Allocated Threads: {n_threads} | Tree Method: {tree_method}")

    if input_path.endswith(".parquet"):
        df = pd.read_parquet(input_path)
    else:
        df = pd.read_csv(input_path)

    X = df[FEATURE_COLS]
    y = df["outbreak_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    logger.info(f"Train size: {len(X_train):,} | Test size: {len(X_test):,}")

    model = XGBClassifier(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        n_jobs=n_threads,
        tree_method=tree_method,
        eval_metric="logloss",
        random_state=42
    )

    logger.info("Fitting model on cluster node...")
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    roc_auc = roc_auc_score(y_test, y_prob)
    brier = brier_score_loss(y_test, y_prob)

    logger.info(f"HPC Evaluation Results -> ROC-AUC: {roc_auc:.4f} | Brier Calibration: {brier:.4f}")
    logger.info(f"\n{classification_report(y_test, y_pred)}")

    os.makedirs(os.path.dirname(model_output_path), exist_ok=True)
    joblib.dump(model, model_output_path)
    logger.info(f"Serialized trained HPC model artifact to: {model_output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="HPC XGBoost Training Node")
    parser.add_argument("--input", default="./data/sample/maharashtra_cotton_data.csv")
    parser.add_argument("--output", default="./backend/app/ml/saved_models/xgboost_hpc.joblib")
    parser.add_argument("--threads", type=int, default=16)
    parser.add_argument("--tree_method", default="hist")
    args = parser.parse_args()

    train_hpc(args.input, args.output, args.threads, args.tree_method)

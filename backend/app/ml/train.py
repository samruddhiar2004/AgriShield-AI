import os
import json
import logging
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    precision_recall_curve,
    auc,
    brier_score_loss,
    confusion_matrix,
)
from backend.app.ml.dataset_generator import generate_maharashtra_cotton_dataset, FEATURE_COLUMNS
from backend.app.ml.models import build_model
from backend.app.database.session import SessionLocal
from backend.app.models.intelligence import MLModelVersion

logger = logging.getLogger(__name__)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
os.makedirs(MODEL_DIR, exist_ok=True)

def train_and_evaluate_all() -> Dict[str, Any]:
    """
    Trains Logistic Regression, Random Forest, and XGBoost on calibrated Maharashtra data.
    Evaluates comprehensive metrics and saves persistent joblib artifacts.
    """
    logger.info("Generating calibrated Maharashtra Cotton training dataset...")
    df = generate_maharashtra_cotton_dataset(n_samples=2000, random_state=42)
    
    # Save copy of raw dataset to data/sample/
    sample_data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../data/sample/maharashtra_cotton_data.csv"))
    os.makedirs(os.path.dirname(sample_data_path), exist_ok=True)
    df.to_csv(sample_data_path, index=False)

    X = df[FEATURE_COLUMNS]
    y = df["outbreak_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    algorithms = ["LogisticRegression", "RandomForest", "XGBoost"]
    results = {}
    db = SessionLocal()

    try:
        for algo in algorithms:
            logger.info(f"Training {algo}...")
            model = build_model(algo)
            model.fit(X_train, y_train)

            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)[:, 1]

            prec = float(precision_score(y_test, y_pred, zero_division=0))
            rec = float(recall_score(y_test, y_pred, zero_division=0))
            f1 = float(f1_score(y_test, y_pred, zero_division=0))
            roc_auc = float(roc_auc_score(y_test, y_prob))
            
            p_curve, r_curve, _ = precision_recall_curve(y_test, y_prob)
            pr_auc = float(auc(r_curve, p_curve))
            brier = float(brier_score_loss(y_test, y_prob))
            cm = confusion_matrix(y_test, y_pred).tolist()

            # Save model artifact
            model_filename = f"{algo.lower()}_v1.joblib"
            model_filepath = os.path.join(MODEL_DIR, model_filename)
            joblib.dump(model, model_filepath)

            # Feature importance calculation
            feat_imp = {}
            if algo == "RandomForest":
                feat_imp = {feat: float(imp) for feat, imp in zip(FEATURE_COLUMNS, model.feature_importances_)}
            elif algo == "XGBoost":
                feat_imp = {feat: float(imp) for feat, imp in zip(FEATURE_COLUMNS, model.feature_importances_)}
            elif algo == "LogisticRegression":
                coefs = model.named_steps["classifier"].coef_[0]
                feat_imp = {feat: float(abs(c)) for feat, c in zip(FEATURE_COLUMNS, coefs)}

            # Sort feature importances descending
            feat_imp = dict(sorted(feat_imp.items(), key=lambda item: item[1], reverse=True))

            eval_summary = {
                "algorithm": algo,
                "version": f"v1.0-{algo.lower()}",
                "precision": round(prec, 4),
                "recall": round(rec, 4),
                "f1_score": round(f1, 4),
                "roc_auc": round(roc_auc, 4),
                "pr_auc": round(pr_auc, 4),
                "brier_score": round(brier, 4),
                "confusion_matrix": cm,
                "feature_importances": feat_imp,
                "model_filepath": model_filepath
            }
            results[algo] = eval_summary

            # Upsert into MLModelVersion DB table
            existing_ver = db.query(MLModelVersion).filter(MLModelVersion.version == f"v1.0-{algo.lower()}").first()
            if not existing_ver:
                mv = MLModelVersion(
                    model_name=f"AgriShield {algo} Cotton Risk Predictor",
                    algorithm=algo,
                    version=f"v1.0-{algo.lower()}",
                    precision_score=round(prec, 4),
                    recall_score=round(rec, 4),
                    f1_score=round(f1, 4),
                    roc_auc=round(roc_auc, 4),
                    pr_auc=round(pr_auc, 4),
                    brier_score=round(brier, 4),
                    model_file_path=model_filepath,
                    is_active=(algo == "XGBoost"), # Default primary active model
                    hyperparameters={"random_state": 42},
                    feature_names=FEATURE_COLUMNS,
                )
                db.add(mv)
            else:
                existing_ver.precision_score = round(prec, 4)
                existing_ver.recall_score = round(rec, 4)
                existing_ver.f1_score = round(f1, 4)
                existing_ver.roc_auc = round(roc_auc, 4)
                existing_ver.pr_auc = round(pr_auc, 4)
                existing_ver.brier_score = round(brier, 4)
                existing_ver.is_active = (algo == "XGBoost")

        db.commit()

        # Save metadata summary
        summary_path = os.path.join(MODEL_DIR, "models_metadata.json")
        with open(summary_path, "w") as f:
            json.dump(results, f, indent=2)

        logger.info("All 3 models trained, evaluated, and saved successfully.")
        return results
    except Exception as e:
        db.rollback()
        logger.error(f"Error during ML training: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    res = train_and_evaluate_all()
    print("Training Results Summary:")
    for algo, metrics in res.items():
        print(f"[{algo}] ROC-AUC: {metrics['roc_auc']} | F1: {metrics['f1_score']} | Recall: {metrics['recall']} | Brier: {metrics['brier_score']}")

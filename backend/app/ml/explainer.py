import os
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, List
from backend.app.ml.dataset_generator import FEATURE_COLUMNS

class MLExplainer:
    _model = None
    _model_algo = "XGBoost"
    _tree_explainer = None

    @classmethod
    def load_active_model(cls, algorithm: str = "XGBoost"):
        model_path = os.path.join(os.path.dirname(__file__), "saved_models", f"{algorithm.lower()}_v1.joblib")
        if os.path.exists(model_path):
            cls._model = joblib.load(model_path)
            cls._model_algo = algorithm
            return cls._model
        return None

    @classmethod
    def explain_prediction(cls, feature_dict: Dict[str, float], algorithm: str = "XGBoost") -> List[Dict[str, Any]]:
        """
        Explains an individual prediction instance, computing feature contributions.
        """
        model = cls.load_active_model(algorithm)
        if not model:
            # Fallback heuristic explanation
            return cls._heuristic_contributions(feature_dict)

        df = pd.DataFrame([feature_dict])[FEATURE_COLUMNS]
        
        contributions = []
        try:
            import shap
            if algorithm in ["RandomForest", "XGBoost"]:
                if cls._tree_explainer is None:
                    cls._tree_explainer = shap.TreeExplainer(model)
                shap_values = cls._tree_explainer.shap_values(df)
                
                # In binary classification, some shap outputs are arrays [N, M] or [N, M, 2]
                if isinstance(shap_values, list) and len(shap_values) == 2:
                    vals = shap_values[1][0]
                elif len(np.shape(shap_values)) == 2:
                    vals = shap_values[0]
                elif len(np.shape(shap_values)) == 3:
                    vals = shap_values[0, :, 1]
                else:
                    vals = shap_values[0]

                for feat, val in zip(FEATURE_COLUMNS, vals):
                    val_float = float(val)
                    human_desc = cls._get_feature_description(feat, feature_dict.get(feat, 0))
                    contributions.append({
                        "feature_name": feat,
                        "contribution_weight": round(abs(val_float), 4),
                        "direction": "INCREASES_RISK" if val_float > 0 else "DECREASES_RISK",
                        "description": human_desc
                    })
            else:
                # Fallback for Logistic Regression
                return cls._heuristic_contributions(feature_dict)
        except Exception:
            return cls._heuristic_contributions(feature_dict)

        # Sort by impact
        contributions.sort(key=lambda x: x["contribution_weight"], reverse=True)
        return contributions[:5]

    @staticmethod
    def _get_feature_description(feature: str, val: float) -> str:
        descriptions = {
            "humidity_avg_7d": f"7-day rolling relative humidity at {val:.1f}%",
            "humidity_avg_3d": f"3-day relative humidity at {val:.1f}%",
            "temp_avg_7d": f"7-day average temperature at {val:.1f}°C",
            "temp_avg_3d": f"3-day average temperature at {val:.1f}°C",
            "cumulative_rainfall_7d": f"7-day cumulative rainfall of {val:.1f}mm",
            "conducive_weather_index": f"Microclimate conduciveness index score of {val:.2f}",
            "stage_susceptibility": f"Crop phenological susceptibility score of {val:.2f}",
            "spatial_proximity_score": f"Spatial proximity risk to verified field incidents at {val:.2f}",
            "nearby_verified_reports": f"{int(val)} verified outbreak observations within cluster radius",
            "historical_outbreak_count": f"{int(val)} historical outbreaks recorded in this sector",
            "elevation_m": f"Terrain elevation at {val:.0f}m"
        }
        return descriptions.get(feature, f"{feature} at {val}")

    @classmethod
    def _heuristic_contributions(cls, feature_dict: Dict[str, float]) -> List[Dict[str, Any]]:
        weights = {
            "humidity_avg_7d": 0.28,
            "stage_susceptibility": 0.22,
            "spatial_proximity_score": 0.18,
            "temp_avg_7d": 0.14,
            "cumulative_rainfall_7d": 0.10,
            "nearby_verified_reports": 0.08
        }
        results = []
        for feat, wt in weights.items():
            val = feature_dict.get(feat, 0.0)
            increases = True
            if "humidity" in feat and val < 60:
                increases = False
            elif "temp" in feat and (val < 20 or val > 36):
                increases = False
            elif "reports" in feat and val == 0:
                increases = False

            results.append({
                "feature_name": feat,
                "contribution_weight": wt,
                "direction": "INCREASES_RISK" if increases else "DECREASES_RISK",
                "description": cls._get_feature_description(feat, val)
            })
        results.sort(key=lambda x: x["contribution_weight"], reverse=True)
        return results

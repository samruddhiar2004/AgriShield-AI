import pytest
from backend.app.database.session import SessionLocal
from backend.app.models.geography import Village
from backend.app.services.risk_engine import VillageRiskEngine

def test_village_risk_engine_evaluation():
    db = SessionLocal()
    try:
        village = db.query(Village).first()
        assert village is not None, "At least one village should be seeded in the database."

        res = VillageRiskEngine.evaluate_village_risk(
            db=db,
            village_id=village.id,
            target_crop_name="Cotton",
            target_disease_name="Pink Bollworm"
        )

        assert "outbreak_probability" in res
        assert 0.0 <= res["outbreak_probability"] <= 1.0
        assert 0.0 <= res["risk_percentage"] <= 100.0
        assert res["risk_category"] in ["Low", "Moderate", "High", "Critical"]
        assert len(res["top_contributing_factors"]) > 0
        assert len(res["shap_summary"]) > 0
        assert "recommended_action" in res
    finally:
        db.close()

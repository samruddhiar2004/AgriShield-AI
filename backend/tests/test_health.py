import pytest
from backend.app.database.session import SessionLocal, check_db_health
from backend.app.api.v1.endpoints.health import health_check

def test_check_db_health():
    health = check_db_health()
    assert health["connected"] is True
    assert health["dialect"] in ["sqlite", "postgresql"]

def test_health_check_endpoint():
    db = SessionLocal()
    try:
        res = health_check(db)
        assert res.status == "HEALTHY"
        assert res.version == "1.0.0"
        assert res.database["connected"] is True
        assert res.ml_models["count"] >= 3
    finally:
        db.close()

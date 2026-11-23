import pytest
from backend.app.database.session import SessionLocal
from backend.app.api.v1.endpoints.dashboard import get_dashboard_statistics
from backend.app.api.v1.endpoints.villages import get_villages
from backend.app.api.v1.endpoints.farmers import get_farmers
from backend.app.api.v1.endpoints.reports import get_farmer_reports
from backend.app.api.v1.endpoints.alerts import get_alerts

def test_dashboard_statistics():
    db = SessionLocal()
    try:
        stats = get_dashboard_statistics(db)
        assert stats.total_monitored_villages >= 20
        assert stats.total_registered_farmers >= 5
        assert stats.active_disease_alerts >= 1
        assert len(stats.disease_outbreak_trends) > 0
    finally:
        db.close()

def test_villages_endpoint():
    db = SessionLocal()
    try:
        villages = get_villages(None, None, None, db)
        assert len(villages) >= 20
        first = villages[0]
        assert hasattr(first, "latitude")
        assert hasattr(first, "longitude")
        assert hasattr(first, "current_risk_score")
        assert first.current_risk_category in ["Low", "Moderate", "High", "Critical"]
    finally:
        db.close()

def test_farmers_endpoint():
    db = SessionLocal()
    try:
        farmers = get_farmers(db)
        assert len(farmers) >= 5
        assert hasattr(farmers[0], "farmer_id_code")
    finally:
        db.close()

def test_alerts_endpoint():
    db = SessionLocal()
    try:
        alerts = get_alerts("ALL", "All", db)
        assert len(alerts) >= 1
        assert hasattr(alerts[0], "recommended_inspection")
        assert hasattr(alerts[0], "preventive_actions")
    finally:
        db.close()

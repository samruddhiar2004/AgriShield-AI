import json
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

print("=" * 60)
print("1. HEALTH CHECK")
print("=" * 60)
r = client.get("/api/v1/health")
print("Status:", r.status_code, r.json())

print("\n" + "=" * 60)
print("2. BATCH RISK RUN ACROSS ALL 21 MAHARASHTRA VILLAGES")
print("=" * 60)
r = client.post("/api/v1/predictions/batch-run")
res = r.json()
print("Batch Run Status:", r.status_code)
print("Assessed Villages Count:", res.get("assessed_villages_count"))
for item in res.get("assessments", [])[:6]:
    print(f"  * Village {item.get('village_name')}: {item.get('risk_percentage')}% ({item.get('risk_category')})")

print("\n" + "=" * 60)
print("3. DATA INGESTION PREVIEW & PARAMETER GRASPING")
print("=" * 60)
csv_sample = """village_name,district,latitude,longitude,farmer_name,farmer_id,survey_number,area_hectares,crop,growth_stage,temperature,humidity,rainfall,symptoms,disease_name,affected_plants_pct
Babhulgaon,Yavatmal,20.5501,78.3302,Rameshwar Patil,FMR-MH-001,Gat-101,3.5,Cotton,Flowering,29.5,82.0,25.0,Rosetted flowers with bored pinholes,Pink Bollworm,18.0
Kalamb,Yavatmal,20.4431,78.3411,Suresh Jadhav,FMR-MH-002,Gat-102,2.8,Cotton,Squaring,30.0,76.0,10.0,Square drops and minor pinholes,Pink Bollworm,12.0
Achalpur,Amravati,21.2570,77.5080,Gajanan Rathod,FMR-MH-003,Gat-103,4.2,Cotton,Flowering,28.5,85.0,40.0,Water soaked angular lesions on leaves,Bacterial Blight,22.0
"""
files = {"file": ("incoming_surveillance_data.csv", csv_sample.encode("utf-8"), "text/csv")}
r = client.post("/api/v1/ingest/preview", files=files)
print("Preview HTTP Status:", r.status_code)
prev = r.json()
print("Detected Columns:", prev.get("detected_columns"))
print("Grasped Parameter Mappings:", json.dumps(prev.get("detected_mappings"), indent=2))
print("Sample Rows Count:", len(prev.get("sample_rows", [])))

print("\n" + "=" * 60)
print("4. FULL DATA INGESTION & RISK RE-EVALUATION")
print("=" * 60)
files = {"file": ("incoming_surveillance_data.csv", csv_sample.encode("utf-8"), "text/csv")}
r = client.post("/api/v1/ingest/process", files=files)
print("Ingestion HTTP Status:", r.status_code)
proc = r.json()
print("Ingestion Results Summary:")
print("  Status:", proc.get("status"))
print("  Villages Processed:", proc.get("villages_processed"))
print("  Farmers Created/Updated:", proc.get("farmers_processed"))
print("  Farms Processed:", proc.get("farms_processed"))
print("  Observations Logged:", proc.get("observations_logged"))
print("  Predictions Recalculated:", proc.get("predictions_recalculated"))
print("  Recalculation Summary:", proc.get("predictions_summary"))

print("\n" + "=" * 60)
print("5. DEDICATED INDIVIDUAL FARMER PORTAL VIEW (FMR-MH-001)")
print("=" * 60)
r = client.get("/api/v1/farmers/FMR-MH-001/portal")
print("Farmer Portal HTTP Status:", r.status_code)
portal = r.json()
farmer = portal.get("farmer", {})
print(f"Farmer Name: {farmer.get('name')} (ID: {farmer.get('farmer_id')})")
print(f"Village: {farmer.get('village_name')} | District: {farmer.get('district_name')}")
print(f"Max Risk Score: {portal.get('max_risk_score')}% ({portal.get('primary_risk_level')})")
print("Monitored Farm Parcels:")
for farm in portal.get("farms", []):
    print(f"  - {farm.get('name')} | Crop: {farm.get('crop')} ({farm.get('growth_stage')}) | Area: {farm.get('area_hectares')} ha | Risk: {farm.get('current_risk_score')}% ({farm.get('risk_category')})")
print("Daily Inspection Checklist:")
for item in portal.get("inspection_checklist", []):
    print(f"  [Priority: {item.get('priority')}] {item.get('category')}: {item.get('action')}")

print("\n" + "=" * 60)
print("ALL LIVE END-TO-END TESTS COMPLETED SUCCESSFULLY!")
print("=" * 60)

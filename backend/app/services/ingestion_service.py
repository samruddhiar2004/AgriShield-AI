import io
import re
import logging
from datetime import date, datetime
from typing import Dict, Any, List, Optional, Tuple
import pandas as pd
from sqlalchemy.orm import Session
from backend.app.models.geography import District, Village
from backend.app.models.agriculture import Farmer, Farm, Crop, Disease
from backend.app.models.monitoring import WeatherObservation, FarmerReport
from backend.app.services.weather_service import WeatherService
from backend.app.services.risk_engine import VillageRiskEngine

logger = logging.getLogger(__name__)

# Column synonym dictionary for flexible schema mapping
SYNONYMS: Dict[str, List[str]] = {
    "latitude": ["latitude", "lat", "y", "gps_lat", "latitude_deg"],
    "longitude": ["longitude", "lon", "lng", "x", "gps_lon", "longitude_deg"],
    "village": ["village", "village_name", "location", "settlement", "gram_panchayat", "village_code"],
    "district": ["district", "district_name", "dist", "zilla"],
    "farmer_name": ["farmer_name", "farmer", "grower", "grower_name", "owner", "cultivator", "name"],
    "farmer_id": ["farmer_id", "farmer_id_code", "farmer_code", "grower_id", "id_code", "aadhaar_ref"],
    "survey_number": ["survey_number", "survey_no", "gat_no", "gat_number", "plot_no", "khasra_no"],
    "area_hectares": ["area_hectares", "area", "land_area", "hectares", "acres", "farm_size", "total_area"],
    "crop_name": ["crop_name", "crop", "crop_type", "commodity", "variety"],
    "growth_stage": ["growth_stage", "crop_stage", "stage", "phenology", "crop_growth_stage"],
    "temperature": ["temperature", "temp", "temp_c", "temperature_c", "temp_avg_7d", "ambient_temp"],
    "humidity": ["humidity", "relative_humidity", "rh", "humidity_pct", "humidity_avg_7d"],
    "rainfall": ["rainfall", "rain", "precipitation", "rainfall_mm", "rain_mm"],
    "symptoms": ["symptoms", "reported_symptoms", "damage_observed", "symptom_notes", "observations"],
    "disease_name": ["disease_name", "disease", "suspected_disease", "pathogen", "pest", "pest_name"],
    "affected_plants_pct": ["affected_plants_pct", "affected_pct", "damage_pct", "affected_percentage"],
    "observation_date": ["observation_date", "date", "date_observed", "survey_date", "timestamp"],
}

class IngestionService:
    @staticmethod
    def detect_column_mappings(df_columns: List[str]) -> Dict[str, Optional[str]]:
        """
        Fuzzy matches incoming columns to AgriShield target parameters.
        """
        mapping: Dict[str, Optional[str]] = {}
        normalized_cols = {re.sub(r'[^a-zA-Z0-9]', '', c.lower()): c for c in df_columns}

        for target_field, synonyms in SYNONYMS.items():
            matched_col = None
            for syn in synonyms:
                clean_syn = re.sub(r'[^a-zA-Z0-9]', '', syn.lower())
                if clean_syn in normalized_cols:
                    matched_col = normalized_cols[clean_syn]
                    break
            mapping[target_field] = matched_col
        return mapping

    @classmethod
    def preview_dataset(cls, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Parses incoming file and returns detected parameters and sample rows.
        """
        df = cls._read_file_to_df(file_bytes, filename)
        mapping = cls.detect_column_mappings(list(df.columns))
        
        preview_rows = df.head(5).to_dict(orient="records")
        # Sanitize for JSON serialization (replace NaNs)
        sanitized_preview = []
        for row in preview_rows:
            sanitized_preview.append({k: (None if pd.isna(v) else v) for k, v in row.items()})

        return {
            "filename": filename,
            "total_rows": len(df),
            "columns": list(df.columns),
            "detected_mappings": mapping,
            "preview_data": sanitized_preview,
            "status": "READY"
        }

    @classmethod
    def process_and_ingest(
        cls, 
        db: Session, 
        file_bytes: bytes, 
        filename: str, 
        custom_mapping: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Ingests parsed records into PostgreSQL/database, attaches meteorological telemetry,
        and triggers risk evaluations.
        """
        df = cls._read_file_to_df(file_bytes, filename)
        mapping = custom_mapping or cls.detect_column_mappings(list(df.columns))

        processed_farmers = 0
        processed_villages = set()
        new_reports_count = 0
        predictions_triggered = 0

        default_crop = db.query(Crop).filter(Crop.name == "Cotton").first()
        default_district = db.query(District).first()

        for _, row in df.iterrows():
            # 1. Grasp location parameters
            v_name = cls._get_val(row, mapping.get("village"), "Unknown Village")
            d_name = cls._get_val(row, mapping.get("district"), "Maharashtra")
            lat = cls._get_float(row, mapping.get("latitude"), 20.45)
            lon = cls._get_float(row, mapping.get("longitude"), 78.10)

            # Match or create District
            dist = db.query(District).filter(District.name.ilike(f"%{d_name}%")).first()
            if not dist:
                dist = District(name=d_name, state="Maharashtra", latitude=lat, longitude=lon)
                db.add(dist)
                db.flush()

            # Match or create Village
            village = db.query(Village).filter(Village.name.ilike(f"%{v_name}%")).first()
            if not village:
                v_code = f"MH-INGEST-{len(db.query(Village).all()) + 1:03d}"
                village = Village(
                    name=v_name,
                    code=v_code,
                    district_id=dist.id,
                    latitude=lat,
                    longitude=lon,
                    total_cultivated_area_ha=1200.0,
                    cotton_cultivated_area_ha=800.0
                )
                db.add(village)
                db.flush()

            processed_villages.add(village.id)

            # 2. Grasp farmer and farm plot parameters
            f_name = cls._get_val(row, mapping.get("farmer_name"))
            f_code = cls._get_val(row, mapping.get("farmer_id"))
            if f_name or f_code:
                if not f_code:
                    f_code = f"FMR-INGEST-{len(db.query(Farmer).all()) + 1:04d}"
                if not f_name:
                    f_name = f"Grower {f_code}"

                farmer = db.query(Farmer).filter(Farmer.farmer_id_code == f_code).first()
                area_ha = cls._get_float(row, mapping.get("area_hectares"), 2.0)
                if not farmer:
                    farmer = Farmer(
                        farmer_id_code=f_code,
                        name=f_name,
                        contact_number=cls._get_val(row, "contact", "+91-9800000000"),
                        village_id=village.id,
                        total_land_area_ha=area_ha
                    )
                    db.add(farmer)
                    db.flush()
                    processed_farmers += 1

                # Survey / plot
                survey_no = cls._get_val(row, mapping.get("survey_number"), f"Gat-{f_code}")
                c_stage = cls._get_val(row, mapping.get("growth_stage"), "Flowering")
                
                farm = db.query(Farm).filter(Farm.farmer_id == farmer.id, Farm.survey_number == survey_no).first()
                if not farm:
                    farm = Farm(
                        farmer_id=farmer.id,
                        village_id=village.id,
                        crop_id=default_crop.id if default_crop else None,
                        survey_number=survey_no,
                        area_hectares=area_ha * 0.85,
                        soil_type="Black Cotton Soil",
                        current_growth_stage=c_stage,
                        latitude=lat + 0.001,
                        longitude=lon + 0.001
                    )
                    db.add(farm)

            # 3. Grasp weather parameters or auto-fill
            temp = cls._get_float(row, mapping.get("temperature"), None)
            humidity = cls._get_float(row, mapping.get("humidity"), None)
            rain = cls._get_float(row, mapping.get("rainfall"), 0.0)

            if temp is not None and humidity is not None:
                w_obs = WeatherObservation(
                    village_id=village.id,
                    observation_date=date.today(),
                    temperature_c=temp,
                    relative_humidity_pct=humidity,
                    rainfall_mm=rain,
                    wind_speed_kmh=12.0,
                    temp_avg_3d=temp,
                    temp_avg_7d=temp - 0.4,
                    humidity_avg_3d=humidity,
                    humidity_avg_7d=humidity - 1.2,
                    cumulative_rainfall_7d=rain * 2.0,
                    conducive_weather_index=round(min(1.0, (humidity / 100.0) * (temp / 35.0)), 2)
                )
                db.add(w_obs)
            else:
                # Auto-fill weather using Open-Meteo / WeatherService
                WeatherService.get_or_sync_village_weather(db, village)

            # 4. Grasp farmer symptoms / disease reports if present
            symptoms_text = cls._get_val(row, mapping.get("symptoms"))
            if symptoms_text:
                disease_name = cls._get_val(row, mapping.get("disease_name"), "Pink Bollworm")
                d_obj = db.query(Disease).filter(Disease.name.ilike(f"%{disease_name}%")).first()
                aff_pct = cls._get_float(row, mapping.get("affected_plants_pct"), 10.0)

                rep = FarmerReport(
                    farmer_id=farmer.id if 'farmer' in locals() else db.query(Farmer).first().id,
                    village_id=village.id,
                    crop_name=cls._get_val(row, mapping.get("crop_name"), "Cotton"),
                    suspected_disease_id=d_obj.id if d_obj else None,
                    crop_growth_stage=cls._get_val(row, mapping.get("growth_stage"), "Flowering"),
                    observation_date=date.today(),
                    symptoms=symptoms_text,
                    affected_plants_pct=aff_pct,
                    severity="High" if aff_pct > 15 else "Moderate",
                    latitude=lat,
                    longitude=lon,
                    status="PENDING"
                )
                db.add(rep)
                new_reports_count += 1

        db.commit()

        # 5. Automatically trigger risk evaluations for all affected villages
        for v_id in processed_villages:
            try:
                VillageRiskEngine.evaluate_village_risk(
                    db=db,
                    village_id=v_id,
                    target_crop_name="Cotton",
                    target_disease_name="Pink Bollworm"
                )
                predictions_triggered += 1
            except Exception as e:
                logger.error(f"Failed to evaluate risk for village {v_id}: {e}")

        return {
            "status": "SUCCESS",
            "message": f"Successfully ingested {len(df)} records from {filename}.",
            "processed_rows": len(df),
            "villages_updated_or_created": len(processed_villages),
            "farmers_registered": processed_farmers,
            "new_symptom_reports": new_reports_count,
            "predictions_recalculated": predictions_triggered
        }

    @staticmethod
    def _read_file_to_df(file_bytes: bytes, filename: str) -> pd.DataFrame:
        stream = io.BytesIO(file_bytes)
        if filename.endswith(".csv"):
            return pd.read_csv(stream)
        elif filename.endswith((".xlsx", ".xls")):
            return pd.read_excel(stream)
        elif filename.endswith(".parquet"):
            return pd.read_parquet(stream)
        elif filename.endswith(".json"):
            return pd.read_json(stream)
        else:
            # Default fallback to CSV
            return pd.read_csv(stream)

    @staticmethod
    def _get_val(row: pd.Series, col_name: Optional[str], default: Any = None) -> Any:
        if not col_name or col_name not in row:
            return default
        val = row[col_name]
        return default if pd.isna(val) else str(val).strip()

    @staticmethod
    def _get_float(row: pd.Series, col_name: Optional[str], default: Any = None) -> Any:
        if not col_name or col_name not in row:
            return default
        try:
            val = row[col_name]
            return default if pd.isna(val) else float(val)
        except Exception:
            return default

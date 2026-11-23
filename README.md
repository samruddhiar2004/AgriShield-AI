# AgriShield AI — Crop Disease Outbreak Prediction & Geographic Risk Mapping Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?logo=typescript)](https://www.typescriptlang.org)
[![PostGIS](https://img.shields.io/badge/PostGIS-3.3-336791.svg?logo=postgresql)](https://postgis.net)
[![XGBoost](https://img.shields.io/badge/XGBoost-Enabled-EB5424.svg)](https://xgboost.readthedocs.io)
[![Azure Compatible](https://img.shields.io/badge/Azure-Cloud_Ready-0078D4.svg?logo=microsoft-azure)](https://azure.microsoft.com)

**AgriShield AI** is an agricultural intelligence platform that transitions crop protection from reactive leaf diagnostics to predictive, proactive spatial epidemiological intelligence.

Instead of waiting for crops to exhibit irreversible necrosis or locule rot, AgriShield AI analyses agro-meteorological anomalies, phenological growth stage vulnerabilities, historical disease incidents, and farmer-reported symptoms to predict **WHERE** crop disease outbreaks are likely to occur before infestation spreads.

The platform is calibrated for the **Cotton Belt of Maharashtra, India** (covering Yavatmal, Wardha, Amravati, Jalgaon, Akola, Chhatrapati Sambhaji Nagar, and Nanded), with an extensible architecture for other crops and agro-climatic zones.

---

## 1. System Architecture

```
                                  +---------------------------------------+
                                  |     React 19 + TypeScript + Vite      |
                                  |   Tailwind CSS + React Leaflet GIS    |
                                  +-------------------+-------------------+
                                                      | (Axios REST Client)
                                                      v
                                  +---------------------------------------+
                                  |         FastAPI REST Backend          |
                                  |     (Python 3.11+, Pydantic v2)       |
                                  +----+--------------+-------------------+
                                       |              |
                +----------------------+              +----------------------+
                |                                                            |
                v                                                            v
+-------------------------------+                            +-------------------------------+
|     PostgreSQL 15 + PostGIS   |                            |     Machine Learning Engine   |
|   Geospatial Coordinates,     |                            |  XGBoost + Random Forest + LR |
|   Farms, Reports, Alerts      |                            |  SHAP Local & Global Explainer|
+-------------------------------+                            +-------------------------------+
                ^                                                            ^
                |                                                            |
+---------------+---------------+                            +---------------+---------------+
|  Open-Meteo Weather Service   |                            |  Celery + Redis Worker Grid   |
|  Rolling 3d/7d Temperature,   |                            |  Batch Risk Recalculation &   |
|  Humidity, Cumulative Rain    |                            |  Automated Warning Dispatch   |
+-------------------------------+                            +-------------------------------+
```

---

## 2. Key Modules & Functional Capabilities

### 1. Main Dashboard & Intelligence Overview
- Real-time aggregate metrics: Monitored villages, active alerts, regional risk percentage, registered growers, and surveyed parcels.
- Temporal disease outbreak trends and seasonal risk progression curves.
- Risk distribution across low, moderate, high, and critical categories.
- Real-time agro-meteorological microclimate indicators (rolling temperature, humidity, and rainfall).

### 2. Geographic Disease Risk Map (GIS Core)
- High-performance GIS visualization built with React Leaflet and OpenStreetMap.
- Color-coded risk markers based on calibrated thresholds:
  - 🟢 **Low Risk (0–25%)**: Routine cultural maintenance.
  - 🟡 **Moderate Risk (26–50%)**: Bi-weekly field scouting.
  - 🟠 **High Risk (51–75%)**: Warning status, trap installation & pheromone monitoring.
  - 🔴 **Critical Risk (76–100%)**: Emergency bio-control release and quarantine.
- Side inspector drawer displaying village telemetry, cotton acreage, past predictions, contributing factors, and on-demand risk assessment execution.
- Filtering by district, risk category, and dominant pathogen.

### 3. Weather Intelligence & Microclimate
- Automated rolling statistics: 3-day average temperature, 7-day average temperature, 3-day average humidity, 7-day average humidity, and 7-day cumulative rainfall.
- Microclimate Disease Conducive Index evaluating optimal spore germination and insect oviposition parameters (Temp 23–32°C, RH > 75%, Rain > 15mm).

### 4. Crop & Phenology Surveillance
- Detailed cotton phenology tracking: Seedling (0.3x), Vegetative (0.4x), Squaring (0.8x), Flowering (1.6x), Boll Formation (1.8x), and Maturity (0.2x).
- Pathogen bioclimatic matrix: Pink Bollworm (*Pectinophora gossypiella*), Bacterial Blight (*Xanthomonas malvacearum*), Cotton Leaf Curl Virus (*Begomovirus*), and Grey Mildew (*Ramularia areola*).

### 5. Farmer & Farm Parcel Directory
- Grower registry tracking contact numbers, survey Gat numbers, soil types (Deep Black Cotton Soil / Regur), and landholdings.
- Farm coordinates mapped to spatial polygons.

### 6. Field Disease Reporting & Officer Verification
- Structured observation capture: Farmer ID, village, growth stage, symptoms, affected plant percentage, and severity.
- Clear separation between raw farmer observations and confirmed outbreaks.
- Agricultural Officer review workflow: Approve (Verify) or Reject with diagnostic notes.

### 7. Village-Level Risk Engine & ML Inference
- Standardized 10-step assessment pipeline:
  1. Retrieve weather observations
  2. Retrieve crop phenological stage
  3. Retrieve historical outbreak incidents
  4. Retrieve verified farmer reports
  5. Perform feature engineering (spatial proximity decay, stage vulnerability multipliers)
  6. Execute ML prediction model
  7. Aggregate farm-level predictions into village-level risk
  8. Compute SHAP explainability drivers
  9. Store prediction records and village risk assessment
  10. Dispatch early warning alerts
- Cross-model benchmarks: Logistic Regression, Random Forest, and XGBoost.

### 8. Early Warning Alert System
- Threshold-triggered alerts with deduplication to prevent alert fatigue.
- Traceable ICAR-CICR Nagpur approved inspection and bio-control recommendations.
- Alert lifecycle management: `ACTIVE` → `ACKNOWLEDGED` → `RESOLVED`.

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts, React Leaflet, Leaflet.
- **Backend**: Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, Alembic, Psycopg2, GeoAlchemy2, Shapely, PyJWT.
- **Database & Cache**: PostgreSQL 15 + PostGIS 3.3 (with SQLite portable fallback), Redis 7.
- **Machine Learning**: Scikit-Learn, XGBoost, SHAP, Joblib, Pandas, NumPy.
- **Background Tasks**: Celery, Redis.
- **HPC Cluster**: Slurm batch processing scripts (`sbatch`), Parquet pipeline.
- **Cloud & Containers**: Docker, Multi-Stage Dockerfiles, Nginx, Azure Bicep, Azure Container Apps.

---

## 4. Quickstart Guide (Local Development)

### Prerequisites
- Python 3.11+
- Node.js 20+ and pnpm / npm

### Step 1: Clone & Configure Environment
```bash
git clone https://github.com/your-org/agrishield-ai.git
cd agrishield-ai
cp .env.example .env
```

### Step 2: Start the FastAPI Backend
```bash
# Install backend dependencies
python -m pip install -r backend/requirements.txt

# Seed the Maharashtra database and train ML models
python -m backend.app.database.init_db
python -m backend.app.ml.train

# Start the API server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI documentation will be available at: **http://localhost:8000/api/v1/docs**

### Step 3: Start the React Frontend
In a separate terminal:
```bash
cd frontend
pnpm install
pnpm dev
```
Open **http://localhost:5173** in your browser.

---

## 5. Docker Compose Deployment (PostGIS + Redis + Full Stack)

Run the entire platform including PostgreSQL with PostGIS extension, Redis, FastAPI, Celery worker, and Nginx reverse proxy with one command:

```bash
docker compose up --build -d
```

Service mappings:
- **Web Dashboard**: http://localhost:80 or http://localhost:5173
- **FastAPI API & Docs**: http://localhost:8000/api/v1/docs
- **PostGIS Database**: localhost:5432 (User: `postgres`, DB: `agrishield_db`)
- **Redis Cache**: localhost:6379

---

## 6. High-Performance Computing (HPC) & Slurm

The `hpc/` directory contains standalone distributed scripts for massive-scale historical dataset processing and batch inference:

```bash
# Preprocess large-scale CSV/Parquet records
python hpc/preprocess_dataset.py --input data/sample/maharashtra_cotton_data.csv --output data/processed/hpc_processed.parquet

# Multi-threaded model training
python hpc/train_model.py --input data/processed/hpc_processed.parquet --threads 16

# Submit to a Slurm cluster
sbatch hpc/slurm_train.sh
sbatch hpc/slurm_predict.sh
```

---

## 7. Azure Cloud Architecture

Ready-to-deploy Infrastructure-as-Code templates are located in `infrastructure/azure/`:
- `infrastructure/azure/main.bicep`: Deploys Azure Database for PostgreSQL (with `POSTGIS` extension enabled), Azure Container Apps Environment, Azure Container Registry, Key Vault, and Application Insights.

Deploy to Azure:
```bash
az group create --name rg-agrishield-prod --location centralindia
az deployment group create --resource-group rg-agrishield-prod --template-file infrastructure/azure/main.bicep
```

---

## 8. Verification & Automated Tests

Run the test suite to verify database health, risk engine calculation, ML models, and API endpoints:

```bash
python -m pytest backend/tests -v
```

All 9 test suites cover:
1. `test_dashboard_statistics`: Verifies live metrics and dynamic aggregation.
2. `test_villages_endpoint`: Verifies GIS coordinates and risk categorizations.
3. `test_farmers_endpoint`: Tests grower and farm parcel directories.
4. `test_alerts_endpoint`: Tests early warning threshold evaluation.
5. `test_check_db_health`: Tests PostGIS/RDBMS connectivity.
6. `test_health_check_endpoint`: Tests `/api/v1/health` response schema.
7. `test_dataset_generation`: Tests Maharashtra agro-climatic dataset generation.
8. `test_ml_model_artifacts_and_explanation`: Tests XGBoost inference and SHAP local feature drivers.
9. `test_village_risk_engine_evaluation`: Tests complete 10-step risk assessment sequence.

---

## 9. License

This project is licensed under the MIT License — see the LICENSE file for details.

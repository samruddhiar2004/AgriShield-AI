# AgriShield AI — Azure Enterprise Deployment Architecture

This document details the production cloud deployment strategy for AgriShield AI on Microsoft Azure.

---

## 1. Cloud Architecture Overview

```
                      +-----------------------------+
                      |   Azure Static Web Apps     |
                      |   or Container App Frontend |
                      +--------------+--------------+
                                     |  (Reverse Proxy / HTTPS)
                                     v
                      +-----------------------------+
                      |  Azure Container Apps       |
                      |  FastAPI Backend Microservice|
                      +--------------+--------------+
                                     |
         +---------------------------+---------------------------+
         |                           |                           |
         v                           v                           v
+------------------+       +------------------+       +-------------------+
| Azure DB for     |       | Azure Cache      |       | Azure Blob        |
| PostgreSQL       |       | for Redis        |       | Storage           |
| (PostGIS 3.3)    |       | (Task Queues)    |       | (Farmer Photos)   |
+------------------+       +------------------+       +-------------------+
         ^                           ^
         |                           |
+------------------------------------+------------------------------------+
| Azure Key Vault (Secrets) & Application Insights (Telemetry & Metrics)  |
+-------------------------------------------------------------------------+
```

---

## 2. Target Azure Components

| Component | Service | Purpose |
|---|---|---|
| **Frontend** | Azure Static Web Apps / Container Apps | Global CDN distribution, low-latency UI |
| **API Backend** | Azure Container Apps | Scalable serverless container hosting FastAPI |
| **Spatial Database** | Azure Database for PostgreSQL (Flexible Server) | Geospatial GIS queries with PostGIS |
| **Worker Queue** | Azure Cache for Redis | Celery background risk recalculation |
| **Media & Parquet** | Azure Blob Storage | Farmer observation photos & historical datasets |
| **Secrets Management** | Azure Key Vault | Zero-trust credentials and connection strings |
| **Observability** | Application Insights & Azure Monitor | Distributed tracing, APM, and alerting |

---

## 3. Deployment Steps via Azure CLI & Bicep

### Step 1: Create Resource Group
```bash
az group create --name rg-agrishield-prod --location centralindia
```

### Step 2: Deploy Infrastructure Template
```bash
az deployment group create \
  --resource-group rg-agrishield-prod \
  --template-file infrastructure/azure/main.bicep \
  --parameters \
    dbAdminPassword="YourStrongPassword#2026" \
    appSecretKey="a4c9f1e089d84e2a901f46b9a2c3d5e7"
```

### Step 3: Enable PostGIS in Azure PostgreSQL
After provisioning, connect to the database via `psql` or Azure Portal and run:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
SELECT PostGIS_Version();
```

### Step 4: Build & Push Docker Containers to Azure Container Registry (ACR)
```bash
# Login to ACR
az acr login --name agrishieldprodacr

# Build and Push Backend
az acr build --registry agrishieldprodacr --image agrishield-backend:v1 -f infrastructure/docker/Dockerfile.backend .

# Build and Push Frontend
az acr build --registry agrishieldprodacr --image agrishield-frontend:v1 -f infrastructure/docker/Dockerfile.frontend .
```

### Step 5: Configure Container App Environment Variables
Ensure the following variables are configured in Azure Container Apps:
- `DATABASE_URL`: `postgresql+psycopg2://agrishieldadmin:<password>@<server>.postgres.database.azure.com:5432/agrishield_db?sslmode=require`
- `REDIS_URL`: `rediss://:<password>@<redis-server>.redis.cache.windows.net:6380/0`
- `SECRET_KEY`: Key Vault reference or secured string
- `OPEN_METEO_BASE_URL`: `https://api.open-meteo.com/v1`

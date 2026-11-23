import json
from typing import Optional, Dict
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from backend.app.database.session import get_db
from backend.app.services.ingestion_service import IngestionService

router = APIRouter()

@router.post("/preview")
async def preview_incoming_dataset(file: UploadFile = File(...)):
    """
    Parses an uploaded dataset file (CSV, Excel, Parquet) and auto-detects column-to-parameter mappings.
    """
    try:
        content = await file.read()
        preview = IngestionService.preview_dataset(content, file.filename or "dataset.csv")
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to preview dataset: {str(e)}")

@router.post("/process")
async def process_and_ingest_dataset(
    file: UploadFile = File(...),
    custom_mapping: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """
    Grasps parameters from incoming dataset, ingests records, auto-fills missing weather,
    and runs the 10-step Village Risk Engine to generate new outbreak predictions.
    """
    try:
        content = await file.read()
        mapping_dict = None
        if custom_mapping:
            mapping_dict = json.loads(custom_mapping)

        result = IngestionService.process_and_ingest(
            db=db,
            file_bytes=content,
            filename=file.filename or "dataset.csv",
            custom_mapping=mapping_dict
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Data ingestion failed: {str(e)}")

@router.get("/template")
def download_sample_template():
    """
    Returns a sample CSV template for field surveillance and farmer records.
    """
    csv_content = (
        "village_name,district,latitude,longitude,farmer_name,farmer_id,survey_number,area_hectares,"
        "crop,growth_stage,temperature,humidity,rainfall,symptoms,disease_name,affected_plants_pct\n"
        "Babhulgaon,Yavatmal,20.5501,78.3302,Rameshwar Patil,FMR-MH-001,Gat-101,3.5,Cotton,Flowering,29.5,82.0,25.0,Rosetted flowers with bored pinholes,Pink Bollworm,18.0\n"
        "Kalamb,Yavatmal,20.4431,78.3411,Suresh Jadhav,FMR-MH-002,Gat-102,2.8,Cotton,Squaring,30.0,76.0,10.0,Square drops and minor pinholes,Pink Bollworm,12.0\n"
        "Achalpur,Amravati,21.2570,77.5080,Gajanan Rathod,FMR-MH-003,Gat-103,4.2,Cotton,Flowering,28.5,85.0,40.0,Water soaked angular lesions on leaves,Bacterial Blight,22.0\n"
    )
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=agrishield_data_template.csv"}
    )

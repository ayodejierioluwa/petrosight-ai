from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from scraper import DatasetScraper
from data_generator import generate_synthetic_telemetry, generate_mock_maintenance_logs
from ml_pipeline import MLPipeline
from pipeline_ml import PipelineML
from compressor_ml import CompressorML
from agentic_briefing import AgenticBriefingEngine
from datetime import datetime, timedelta
import asyncio
import json

app = FastAPI(title="PetroSight AI API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3005",
        "http://127.0.0.1:3005",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scraper = DatasetScraper()
ml_engine = MLPipeline()
pipeline_engine = PipelineML()
compressor_engine = CompressorML()
briefing_engine = AgenticBriefingEngine()

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to PetroSight AI API"}

@app.get("/api/datasets/search")
def search_datasets(q: str = "predictive maintenance oil gas"):
    """Search for public datasets across multiple sources."""
    uci_results = scraper.search_uci(q)
    datagov_results = scraper.search_data_gov(q)
    
    # Combine results
    all_results = uci_results + datagov_results
    return {"query": q, "total_found": len(all_results), "results": all_results}

@app.get("/api/datasets/publications")
def search_publications(q: str = "predictive maintenance ESP pump"):
    """Search for recent research papers."""
    results = scraper.fetch_recent_publications(q)
    return {"query": q, "results": results}

@app.get("/api/assets/telemetry")
def get_telemetry(asset_id: str = "ESP-001", records: int = 100):
    """Get synthetic telemetry data for an asset."""
    df = generate_synthetic_telemetry(num_records=records)
    # Convert to JSON-serializable format
    data = df.to_dict(orient="records")
    return {"asset_id": asset_id, "data": data}

@app.get("/api/assets/processed_telemetry")
def get_processed_telemetry(offset: int = 0, limit: int = 30):
    """Serve the real ML-processed predictive maintenance data."""
    df = ml_engine.get_processed_data()
    
    total_records = len(df)
    if offset >= total_records:
        offset = total_records - limit
        
    chunk = df.iloc[offset : offset + limit]
    
    # Simulate timestamps for the UI
    base_time = datetime.now() - timedelta(minutes=limit*5)
    
    data = []
    for i, row in enumerate(chunk.to_dict(orient="records")):
        row["timestamp"] = (base_time + timedelta(minutes=i*5)).isoformat()
        data.append(row)
        
    return {
        "asset_id": "UCI-AI4I-2020",
        "offset": offset,
        "limit": limit,
        "total_records": total_records,
        "data": data
    }

@app.get("/api/pipeline/processed_telemetry")
def get_pipeline_telemetry(offset: int = 0, limit: int = 30):
    """Serve the ML-processed pipeline sensor fusion data."""
    df = pipeline_engine.get_processed_data()
    
    total_records = len(df)
    if offset >= total_records:
        offset = total_records - limit
        
    chunk = df.iloc[offset : offset + limit]
    
    # Simulate timestamps for the UI (10 second intervals for faster pipeline data)
    base_time = datetime.now() - timedelta(seconds=limit*10)
    
    data = []
    for i, row in enumerate(chunk.to_dict(orient="records")):
        row["timestamp"] = (base_time + timedelta(seconds=i*10)).isoformat()
        data.append(row)
        
    return {
        "asset_id": "P-01-Trunkline",
        "offset": offset,
        "limit": limit,
        "total_records": total_records,
        "data": data
    }

@app.get("/api/assets/logs")
def get_logs(asset_id: str = "ESP-001"):
    """Get unstructured maintenance logs for an asset."""
    logs = generate_mock_maintenance_logs()
    return {"asset_id": asset_id, "logs": logs}

@app.get("/api/compressors/processed_telemetry")
def get_compressor_telemetry(offset: int = 0, limit: int = 30):
    """Serve the ML-processed compressor telemetry data."""
    df = compressor_engine.get_processed_data()
    
    total_records = len(df)
    if offset >= total_records:
        offset = total_records - limit
        
    chunk = df.iloc[offset : offset + limit]
    
    # Simulate timestamps for the UI (5 second intervals)
    base_time = datetime.now() - timedelta(seconds=limit*5)
    
    data = []
    for i, row in enumerate(chunk.to_dict(orient="records")):
        row["timestamp"] = (base_time + timedelta(seconds=i*5)).isoformat()
        data.append(row)
        
    return {
        "asset_id": "C-001",
        "offset": offset,
        "limit": limit,
        "total_records": total_records,
        "data": data
    }

@app.get("/api/briefings/latest")
def get_latest_briefing():
    """Generate and serve a dynamic Agentic Briefing report."""
    return briefing_engine.generate_briefing()

@app.get("/api/assets/telemetry_stream")
async def assets_telemetry_stream():
    """Real-time SSE stream for ML predictive machine telemetry."""
    async def event_generator():
        df = ml_engine.get_processed_data()
        total_records = len(df)
        offset = 0
        while True:
            row = df.iloc[offset].to_dict()
            row["timestamp"] = datetime.now().isoformat()
            yield f"data: {json.dumps(row)}\n\n"
            offset = (offset + 1) % total_records
            await asyncio.sleep(0.2)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/pipeline/telemetry_stream")
async def pipeline_telemetry_stream():
    """Real-time SSE stream for pipeline sensor fusion telemetry."""
    async def event_generator():
        df = pipeline_engine.get_processed_data()
        total_records = len(df)
        offset = 0
        while True:
            row = df.iloc[offset].to_dict()
            row["timestamp"] = datetime.now().isoformat()
            yield f"data: {json.dumps(row)}\n\n"
            offset = (offset + 1) % total_records
            await asyncio.sleep(0.2)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/compressors/telemetry_stream")
async def compressors_telemetry_stream():
    """Real-time SSE stream for compressor machine telemetry."""
    async def event_generator():
        df = compressor_engine.get_processed_data()
        total_records = len(df)
        offset = 0
        while True:
            row = df.iloc[offset].to_dict()
            row["timestamp"] = datetime.now().isoformat()
            yield f"data: {json.dumps(row)}\n\n"
            offset = (offset + 1) % total_records
            await asyncio.sleep(0.2)
    return StreamingResponse(event_generator(), media_type="text/event-stream")

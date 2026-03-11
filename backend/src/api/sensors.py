"""Sensor data ingestion and historical data endpoints."""

from fastapi import APIRouter, HTTPException

from src.db import insert_reading, get_readings, get_latest_reading
from src.models import SensorReading, SensorReadingResponse

router = APIRouter(prefix="/api/sensor-data", tags=["sensors"])


@router.post("", response_model=SensorReadingResponse, status_code=201)
async def ingest_sensor_data(reading: SensorReading):
    """Accept a new sensor reading and persist it."""
    reading_id = await insert_reading(
        soil_moisture=reading.soil_moisture,
        temperature=reading.temperature,
        humidity=reading.humidity,
        light=reading.light,
    )
    # SSE broadcast placeholder — implemented in Task 10
    return SensorReadingResponse(status="ok", id=reading_id)


@router.get("/latest")
async def get_latest():
    """Return the most recent sensor reading."""
    row = await get_latest_reading()
    if row is None:
        raise HTTPException(status_code=404, detail="No readings found")
    return row


@router.get("")
async def get_historical(hours: int = 24, limit: int = 1000):
    """Return historical sensor readings within the past N hours."""
    rows = await get_readings(hours=hours, limit=limit)
    return {"readings": rows}

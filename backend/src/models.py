"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field


class SensorReading(BaseModel):
    soil_moisture: float = Field(ge=0, le=100, description="Soil moisture %")
    temperature: float = Field(ge=-40, le=80, description="Temperature °C")
    humidity: float = Field(ge=0, le=100, description="Humidity %")
    light: float = Field(ge=0, le=100, description="Light level (0=dark, 100=bright)")


class SensorReadingResponse(BaseModel):
    status: str
    id: int


class AnalysisResult(BaseModel):
    health_score: int = Field(ge=0, le=100)
    status: str  # 'healthy', 'warning', 'critical'
    issues: list[str]
    recommendations: list[str]
    analysis_type: str  # 'rule_based', 'ai_routine', 'ai_critical'
    model_used: str | None = None
    created_at: str


class PlantConfig(BaseModel):
    species: str
    name: str
    updated_at: str | None = None

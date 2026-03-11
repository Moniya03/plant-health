# pyright: reportMissingImports=false, reportDeprecated=false

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.db import init_db
from src.api.analysis import router as analysis_router
from src.api.sensors import router as sensors_router
from src.api.plant import router as plant_router
from src.api.health import router as health_router

app = FastAPI(
    title="Plant Health Monitor",
    description="IoT sensor data collection and AI-powered plant health analysis",
    version="0.1.0",
)

# CORS — never combine allow_credentials=True with wildcard origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=False,
)

# Routers
app.include_router(sensors_router)
app.include_router(plant_router)
app.include_router(health_router)
app.include_router(analysis_router)


@app.on_event("startup")
async def startup():
    await init_db()


@app.get("/")
async def root():
    return {"message": "Plant Health Monitor API"}

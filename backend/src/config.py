import os
from dotenv import load_dotenv

load_dotenv()

# Sensor thresholds (configurable via env vars)
SOIL_MOISTURE_LOW = float(os.getenv("SOIL_MOISTURE_LOW", "20"))
SOIL_MOISTURE_HIGH = float(os.getenv("SOIL_MOISTURE_HIGH", "80"))
TEMPERATURE_LOW = float(os.getenv("TEMPERATURE_LOW", "15"))
TEMPERATURE_HIGH = float(os.getenv("TEMPERATURE_HIGH", "35"))
HUMIDITY_LOW = float(os.getenv("HUMIDITY_LOW", "30"))
HUMIDITY_HIGH = float(os.getenv("HUMIDITY_HIGH", "80"))
LIGHT_LOW = float(os.getenv("LIGHT_LOW", "50"))
LIGHT_HIGH = float(os.getenv("LIGHT_HIGH", "101"))
MIN_READINGS_FOR_ANALYSIS = int(os.getenv("MIN_READINGS_FOR_ANALYSIS", "5"))
ANALYSIS_COOLDOWN_MINUTES = int(os.getenv("ANALYSIS_COOLDOWN_MINUTES", "30"))
SENSOR_INTERVAL_SECONDS = int(os.getenv("SENSOR_INTERVAL_SECONDS", "60"))
LLM_MAX_BUDGET = float(os.getenv("LLM_MAX_BUDGET", "10.0"))
DATABASE_PATH = os.getenv("DATABASE_PATH", "data/plant_health.db")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")

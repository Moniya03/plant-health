"""Seed script: insert 24h of realistic mock sensor data for development/demo.
Usage: cd backend && uv run python seed.py
"""

import asyncio
import math
import random
from datetime import datetime, timedelta

# Adjust Python path for src imports
import sys, os

sys.path.insert(0, os.path.dirname(__file__))

from src.db import (
    init_db,
    insert_reading,
    insert_analysis,
    update_plant_config,
    get_reading_count,
)


async def main():
    await init_db()

    # Set plant species
    await update_plant_config(species="Monstera deliciosa", name="My Plant")

    # Generate 1440 readings (1 per minute, starting 24h ago)
    now = datetime.utcnow()
    start_time = now - timedelta(hours=24)

    readings_inserted = 0
    for i in range(1440):
        t = start_time + timedelta(minutes=i)
        hour = t.hour + t.minute / 60.0  # fractional hour (0.0 - 24.0)

        # Temperature: day/night sine curve 18-28°C, peak at 14:00
        temp_base = 23 + 5 * math.sin(math.pi * (hour - 8) / 12)
        temperature = round(max(18, min(28, temp_base + random.gauss(0, 0.3))), 1)

        # Humidity: inverse of temperature (40-75%)
        humidity_base = 57 - 17 * math.sin(math.pi * (hour - 8) / 12)
        humidity = round(max(40, min(75, humidity_base + random.gauss(0, 1.0))), 1)

        # Binary light: bright during day (6-18), dark at night
        if 6 <= hour < 18:
            light = 100.0
            # Occasional cloud cover (5% chance during daytime)
            if random.random() < 0.05:
                light = 0.0
        else:
            light = 0.0

        # Soil moisture: starts at 65%, slowly decreases (evaporation), watering event at t=720min (noon)
        if i < 720:
            # Morning: 65% → 40%
            moisture_base = 65 - 25 * (i / 720)
        elif i < 750:
            # Watering event at noon: spike from 40% up to 70%
            moisture_base = 40 + 30 * ((i - 720) / 30)
        else:
            # Afternoon/evening: 70% → 50%
            moisture_base = 70 - 20 * ((i - 750) / 690)

        soil_moisture = round(max(20, min(80, moisture_base + random.gauss(0, 0.5))), 1)

        await insert_reading(
            soil_moisture=soil_moisture,
            temperature=temperature,
            humidity=humidity,
            light=float(light),
        )
        readings_inserted += 1

    # Insert 3 analysis results
    # 1. Healthy rule-based (12h ago)
    await insert_analysis(
        health_score=92,
        status="healthy",
        issues=[],
        recommendations=["Keep up the good care! Soil moisture is optimal."],
        analysis_type="rule_based",
        model_used=None,
    )

    # 2. Warning AI (6h ago)
    await insert_analysis(
        health_score=68,
        status="warning",
        issues=["Soil moisture dropping below optimal range"],
        recommendations=[
            "Water the plant with 200ml",
            "Check drainage to prevent root rot",
        ],
        analysis_type="ai_analysis",
        model_used="gpt-4o-mini",
    )

    # 3. Recent healthy (1h ago)
    await insert_analysis(
        health_score=88,
        status="healthy",
        issues=[],
        recommendations=[
            "Plant is recovering well after watering. Maintain current care routine."
        ],
        analysis_type="rule_based",
        model_used=None,
    )

    total = await get_reading_count()
    print(
        f"Inserted {readings_inserted} readings, 3 analyses, species: Monstera deliciosa"
    )
    print(f"Total readings in DB: {total}")


if __name__ == "__main__":
    asyncio.run(main())

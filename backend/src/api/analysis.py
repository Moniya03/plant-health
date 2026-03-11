# pyright: reportMissingImports=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownArgumentType=false

from fastapi import APIRouter, HTTPException

from src.agents.flow import create_analysis_flow
from src.sse import broadcaster
from src.config import (
    HUMIDITY_HIGH,
    HUMIDITY_LOW,
    LIGHT_HIGH,
    LIGHT_LOW,
    MIN_READINGS_FOR_ANALYSIS,
    SOIL_MOISTURE_HIGH,
    SOIL_MOISTURE_LOW,
    TEMPERATURE_HIGH,
    TEMPERATURE_LOW,
)
from src.db import (
    get_analysis_history,
    get_latest_analysis,
    get_latest_reading,
    get_plant_config,
    get_reading_count,
    get_readings,
    insert_analysis,
)

router = APIRouter(prefix="/api", tags=["analysis"])


@router.post("/analyze", status_code=200)
async def trigger_analysis() -> dict[str, object]:
    reading_count = await get_reading_count()
    if reading_count < MIN_READINGS_FOR_ANALYSIS:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "insufficient_data",
                "message": f"Need at least {MIN_READINGS_FOR_ANALYSIS} sensor readings before analysis",
                "readings_count": reading_count,
            },
        )

    reading = await get_latest_reading()
    if not reading:
        raise HTTPException(
            status_code=400,
            detail={"error": "no_reading", "message": "No sensor readings found"},
        )

    recent_readings = await get_readings(hours=2, limit=12)
    plant_config = await get_plant_config()

    shared: dict[str, object] = {
        "reading": reading,
        "thresholds": {
            "soil_moisture_low": SOIL_MOISTURE_LOW,
            "soil_moisture_high": SOIL_MOISTURE_HIGH,
            "temperature_low": TEMPERATURE_LOW,
            "temperature_high": TEMPERATURE_HIGH,
            "humidity_low": HUMIDITY_LOW,
            "humidity_high": HUMIDITY_HIGH,
            "light_low": LIGHT_LOW,
            "light_high": LIGHT_HIGH,
        },
        "reading_count": reading_count,
        "plant_species": plant_config.get("species", "Unknown"),
        "recent_readings": recent_readings,
    }

    try:
        flow = create_analysis_flow()
        await flow.run_async(shared)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={"error": "pipeline_error", "message": str(exc)},
        ) from exc

    final = shared.get("final_analysis")
    if not isinstance(final, dict):
        final = _build_final_from_shared(shared)

    health_score_value = final.get("health_score", 50)
    health_score = health_score_value if isinstance(health_score_value, int) else 50
    status = final.get("status", "unknown")
    analysis_type = final.get("analysis_type", "rule_based")
    model_used = final.get("model_used")
    issues = _coerce_string_list(final.get("issues", []))
    recommendations = _coerce_string_list(final.get("recommendations", []))

    analysis_id = await insert_analysis(
        health_score=health_score,
        status=status if isinstance(status, str) else "unknown",
        issues=issues,
        recommendations=recommendations,
        analysis_type=analysis_type if isinstance(analysis_type, str) else "rule_based",
        model_used=model_used if isinstance(model_used, str) else None,
    )

    await broadcaster.broadcast("analysis", {
        "id": analysis_id,
        "health_score": health_score,
        "status": status if isinstance(status, str) else "unknown",
        "analysis_type": analysis_type if isinstance(analysis_type, str) else "rule_based",
    })
    return {**final, "id": analysis_id}


def _build_final_from_shared(shared: dict[str, object]) -> dict[str, object]:
    diagnosis = shared.get("diagnosis", {})
    care = shared.get("care_recommendations", {})
    rule = shared.get("rule_analysis", {})

    diagnosis_dict = diagnosis if isinstance(diagnosis, dict) else {}
    care_dict = care if isinstance(care, dict) else {}
    rule_dict = rule if isinstance(rule, dict) else {}

    issues = diagnosis_dict.get("issues", rule_dict.get("issues", []))
    if not isinstance(issues, list):
        issues = []

    recommendations: list[object] = []
    for key in ["immediate_actions", "weekly_routine", "watch_for"]:
        recs = care_dict.get(key, [])
        if isinstance(recs, list):
            recommendations.extend(recs)

    if not recommendations:
        diagnosis_recs = diagnosis_dict.get("recommendations", [])
        if isinstance(diagnosis_recs, list):
            recommendations = diagnosis_recs

    return {
        "health_score": diagnosis_dict.get("health_score", 50),
        "status": diagnosis_dict.get("status", "warning"),
        "issues": issues,
        "recommendations": recommendations,
        "analysis_type": "ai_analysis",
        "model_used": shared.get("model", "gpt-4o-mini"),
    }


def _coerce_string_list(value: object) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, str)]


@router.get("/analysis/latest")
async def get_latest() -> dict[str, object]:
    result = await get_latest_analysis()
    if not result:
        raise HTTPException(status_code=404, detail="No analysis results found")
    return result


@router.get("/analysis/history")
async def get_history(limit: int = 10) -> dict[str, object]:
    results = await get_analysis_history(limit=limit)
    return {"analyses": results, "count": len(results)}

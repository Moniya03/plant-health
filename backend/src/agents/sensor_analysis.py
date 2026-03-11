from typing import NotRequired, TypedDict, cast, override

from pocketflow import AsyncNode
from src.config import (
    SOIL_MOISTURE_LOW,
    SOIL_MOISTURE_HIGH,
    TEMPERATURE_LOW,
    TEMPERATURE_HIGH,
    HUMIDITY_LOW,
    HUMIDITY_HIGH,
    LIGHT_LOW,
    LIGHT_HIGH,
)


class SensorReading(TypedDict):
    soil_moisture: float
    temperature: float
    humidity: float
    light: float


class SensorThresholds(TypedDict):
    soil_moisture_low: float
    soil_moisture_high: float
    temperature_low: float
    temperature_high: float
    humidity_low: float
    humidity_high: float
    light_low: float
    light_high: float


class PrepResult(TypedDict):
    reading: SensorReading
    thresholds: SensorThresholds
    reading_count: int


class ExecResult(TypedDict):
    issues: list[str]
    is_anomaly: bool
    is_critical: bool
    needs_ai: bool


class SharedStore(TypedDict):
    reading: SensorReading
    thresholds: SensorThresholds
    reading_count: int
    rule_analysis: NotRequired[ExecResult]
    final_analysis: NotRequired[dict[str, object]]


class SensorAnalysisNode(AsyncNode):  # pyright: ignore[reportMissingTypeArgument]
    @override
    async def prep_async(self, shared: dict[str, object]) -> PrepResult:
        """Read latest sensor data and thresholds from shared store.
        exec_async has NO access to shared — pass everything needed here."""
        store = cast(SharedStore, cast(object, shared))
        thresholds: SensorThresholds = store.get(
            "thresholds",
            {
                "soil_moisture_low": SOIL_MOISTURE_LOW,
                "soil_moisture_high": SOIL_MOISTURE_HIGH,
                "temperature_low": TEMPERATURE_LOW,
                "temperature_high": TEMPERATURE_HIGH,
                "humidity_low": HUMIDITY_LOW,
                "humidity_high": HUMIDITY_HIGH,
                "light_low": LIGHT_LOW,
                "light_high": LIGHT_HIGH,
            },
        )
        return {
            "reading": store["reading"],
            "thresholds": thresholds,
            "reading_count": store["reading_count"],
        }

    @override
    async def exec_async(self, prep_res: PrepResult) -> ExecResult:
        """Rule-based analysis — NO LLM call, completely FREE.
        Returns structured result with issues and routing flags."""
        reading = prep_res["reading"]
        thresholds = prep_res["thresholds"]
        issues: list[str] = []

        # Check soil moisture
        if reading["soil_moisture"] < thresholds["soil_moisture_low"]:
            issues.append(f"Soil is too dry ({reading['soil_moisture']:.1f}%) — needs watering")
        elif reading["soil_moisture"] > thresholds["soil_moisture_high"]:
            issues.append(f"Soil is overwatered ({reading['soil_moisture']:.1f}%) — reduce watering")

        # Check temperature
        if reading["temperature"] < thresholds["temperature_low"]:
            issues.append(f"Temperature too cold ({reading['temperature']:.1f}°C) — move to warmer location")
        elif reading["temperature"] > thresholds["temperature_high"]:
            issues.append(f"Temperature too hot ({reading['temperature']:.1f}°C) — move away from heat")

        # Check humidity
        if reading["humidity"] < thresholds["humidity_low"]:
            issues.append(f"Air humidity too low ({reading['humidity']:.1f}%) — consider a humidifier")
        elif reading["humidity"] > thresholds["humidity_high"]:
            issues.append(f"Air humidity too high ({reading['humidity']:.1f}%) — improve ventilation")

        # Check light
        if reading["light"] < thresholds["light_low"]:
            issues.append(f"Light level too low ({reading['light']:.0f} lux) — move to brighter location")
        elif reading["light"] > thresholds["light_high"]:
            issues.append(f"Light level too intense ({reading['light']:.0f} lux) — provide shade")

        # Critical: moisture extremely low OR temperature extremely high
        is_critical = (
            reading["soil_moisture"] < thresholds["soil_moisture_low"] * 0.5
            or reading["temperature"] > thresholds["temperature_high"] * 1.1
        )
        is_anomaly = len(issues) > 0

        return {
            "issues": issues,
            "is_anomaly": is_anomaly,
            "is_critical": is_critical,
            "needs_ai": is_anomaly,
        }

    @override
    async def post_async(self, shared: dict[str, object], prep_res: PrepResult, exec_res: ExecResult) -> str:
        """Store results in shared, decide routing."""
        store = cast(SharedStore, cast(object, shared))
        store["rule_analysis"] = exec_res
        if exec_res["is_critical"]:
            return "critical"  # → gpt-4o path
        elif exec_res["needs_ai"]:
            return "anomaly"  # → gpt-4o-mini path
        else:
            # Normal readings — generate rule-based result, SKIP LLM
            reading = prep_res["reading"]
            thresholds = prep_res["thresholds"]
            health_score = self._calculate_health_score(reading, thresholds)
            store["final_analysis"] = {
                "health_score": health_score,
                "status": "healthy",
                "issues": [],
                "recommendations": ["Keep up the good care!"],
                "analysis_type": "rule_based",
                "model_used": None,
            }
            return "healthy"  # → skip AI agents

    def _calculate_health_score(self, reading: SensorReading, thresholds: SensorThresholds) -> int:
        """Score 70-100 based on proximity to optimal range center."""
        score = 100
        # Soil moisture: optimal midpoint
        sm_mid = (thresholds["soil_moisture_low"] + thresholds["soil_moisture_high"]) / 2
        sm_range = (thresholds["soil_moisture_high"] - thresholds["soil_moisture_low"]) / 2
        sm_deviation = abs(reading["soil_moisture"] - sm_mid) / sm_range
        score -= int(min(sm_deviation, 1.0) * 10)

        # Temperature: optimal midpoint
        t_mid = (thresholds["temperature_low"] + thresholds["temperature_high"]) / 2
        t_range = (thresholds["temperature_high"] - thresholds["temperature_low"]) / 2
        t_deviation = abs(reading["temperature"] - t_mid) / t_range
        score -= int(min(t_deviation, 1.0) * 10)

        return max(70, min(100, score))

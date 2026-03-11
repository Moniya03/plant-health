# pyright: reportMissingImports=false, reportMissingTypeArgument=false, reportUnknownParameterType=false, reportUnknownVariableType=false, reportUnusedExpression=false, reportOperatorIssue=false

"""PocketFlow wiring for the multi-agent analysis pipeline.

Shared Store Schema:
INPUT:
  reading: dict - {soil_moisture, temperature, humidity, light}
  thresholds: dict - from config.py
  reading_count: int - total readings in DB
  plant_species: str - user's plant species
  recent_readings: list[dict] - last 12 readings for trend analysis

OUTPUT (populated by agents):
  rule_analysis: dict - Agent 1 results
  diagnosis: dict - Agent 2 LLM results (if AI triggered)
  care_recommendations: dict - Agent 3 results (if AI triggered)
  web_research: list[dict] - Agent 4 results (if low confidence)
  final_analysis: dict - merged final result for storage
"""

from pocketflow import AsyncFlow

from src.agents.care_advisor import CareAdvisorNode
from src.agents.diagnosis import PlantDiagnosisNode
from src.agents.sensor_analysis import SensorAnalysisNode
from src.agents.web_research import WebResearchNode


def create_analysis_flow() -> AsyncFlow:
    sensor_analysis = SensorAnalysisNode()
    diagnosis = PlantDiagnosisNode()
    care_advisor = CareAdvisorNode()
    web_research = WebResearchNode()

    sensor_analysis - "anomaly" >> diagnosis
    sensor_analysis - "critical" >> diagnosis
    diagnosis - "next" >> care_advisor
    care_advisor - "research" >> web_research
    care_advisor - "done" >> None
    web_research - "done" >> None

    return AsyncFlow(start=sensor_analysis)

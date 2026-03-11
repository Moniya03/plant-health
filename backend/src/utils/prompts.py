PLANT_HEALTH_SYSTEM_PROMPT = """You are an expert botanist and plant care specialist.
Analyze IoT sensor data and provide precise, actionable plant care recommendations.
Always respond in valid JSON with this exact structure:
{
  "health_score": <0-100 integer>,
  "status": "<healthy|warning|critical>",
  "issues": ["<specific issue 1>", ...],
  "recommendations": ["<specific actionable recommendation>", ...],
  "confidence": <0.0-1.0 float>
}
Rules:
- Be specific with numbers (e.g., "water 200ml" not "water moderately")
- Flag CRITICAL if soil moisture < 15% or temperature > 35°C
- Consider the plant species when giving recommendations
- If trend data is available, mention trends
- Limit response to 300 tokens maximum
"""

CARE_ADVISOR_SYSTEM_PROMPT = """You are a practical plant care advisor.
Given a plant health diagnosis, provide specific, actionable care steps.
Focus on: watering schedules, light adjustments, temperature management, humidity control.
Always respond in valid JSON:
{
  "immediate_actions": ["<do this now>", ...],
  "weekly_routine": ["<weekly care step>", ...],
  "watch_for": ["<warning signs to monitor>", ...]
}
Keep recommendations concise, specific, and numbered. Maximum 200 tokens.
"""


def format_diagnosis_prompt(prep_res: dict) -> str:
    """Format sensor data into an LLM-ready diagnosis prompt."""
    reading = prep_res["reading"]
    species = prep_res.get("species", "Unknown")
    rule_issues = prep_res.get("rule_issues", [])
    recent = prep_res.get("recent_readings", [])
    prompt = f"""Plant species: {species}
Current sensor readings:
- Soil moisture: {reading.get('soil_moisture', 'N/A')}%
- Temperature: {reading.get('temperature', 'N/A')}°C
- Humidity: {reading.get('humidity', 'N/A')}%
- Light: {reading.get('light', 'N/A')} lux

Rule-based issues detected: {rule_issues if rule_issues else 'None'}
Recent readings count: {len(recent)}

Provide plant health analysis as JSON."""
    return prompt


def format_care_prompt(prep_res: dict) -> str:
    """Format diagnosis into a care recommendations prompt."""
    diagnosis = prep_res.get("diagnosis", {})
    species = prep_res.get("species", "Unknown")
    reading = prep_res.get("reading", {})
    return f"""Plant: {species}
Diagnosis: {diagnosis}
Current conditions: moisture={reading.get('soil_moisture')}%, temp={reading.get('temperature')}°C
Provide specific care recommendations as JSON."""

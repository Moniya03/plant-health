# pyright: reportMissingImports=false, reportMissingTypeArgument=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownParameterType=false, reportUnknownArgumentType=false, reportImplicitOverride=false
from pocketflow import AsyncNode

from src.utils.call_llm import call_llm
from src.utils.prompts import PLANT_HEALTH_SYSTEM_PROMPT, format_diagnosis_prompt


class PlantDiagnosisNode(AsyncNode):
    async def prep_async(self, shared: dict[str, object]) -> dict[str, object]:
        model = "gpt-4o" if shared.get("model") == "gpt-4o" else "gpt-4o-mini"
        rule_analysis = shared.get("rule_analysis", {})
        rule_issues = rule_analysis.get("issues", []) if isinstance(rule_analysis, dict) else []
        return {
            "reading": shared["reading"],
            "species": shared.get("plant_species", "Unknown"),
            "rule_issues": rule_issues,
            "recent_readings": shared.get("recent_readings", []),
            "model": model,
        }

    async def exec_async(self, prep_res: dict[str, object]) -> dict:
        messages = [
            {"role": "system", "content": PLANT_HEALTH_SYSTEM_PROMPT},
            {"role": "user", "content": format_diagnosis_prompt(prep_res)},
        ]
        model_value = prep_res.get("model", "gpt-4o-mini")
        model = model_value if isinstance(model_value, str) else "gpt-4o-mini"
        try:
            result = await call_llm(messages=messages, model=model)
            return result
        except Exception:
            issues = prep_res.get("rule_issues", [])
            return {
                "health_score": 50,
                "status": "warning",
                "issues": issues if isinstance(issues, list) else [],
                "recommendations": ["Review sensor data and retry AI diagnosis when API is available."],
                "confidence": 0.0,
            }

    async def post_async(self, shared: dict[str, object], prep_res: dict[str, object], exec_res: dict) -> str:
        shared["diagnosis"] = exec_res
        return "next"

# pyright: reportMissingImports=false, reportMissingTypeArgument=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownParameterType=false, reportUnknownArgumentType=false, reportImplicitOverride=false
from pocketflow import AsyncNode

from src.utils.call_llm import call_llm
from src.utils.prompts import CARE_ADVISOR_SYSTEM_PROMPT, format_care_prompt


class CareAdvisorNode(AsyncNode):
    async def prep_async(self, shared: dict[str, object]) -> dict[str, object]:
        return {
            "diagnosis": shared["diagnosis"],
            "species": shared.get("plant_species", "Unknown"),
            "reading": shared["reading"],
        }

    async def exec_async(self, prep_res: dict[str, object]) -> dict:
        messages = [
            {"role": "system", "content": CARE_ADVISOR_SYSTEM_PROMPT},
            {"role": "user", "content": format_care_prompt(prep_res)},
        ]
        result = await call_llm(messages=messages, model="gpt-4o-mini")
        return result

    async def post_async(self, shared: dict[str, object], prep_res: dict[str, object], exec_res: dict) -> str:
        shared["care_recommendations"] = exec_res
        diagnosis = shared.get("diagnosis", {})
        confidence = diagnosis.get("confidence", 1.0) if isinstance(diagnosis, dict) else 1.0
        if isinstance(confidence, (int, float)) and confidence < 0.7:
            return "research"
        return "done"

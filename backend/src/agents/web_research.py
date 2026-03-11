# pyright: reportMissingImports=false, reportMissingTypeArgument=false, reportUnknownVariableType=false, reportUnknownMemberType=false, reportUnknownParameterType=false, reportUnknownArgumentType=false, reportImplicitOverride=false, reportUnnecessaryIsInstance=false
from pocketflow import AsyncNode

from src.utils.call_llm import call_llm
from src.utils.search_web import search_web


class WebResearchNode(AsyncNode):
    MAX_SEARCHES: int = 3

    async def prep_async(self, shared: dict[str, object]) -> dict[str, object]:
        diagnosis = shared.get("diagnosis", {})
        species = shared.get("plant_species", "Unknown")
        issues = diagnosis.get("issues", []) if isinstance(diagnosis, dict) else []
        queries = [f"{species} {issue}" for issue in issues[: self.MAX_SEARCHES]]
        return {"queries": queries, "species": species}

    async def exec_async(self, prep_res: dict[str, object]) -> list[dict]:
        all_results: list[dict] = []
        queries = prep_res.get("queries", [])
        if not isinstance(queries, list):
            return all_results
        for query in queries:
            results = await search_web(query, max_results=3)
            all_results.extend(results)
        return all_results

    async def post_async(self, shared: dict[str, object], prep_res: dict[str, object], exec_res: list[dict]) -> str:
        shared["web_research"] = exec_res
        if exec_res:
            synthesis = await self._synthesize_research(shared, exec_res)
            care_recommendations = shared.get("care_recommendations", {})
            if isinstance(care_recommendations, dict):
                care_recommendations["web_insights"] = synthesis
        return "done"

    async def _synthesize_research(self, shared: dict[str, object], results: list[dict]) -> str:
        species = shared.get("plant_species", "Unknown")
        summaries = [r.get("body", r.get("snippet", r.get("content", ""))) for r in results[:6]]
        content = "\n".join(summaries)
        messages = [
            {
                "role": "system",
                "content": "You are a plant care expert. Summarize these web search results into 2-3 specific, actionable insights. Respond in plain text, no JSON.",
            },
            {
                "role": "user",
                "content": f"Plant: {species}\nSearch results:\n{content}\n\nSummarize key care insights:",
            },
        ]
        result = await call_llm(messages=messages, model="gpt-4o-mini", response_format=None)
        if isinstance(result, dict):
            return str(result)
        return result

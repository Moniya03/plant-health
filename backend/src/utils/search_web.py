import os
import asyncio
from typing import Optional


async def search_web(query: str, max_results: int = 3) -> list[dict]:
    """Search web using Tavily (primary) or DuckDuckGo (fallback).
    Returns list of {"title": str, "url": str, "content": str}
    """
    tavily_key = os.getenv("TAVILY_API_KEY")
    if tavily_key:
        try:
            return await _search_tavily(query, max_results, tavily_key)
        except Exception:
            pass  # Fall through to DuckDuckGo
    return await _search_duckduckgo(query, max_results)


async def _search_tavily(query: str, max_results: int, api_key: str) -> list[dict]:
    from tavily import TavilyClient
    client = TavilyClient(api_key=api_key)
    # TavilyClient is sync — run in thread to avoid blocking event loop
    result = await asyncio.to_thread(client.search, query, max_results=max_results)
    return [
        {"title": r.get("title", ""), "url": r.get("url", ""), "content": r.get("content", "")}
        for r in result.get("results", [])
    ]


async def _search_duckduckgo(query: str, max_results: int) -> list[dict]:
    from duckduckgo_search import DDGS

    def _do_search() -> list:
        # Use _text_html directly as DDGS v8.x forces bing backend in text()
        # which is unreliable in async thread contexts
        d = DDGS()
        try:
            return d._text_html(query, None, None, max_results)
        except Exception:
            return list(d.text(query, max_results=max_results))

    # DDGS is sync — run in thread to avoid blocking event loop
    results = await asyncio.to_thread(_do_search)
    return [
        {"title": r.get("title", ""), "url": r.get("href", ""), "content": r.get("body", "")}
        for r in results
    ]

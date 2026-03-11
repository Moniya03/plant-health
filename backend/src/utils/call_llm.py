import json
from litellm import acompletion


async def call_llm(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    response_format: dict | None = None,
    max_tokens: int = 500,
    temperature: float = 0.3,
) -> dict:
    """Call LLM via LiteLLM. Returns parsed JSON or raw dict."""
    kwargs = dict(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        temperature=temperature,
    )
    if response_format:
        kwargs["response_format"] = response_format
    response = await acompletion(**kwargs)
    content = response.choices[0].message.content
    try:
        return json.loads(content)
    except (json.JSONDecodeError, TypeError):
        return {"raw": content}


async def call_llm_stream(
    messages: list[dict],
    model: str = "gpt-4o-mini",
    max_tokens: int = 500,
):
    """Streaming LLM call via LiteLLM. Async generator yielding content chunks."""
    response = await acompletion(
        model=model,
        messages=messages,
        max_tokens=max_tokens,
        stream=True,
    )
    async for chunk in response:
        content = chunk.choices[0].delta.content
        if content:
            yield content

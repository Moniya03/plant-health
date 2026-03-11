"""SSE stream endpoint — clients subscribe to real-time plant sensor and analysis events."""

import asyncio
import json
from datetime import datetime
from typing import AsyncGenerator

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from src.sse import broadcaster

router = APIRouter(prefix="/api", tags=["stream"])


async def _generate(request: Request, q: asyncio.Queue) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted strings; send heartbeat every 15 s on idle."""
    # Send initial ping so client knows connection is live
    yield f"event: ping\ndata: {json.dumps({'ts': datetime.utcnow().isoformat()})}\n\n"

    try:
        while True:
            if await request.is_disconnected():
                break
            try:
                msg = await asyncio.wait_for(q.get(), timeout=15.0)
                yield f"event: {msg['event']}\ndata: {msg['data']}\n\n"
            except asyncio.TimeoutError:
                yield f"event: ping\ndata: {json.dumps({'ts': datetime.utcnow().isoformat()})}\n\n"
    finally:
        broadcaster.unsubscribe(q)


@router.get("/stream")
async def stream(request: Request) -> StreamingResponse:
    """Subscribe to real-time Server-Sent Events (sensor_data, analysis, ping)."""
    q = broadcaster.subscribe()
    return StreamingResponse(
        _generate(request, q),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )

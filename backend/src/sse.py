"""SSE broadcaster — fan-out events to all connected clients via per-client asyncio.Queue."""

import asyncio
import json


class SSEBroadcaster:
    def __init__(self) -> None:
        self._clients: list[asyncio.Queue] = []

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=50)
        self._clients.append(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        try:
            self._clients.remove(q)
        except ValueError:
            pass  # already removed (e.g. evicted as dead client)

    async def broadcast(self, event_type: str, data: dict) -> None:
        message = {"event": event_type, "data": json.dumps(data)}
        dead: list[asyncio.Queue] = []
        for q in self._clients:
            try:
                q.put_nowait(message)
            except asyncio.QueueFull:
                dead.append(q)
        for q in dead:
            try:
                self._clients.remove(q)
            except ValueError:
                pass


broadcaster = SSEBroadcaster()

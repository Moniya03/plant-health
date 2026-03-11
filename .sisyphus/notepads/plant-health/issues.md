# Plant Health Project - Issues & Gotchas

## Known Gotchas
- PocketFlow AsyncNode: exec_async() gets NO access to `shared` - only prep_res
- FastAPI ≥0.135.0 has native SSE via `from fastapi.sse import EventSourceResponse`
- SQLite MUST use WAL mode at connection init to prevent "database is locked"
- ESP32 DHT11 has ~5% NaN rate - firmware must guard with isnan()
- Tailwind v4 compatibility with shadcn - may need to fall back to v3
- SSE broadcaster breaks with multiple uvicorn workers - single worker REQUIRED
- PocketFlow routing: post_async() return value determines next node (string action)
- Recharts: ResponsiveContainer is MANDATORY - without it renders at 0px width
- node1 - "action" >> node2 is PocketFlow's DSL for wiring

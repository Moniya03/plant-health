# Plant Health Project - Decisions

## Architecture
- SQLite (local, no cloud) over Turso
- React + Vite (SPA) over Next.js
- FastAPI + PocketFlow (Python) for AI pipeline
- LiteLLM tiered: rule-based (free) → gpt-4o-mini (routine) → gpt-4o (critical)
- Tavily primary, DuckDuckGo fallback for web search
- Vercel for frontend, Docker for backend
- uv for Python package management
- SSE for real-time (no WebSocket)

## Wave Execution Order
- Wave 1: Task 1 → then Tasks 2 & 3 in parallel
- Wave 2: Tasks 4, 5, 6, 7 in parallel (all depend on Wave 1)
- Wave 3: Task 8 → Task 9 → Tasks 10, 11, 12 (some parallel)
- Wave 4: Tasks 13 & 14 parallel → Task 15 → Task 16
- Wave 5: Tasks 17 & 18 parallel → Task 19
- Final: F1, F2, F3, F4 in parallel

# Plant Health Project - Learnings

## Architecture Decisions
- Worktree: /home/moniya/personal/plant-health (main branch)
- Backend: FastAPI + PocketFlow + aiosqlite + LiteLLM
- Frontend: React + Vite + Tailwind v4 + Shadcn UI + Recharts + Framer Motion
- Database: SQLite with WAL mode via aiosqlite ONLY (NO sqlite3 import in async code)
- Package manager: uv (Python), npm (Node)
- PocketFlow: AsyncNode/AsyncFlow ONLY - NEVER sync Node/Flow for I/O
- SSE: single uvicorn worker required (in-memory broadcaster)
- No authentication, no multi-plant, no WebSocket, no dark mode

## Critical Constraints
- NO `import sqlite3` in async code - aiosqlite only
- NO `allow_origins=["*"]` with `allow_credentials=True`
- NO LLM calls on every sensor reading - rule-based gating
- NO mutable state on PocketFlow node instances - use `shared` dict
- NO tailwind.config.js - Tailwind v4 CSS-first @theme
- NO Heroicons - Lucide only
- Sensor threshold constants must come from backend/src/config.py
- MIN_READINGS_FOR_ANALYSIS = 5 (before AI can run)

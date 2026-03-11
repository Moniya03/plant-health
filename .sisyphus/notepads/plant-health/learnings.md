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

## [2026-03-11] Task 1: Project Scaffolding & Configuration

### Completed
- ✅ Full monorepo skeleton created: backend/, frontend/, firmware/, .github/workflows/
- ✅ backend/pyproject.toml configured with uv format + all 10 dependencies
- ✅ backend/src/config.py with 14 threshold constants + env var loading
- ✅ backend/src/main.py FastAPI stub with root endpoint
- ✅ .env.example with all 16 required environment variables
- ✅ Comprehensive .gitignore (Python, Node, SQLite, OS, IDE, evidence)
- ✅ README.md with architecture overview and setup instructions
- ✅ uv.lock generated from uv sync (dependencies: FastAPI 0.135.0+, uvicorn, aiosqlite, LiteLLM, PocketFlow, pydantic, httpx, python-dotenv, tavily-python, duckduckgo-search)
- ✅ All 3 QA scenarios passing:
  1. Monorepo structure verified (all directories + files present)
  2. Git repo valid (.gitignore contains __pycache__, .env, *.db)
  3. Config module loads defaults (SOIL_MOISTURE_LOW=20.0, DATABASE_PATH=data/plant_health.db)
- ✅ Evidence saved to .sisyphus/evidence/task-1-*.txt
- ✅ Committed with message: "chore: scaffold monorepo with backend, frontend, firmware structure"

### Key Decisions
- uv as Python package manager (not pip, not poetry)
- hatchling build backend with src-layout
- Python 3.11+ requirement
- No readme in backend/pyproject.toml (root has it)
- Tool hatch config specifies packages = ["src"]

### Blockers Resolved
- uv not in PATH initially → installed from astral.sh script
- pyproject.toml validation error (missing README) → removed readme field
- Build system error (no package dir) → added tool.hatch.build.targets.wheel configuration

### Next Steps
- Task 2: ESP32 firmware scaffold + sensor reading loop
- Task 3: Backend database schema + API scaffolding
- Task 4: Backend sensor simulation + analysis endpoints
- Task 5: Frontend scaffolding (React + Vite + Shadcn UI)

## [2026-03-11] Task 2: ESP32 Firmware Sketch

### Completed
- ✅ firmware/plant_health_sensor/plant_health_sensor.ino created (185 lines)
- ✅ All 4 required headers: WiFi.h, HTTPClient.h, DHT.h, ArduinoJson.h
- ✅ DHTData struct for bundling temperature, humidity, valid flag
- ✅ setup(): Serial.begin(115200), dht.begin(), pinMode, WiFi retry loop (max 20 × 500ms)
- ✅ loop(): WiFi reconnect check, sensor reads, isnan guard, StaticJsonDocument POST, HTTP response logging
- ✅ readSoilMoisture(): map(rawValue, 4095, 0, 0, 100) — capacitive sensor inverted mapping
- ✅ readDHT(): isnan check, valid flag, returns DHTData struct
- ✅ readLDR(): voltage → R_ldr → lux approximation via 10kΩ divider, clamped 0–65535
- ✅ All 7 QA checks passing (WiFi.h×1, DHT.h×1, ArduinoJson.h×1, setup×1, loop×1, isnan≥1, WiFi.status≥1)
- ✅ No forbidden features: no deep sleep, OTA, captive portal, MQTT, HTTPS
- ✅ Evidence saved to .sisyphus/evidence/task-2-firmware.txt and task-2-no-forbidden.txt
- ✅ Committed: "feat(firmware): add ESP32 sensor reading and HTTP POST sketch"

### Key Decisions
- Used StaticJsonDocument<256> for fixed-size JSON on embedded device
- Forward declarations added to avoid C++ implicit-declaration warnings
- LDR lux formula: 500 / (R_ldr_kΩ) — simple approximation for 10kΩ divider circuit
- Capacitive soil sensor: inverted ADC mapping (4095=dry, 0=wet) unlike resistive sensors
- HTTP (not HTTPS) as explicitly required — no WiFiClientSecure
- isnan() guard appears twice: in readDHT() for detection, in loop() as final gate before POST

### Patterns
- ESP32 ADC is 12-bit (0–4095), VRef 3.3V
- DHT11 can return NaN on read failure — always guard with isnan()
- WiFi.status() != WL_CONNECTED is the reconnect trigger pattern
- StaticJsonDocument is stack-allocated, preferred over DynamicJsonDocument for ESP32

## [2026-03-11] Task 3: SQLite Schema & Async Database Module

### Completed
- ✅ backend/src/db.py created (226 lines, 14 async functions)
- ✅ Database initialization with WAL mode: PRAGMA journal_mode=WAL, PRAGMA synchronous=NORMAL
- ✅ 3 tables created:
  - sensor_readings: id, soil_moisture, temperature, humidity, light, created_at (with index on created_at)
  - analysis_results: id, health_score, status, issues, recommendations, analysis_type, model_used, raw_response, created_at
  - plant_config: singleton row (id=1) for species + name + updated_at
- ✅ Core CRUD functions implemented:
  - insert_reading() — returns lastrowid
  - get_readings(hours, limit) — historical data with datetime filter
  - get_latest_reading() — most recent sensor reading
  - insert_analysis() — stores health_score, status, issues[], recommendations[], analysis_type
  - get_latest_analysis() — retrieves + deserializes JSON lists
  - get_analysis_history(limit) — recent analyses with JSON parsing
  - get_plant_config() — singleton getter
  - update_plant_config(species, name) — singleton updater
  - get_reading_count() — for MIN_READINGS_FOR_ANALYSIS gate
- ✅ Module-level async connection pooling: global _db, lazy init via get_db()
- ✅ JSON serialization for issues[] and recommendations[] lists
- ✅ All 3 QA scenarios passing:
  1. Database init test: WAL mode verified, all 3 tables created
  2. CRUD test: insert_reading(45.2, 23.5, 65.0, 750.0) → id=1, get_latest_reading() → moisture=45.2, get_reading_count() → 1
  3. No sqlite3 import: grep finds CLEAN (aiosqlite only)
- ✅ Evidence saved to .sisyphus/evidence/task-3-*.txt
- ✅ Committed: "feat(backend): add SQLite schema and async database module"

### Key Decisions
- aiosqlite exclusively (NO sqlite3) — required for true async I/O without blocking event loop
- WAL mode mandatory — prevents "database is locked" errors during concurrent SSE reads + sensor writes
- Module-level connection with lazy initialization — avoids connection proliferation
- os.makedirs() for data/ directory creation — idempotent with exist_ok=True
- JSON serialization for array columns (issues, recommendations) — simpler than JSONB
- Singleton plant_config pattern: id=1 only, UPDATE not INSERT for changes

### Patterns
- aiosqlite.Connection is context manager (async with) and module-level cached
- row_factory = aiosqlite.Row enables dict-like access: dict(row) converts to dict
- await db.execute() returns cursor, await cursor.fetchone/fetchall() for results
- await db.commit() required after INSERT/UPDATE to persist
- datetime('now') in SQL for server-side timestamps
- cursor.lastrowid available after INSERT for returning new id
- json.dumps(list) / json.loads(str) for serialization of issues/recommendations

## [2026-03-11] Task 4: FastAPI Sensor Ingest & Historical Data API

### Completed
- ✅ backend/src/models.py created with SensorReading, SensorReadingResponse, AnalysisResult, PlantConfig Pydantic models
- ✅ backend/src/api/__init__.py created (empty package marker)
- ✅ backend/src/api/sensors.py: POST /api/sensor-data (201), GET /api/sensor-data (historical), GET /api/sensor-data/latest
- ✅ backend/src/api/plant.py: GET /api/plant/species, PUT /api/plant/species
- ✅ backend/src/api/health.py: GET /api/health → {status, db, timestamp}
- ✅ backend/src/main.py updated: title="Plant Health Monitor", CORS middleware, startup → init_db(), 3 routers included
- ✅ All 5 QA scenarios passing:
  1. Health: {"status":"healthy","db":"connected","timestamp":"..."}
  2. Valid POST → 201 {"status":"ok","id":<int>}
  3. Invalid POST (out of range) → 422
  4. Historical GET → {"readings":[...]} with 2 entries
  5. Species CRUD: PUT then GET both return Monstera deliciosa
- ✅ Evidence saved to .sisyphus/evidence/task-4-*.txt
- ✅ Committed: "feat(backend): add sensor ingest and historical data API endpoints"

### Key Decisions
- Router prefix `/api/sensor-data` in APIRouter constructor — routes registered as `""` and `"/latest"` inside
- `GET /api/sensor-data/latest` MUST be defined BEFORE `GET /api/sensor-data` in the router to avoid route shadowing
- `allow_credentials=False` (spec requirement — never True with wildcard/broad origins)
- CORS_ORIGINS from os.getenv() not from src.config — spec said os.getenv() directly in main.py
- @app.on_event("startup") for init_db() — deprecated in FastAPI ≥0.93 but still works; lifespan context preferred for new code
- health.py prefix is `/api` (not `/api/health`) — route handler path is `/health`

### Patterns
- FastAPI APIRouter(prefix=..., tags=[...]) groups routes cleanly
- Pydantic Field(ge=..., le=...) for validation → automatic 422 on violation
- Return `SensorReadingResponse` not raw dict to get consistent schema
- For GET endpoints returning plain dicts, no response_model needed
- `dict(row)` on aiosqlite.Row gives plain dict safe to return from FastAPI

## [2026-03-11] Task 6: PocketFlow Agent 1 - Sensor Analysis (Rule-Based)

### Completed
- ✅ Added `backend/src/agents/__init__.py` as empty package marker
- ✅ Added `backend/src/agents/sensor_analysis.py` with `SensorAnalysisNode(AsyncNode)` using `prep_async` → `exec_async` → `post_async`
- ✅ Implemented pure rule-based checks for soil moisture, temperature, humidity, and light (no LLM calls)
- ✅ Added routing actions from `post_async`: `healthy`, `anomaly`, `critical`
- ✅ Healthy path now writes `shared["final_analysis"]` with `health_score`, `status`, `issues`, `recommendations`, `analysis_type`, `model_used`
- ✅ Health score function clamps to 70-100 and uses moisture/temperature deviation from midpoint
- ✅ PocketFlow import verified (`ok`)
- ✅ QA Scenario 1 (normal): `Anomaly: False`, `Needs AI: False`, `Action: healthy`, `Health score: 97`
- ✅ QA Scenario 2 (dry soil 10%): `Anomaly: True`, issue contains `dry`, `Action: anomaly`
- ✅ Evidence saved: `.sisyphus/evidence/task-6-pocketflow.txt`, `.sisyphus/evidence/task-6-normal.txt`, `.sisyphus/evidence/task-6-dry.txt`

### Patterns
- `exec_async()` has no access to `shared`; pass all required inputs through `prep_async()`
- Rule-based agent is the cost gate: only anomaly/critical paths should request AI later in the flow
- Keep PocketFlow node state in `shared` dict only; avoid mutable instance state

## Task 7: PocketFlow Utils — LiteLLM, search_web, prompts (2026-03-11)

### LiteLLM
- `from litellm import acompletion` — async variant; must be used in async context
- Import works without API key (no runtime error at import time)
- `call_llm_stream` must be an async generator (`async def` + `yield`)

### DuckDuckGo Search (duckduckgo_search v8.1.1)
- Package has been renamed to `ddgs` — emits RuntimeWarning but still works via `duckduckgo_search`
- `DDGS().text()` v8.x hardcodes bing backend: `backends = ["bing"]  # temporaly disable html and lite backends`
- Bing backend is unreliable in async thread contexts (returns 0 results) but sync direct calls work
- **WORKAROUND**: Use `_text_html()` directly instead of `text()` — reliable in `asyncio.to_thread`
- `asyncio.to_thread()` works; `loop.run_in_executor(None, lambda: ...)` fails silently for DDGS
- Lambda captures may lose context in `run_in_executor` — always prefer `asyncio.to_thread` with named function

### Tavily
- `TavilyClient` is synchronous — use `asyncio.to_thread(client.search, query, max_results=n)`
- Pass positional args to `asyncio.to_thread` rather than using a lambda

### Prompts
- `format_diagnosis_prompt` and `format_care_prompt` are pure functions — no async needed
- JSON structure prompts work best with litellm's `response_format` parameter

## Frontend Setup
- Tailwind v4 setup works with Vite out of the box using `@tailwindcss/vite`.
- Shadcn UI initialization (`npx shadcn@latest init -d`) handles Tailwind v4 perfectly, adding the base variables inside `@theme inline` dynamically without breaking existing `--color-*` rules added prior to init.
- Shadcn UI requires `compilerOptions.baseUrl` and `compilerOptions.paths` in `tsconfig.json`, otherwise it will fail to validate aliases, even though modern Vite uses `tsconfig.app.json`.
- React 19 imported by Vite 6 does not need `import React from 'react'` in TSX, keeping it causes TS6133 warning/error.

## [2026-03-11] Task 8: Diagnosis, Care Advisor, and Web Research Agents
- Added , , and  as  agents under .
- Reused existing prompt helpers from ; no prompt duplication.
-  is fixed at 3 and query slicing enforces that cap.
- Web synthesis appends  only when search results exist.
- QA evidence captured in  and .

## [2026-03-11] Task 8: Diagnosis, Care Advisor, and Web Research Agents
- Added PlantDiagnosisNode, CareAdvisorNode, and WebResearchNode as AsyncNode agents under backend/src/agents/.
- Reused existing prompt helpers from src/utils/prompts.py with no prompt duplication.
- WebResearchNode.MAX_SEARCHES is fixed at 3 and query slicing enforces that cap.
- Web synthesis appends web_insights only when search results exist.
- QA evidence captured in .sisyphus/evidence/task-8-diagnosis.txt and .sisyphus/evidence/task-8-search-limit.txt.

- Task 9: Added AsyncFlow wiring in backend/src/agents/flow.py for SensorAnalysis -> Diagnosis -> CareAdvisor -> WebResearch with explicit anomaly/critical/research/done transitions.
- Task 9: Analysis API uses /api/analyze, /api/analysis/latest, and /api/analysis/history; enforces MIN_READINGS_FOR_ANALYSIS and persists only final merged analysis.
- Task 9: Verified QA with temporary DATABASE_PATH instances; evidence files captured for normal analysis, insufficient_data 400 response, and latest analysis retrieval.

## Task 12: Seed Data Script

**Status:** ✓ COMPLETED

**Key Learnings:**
- `seed.py` uses async DB functions from `src.db` module - no direct sqlite3 imports
- Realistic sensor patterns: temperature sine curve (18-28°C), humidity inverse to temp, light 6am-6pm
- Soil moisture pattern: gradual evaporation with watering spike at noon (realistic for plant care)
- 1440 readings (1 per minute for 24h) stored as UTC timestamps
- `update_plant_config()` updates singleton plant_config table row

**Implementation Pattern:**
- Path insertion for src imports: `sys.path.insert(0, os.path.dirname(__file__))`
- All DB operations await async functions
- Math module for realistic sine curves: `math.sin(math.pi * (hour - offset) / period)`
- Random Gaussian noise adds realistic variation: `random.gauss(mean, std_dev)`

**Verification:**
- Output confirmed: "Inserted 1440 readings ... Monstera deliciosa"
- Database has exactly 1440 sensor readings
- 3 analysis results with proper JSON serialization for lists


### Task 11: Dashboard Layout
- **Recharts Tooltip Customization**: To correctly format different data types (e.g., lux vs °C vs %) and use normalized data for the chart while showing raw data in the tooltip, a `CustomTooltip` component is very effective.
- **Lucide Icons**: When importing icon components to pass as props, `import type { LucideIcon }` should be used in Vite to avoid TS/bundler errors about missing exports.
- **Framer Motion**: Wrapped the `Card` component with `motion.div` to provide entrance animations.
- **ResponsiveContainer**: Mandatory wrapper for Recharts `<AreaChart>` to ensure it renders with a width > 0.
- **Data Mappings**: To ensure left-to-right chronological order on `AreaChart`, reversing the array from the backend is needed if the backend provides data in descending order.

## [2026-03-11] Task 10 REDO: SSE Broadcaster

### Completed
- Created backend/src/sse.py: SSEBroadcaster with per-client asyncio.Queue(maxsize=50) fan-out
- Created backend/src/api/stream.py: GET /api/stream using StreamingResponse(text/event-stream)
- Updated sensors.py: broadcaster.broadcast("sensor_data", ...) after insert_reading
- Updated analysis.py: broadcaster.broadcast("analysis", ...) after insert_analysis
- Updated main.py: stream_router registered

### Key Patterns
- SSE with FastAPI: StreamingResponse(async_generator(), media_type="text/event-stream") — no third-party sse-starlette needed for FastAPI ≥0.135.0
- Event format: `event: {type}\ndata: {json_str}\n\n` (double newline terminates event)
- Disconnect detection: `await request.is_disconnected()` (async in Starlette)
- Heartbeat: asyncio.wait_for(q.get(), timeout=15.0) catches TimeoutError → yields ping event
- Dead client eviction: QueueFull exception during put_nowait marks client as dead; removed after broadcast loop
- Single uvicorn worker required: in-memory broadcaster state is process-local
- Headers: Cache-Control: no-cache, X-Accel-Buffering: no, Connection: keep-alive prevent nginx/proxy buffering

### QA Results
- ping event received immediately on connect: ✅
- sensor_data event broadcast after POST /api/sensor-data: ✅ (id matched between POST response and SSE event)
- Backend starts without errors: ✅
- Committed: 004d519 feat(backend): add SSE broadcaster and stream endpoint

# Smart Plant Health GenAI Monitoring System

## TL;DR

> **Quick Summary**: Build a smart plant health monitoring system where ESP32 sensors (soil moisture, DHT11, LDR) send data via HTTP POST to a FastAPI backend with a PocketFlow multi-agent AI pipeline (LiteLLM + OpenAI) for plant health analysis, displayed on a React+Vite dashboard with Recharts, Shadcn UI, and Framer Motion.
> 
> **Deliverables**:
> - ESP32 Arduino firmware (soil moisture + DHT11 + LDR → HTTP POST JSON)
> - FastAPI Python backend (sensor ingestion, AI analysis, SSE streaming, SQLite)
> - PocketFlow 4-agent pipeline (Sensor Analysis → Plant Diagnosis → Care Advisor → Web Research)
> - React + Vite SPA dashboard (Recharts charts, Shadcn UI, Tailwind v4, Framer Motion)
> - Docker + Docker Compose for backend deployment
> - GitHub Action for GHCR image push on version change
> - Seed data script for development/demo
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 → Task 3 → Task 7 → Task 10 → Task 15 → Task 18 → Final

---

## Context

### Original Request
Build a smart plant health GenAI-powered project using ESP32 with soil moisture sensor, DHT11 and LDR modules for sensor data. Sensors send data to a web app where user can monitor and get AI-powered insights. Use LiteLLM with OpenAI, PocketFlow for multi-agent orchestration, with multiple agents including web search.

### Interview Summary
**Key Discussions**:
- **Architecture pivot**: Started with Next.js full-stack, pivoted back to FastAPI + PocketFlow for better scalability and native Python LLM support
- **Frontend**: Dropped Next.js, chose React + Vite for lighter SPA (backend is separate)
- **Database**: Chose local SQLite over Turso — simplest for prototype, no cloud dependency
- **PocketFlow scope**: Full multi-agent system with web search, not simplified pipeline
- **Deployment**: Frontend on Vercel, backend in Docker with GHCR via GitHub Actions
- **Package manager**: uv for Python (not pip/poetry)
- **Design vision**: Professional, modern, minimal — must look good even with minimal data

**Research Findings**:
- PocketFlow is 100 lines of Python — must use `AsyncNode`/`AsyncFlow` for I/O, never mix sync `Node` with `AsyncFlow`
- LiteLLM tiered analysis pattern: rule-based (free) → gpt-4o-mini (routine) → gpt-4o (critical) saves 85%+ costs
- FastAPI ≥ 0.135.0 has native SSE (`from fastapi.sse import EventSourceResponse`)
- SQLite MUST use WAL mode + `aiosqlite` in async context or event loop blocks
- ESP32 DHT11 has ~5% NaN rate — firmware must guard with `isnan()`
- Shadcn UI + Tailwind v4 compatibility needs verification (v4 uses CSS-first config, not tailwind.config.js)

### Metis Review
**Identified Gaps** (addressed):
- **LLM trigger strategy undefined**: Resolved — Agent 1 (rule-based) gates all LLM calls. Agents 2-4 only run on anomaly, user demand, or 30-min schedule
- **Web search API not chosen**: Resolved — will use Tavily or DuckDuckGo (decision in task)
- **Sensor threshold constants missing**: Resolved — define in `backend/config.py` with configurable defaults
- **PocketFlow infinite loop risk**: Resolved — `max_iterations` counter in shared store
- **Two icon libraries (Lucide + Heroicons)**: Resolved — Lucide only (shadcn default)
- **SQLite WAL mode**: Resolved — mandatory at connection init
- **First-boot empty state**: Resolved — min 5 readings before AI analysis
- **ESP32 offline detection**: Resolved — "last seen" timestamp + configurable stale threshold
- **Tailwind v4 + shadcn compatibility**: Resolved — verify during scaffolding, fall back to v3 if needed

---

## Work Objectives

### Core Objective
Build an end-to-end plant health monitoring system: ESP32 sensors → FastAPI backend → PocketFlow AI analysis → React dashboard, deployable via Docker with CI/CD.

### Concrete Deliverables
- `firmware/` — ESP32 Arduino sketch (`.ino`) with sensor reading + HTTP POST
- `backend/` — FastAPI app with REST API, SSE streaming, PocketFlow pipeline, SQLite storage
- `frontend/` — React + Vite SPA with sensor charts, AI insights, plant configuration
- `docker-compose.yml` + `backend/Dockerfile` — containerized backend
- `.github/workflows/publish.yml` — GHCR push on version change
- `backend/seed.py` — 24h of realistic mock sensor data
- `.env.example` — all required environment variables documented

### Definition of Done
- [ ] ESP32 firmware compiles without errors in Arduino IDE
- [ ] `curl -sf http://localhost:8000/api/health` returns `{"status": "healthy"}`
- [ ] Sensor data POST returns 201, invalid data returns 422
- [ ] SSE stream connects and sends events within 20s
- [ ] PocketFlow pipeline runs and returns structured JSON analysis
- [ ] React dashboard displays charts, AI analysis, plant species config
- [ ] Docker build succeeds and compose brings up healthy backend
- [ ] GitHub Action triggers on version change and pushes to GHCR

### Must Have
- ESP32 reading 3 sensors and POSTing JSON every configurable interval
- FastAPI backend with sensor ingest, historical data retrieval, AI analysis trigger
- PocketFlow 4-agent async pipeline with rule-based gating
- LiteLLM integration with OpenAI (gpt-4o-mini primary)
- SQLite with WAL mode via aiosqlite
- SSE streaming for real-time dashboard updates
- React dashboard with Recharts time-series charts
- Shadcn UI components with Tailwind v4 styling
- Plant species configurable via dashboard
- Empty/loading/error states for all UI sections
- Seed data script for development
- Docker + Docker Compose for backend
- GitHub Action for GHCR publish
- Professional, modern, minimal design

### Must NOT Have (Guardrails)
- NO authentication/authorization
- NO multi-user, user model, or sessions
- NO multi-plant support in data model or UI
- NO mobile app, PWA, or responsive mobile layout optimization
- NO notification system (email, push, SMS, Discord)
- NO data export (CSV, PDF, JSON download)
- NO sensor calibration UI
- NO OTA firmware updates
- NO CI/CD for frontend (Vercel handles this)
- NO database migration framework (raw SQL, auto-create on startup)
- NO rate limiting or API throttling
- NO logging infrastructure beyond Python `logging`
- NO monitoring/alerting (Prometheus, Grafana, Sentry)
- NO WebSocket — SSE only
- NO dark mode toggle
- NO i18n/l10n
- NO SQLAlchemy or any ORM — raw aiosqlite only
- NO Heroicons — Lucide icons exclusively
- NO `tailwind.config.js` — Tailwind v4 uses CSS-first `@theme`
- NO sync `Node`/`Flow` for PocketFlow I/O — `AsyncNode`/`AsyncFlow` only
- NO `import sqlite3` in async code — `aiosqlite` only
- NO `allow_origins=["*"]` with `allow_credentials=True` in CORS
- NO LLM calls on every sensor reading — rule-based gating required
- NO mutable state on PocketFlow node instances — use `shared` dict
- NO multiple uvicorn workers — in-memory SSE broadcaster requires single worker
- NO deep sleep, OTA, captive portal on ESP32
- NO HTTPS on ESP32 (unreliable for prototypes)

---

## Verification Strategy (MANDATORY)

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.
> Acceptance criteria requiring "user manually tests/confirms" are FORBIDDEN.
> ONE EXCEPTION: ESP32 firmware compilation requires Arduino IDE (document expected output).

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: None — QA via agent-executed scenarios only
- **Framework**: N/A

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl + jq) — Send requests, assert status + response fields
- **ESP32**: Document expected Arduino IDE output (only manual verification component)
- **Docker**: Use Bash — docker build, docker compose up, curl health check

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation + scaffolding):
├── Task 1: Project scaffolding (git, monorepo, configs, .env) [quick]
├── Task 2: ESP32 Arduino firmware [unspecified-high]
└── Task 3: SQLite schema + database module [quick]

Wave 2 (After Wave 1 — core backend + frontend shell):
├── Task 4: FastAPI sensor ingest + historical API [unspecified-high]
├── Task 5: React + Vite project scaffolding [quick]
├── Task 6: PocketFlow Agent 1: Sensor Analysis (rule-based) [deep]
└── Task 7: PocketFlow utils: call_llm + search_web [unspecified-high]

Wave 3 (After Wave 2 — AI pipeline + dashboard):
├── Task 8: PocketFlow Agents 2-4: Diagnosis, Care, Web Research [deep]
├── Task 9: PocketFlow flow wiring + analysis trigger API [deep]
├── Task 10: SSE broadcaster + stream endpoint [unspecified-high]
├── Task 11: Dashboard layout + sensor charts [visual-engineering]
└── Task 12: Seed data script [quick]

Wave 4 (After Wave 3 — integration + polish):
├── Task 13: AI analysis card + SSE consumer [visual-engineering]
├── Task 14: Plant species config + empty/loading/error states [visual-engineering]
├── Task 15: Dashboard animations + design polish [visual-engineering]
└── Task 16: Frontend deployment config (Vercel) [quick]

Wave 5 (After Wave 4 — deployment + CI/CD):
├── Task 17: Dockerfile + docker-compose.yml [quick]
├── Task 18: GitHub Action for GHCR publish [quick]
└── Task 19: End-to-end integration verification [deep]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
└── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 3 → Task 4 → Task 7 → Task 9 → Task 10 → Task 13 → Task 19 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 4 (Waves 2, 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2-19 | 1 |
| 2 | 1 | 19 | 1 |
| 3 | 1 | 4, 6, 7, 8, 9, 10, 12 | 1 |
| 4 | 1, 3 | 10, 12, 13, 19 | 2 |
| 5 | 1 | 11, 13, 14, 15, 16 | 2 |
| 6 | 1, 3 | 9 | 2 |
| 7 | 1, 3 | 8, 9 | 2 |
| 8 | 6, 7 | 9 | 3 |
| 9 | 6, 7, 8 | 10, 13, 19 | 3 |
| 10 | 4, 9 | 13, 19 | 3 |
| 11 | 5, 4 | 13, 15 | 3 |
| 12 | 3, 4 | 19 | 3 |
| 13 | 10, 11 | 15, 19 | 4 |
| 14 | 5, 4 | 15 | 4 |
| 15 | 11, 13, 14 | 16 | 4 |
| 16 | 5, 15 | 19 | 4 |
| 17 | 4 | 18, 19 | 5 |
| 18 | 17 | 19 | 5 |
| 19 | ALL | F1-F4 | 5 |

### Agent Dispatch Summary

- **Wave 1**: **3 tasks** — T1 → `quick`, T2 → `unspecified-high`, T3 → `quick`
- **Wave 2**: **4 tasks** — T4 → `unspecified-high`, T5 → `quick`, T6 → `deep`, T7 → `unspecified-high`
- **Wave 3**: **5 tasks** — T8 → `deep`, T9 → `deep`, T10 → `unspecified-high`, T11 → `visual-engineering`, T12 → `quick`
- **Wave 4**: **4 tasks** — T13 → `visual-engineering`, T14 → `visual-engineering`, T15 → `visual-engineering`, T16 → `quick`
- **Wave 5**: **3 tasks** — T17 → `quick`, T18 → `quick`, T19 → `deep`
- **FINAL**: **4 tasks** — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

> Implementation + QA = ONE Task. Never separate.
> EVERY task MUST have: Recommended Agent Profile + Parallelization info + QA Scenarios.

- [ ] 1. Project Scaffolding & Configuration

  **What to do**:
  - Initialize git repo (`git init`) with comprehensive `.gitignore` (Python, Node, ESP32, SQLite, .env)
  - Create monorepo structure: `backend/`, `frontend/`, `firmware/`, `.github/workflows/`
  - Create `backend/pyproject.toml` with uv — dependencies: `fastapi>=0.135.0`, `uvicorn`, `aiosqlite`, `litellm`, `pocketflow`, `pydantic`, `httpx`, `python-dotenv`. Include `[project.scripts]` entry for `uvicorn backend.main:app`
  - Create `backend/src/` package structure: `backend/src/__init__.py`, `backend/src/main.py` (empty FastAPI app stub), `backend/src/config.py` (env var loading + sensor threshold constants)
  - Create `backend/src/config.py` with sensor threshold constants:
    ```python
    # Sensor thresholds (configurable via env vars)
    SOIL_MOISTURE_LOW = float(os.getenv("SOIL_MOISTURE_LOW", "20"))  # % — below = dry
    SOIL_MOISTURE_HIGH = float(os.getenv("SOIL_MOISTURE_HIGH", "80"))  # % — above = overwatered
    TEMPERATURE_LOW = float(os.getenv("TEMPERATURE_LOW", "15"))  # °C
    TEMPERATURE_HIGH = float(os.getenv("TEMPERATURE_HIGH", "35"))  # °C
    HUMIDITY_LOW = float(os.getenv("HUMIDITY_LOW", "30"))  # %
    HUMIDITY_HIGH = float(os.getenv("HUMIDITY_HIGH", "80"))  # %
    LIGHT_LOW = float(os.getenv("LIGHT_LOW", "200"))  # lux — below = too dark
    LIGHT_HIGH = float(os.getenv("LIGHT_HIGH", "50000"))  # lux — above = scorching
    MIN_READINGS_FOR_ANALYSIS = int(os.getenv("MIN_READINGS_FOR_ANALYSIS", "5"))
    ANALYSIS_COOLDOWN_MINUTES = int(os.getenv("ANALYSIS_COOLDOWN_MINUTES", "30"))
    SENSOR_INTERVAL_SECONDS = int(os.getenv("SENSOR_INTERVAL_SECONDS", "60"))
    LLM_MAX_BUDGET = float(os.getenv("LLM_MAX_BUDGET", "10.0"))  # USD
    DATABASE_PATH = os.getenv("DATABASE_PATH", "data/plant_health.db")
    ```
  - Create `.env.example` documenting ALL env vars:
    ```
    OPENAI_API_KEY=sk-...
    TAVILY_API_KEY=tvly-...  # or SEARCH_API_KEY for web research agent
    VITE_BACKEND_URL=http://localhost:8000
    DATABASE_PATH=data/plant_health.db
    SENSOR_INTERVAL_SECONDS=60
    SOIL_MOISTURE_LOW=20
    SOIL_MOISTURE_HIGH=80
    TEMPERATURE_LOW=15
    TEMPERATURE_HIGH=35
    HUMIDITY_LOW=30
    HUMIDITY_HIGH=80
    LIGHT_LOW=200
    LIGHT_HIGH=50000
    MIN_READINGS_FOR_ANALYSIS=5
    ANALYSIS_COOLDOWN_MINUTES=30
    LLM_MAX_BUDGET=10.0
    CORS_ORIGINS=http://localhost:5173
    ```
  - Create a minimal `README.md` with project description and setup instructions stub

  **Must NOT do**:
  - Do NOT create frontend project yet (Task 5)
  - Do NOT write any actual API routes
  - Do NOT install dependencies (just define them in pyproject.toml)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: File creation and scaffolding — no complex logic
  - **Skills**: []
    - No specialized skills needed for file scaffolding

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation for everything)
  - **Parallel Group**: Wave 1 (sequential start)
  - **Blocks**: Tasks 2-19 (all tasks depend on project structure)
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - PocketFlow official structure: `main.py`, `nodes.py`, `flow.py`, `utils/` — see https://github.com/The-Pocket/PocketFlow cookbook examples
  - uv project setup: `uv init` + `pyproject.toml` with `[project]` and `[tool.uv]` sections

  **External References**:
  - PocketFlow PyPI: `pip install pocketflow` (or `uv add pocketflow`)
  - FastAPI docs: https://fastapi.tiangolo.com/
  - uv docs: https://docs.astral.sh/uv/

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Monorepo structure exists
    Tool: Bash
    Preconditions: Project freshly scaffolded
    Steps:
      1. Run: ls -la /home/moniya/personal/plant-health/
      2. Assert directories exist: backend/, frontend/, firmware/, .github/
      3. Run: ls -la backend/src/
      4. Assert files exist: __init__.py, main.py, config.py
      5. Run: cat .env.example
      6. Assert: contains "OPENAI_API_KEY" and "VITE_BACKEND_URL" and "DATABASE_PATH"
    Expected Result: All directories and files present
    Failure Indicators: Any directory or file missing
    Evidence: .sisyphus/evidence/task-1-structure.txt

  Scenario: Git repo initialized
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Run: git -C /home/moniya/personal/plant-health/ status
      2. Assert: output contains "On branch" (not "fatal: not a git repository")
      3. Run: cat /home/moniya/personal/plant-health/.gitignore
      4. Assert: contains "__pycache__", "node_modules", ".env", "*.db"
    Expected Result: Valid git repo with comprehensive .gitignore
    Failure Indicators: "fatal: not a git repository" or missing .gitignore entries
    Evidence: .sisyphus/evidence/task-1-git.txt

  Scenario: Config module loads defaults
    Tool: Bash
    Preconditions: backend/src/config.py exists
    Steps:
      1. Run: cd backend && uv run python -c "from src.config import SOIL_MOISTURE_LOW, DATABASE_PATH; print(SOIL_MOISTURE_LOW, DATABASE_PATH)"
      2. Assert: output is "20.0 data/plant_health.db"
    Expected Result: Config loads with sensible defaults
    Failure Indicators: ImportError or wrong default values
    Evidence: .sisyphus/evidence/task-1-config.txt
  ```

  **Commit**: YES
  - Message: `chore: scaffold monorepo with backend, frontend, firmware structure`
  - Files: all scaffolding files
  - Pre-commit: `ls backend/src/config.py && cat .env.example | grep OPENAI_API_KEY`

- [ ] 2. ESP32 Arduino Firmware

  **What to do**:
  - Create `firmware/plant_health_sensor/plant_health_sensor.ino` — complete Arduino sketch
  - Include libraries: `WiFi.h`, `HTTPClient.h`, `DHT.h`, `ArduinoJson.h`
  - Define configurable constants at top of file:
    ```cpp
    #define WIFI_SSID "YOUR_WIFI_SSID"
    #define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"
    #define BACKEND_URL "http://YOUR_BACKEND_IP:8000/api/sensor-data"
    #define SENSOR_INTERVAL_MS 60000  // 1 minute, configurable
    #define SOIL_MOISTURE_PIN 34      // ADC pin
    #define DHT_PIN 4                 // Digital pin
    #define DHT_TYPE DHT11
    #define LDR_PIN 35                // ADC pin
    ```
  - Implement `setup()`: WiFi connect with retry loop (max 20 attempts, 500ms delay), Serial.begin(115200), DHT init, pin modes
  - Implement `loop()`: Read all 3 sensors → validate (isnan guard for DHT11) → build JSON → HTTP POST → delay(SENSOR_INTERVAL_MS)
  - Sensor reading functions:
    - `readSoilMoisture()`: ADC read pin 34, map 4095→0 to 0%→100% (capacitive: higher ADC = drier)
    - `readDHT()`: `dht.readTemperature()`, `dht.readHumidity()` with `isnan()` guard — skip POST if NaN
    - `readLDR()`: ADC read pin 35, convert to approximate lux using voltage divider formula with 10kΩ resistor
  - JSON payload (using ArduinoJson):
    ```json
    {"soil_moisture": 45.2, "temperature": 23.5, "humidity": 65.0, "light": 750.0}
    ```
  - WiFi reconnection: check `WiFi.status() != WL_CONNECTED` before each POST, reconnect if needed
  - Serial logging for debugging: print sensor values and HTTP response code
  - HTTP POST with proper headers: `Content-Type: application/json`
  - Handle HTTP errors gracefully: log error code, continue to next reading cycle

  **Must NOT do**:
  - NO deep sleep mode
  - NO OTA updates
  - NO captive portal for WiFi config
  - NO local data buffering/queue
  - NO HTTPS (use plain HTTP)
  - NO MQTT — HTTP POST only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Embedded C++ firmware with sensor-specific calibration logic
  - **Skills**: []
    - No specialized skills needed (Arduino is well-documented)

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 3)
  - **Parallel Group**: Wave 1 (with Tasks 1 complete)
  - **Blocks**: Task 19 (end-to-end verification)
  - **Blocked By**: Task 1 (project structure)

  **References**:

  **Pattern References**:
  - Tasmota DHT driver: sensor reading with NaN guard pattern — `https://github.com/arendst/Tasmota/blob/a932b3d991caf9911614dbb77bc6382c64b65c46/tasmota/tasmota_xsns_sensor/xsns_06_esp32_dht.ino`
  - Tasmota WiFi reconnect: exponential backoff pattern — `https://github.com/arendst/Tasmota/blob/a932b3d991caf9911614dbb77bc6382c64b65c46/tasmota/tasmota_support/support_wifi.ino#L1136-L1215`

  **External References**:
  - ArduinoJson library: https://arduinojson.org/v6/api/jsonobject/
  - DHT sensor library: https://github.com/adafruit/DHT-sensor-library
  - ESP32 ADC: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/adc.html

  **WHY Each Reference Matters**:
  - Tasmota DHT driver shows production-grade NaN handling for DHT11's ~5% failure rate
  - Tasmota WiFi shows BSSID caching for faster reconnect (4s→400ms)
  - ArduinoJson docs for correct `serializeJson()` usage with HTTPClient

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Firmware file exists and has required structure
    Tool: Bash
    Preconditions: Task 1 complete
    Steps:
      1. Run: cat firmware/plant_health_sensor/plant_health_sensor.ino
      2. Assert: file contains "#include <WiFi.h>"
      3. Assert: file contains "#include <DHT.h>"
      4. Assert: file contains "#include <ArduinoJson.h>"
      5. Assert: file contains "void setup()"
      6. Assert: file contains "void loop()"
      7. Assert: file contains "SENSOR_INTERVAL_MS"
      8. Assert: file contains "isnan" (DHT NaN guard)
      9. Assert: file contains "WiFi.status()" (reconnection check)
    Expected Result: Complete firmware with all required components
    Failure Indicators: Missing includes, missing functions, no NaN guard
    Evidence: .sisyphus/evidence/task-2-firmware.txt

  Scenario: No forbidden features in firmware
    Tool: Bash
    Preconditions: Firmware file exists
    Steps:
      1. Run: grep -i "deep.sleep\|OTA\|captive.portal\|MQTT\|https" firmware/plant_health_sensor/plant_health_sensor.ino
      2. Assert: no matches (exit code 1)
    Expected Result: None of the forbidden features present
    Failure Indicators: Any grep match
    Evidence: .sisyphus/evidence/task-2-no-forbidden.txt
  ```

  **Note**: Full compilation verification requires Arduino IDE with ESP32 board support installed — this is the ONE component requiring manual verification. Document expected output: "Sketch uses X bytes (Y%) of program storage space."

  **Commit**: YES
  - Message: `feat(firmware): add ESP32 sensor reading and HTTP POST sketch`
  - Files: `firmware/plant_health_sensor/plant_health_sensor.ino`

- [ ] 3. SQLite Schema & Async Database Module

  **What to do**:
  - Create `backend/src/db.py` — async database module using `aiosqlite`
  - Schema (3 tables, auto-created on startup via `IF NOT EXISTS`):
    ```sql
    CREATE TABLE IF NOT EXISTS sensor_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      soil_moisture REAL NOT NULL,
      temperature REAL NOT NULL,
      humidity REAL NOT NULL,
      light REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_readings_created_at ON sensor_readings(created_at);

    CREATE TABLE IF NOT EXISTS analysis_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      health_score INTEGER NOT NULL,
      status TEXT NOT NULL,  -- 'healthy', 'warning', 'critical'
      issues TEXT NOT NULL DEFAULT '[]',  -- JSON array
      recommendations TEXT NOT NULL DEFAULT '[]',  -- JSON array
      analysis_type TEXT NOT NULL,  -- 'rule_based', 'ai_routine', 'ai_critical'
      model_used TEXT,  -- e.g., 'gpt-4o-mini'
      raw_response TEXT,  -- full LLM response for debugging
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS plant_config (
      id INTEGER PRIMARY KEY DEFAULT 1,  -- singleton row
      species TEXT NOT NULL DEFAULT 'Unknown',
      name TEXT NOT NULL DEFAULT 'My Plant',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    ```
  - Implement async functions:
    - `init_db()` — create connection, run `PRAGMA journal_mode=WAL`, `PRAGMA synchronous=NORMAL`, create tables, insert default plant_config if empty
    - `get_db()` — return aiosqlite connection (singleton or connection pool pattern)
    - `insert_reading(soil_moisture, temperature, humidity, light)` — insert sensor reading, return id
    - `get_readings(hours=24, limit=1000)` — get historical readings within time window
    - `get_latest_reading()` — most recent reading
    - `insert_analysis(health_score, status, issues, recommendations, analysis_type, model_used, raw_response)` — store analysis result
    - `get_latest_analysis()` — most recent analysis
    - `get_plant_config()` — get current plant species/name
    - `update_plant_config(species, name)` — update plant config
    - `get_reading_count()` — count total readings (for min-readings check)
  - ALL functions must use `aiosqlite` — NEVER import `sqlite3`
  - Create `backend/data/` directory with `.gitkeep` (SQLite file location)

  **Must NOT do**:
  - NO SQLAlchemy or any ORM
  - NO migration framework (Alembic)
  - NO `import sqlite3` — `aiosqlite` only
  - NO connection pooling (single connection is fine for prototype)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file with straightforward async SQLite operations
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2)
  - **Parallel Group**: Wave 1 (after Task 1)
  - **Blocks**: Tasks 4, 6, 7, 8, 9, 10, 12
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - aiosqlite docs: https://aiosqlite.omnilib.dev/en/stable/
  - SQLite WAL mode: https://www.sqlite.org/wal.html
  - SQLite datetime functions: https://www.sqlite.org/lang_datefunc.html

  **WHY Each Reference Matters**:
  - aiosqlite docs for async context manager pattern and connection lifecycle
  - WAL mode is MANDATORY — without it, concurrent reads during SSE + writes from sensor ingest produce `database is locked` errors

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Database initializes with WAL mode and tables
    Tool: Bash
    Preconditions: backend/src/db.py exists, uv dependencies installed
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio
         from src.db import init_db, get_db
         asyncio.run(init_db())
         import aiosqlite
         async def check():
           async with aiosqlite.connect('data/plant_health.db') as db:
             cursor = await db.execute('PRAGMA journal_mode')
             mode = await cursor.fetchone()
             print(f'WAL: {mode[0]}')
             cursor = await db.execute(\"SELECT name FROM sqlite_master WHERE type='table'\")
             tables = [row[0] for row in await cursor.fetchall()]
             print(f'Tables: {sorted(tables)}')
         asyncio.run(check())
         "
      2. Assert: output contains "WAL: wal"
      3. Assert: output contains "sensor_readings" and "analysis_results" and "plant_config"
    Expected Result: WAL mode enabled, all 3 tables created
    Failure Indicators: WAL not set, missing tables, import errors
    Evidence: .sisyphus/evidence/task-3-db-init.txt

  Scenario: CRUD operations work
    Tool: Bash
    Preconditions: Database initialized
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio
         from src.db import init_db, insert_reading, get_readings, get_latest_reading, get_reading_count
         async def test():
           await init_db()
           rid = await insert_reading(45.2, 23.5, 65.0, 750.0)
           print(f'Inserted: {rid}')
           latest = await get_latest_reading()
           print(f'Latest moisture: {latest[\"soil_moisture\"]}')
           count = await get_reading_count()
           print(f'Count: {count}')
           readings = await get_readings(hours=1)
           print(f'Readings in 1h: {len(readings)}')
         asyncio.run(test())
         "
      2. Assert: output contains "Inserted: 1" (or similar integer)
      3. Assert: output contains "Latest moisture: 45.2"
      4. Assert: output contains "Count: 1"
    Expected Result: Insert and read operations work correctly
    Failure Indicators: Any error or wrong values
    Evidence: .sisyphus/evidence/task-3-crud.txt

  Scenario: No sqlite3 import in async code
    Tool: Bash
    Preconditions: backend/src/db.py exists
    Steps:
      1. Run: grep "import sqlite3" backend/src/db.py
      2. Assert: no matches (exit code 1)
    Expected Result: Only aiosqlite is used
    Failure Indicators: Any match for "import sqlite3"
    Evidence: .sisyphus/evidence/task-3-no-sqlite3.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add SQLite schema and async database module`
  - Files: `backend/src/db.py`, `backend/data/.gitkeep`

- [ ] 4. FastAPI Sensor Ingest & Historical Data API

  **What to do**:
  - Create `backend/src/models.py` — Pydantic models:
    ```python
    class SensorReading(BaseModel):
        soil_moisture: float = Field(ge=0, le=100, description="Soil moisture %")
        temperature: float = Field(ge=-40, le=80, description="Temperature °C")
        humidity: float = Field(ge=0, le=100, description="Humidity %")
        light: float = Field(ge=0, le=200000, description="Light in lux")

    class SensorReadingResponse(BaseModel):
        status: str
        id: int

    class AnalysisResult(BaseModel):
        health_score: int = Field(ge=0, le=100)
        status: str  # 'healthy', 'warning', 'critical'
        issues: list[str]
        recommendations: list[str]
        analysis_type: str  # 'rule_based', 'ai_routine', 'ai_critical'
        model_used: str | None = None
        created_at: str

    class PlantConfig(BaseModel):
        species: str
        name: str
        updated_at: str | None = None
    ```
  - Create `backend/src/api/` package with `__init__.py`
  - Create `backend/src/api/sensors.py` — sensor API routes:
    - `POST /api/sensor-data` — validate with `SensorReading` model (auto 422 on invalid), insert to DB, broadcast via SSE, return `{"status": "ok", "id": <id>}`
    - `GET /api/sensor-data?hours=24&limit=1000` — get historical readings with query params
    - `GET /api/sensor-data/latest` — get most recent reading
  - Create `backend/src/api/plant.py` — plant config routes:
    - `GET /api/plant/species` — get current plant config
    - `PUT /api/plant/species` — update plant species/name
  - Create `backend/src/api/health.py` — health check:
    - `GET /api/health` — return `{"status": "healthy", "db": "connected", "timestamp": "..."}`
  - Update `backend/src/main.py`:
    - Create FastAPI app with title, description
    - Add CORS middleware with `allow_origins` from env var `CORS_ORIGINS` (default `http://localhost:5173`)
    - Add `@app.on_event("startup")` to call `init_db()`
    - Include all API routers with `/api` prefix
  - Ensure proper error handling: HTTPException with descriptive messages

  **Must NOT do**:
  - NO authentication middleware
  - NO rate limiting
  - NO pagination (use LIMIT clause)
  - NO analysis endpoints yet (Task 9)
  - NO SSE endpoints yet (Task 10)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple API routes with Pydantic models, async DB integration, CORS setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 5, 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 10, 12, 13, 19
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/db.py` (Task 3) — async database functions to call from routes
  - `backend/src/config.py` (Task 1) — CORS_ORIGINS and other config values

  **External References**:
  - FastAPI Route Handlers: https://fastapi.tiangolo.com/tutorial/first-steps/
  - Pydantic Field validators: https://docs.pydantic.dev/latest/concepts/fields/
  - FastAPI CORS: https://fastapi.tiangolo.com/tutorial/cors/

  **WHY Each Reference Matters**:
  - Pydantic `Field(ge=0, le=100)` provides automatic input validation — ESP32 sending impossible values (negative humidity) gets rejected with 422
  - CORS must explicitly allow `http://localhost:5173` (Vite dev server) — `*` with credentials is a spec violation

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Health check returns healthy
    Tool: Bash (curl)
    Preconditions: Backend running on localhost:8000
    Steps:
      1. Run: cd backend && uv run uvicorn src.main:app --host 0.0.0.0 --port 8000 &
      2. Wait 3s for startup
      3. Run: curl -sf http://localhost:8000/api/health | python3 -m json.tool
      4. Assert: response contains "status": "healthy"
    Expected Result: {"status": "healthy", "db": "connected", ...}
    Failure Indicators: Connection refused, non-200 status, missing fields
    Evidence: .sisyphus/evidence/task-4-health.txt

  Scenario: Valid sensor data accepted (201)
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. Run: curl -sf -w "\n%{http_code}" -X POST http://localhost:8000/api/sensor-data \
           -H "Content-Type: application/json" \
           -d '{"soil_moisture":45.2,"temperature":23.5,"humidity":65.0,"light":750.0}'
      2. Assert: HTTP status is 201
      3. Assert: response body contains "status": "ok"
      4. Assert: response body contains "id" field with integer value
    Expected Result: 201 with {"status": "ok", "id": 1}
    Failure Indicators: Non-201 status, missing id field
    Evidence: .sisyphus/evidence/task-4-ingest-valid.txt

  Scenario: Invalid sensor data rejected (422)
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. Run: curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/sensor-data \
           -H "Content-Type: application/json" \
           -d '{"soil_moisture":-5,"temperature":200,"humidity":150,"light":-1}'
      2. Assert: HTTP status is 422
    Expected Result: 422 Unprocessable Entity
    Failure Indicators: 200 or 500 (means validation not working)
    Evidence: .sisyphus/evidence/task-4-ingest-invalid.txt

  Scenario: Historical data retrieval
    Tool: Bash (curl)
    Preconditions: At least 1 reading inserted
    Steps:
      1. Run: curl -sf http://localhost:8000/api/sensor-data?hours=24 | python3 -m json.tool
      2. Assert: response contains "readings" array with length > 0
      3. Assert: first reading has fields: soil_moisture, temperature, humidity, light, created_at
    Expected Result: Array of readings with all sensor fields
    Failure Indicators: Empty array, missing fields
    Evidence: .sisyphus/evidence/task-4-historical.txt

  Scenario: Plant species CRUD
    Tool: Bash (curl)
    Preconditions: Backend running
    Steps:
      1. Run: curl -sf -X PUT http://localhost:8000/api/plant/species \
           -H "Content-Type: application/json" \
           -d '{"species":"Monstera deliciosa","name":"Office Plant"}' | python3 -m json.tool
      2. Assert: response contains "species": "Monstera deliciosa"
      3. Run: curl -sf http://localhost:8000/api/plant/species | python3 -m json.tool
      4. Assert: response contains "species": "Monstera deliciosa"
    Expected Result: PUT saves, GET retrieves same species
    Failure Indicators: Species not persisted between calls
    Evidence: .sisyphus/evidence/task-4-species.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add sensor ingest and historical data API endpoints`
  - Files: `backend/src/models.py`, `backend/src/api/`, `backend/src/main.py`

- [ ] 5. React + Vite Project Scaffolding

  **What to do**:
  - Create React + Vite project in `frontend/` directory using `npm create vite@latest frontend -- --template react-ts`
  - Install dependencies:
    - `shadcn` (Shadcn UI CLI + components)
    - `tailwindcss@4` (Tailwind v4 — CSS-first, no tailwind.config.js)
    - `recharts` (charting)
    - `framer-motion` (animations)
    - `lucide-react` (icons — Lucide ONLY, no Heroicons)
    - `axios` or use native `fetch` (for API calls)
  - Set up Tailwind v4 with CSS-first config (NO `tailwind.config.js`):
    - In `src/index.css`: `@import "tailwindcss"` + `@theme { ... }` block for custom colors
    - Define plant-health theme colors: greens for healthy, ambers for warning, reds for critical
  - Set up Shadcn UI:
    - Run `npx shadcn@latest init` — follow CSS variables approach
    - Verify compatibility with Tailwind v4 — if incompatible, fall back to Tailwind v3
    - Install initial components: `button`, `card`, `input`, `badge`, `skeleton`, `separator`
  - Create basic app structure:
    - `src/App.tsx` — main layout shell
    - `src/components/` — component directory
    - `src/hooks/` — custom hooks directory
    - `src/lib/` — utility functions
    - `src/lib/api.ts` — API client using `VITE_BACKEND_URL` env var for base URL
  - Create `frontend/.env` with `VITE_BACKEND_URL=http://localhost:8000`
  - Verify dev server starts: `npm run dev` → opens on port 5173

  **Must NOT do**:
  - NO Heroicons — Lucide only
  - NO `tailwind.config.js` — use Tailwind v4 CSS-first config. If shadcn requires v3, fall back to v3 with tailwind.config.js
  - NO actual page components yet (just shell)
  - NO routing library (single page dashboard)
  - NO dark mode toggle
  - NO i18n

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Vite scaffolding with library installation
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Needed for Shadcn + Tailwind v4 setup and theme configuration

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 6, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 11, 13, 14, 15, 16
  - **Blocked By**: Task 1

  **References**:

  **External References**:
  - Vite React template: https://vitejs.dev/guide/
  - Tailwind v4 installation: https://tailwindcss.com/docs/installation/vite
  - Shadcn UI installation: https://ui.shadcn.com/docs/installation/vite
  - Recharts: https://recharts.org/en-US/guide
  - Lucide React: https://lucide.dev/guide/packages/lucide-react

  **WHY Each Reference Matters**:
  - Tailwind v4 has breaking changes from v3 — CSS-first `@import "tailwindcss"` replaces `tailwind.config.js`
  - Shadcn UI may need specific v4 compatibility steps — verify during setup

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dev server starts and renders
    Tool: Bash
    Preconditions: frontend/ scaffolded with all dependencies
    Steps:
      1. Run: cd frontend && npm run dev -- --port 5173 &
      2. Wait 5s
      3. Run: curl -sf http://localhost:5173 | head -20
      4. Assert: HTML response contains "<div id=\"root\">"
    Expected Result: Vite dev server running, serving React app
    Failure Indicators: Connection refused, build errors
    Evidence: .sisyphus/evidence/task-5-dev-server.txt

  Scenario: Dependencies installed correctly
    Tool: Bash
    Preconditions: frontend/ exists
    Steps:
      1. Run: cd frontend && cat package.json | python3 -m json.tool
      2. Assert: dependencies include "recharts", "framer-motion", "lucide-react"
      3. Assert: dependencies do NOT include "heroicons" or "@heroicons"
      4. Assert: devDependencies include "tailwindcss"
    Expected Result: All required deps present, no forbidden deps
    Failure Indicators: Missing deps or presence of heroicons
    Evidence: .sisyphus/evidence/task-5-deps.txt

  Scenario: Tailwind CSS works
    Tool: Bash
    Preconditions: Frontend running
    Steps:
      1. Run: cat frontend/src/index.css
      2. Assert: contains "@import" and "tailwindcss" (v4 pattern) OR "@tailwind base" (v3 fallback)
    Expected Result: Tailwind configured correctly
    Failure Indicators: No tailwind imports
    Evidence: .sisyphus/evidence/task-5-tailwind.txt

  Scenario: API client configured
    Tool: Bash
    Preconditions: frontend/src/lib/api.ts exists
    Steps:
      1. Run: cat frontend/src/lib/api.ts
      2. Assert: contains "VITE_BACKEND_URL"
      3. Run: cat frontend/.env
      4. Assert: contains "VITE_BACKEND_URL=http://localhost:8000"
    Expected Result: API client uses env var for backend URL
    Failure Indicators: Hardcoded URL or missing env var
    Evidence: .sisyphus/evidence/task-5-api-client.txt
  ```

  **Commit**: YES
  - Message: `feat(frontend): scaffold React+Vite with Shadcn UI and Tailwind v4`
  - Files: `frontend/`

- [ ] 6. PocketFlow Agent 1: Sensor Analysis (Rule-Based)

  **What to do**:
  - Create `backend/src/agents/` package with `__init__.py`
  - Create `backend/src/agents/sensor_analysis.py` — rule-based sensor analysis agent
  - Implement as PocketFlow `AsyncNode` (NOT sync `Node`):
    ```python
    from pocketflow import AsyncNode

    class SensorAnalysisNode(AsyncNode):
        async def prep_async(self, shared):
            """Read latest sensor data and thresholds from shared store"""
            return {
                "reading": shared["reading"],
                "thresholds": shared["thresholds"],
                "reading_count": shared["reading_count"],
            }

        async def exec_async(self, prep_res):
            """Rule-based analysis — NO LLM call, FREE"""
            reading = prep_res["reading"]
            thresholds = prep_res["thresholds"]
            issues = []
            # Check each sensor against thresholds
            if reading["soil_moisture"] < thresholds["soil_moisture_low"]:
                issues.append("Soil is too dry — needs watering")
            if reading["soil_moisture"] > thresholds["soil_moisture_high"]:
                issues.append("Soil is overwatered — reduce watering")
            # ... similar for temperature, humidity, light
            # Determine severity
            is_critical = any(...)  # define critical conditions
            is_anomaly = len(issues) > 0
            return {
                "issues": issues,
                "is_anomaly": is_anomaly,
                "is_critical": is_critical,
                "needs_ai": is_anomaly,  # only trigger AI if anomaly detected
            }

        async def post_async(self, shared, prep_res, exec_res):
            """Store results in shared, decide next step"""
            shared["rule_analysis"] = exec_res
            if exec_res["is_critical"]:
                return "critical"  # → route to AI with gpt-4o
            elif exec_res["needs_ai"]:
                return "anomaly"  # → route to AI with gpt-4o-mini
            else:
                # Normal readings — generate rule-based result, skip LLM
                shared["final_analysis"] = {
                    "health_score": self._calculate_health_score(exec_res),
                    "status": "healthy",
                    "issues": [],
                    "recommendations": ["Keep up the good care!"],
                    "analysis_type": "rule_based",
                    "model_used": None,
                }
                return "healthy"  # → skip AI agents, go to end
    ```
  - Define threshold comparison logic using values from `backend/src/config.py`
  - Calculate health_score for healthy readings (no LLM): based on how close to optimal ranges
  - This agent is the COST GATE — only anomalous/critical readings trigger LLM calls

  **Must NOT do**:
  - NO LLM calls in this agent — purely rule-based
  - NO web search
  - NO mutable state on node instances — use `shared` dict exclusively
  - NEVER use sync `Node` — use `AsyncNode` with `prep_async`/`exec_async`/`post_async`

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core business logic with threshold calculations, routing decisions, and health score algorithm
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5, 7)
  - **Parallel Group**: Wave 2
  - **Blocks**: Task 9 (flow wiring)
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - `backend/src/config.py` (Task 1) — threshold constants (`SOIL_MOISTURE_LOW`, etc.)
  - PocketFlow AsyncNode pattern: `prep_async()` reads shared → `exec_async()` processes → `post_async()` writes shared + returns routing action

  **External References**:
  - PocketFlow source: https://github.com/The-Pocket/PocketFlow — `AsyncNode` class definition (100 lines total)
  - PocketFlow Agent cookbook: https://github.com/The-Pocket/PocketFlow/tree/main/cookbook/pocketflow-agent — shows Node subclassing pattern

  **WHY Each Reference Matters**:
  - PocketFlow `exec_async()` receives NO access to `shared` — only `prep_res`. This is intentional separation of concerns
  - `post_async()` return value determines routing: "critical" → gpt-4o path, "anomaly" → gpt-4o-mini path, "healthy" → skip AI
  - Config thresholds are the decision criteria — sensor analysis agent IS these thresholds

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Normal reading returns healthy (no AI needed)
    Tool: Bash
    Preconditions: Agent module importable
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio
         from src.agents.sensor_analysis import SensorAnalysisNode
         async def test():
           node = SensorAnalysisNode()
           shared = {
             'reading': {'soil_moisture': 50, 'temperature': 22, 'humidity': 60, 'light': 500},
             'thresholds': {'soil_moisture_low': 20, 'soil_moisture_high': 80,
                           'temperature_low': 15, 'temperature_high': 35,
                           'humidity_low': 30, 'humidity_high': 80,
                           'light_low': 200, 'light_high': 50000},
             'reading_count': 10,
           }
           prep = await node.prep_async(shared)
           result = await node.exec_async(prep)
           print(f'Anomaly: {result[\"is_anomaly\"]}')
           print(f'Needs AI: {result[\"needs_ai\"]}')
           action = await node.post_async(shared, prep, result)
           print(f'Action: {action}')
           print(f'Health score: {shared[\"final_analysis\"][\"health_score\"]}')
         asyncio.run(test())
         "
      2. Assert: output contains "Anomaly: False"
      3. Assert: output contains "Needs AI: False"
      4. Assert: output contains "Action: healthy"
      5. Assert: output contains "Health score:" followed by a number 70-100
    Expected Result: Normal readings routed to "healthy" with high health score
    Failure Indicators: Anomaly detected on normal readings, or AI triggered
    Evidence: .sisyphus/evidence/task-6-normal.txt

  Scenario: Dry soil triggers anomaly
    Tool: Bash
    Preconditions: Agent module importable
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio
         from src.agents.sensor_analysis import SensorAnalysisNode
         async def test():
           node = SensorAnalysisNode()
           shared = {
             'reading': {'soil_moisture': 10, 'temperature': 22, 'humidity': 60, 'light': 500},
             'thresholds': {'soil_moisture_low': 20, 'soil_moisture_high': 80,
                           'temperature_low': 15, 'temperature_high': 35,
                           'humidity_low': 30, 'humidity_high': 80,
                           'light_low': 200, 'light_high': 50000},
             'reading_count': 10,
           }
           prep = await node.prep_async(shared)
           result = await node.exec_async(prep)
           print(f'Anomaly: {result[\"is_anomaly\"]}')
           print(f'Issues: {result[\"issues\"]}')
           action = await node.post_async(shared, prep, result)
           print(f'Action: {action}')
         asyncio.run(test())
         "
      2. Assert: output contains "Anomaly: True"
      3. Assert: output contains "dry" (case-insensitive) in issues
      4. Assert: output contains "Action: anomaly" or "Action: critical"
    Expected Result: Low moisture triggers anomaly routing to AI
    Failure Indicators: No anomaly detected for 10% moisture
    Evidence: .sisyphus/evidence/task-6-dry.txt
  ```

  **Commit**: YES (grouped with Task 7)
  - Message: `feat(backend): add PocketFlow sensor analysis agent and LLM utils`
  - Files: `backend/src/agents/sensor_analysis.py`

- [ ] 7. PocketFlow Utils: call_llm & search_web

  **What to do**:
  - Create `backend/src/utils/` package with `__init__.py`
  - Create `backend/src/utils/call_llm.py` — LiteLLM wrapper:
    ```python
    from litellm import completion, acompletion
    import json

    async def call_llm(
        messages: list[dict],
        model: str = "gpt-4o-mini",
        response_format: dict | None = None,
        max_tokens: int = 500,
        temperature: float = 0.3,
    ) -> dict:
        """Call LLM via LiteLLM. Returns parsed JSON response."""
        response = await acompletion(
            model=model,
            messages=messages,
            response_format=response_format,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        content = response.choices[0].message.content
        # Try to parse as JSON
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return {"raw": content}
    ```
  - Create `backend/src/utils/call_llm.py` with streaming variant:
    ```python
    async def call_llm_stream(
        messages: list[dict],
        model: str = "gpt-4o-mini",
        max_tokens: int = 500,
    ):
        """Streaming LLM call via LiteLLM. Yields chunks."""
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
    ```
  - Create `backend/src/utils/search_web.py` — web search wrapper:
    ```python
    async def search_web(query: str, max_results: int = 3) -> list[dict]:
        """Search web using Tavily API (or DuckDuckGo as fallback)."""
        # Primary: Tavily API
        # Fallback: DuckDuckGo (no API key needed)
        # Returns: [{"title": ..., "url": ..., "content": ...}, ...]
    ```
  - Implement Tavily as primary search (requires `TAVILY_API_KEY`), with DuckDuckGo fallback via `duckduckgo-search` package (no API key)
  - Add `tavily-python` and `duckduckgo-search` to `pyproject.toml` dependencies
  - Create `backend/src/utils/prompts.py` — system prompts:
    ```python
    PLANT_HEALTH_SYSTEM_PROMPT = """You are an expert botanist and plant care specialist.
    Analyze IoT sensor data and provide precise, actionable plant care recommendations.
    Always respond in valid JSON with this exact structure:
    {
      "health_score": <0-100 integer>,
      "status": "<healthy|warning|critical>",
      "issues": ["<specific issue 1>", ...],
      "recommendations": ["<specific actionable recommendation>", ...],
      "confidence": <0.0-1.0 float>
    }
    Rules:
    - Be specific with numbers (e.g., "water 200ml" not "water moderately")
    - Flag CRITICAL if soil moisture < 15% or temperature > 35°C
    - Consider the plant species when giving recommendations
    - If trend data is available, mention trends
    - Limit response to 300 tokens maximum
    """
    ```

  **Must NOT do**:
  - NO PocketFlow nodes in this file — just utility functions
  - NO direct OpenAI SDK import — use LiteLLM for provider abstraction
  - NO caching implementation (keep simple for prototype)
  - NO budget management (keep simple)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: LiteLLM integration with async streaming, web search with fallback pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 4, 5, 6)
  - **Parallel Group**: Wave 2
  - **Blocks**: Tasks 8, 9
  - **Blocked By**: Tasks 1, 3

  **References**:

  **Pattern References**:
  - PocketFlow `call_llm()` pattern: `from litellm import completion` — per official PocketFlow `utils.py`

  **External References**:
  - LiteLLM async completion: https://docs.litellm.ai/docs/completion/stream#async-streaming
  - LiteLLM structured output: https://docs.litellm.ai/docs/completion/json_mode
  - Tavily Python SDK: https://docs.tavily.com/documentation/python
  - DuckDuckGo Search: https://pypi.org/project/duckduckgo-search/

  **WHY Each Reference Matters**:
  - LiteLLM `acompletion()` is the async variant — MUST use this in async context, not sync `completion()`
  - Tavily is purpose-built for AI agent web search with clean content extraction
  - DuckDuckGo fallback ensures web search works even without API key

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: call_llm returns structured response
    Tool: Bash
    Preconditions: OPENAI_API_KEY set in .env, backend deps installed
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio, os
         from dotenv import load_dotenv
         load_dotenv()
         from src.utils.call_llm import call_llm
         async def test():
           result = await call_llm(
             messages=[{'role': 'user', 'content': 'Say hello in JSON: {\"greeting\": \"...\"}'}],
             model='gpt-4o-mini',
           )
           print(type(result).__name__)
           print(result)
         asyncio.run(test())
         "
      2. Assert: output type is "dict"
      3. Assert: no ImportError or API error
    Expected Result: Dict response from LLM
    Failure Indicators: ImportError, API key error, non-dict response
    Evidence: .sisyphus/evidence/task-7-call-llm.txt

  Scenario: search_web returns results
    Tool: Bash
    Preconditions: Backend deps installed (Tavily key optional — DuckDuckGo fallback)
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio
         from src.utils.search_web import search_web
         async def test():
           results = await search_web('monstera yellow leaves care')
           print(f'Results: {len(results)}')
           if results:
             print(f'First title: {results[0][\"title\"]}')
         asyncio.run(test())
         "
      2. Assert: output contains "Results:" with number > 0
    Expected Result: At least 1 search result with title
    Failure Indicators: 0 results or error
    Evidence: .sisyphus/evidence/task-7-search.txt

  Scenario: Prompts module is importable
    Tool: Bash
    Preconditions: Module exists
    Steps:
      1. Run: cd backend && uv run python -c "from src.utils.prompts import PLANT_HEALTH_SYSTEM_PROMPT; print(len(PLANT_HEALTH_SYSTEM_PROMPT))"
      2. Assert: output is a number > 100
    Expected Result: System prompt is a substantial string
    Failure Indicators: ImportError
    Evidence: .sisyphus/evidence/task-7-prompts.txt
  ```

  **Commit**: YES (grouped with Task 6)
  - Message: `feat(backend): add PocketFlow sensor analysis agent and LLM utils`
  - Files: `backend/src/utils/`, `backend/src/agents/`

- [ ] 8. PocketFlow Agents 2-4: Diagnosis, Care Advisor, Web Research

  **What to do**:
  - Create `backend/src/agents/diagnosis.py` — Plant Diagnosis Agent (LLM-powered):
    ```python
    class PlantDiagnosisNode(AsyncNode):
        async def prep_async(self, shared):
            """Prepare LLM prompt with sensor data, species, and recent history"""
            reading = shared["reading"]
            species = shared.get("plant_species", "Unknown")
            recent_readings = shared.get("recent_readings", [])
            rule_analysis = shared["rule_analysis"]
            return {
                "reading": reading,
                "species": species,
                "recent_readings": recent_readings[-12:],  # Last 12 readings max
                "rule_issues": rule_analysis["issues"],
            }

        async def exec_async(self, prep_res):
            """Call LLM for structured plant health diagnosis"""
            messages = [
                {"role": "system", "content": PLANT_HEALTH_SYSTEM_PROMPT},
                {"role": "user", "content": format_diagnosis_prompt(prep_res)},
            ]
            # Use gpt-4o for critical, gpt-4o-mini for routine
            model = prep_res.get("model", "gpt-4o-mini")
            result = await call_llm(messages=messages, model=model)
            return result

        async def post_async(self, shared, prep_res, exec_res):
            """Store diagnosis in shared, route to care advisor"""
            shared["diagnosis"] = exec_res
            return "next"  # → Care Advisor
    ```
  - Create `backend/src/agents/care_advisor.py` — Care Advisor Agent:
    ```python
    class CareAdvisorNode(AsyncNode):
        async def prep_async(self, shared):
            """Prepare context for care recommendations"""
            return {
                "diagnosis": shared["diagnosis"],
                "species": shared.get("plant_species", "Unknown"),
                "reading": shared["reading"],
            }

        async def exec_async(self, prep_res):
            """Generate specific, actionable care recommendations"""
            messages = [
                {"role": "system", "content": CARE_ADVISOR_SYSTEM_PROMPT},
                {"role": "user", "content": format_care_prompt(prep_res)},
            ]
            result = await call_llm(messages=messages, model="gpt-4o-mini")
            return result

        async def post_async(self, shared, prep_res, exec_res):
            """Store recommendations, decide if web research needed"""
            shared["care_recommendations"] = exec_res
            # Route to web research if diagnosis mentions unknown conditions
            diagnosis = shared["diagnosis"]
            if diagnosis.get("confidence", 1.0) < 0.7:
                return "research"  # → Web Research Agent
            return "done"  # → End
    ```
  - Create `backend/src/agents/web_research.py` — Web Research Agent:
    ```python
    class WebResearchNode(AsyncNode):
        MAX_SEARCHES = 3  # Cost guardrail

        async def prep_async(self, shared):
            """Build search queries from diagnosis issues"""
            diagnosis = shared["diagnosis"]
            species = shared.get("plant_species", "Unknown")
            issues = diagnosis.get("issues", [])
            # Generate focused search queries
            queries = [f"{species} {issue}" for issue in issues[:self.MAX_SEARCHES]]
            return {"queries": queries, "species": species}

        async def exec_async(self, prep_res):
            """Search web for plant care information"""
            all_results = []
            for query in prep_res["queries"]:
                results = await search_web(query, max_results=3)
                all_results.extend(results)
            return all_results

        async def post_async(self, shared, prep_res, exec_res):
            """Store research results, enrich recommendations"""
            shared["web_research"] = exec_res
            # Optionally call LLM to synthesize research into recommendations
            if exec_res:
                synthesis = await self._synthesize_research(shared, exec_res)
                shared["care_recommendations"]["web_insights"] = synthesis
            return "done"
    ```
  - Add `CARE_ADVISOR_SYSTEM_PROMPT` to `backend/src/utils/prompts.py` — focused on actionable, specific care advice
  - Add prompt formatting functions to `backend/src/utils/prompts.py`:
    - `format_diagnosis_prompt(prep_res)` — structures sensor data for LLM
    - `format_care_prompt(prep_res)` — structures diagnosis for care recommendations
  - CRITICAL: All nodes use `AsyncNode` with `prep_async`/`exec_async`/`post_async`
  - CRITICAL: `exec_async()` receives NO access to `shared` — only `prep_res`
  - CRITICAL: No mutable state on node instances — use `shared` dict only
  - Web Research Agent limited to MAX_SEARCHES = 3 per run (cost guardrail)

  **Must NOT do**:
  - NO sync `Node` — AsyncNode only
  - NO mutable instance attributes on nodes
  - NO more than 3 web searches per analysis run
  - NO agent memory/conversation history
  - NO intermediate state persistence (only final results persisted)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex multi-agent logic with LLM integration, routing, and web search
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 6, 7)
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11, 12 — but 8 must complete before 9)
  - **Blocks**: Task 9
  - **Blocked By**: Tasks 6, 7

  **References**:

  **Pattern References**:
  - `backend/src/agents/sensor_analysis.py` (Task 6) — same AsyncNode pattern, routing via post_async return
  - `backend/src/utils/call_llm.py` (Task 7) — LLM wrapper to use in exec_async
  - `backend/src/utils/search_web.py` (Task 7) — web search wrapper for research agent
  - `backend/src/utils/prompts.py` (Task 7) — system prompts and formatting functions

  **External References**:
  - PocketFlow Agent cookbook: https://github.com/The-Pocket/PocketFlow/tree/main/cookbook/pocketflow-agent — multi-node flow pattern
  - LiteLLM tiered models: gpt-4o-mini for routine ($0.15/1M tokens), gpt-4o for critical ($2.50/1M tokens)

  **WHY Each Reference Matters**:
  - PocketFlow exec_async() gets NO shared access — all reads in prep_async, all writes in post_async
  - Tiered model selection (gpt-4o-mini vs gpt-4o) based on Agent 1's severity assessment saves 85%+ on LLM costs
  - Web Research Agent's MAX_SEARCHES=3 prevents unbounded API costs

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Diagnosis agent produces structured output
    Tool: Bash
    Preconditions: OPENAI_API_KEY set, all agent modules importable
    Steps:
      1. Run: cd backend && uv run python -c "
         import asyncio, os
         from dotenv import load_dotenv
         load_dotenv()
         from src.agents.diagnosis import PlantDiagnosisNode
         async def test():
           node = PlantDiagnosisNode()
           shared = {
             'reading': {'soil_moisture': 10, 'temperature': 22, 'humidity': 60, 'light': 500},
             'rule_analysis': {'issues': ['Soil is too dry'], 'is_anomaly': True, 'is_critical': False},
             'plant_species': 'Monstera deliciosa',
             'recent_readings': [],
           }
           prep = await node.prep_async(shared)
           result = await node.exec_async(prep)
           print(f'Has health_score: {\"health_score\" in result}')
           print(f'Has status: {\"status\" in result}')
           print(f'Has issues: {\"issues\" in result}')
         asyncio.run(test())
         "
      2. Assert: all three "Has" lines show True
    Expected Result: Structured JSON with health_score, status, issues
    Failure Indicators: Missing fields, API error, malformed JSON
    Evidence: .sisyphus/evidence/task-8-diagnosis.txt

  Scenario: Web research agent respects MAX_SEARCHES limit
    Tool: Bash
    Preconditions: Agent module importable
    Steps:
      1. Run: grep "MAX_SEARCHES" backend/src/agents/web_research.py
      2. Assert: contains "MAX_SEARCHES = 3"
      3. Run: cd backend && uv run python -c "
         from src.agents.web_research import WebResearchNode
         node = WebResearchNode()
         print(f'Max: {node.MAX_SEARCHES}')
         "
      4. Assert: output is "Max: 3"
    Expected Result: Search limit enforced at 3
    Failure Indicators: No limit or limit > 3
    Evidence: .sisyphus/evidence/task-8-search-limit.txt
  ```

  **Commit**: YES (grouped with Task 9)
  - Message: `feat(backend): add PocketFlow diagnosis, care, research agents and flow wiring`
  - Files: `backend/src/agents/`

- [ ] 9. PocketFlow Flow Wiring & Analysis Trigger API

  **What to do**:
  - Create `backend/src/agents/flow.py` — wire all 4 agents into PocketFlow AsyncFlow:
    ```python
    from pocketflow import AsyncFlow

    def create_analysis_flow():
        """Create the 4-agent analysis pipeline."""
        # Instantiate nodes
        sensor_analysis = SensorAnalysisNode()
        diagnosis = PlantDiagnosisNode()
        care_advisor = CareAdvisorNode()
        web_research = WebResearchNode()

        # Wire routing
        sensor_analysis - "anomaly" >> diagnosis    # anomaly → gpt-4o-mini diagnosis
        sensor_analysis - "critical" >> diagnosis   # critical → gpt-4o diagnosis (set in shared)
        diagnosis - "next" >> care_advisor           # always → care advisor
        care_advisor - "research" >> web_research    # low confidence → web research
        care_advisor - "done" >> None                # high confidence → end
        web_research - "done" >> None                # end after research

        # Create flow starting at sensor_analysis
        flow = AsyncFlow(start=sensor_analysis)
        return flow
    ```
  - Document shared store schema at top of flow.py:
    ```python
    # Shared Store Schema:
    # INPUT:
    #   reading: dict — {soil_moisture, temperature, humidity, light}
    #   thresholds: dict — from config.py
    #   reading_count: int — total readings in DB
    #   plant_species: str — user's plant species
    #   recent_readings: list[dict] — last 12 readings for trend analysis
    #
    # OUTPUT (populated by agents):
    #   rule_analysis: dict — Agent 1 results
    #   diagnosis: dict — Agent 2 LLM results (if AI triggered)
    #   care_recommendations: dict — Agent 3 results (if AI triggered)
    #   web_research: list[dict] — Agent 4 results (if low confidence)
    #   final_analysis: dict — merged final result for storage
    ```
  - Add `max_iterations` safety: track iteration count in shared store, force end at 10
  - Create `backend/src/api/analysis.py` — analysis API routes:
    - `POST /api/analyze` — trigger analysis pipeline:
      1. Get latest reading from DB
      2. Check min readings threshold (5+)
      3. Build shared store with reading + thresholds + species
      4. Run `await flow.run_async(shared)` 
      5. Store result in `analysis_results` table
      6. Broadcast result via SSE
      7. Return analysis result
    - `GET /api/analysis/latest` — get most recent analysis result
    - `GET /api/analysis/history?limit=10` — get recent analyses
  - Handle PocketFlow errors: wrap `flow.run_async()` in try/except, return graceful error
  - If < 5 readings exist, return `{"error": "insufficient_data", "message": "Need at least 5 sensor readings before analysis", "readings_count": N}`
  - Add analysis routes to main.py router

  **Must NOT do**:
  - NO sync Flow — use AsyncFlow only
  - NO auto-triggering on every sensor reading (user-initiated or scheduled only via this endpoint)
  - NO storing intermediate agent state — only final merged result

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex flow wiring with routing logic, error handling, and API integration
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 6, 7, 8)
  - **Parallel Group**: Wave 3 (after 8 completes)
  - **Blocks**: Tasks 10, 13, 19
  - **Blocked By**: Tasks 6, 7, 8

  **References**:

  **Pattern References**:
  - `backend/src/agents/sensor_analysis.py` (Task 6) — routing via return values
  - `backend/src/agents/diagnosis.py` (Task 8) — diagnosis node
  - `backend/src/agents/care_advisor.py` (Task 8) — care node
  - `backend/src/agents/web_research.py` (Task 8) — research node
  - `backend/src/db.py` (Task 3) — database functions for reading/storing

  **External References**:
  - PocketFlow Flow wiring: https://github.com/The-Pocket/PocketFlow — `node1 - "action" >> node2` syntax
  - PocketFlow AsyncFlow: MUST use `AsyncFlow` not `Flow` for async nodes — `RuntimeError` otherwise

  **WHY Each Reference Matters**:
  - PocketFlow uses `node - "action" >> next_node` operator for routing — this is the DSL
  - `AsyncFlow` is MANDATORY for `AsyncNode` chains — mixing `Flow` + `AsyncNode` crashes at runtime
  - Shared store schema documentation is the contract between all 4 agents

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Analysis endpoint returns result for normal readings
    Tool: Bash (curl)
    Preconditions: Backend running, seed data loaded (5+ readings)
    Steps:
      1. Insert 5 normal readings via API
      2. Run: curl -sf -X POST http://localhost:8000/api/analyze | python3 -m json.tool
      3. Assert: response contains "health_score" field
      4. Assert: response contains "status" field
      5. Assert: response contains "analysis_type" (should be "rule_based" for normal readings)
    Expected Result: Rule-based analysis with health_score and healthy status
    Failure Indicators: Error response, missing fields, 500 status
    Evidence: .sisyphus/evidence/task-9-analyze-normal.txt

  Scenario: Analysis refused with insufficient data
    Tool: Bash (curl)
    Preconditions: Backend running, empty database (< 5 readings)
    Steps:
      1. Run: curl -s -w "\n%{http_code}" -X POST http://localhost:8000/api/analyze
      2. Assert: HTTP status is 400 or 422
      3. Assert: response contains "insufficient_data" or "Need at least 5"
    Expected Result: Graceful rejection with helpful message
    Failure Indicators: 200 with empty analysis, or 500 error
    Evidence: .sisyphus/evidence/task-9-insufficient.txt

  Scenario: Latest analysis endpoint works
    Tool: Bash (curl)
    Preconditions: At least one analysis has been run
    Steps:
      1. Run: curl -sf http://localhost:8000/api/analysis/latest | python3 -m json.tool
      2. Assert: response contains "health_score" and "created_at"
    Expected Result: Most recent analysis with timestamp
    Failure Indicators: Empty response or error
    Evidence: .sisyphus/evidence/task-9-latest.txt
  ```

  **Commit**: YES (grouped with Task 8)
  - Message: `feat(backend): add PocketFlow diagnosis, care, research agents and flow wiring`
  - Files: `backend/src/agents/flow.py`, `backend/src/api/analysis.py`

- [ ] 10. SSE Broadcaster & Stream Endpoint

  **What to do**:
  - Create `backend/src/sse.py` — SSE broadcaster using per-client asyncio.Queue pattern:
    ```python
    import asyncio
    from typing import AsyncGenerator

    class SSEBroadcaster:
        def __init__(self):
            self._clients: list[asyncio.Queue] = []

        async def subscribe(self) -> AsyncGenerator:
            """Subscribe a client. Yields SSE-formatted events."""
            queue = asyncio.Queue()
            self._clients.append(queue)
            try:
                while True:
                    event = await queue.get()
                    yield event
            finally:
                self._clients.remove(queue)

        async def broadcast(self, event_type: str, data: dict):
            """Send event to all connected clients."""
            import json
            message = f"event: {event_type}\ndata: {json.dumps(data)}\n\n"
            for queue in self._clients:
                queue.put_nowait(message)

        async def send_heartbeat(self):
            """Send keepalive ping to all clients."""
            await self.broadcast("ping", {"ts": datetime.utcnow().isoformat()})

    # Singleton broadcaster
    broadcaster = SSEBroadcaster()
    ```
  - Create `backend/src/api/stream.py` — SSE endpoint:
    - `GET /api/stream` — SSE endpoint using FastAPI native SSE (`from fastapi.sse import EventSourceResponse`) if available, else `sse-starlette`
    - Set proper headers: `Cache-Control: no-cache`, `X-Accel-Buffering: no`
    - Send heartbeat every 15s to keep connection alive
    - Event types: `sensor_data` (new reading), `analysis` (new analysis result), `ping` (heartbeat)
  - Integrate broadcaster with sensor ingest (Task 4): after inserting reading, call `broadcaster.broadcast("sensor_data", reading_dict)`
  - Integrate broadcaster with analysis (Task 9): after analysis completes, call `broadcaster.broadcast("analysis", result_dict)`
  - Add stream routes to main.py router
  - CRITICAL: Single uvicorn worker only (`--workers 1`) — in-memory broadcaster breaks with multiple workers

  **Must NOT do**:
  - NO WebSocket — SSE only
  - NO external pub/sub service (Redis, Pusher)
  - NO multiple uvicorn workers
  - NO proxy buffering (headers prevent it)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Async SSE broadcasting with proper lifecycle management
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 11, 12 — but needs 4, 9 complete)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 13, 19
  - **Blocked By**: Tasks 4, 9

  **References**:

  **Pattern References**:
  - `backend/src/api/sensors.py` (Task 4) — integrate broadcaster.broadcast() after insert
  - `backend/src/api/analysis.py` (Task 9) — integrate broadcaster.broadcast() after analysis

  **External References**:
  - FastAPI native SSE (≥0.135.0): `from fastapi.sse import EventSourceResponse, ServerSentEvent`
  - sse-starlette fallback: https://pypi.org/project/sse-starlette/
  - SSE broadcasting pattern: per-client asyncio.Queue fan-out

  **WHY Each Reference Matters**:
  - FastAPI native SSE auto-sets `Cache-Control: no-cache` and `X-Accel-Buffering: no`
  - Per-client Queue pattern ensures each client gets all events without blocking others
  - Heartbeat every 15s prevents proxy/CDN timeout and browser reconnection

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: SSE stream connects and receives heartbeat
    Tool: Bash
    Preconditions: Backend running
    Steps:
      1. Run: timeout 25 curl -sf -N http://localhost:8000/api/stream 2>&1 | head -5
      2. Assert: output contains "event:" (either "event: ping" or "event: sensor_data")
    Expected Result: SSE events received within 25s
    Failure Indicators: Timeout with no output, connection refused
    Evidence: .sisyphus/evidence/task-10-sse-connect.txt

  Scenario: SSE receives sensor data event after POST
    Tool: Bash
    Preconditions: Backend running
    Steps:
      1. Start SSE listener in background: timeout 15 curl -sf -N http://localhost:8000/api/stream > /tmp/sse-output.txt &
      2. Wait 2s
      3. POST sensor data: curl -sf -X POST http://localhost:8000/api/sensor-data \
           -H "Content-Type: application/json" \
           -d '{"soil_moisture":50,"temperature":22,"humidity":60,"light":500}'
      4. Wait 3s
      5. Run: cat /tmp/sse-output.txt
      6. Assert: output contains "event: sensor_data"
    Expected Result: SSE stream includes sensor_data event after POST
    Failure Indicators: No sensor_data event in stream
    Evidence: .sisyphus/evidence/task-10-sse-sensor.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add SSE broadcaster and stream endpoint`
  - Files: `backend/src/sse.py`, `backend/src/api/stream.py`

- [ ] 11. Dashboard Layout & Sensor Time-Series Charts

  **What to do**:
  - Create `frontend/src/pages/Dashboard.tsx` — main dashboard page
  - Create dashboard layout with header + main content area:
    - Header: app title "Plant Health Monitor", plant species display, connection status indicator
    - Main grid: sensor charts (large), AI analysis card (sidebar), plant config (small)
  - Create `frontend/src/components/SensorChart.tsx` — Recharts time-series chart:
    - Use `ResponsiveContainer` wrapping (mandatory for responsive layout)
    - `AreaChart` with gradient fills for polished look
    - Show soil moisture, temperature, humidity, light as separate series
    - Time axis (X) with formatted timestamps
    - Tooltip showing exact values on hover
    - Legend for each sensor type
    - Use plant-health theme colors: greens (moisture), reds (temperature), blues (humidity), yellows (light)
  - Create `frontend/src/components/SensorCard.tsx` — individual sensor stat card:
    - Current value with icon (Lucide: `Droplets` for moisture, `Thermometer` for temp, `Wind` for humidity, `Sun` for light)
    - Trend indicator (up/down/stable arrow)
    - Status badge (healthy/warning/critical) using Shadcn Badge component
    - Use Framer Motion `motion.div` for subtle entrance animation
  - Create `frontend/src/hooks/useSensorData.ts` — custom hook:
    - Fetch historical data from `GET /api/sensor-data?hours=24`
    - Fetch latest reading from `GET /api/sensor-data/latest`
    - Auto-refresh on interval (every 60s) or via SSE (Task 13)
    - Return `{ readings, latest, isLoading, error }`
  - Create `frontend/src/components/ConnectionStatus.tsx`:
    - Show green dot + "Connected" when SSE is active
    - Show amber dot + "Reconnecting" during SSE reconnect
    - Show red dot + "Offline" when disconnected
    - Add `data-testid="connection-status"` attribute
  - Add `data-testid` attributes to ALL key elements:
    - `data-testid="sensor-chart"` on chart container
    - `data-testid="sensor-card-moisture"`, `data-testid="sensor-card-temperature"`, etc.
    - `data-testid="connection-status"` on connection indicator
  - Design for minimal data: charts should look good even with just a few data points (no empty gaps)
  - Use Shadcn `Card`, `Badge`, `Skeleton` components
  - Responsive grid layout (but NO mobile optimization — desktop-first)

  **Must NOT do**:
  - NO mobile-first responsive design
  - NO dark mode
  - NO virtual scrolling or infinite scroll
  - NO complex data tables
  - NO client-side caching beyond React state
  - NO Heroicons — Lucide only

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Dashboard UI with charts, animations, and polished design
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Crafting professional dashboard layout with Shadcn + Recharts + Framer Motion

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 10, 12)
  - **Parallel Group**: Wave 3
  - **Blocks**: Tasks 13, 15
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `frontend/src/lib/api.ts` (Task 5) — API client with VITE_BACKEND_URL
  - Shadcn Card/Badge/Skeleton components installed in Task 5

  **External References**:
  - Recharts AreaChart: https://recharts.org/en-US/api/AreaChart
  - Recharts ResponsiveContainer: https://recharts.org/en-US/api/ResponsiveContainer
  - Recharts gradient fill: use `<defs><linearGradient>` in chart for polished look
  - Framer Motion: https://www.framer.com/motion/
  - Lucide icons list: https://lucide.dev/icons/

  **WHY Each Reference Matters**:
  - `ResponsiveContainer` is MANDATORY — without it, Recharts renders at 0px width
  - Gradient fills via `<linearGradient>` in `<defs>` give professional chart appearance
  - Lucide has specific sensor-related icons (Droplets, Thermometer, Wind, Sun) for data cards

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dashboard renders with sensor chart
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running on localhost:5173, backend running with seed data
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for [data-testid="sensor-chart"] to be visible (timeout: 10s)
      3. Assert: [data-testid="sensor-chart"] is visible
      4. Assert: page title or heading contains "Plant Health" (case-insensitive)
      5. Screenshot
    Expected Result: Dashboard with visible chart containing data
    Failure Indicators: Chart not visible, blank page, loading forever
    Evidence: .sisyphus/evidence/task-11-dashboard.png

  Scenario: Sensor cards display current values
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running with backend data
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: [data-testid="sensor-card-moisture"] is visible
      3. Assert: [data-testid="sensor-card-temperature"] is visible
      4. Assert: [data-testid="sensor-card-humidity"] is visible
      5. Assert: [data-testid="sensor-card-light"] is visible
      6. Assert: each card contains a numeric value
    Expected Result: 4 sensor cards with current readings
    Failure Indicators: Missing cards, no values displayed
    Evidence: .sisyphus/evidence/task-11-sensor-cards.png

  Scenario: Connection status indicator visible
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running
    Steps:
      1. Navigate to http://localhost:5173
      2. Assert: [data-testid="connection-status"] is visible
    Expected Result: Connection status indicator shown
    Failure Indicators: Missing indicator
    Evidence: .sisyphus/evidence/task-11-connection.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add dashboard layout with sensor time-series charts`
  - Files: `frontend/src/pages/`, `frontend/src/components/`, `frontend/src/hooks/`

- [ ] 12. Seed Data Script

  **What to do**:
  - Create `backend/seed.py` — generates 24h of realistic mock sensor data:
    - 1 reading per minute = 1,440 readings
    - Realistic patterns: soil moisture slowly decreasing over time (evaporation), temperature following day/night cycle, humidity inversely correlated with temperature, light following sunrise-noon-sunset pattern
    - Add some "event" data: a watering event (moisture spike), a cloud passing (light dip), a window opening (temperature dip + humidity change)
    - Insert a few analysis results: 1 healthy (rule-based), 1 warning (AI), 1 recent healthy
    - Set plant species to "Monstera deliciosa" in plant_config
  - Script should be runnable via `uv run python seed.py` from backend directory
  - Print summary when done: "Inserted 1440 readings, 3 analyses, species: Monstera deliciosa"
  - Use realistic value ranges:
    - Soil moisture: 30-70% (gradually decreasing with watering spike)
    - Temperature: 18-28°C (day/night cycle)
    - Humidity: 40-75% (inverse of temperature)
    - Light: 0-5000 lux (sunrise at 6am, peak at noon, sunset at 6pm, 0 at night)

  **Must NOT do**:
  - NO random noise only — must have realistic patterns
  - NO more than 24h of data
  - NO separate migration script

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single Python script with math/datetime logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 8, 9, 10, 11)
  - **Parallel Group**: Wave 3
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `backend/src/db.py` (Task 3) — database functions to call for inserts

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Seed script runs and populates database
    Tool: Bash
    Preconditions: Backend database module available
    Steps:
      1. Run: cd backend && uv run python seed.py
      2. Assert: output contains "1440" (readings count)
      3. Assert: output contains "Monstera" (species)
      4. Run: cd backend && uv run python -c "
         import asyncio
         from src.db import init_db, get_readings, get_reading_count
         async def check():
           await init_db()
           count = await get_reading_count()
           print(f'Total readings: {count}')
           readings = await get_readings(hours=24)
           print(f'Readings in 24h: {len(readings)}')
         asyncio.run(check())
         "
      5. Assert: Total readings >= 1440
    Expected Result: 1440 readings with realistic patterns
    Failure Indicators: 0 readings, error during seed
    Evidence: .sisyphus/evidence/task-12-seed.txt
  ```

  **Commit**: YES
  - Message: `feat(backend): add seed data script for development`
  - Files: `backend/seed.py`

- [ ] 13. AI Analysis Card & SSE Consumer

  **What to do**:
  - Create `frontend/src/hooks/useSSE.ts` — SSE consumer hook:
    ```typescript
    function useSSE(url: string) {
      // Create EventSource connection to /api/stream
      // Handle event types: sensor_data, analysis, ping
      // Auto-reconnect on disconnect with "Reconnecting..." status
      // Update connection status (connected/reconnecting/offline)
      // Return { lastSensorData, lastAnalysis, connectionStatus }
    }
    ```
  - Create `frontend/src/components/AnalysisCard.tsx` — AI analysis display:
    - Health score as large circular gauge/number (0-100) with color coding:
      - 80-100: green (healthy)
      - 50-79: amber (warning)  
      - 0-49: red (critical)
    - Status badge: "Healthy" / "Warning" / "Critical" using Shadcn Badge
    - Issues list: each issue as a bulleted item
    - Recommendations list: each recommendation as an actionable item
    - Analysis type indicator: "Rule-based" or "AI-powered" with model name
    - "Last analyzed" timestamp
    - "Analyze Now" button — triggers `POST /api/analyze` and shows loading state
    - Streaming indicator: show analysis appearing word-by-word when AI is running
    - Add `data-testid="analysis-card"`, `data-testid="health-score"`, `data-testid="analyze-button"`
    - Use Framer Motion for smooth card entrance and score number animation
  - Create `frontend/src/components/AnalysisHistory.tsx` — small timeline of recent analyses:
    - Show last 5 analyses with timestamp + health score + status badge
    - Compact layout (sidebar or below main card)
  - Integrate SSE hook with dashboard:
    - When `sensor_data` event received: update latest reading + chart
    - When `analysis` event received: update analysis card
    - Update ConnectionStatus component from SSE connection state
  - Handle "Analyze Now" button:
    - Show loading spinner while analysis runs
    - On success: update analysis card with result
    - On error: show error message in card
    - On "insufficient_data": show helpful message

  **Must NOT do**:
  - NO WebSocket — EventSource (SSE) only
  - NO client-side caching beyond React state
  - NO polling fallback (SSE auto-reconnects)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI component with SSE integration, animations, and streaming display
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Polished health score visualization with animations

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 14)
  - **Parallel Group**: Wave 4
  - **Blocks**: Tasks 15, 19
  - **Blocked By**: Tasks 10, 11

  **References**:

  **Pattern References**:
  - `frontend/src/hooks/useSensorData.ts` (Task 11) — data fetching pattern to integrate with
  - `frontend/src/components/ConnectionStatus.tsx` (Task 11) — update with SSE state
  - `backend/src/api/stream.py` (Task 10) — SSE event format (event: type\ndata: JSON\n\n)
  - `backend/src/api/analysis.py` (Task 9) — analysis response schema

  **External References**:
  - EventSource API: https://developer.mozilla.org/en-US/docs/Web/API/EventSource
  - Framer Motion animate number: `motion.span` with `animate={{ scale: [1, 1.2, 1] }}`

  **WHY Each Reference Matters**:
  - EventSource auto-reconnects on disconnect — no manual retry logic needed
  - SSE event format must match backend: `event: sensor_data\ndata: {...}\n\n`

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Analysis card displays health score
    Tool: Playwright (playwright skill)
    Preconditions: Frontend + backend running, at least 1 analysis exists
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for [data-testid="analysis-card"] to be visible (timeout: 10s)
      3. Assert: [data-testid="health-score"] is visible and contains a number
      4. Assert: [data-testid="analyze-button"] is visible
      5. Screenshot
    Expected Result: Analysis card with health score and analyze button
    Failure Indicators: Card not visible, no score, missing button
    Evidence: .sisyphus/evidence/task-13-analysis-card.png

  Scenario: Analyze Now button triggers analysis
    Tool: Playwright (playwright skill)
    Preconditions: Frontend + backend running, 5+ readings in DB
    Steps:
      1. Navigate to http://localhost:5173
      2. Click [data-testid="analyze-button"]
      3. Wait for loading state to appear
      4. Wait for loading state to disappear (timeout: 30s)
      5. Assert: [data-testid="health-score"] contains updated number
      6. Screenshot
    Expected Result: Analysis triggered and result displayed
    Failure Indicators: Button doesn't respond, loading never ends, no result
    Evidence: .sisyphus/evidence/task-13-analyze-click.png

  Scenario: SSE updates dashboard in real-time
    Tool: Playwright + Bash
    Preconditions: Frontend + backend running
    Steps:
      1. Open http://localhost:5173 in Playwright
      2. Note current sensor values
      3. POST new sensor data via curl: curl -X POST http://localhost:8000/api/sensor-data ...
      4. Wait 5s
      5. Assert: sensor values on dashboard have updated (different from step 2)
    Expected Result: Dashboard updates without page refresh
    Failure Indicators: Values don't update, requires manual refresh
    Evidence: .sisyphus/evidence/task-13-sse-update.png
  ```

  **Commit**: YES (grouped with Task 14)
  - Message: `feat(frontend): add AI analysis card, species config, and state handling`
  - Files: `frontend/src/components/AnalysisCard.tsx`, `frontend/src/hooks/useSSE.ts`

- [ ] 14. Plant Species Config & Empty/Loading/Error States

  **What to do**:
  - Create `frontend/src/components/PlantConfig.tsx` — plant species configuration:
    - Text input field for plant species (e.g., "Monstera deliciosa")
    - Text input for plant name (e.g., "Office Plant")
    - Save button — calls `PUT /api/plant/species`
    - Show current saved species from `GET /api/plant/species`
    - Success feedback: briefly show "Saved!" after successful update
    - Add `data-testid="species-input"`, `data-testid="save-species"`
    - Use Shadcn `Input`, `Button`, `Label` components
  - Implement empty/loading/error states for ALL data sections:
    - **Loading state**: Shadcn `Skeleton` components matching layout shape
    - **Empty state** (no data): 
      - Sensor chart: "No sensor data yet. Connect your ESP32 to start monitoring."
      - Analysis card: "No analysis yet. Need at least 5 readings."
      - Add plant illustration or icon (Lucide `Sprout` or `Flower2`)
      - Add `data-testid="empty-state"` to empty state container
    - **Error state**:
      - API error: "Unable to connect to backend. Is the server running?"
      - Network error: "Network error. Check your connection."
      - Show retry button
  - Handle 3 states for EVERY data section: loading → data → error/empty
  - Use Framer Motion `AnimatePresence` for smooth transitions between states
  - All states must look polished (not just text — icons, proper spacing, subtle colors)

  **Must NOT do**:
  - NO settings page — species config is inline on dashboard
  - NO autocomplete/dropdown for species (free text input)
  - NO validation on species text (AI handles any input gracefully)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: State management UI with polished empty/loading/error designs
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Crafting beautiful empty states and transitions

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 13)
  - **Parallel Group**: Wave 4
  - **Blocks**: Task 15
  - **Blocked By**: Tasks 4, 5

  **References**:

  **Pattern References**:
  - `frontend/src/lib/api.ts` (Task 5) — API client for plant species endpoints
  - `backend/src/api/plant.py` (Task 4) — plant species API response format
  - Shadcn Skeleton: installed in Task 5

  **External References**:
  - Framer Motion AnimatePresence: https://www.framer.com/motion/animate-presence/
  - Shadcn Skeleton: https://ui.shadcn.com/docs/components/skeleton
  - Lucide plant icons: Sprout, Flower2, TreePine, Leaf

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Plant species can be configured
    Tool: Playwright (playwright skill)
    Preconditions: Frontend + backend running
    Steps:
      1. Navigate to http://localhost:5173
      2. Find [data-testid="species-input"]
      3. Clear input and type "Fiddle Leaf Fig"
      4. Click [data-testid="save-species"]
      5. Wait 2s
      6. Assert: text "Fiddle Leaf Fig" appears on page
      7. Reload page
      8. Assert: [data-testid="species-input"] still contains "Fiddle Leaf Fig"
    Expected Result: Species saved and persisted across reloads
    Failure Indicators: Species not saved, lost on reload
    Evidence: .sisyphus/evidence/task-14-species.png

  Scenario: Empty state renders gracefully
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running, backend running with EMPTY database
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for page to load (timeout: 10s)
      3. Assert: [data-testid="empty-state"] is visible
      4. Assert: page does NOT show error
      5. Assert: text matches /no.*data|get.*started|waiting|connect/i
      6. Screenshot
    Expected Result: Friendly empty state with guidance text
    Failure Indicators: Blank page, error messages, broken layout
    Evidence: .sisyphus/evidence/task-14-empty-state.png

  Scenario: Loading skeletons appear during data fetch
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running
    Steps:
      1. Navigate to http://localhost:5173 with network throttling (Slow 3G)
      2. Assert: skeleton elements are visible during loading
      3. Wait for data to load
      4. Assert: skeletons replaced by actual content
    Expected Result: Smooth loading → data transition
    Failure Indicators: No loading indication, content jumps
    Evidence: .sisyphus/evidence/task-14-loading.png
  ```

  **Commit**: YES (grouped with Task 13)
  - Message: `feat(frontend): add AI analysis card, species config, and state handling`
  - Files: `frontend/src/components/PlantConfig.tsx`, updates to existing components

- [ ] 15. Dashboard Animations & Design Polish

  **What to do**:
  - Apply Framer Motion animations throughout the dashboard:
    - Page entrance: staggered fade-in of cards (each card delays 100ms after previous)
    - Sensor cards: subtle scale animation on data update
    - Health score: animated counter (0 → actual score) when analysis loads
    - Analysis card: slide-in from right when new analysis arrives via SSE
    - Chart: smooth line transitions when new data points are added
  - Design polish with Tailwind v4:
    - Define custom theme in `@theme` block: plant-health color palette
      - Primary: forest green (#166534)
      - Healthy: emerald green (#059669)
      - Warning: amber (#d97706)  
      - Critical: red (#dc2626)
      - Background: light gray (#f8fafc)
      - Cards: white with subtle shadow
    - Add gradient backgrounds to sensor cards
    - Add subtle border-left color coding on analysis issues (green/amber/red)
    - Ensure consistent spacing (use Tailwind's spacing scale)
    - Typography hierarchy: clear heading sizes, readable body text
  - Make dashboard look professional with MINIMAL data (1-2 readings):
    - Chart should show connected dots even with few points
    - Cards should have reasonable default values, not "NaN" or "undefined"
    - Overall layout should feel "complete" even when data is sparse
  - Add subtle hover effects on interactive elements (buttons, cards)
  - Ensure Lucide icons are consistently sized and colored
  - Final visual audit: check alignment, spacing, color consistency

  **Must NOT do**:
  - NO dark mode
  - NO complex animations that distract from data
  - NO custom fonts (use system font stack or Tailwind defaults)
  - NO mobile-specific responsive adjustments

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Pure design polish with animations, theming, and visual refinement
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Professional polish — the difference between "works" and "impressive"

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Tasks 11, 13, 14 complete)
  - **Parallel Group**: Wave 4 (after 13, 14)
  - **Blocks**: Task 16
  - **Blocked By**: Tasks 11, 13, 14

  **References**:

  **Pattern References**:
  - All frontend components from Tasks 11, 13, 14 — this task polishes them
  - `frontend/src/index.css` (Task 5) — Tailwind v4 `@theme` block for colors

  **External References**:
  - Framer Motion stagger: https://www.framer.com/motion/stagger-children/
  - Tailwind v4 theming: `@theme { --color-primary: ... }` in CSS

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Dashboard looks professional with seed data
    Tool: Playwright (playwright skill)
    Preconditions: Frontend + backend running with seed data
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for all content to load (timeout: 15s)
      3. Take full-page screenshot
      4. Assert: [data-testid="sensor-chart"] contains visible chart lines/areas
      5. Assert: sensor cards have colored backgrounds or borders
      6. Assert: analysis card has visible health score with color coding
    Expected Result: Polished, professional dashboard with data
    Failure Indicators: Raw/unstyled elements, missing colors, broken layout
    Evidence: .sisyphus/evidence/task-15-polished.png

  Scenario: Animations are smooth (not janky)
    Tool: Playwright (playwright skill)
    Preconditions: Frontend running with seed data
    Steps:
      1. Navigate to http://localhost:5173
      2. Wait for entrance animations to complete
      3. Assert: no layout shifts after animations
      4. Click [data-testid="analyze-button"]
      5. Wait for analysis result
      6. Assert: result appears with smooth animation (no jump/flash)
    Expected Result: Smooth animations, no janky transitions
    Failure Indicators: Layout shifts, flashing content, no animations at all
    Evidence: .sisyphus/evidence/task-15-animations.png
  ```

  **Commit**: YES
  - Message: `feat(frontend): add animations, design polish, and final styling`
  - Files: `frontend/src/`

- [ ] 16. Frontend Deployment Config (Vercel)

  **What to do**:
  - Create `frontend/vercel.json`:
    ```json
    {
      "buildCommand": "npm run build",
      "outputDirectory": "dist",
      "framework": "vite",
      "rewrites": [
        { "source": "/(.*)", "destination": "/index.html" }
      ]
    }
    ```
  - Ensure `frontend/package.json` has correct `build` script: `"build": "tsc && vite build"`
  - Add `frontend/.env.production` with placeholder: `VITE_BACKEND_URL=https://your-backend-url.com`
  - Verify build works: `npm run build` produces `dist/` directory
  - Add Vercel-specific notes to README: how to deploy frontend to Vercel, set env vars

  **Must NOT do**:
  - NO CI/CD for frontend (Vercel auto-deploys from git)
  - NO server-side rendering (SPA only)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple config file creation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs Task 15 complete)
  - **Parallel Group**: Wave 4 (after 15)
  - **Blocks**: Task 19
  - **Blocked By**: Tasks 5, 15

  **References**:

  **External References**:
  - Vercel Vite deployment: https://vercel.com/docs/frameworks/vite

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Frontend builds successfully
    Tool: Bash
    Preconditions: frontend/ fully set up
    Steps:
      1. Run: cd frontend && npm run build
      2. Assert: exit code 0
      3. Run: ls frontend/dist/index.html
      4. Assert: file exists
    Expected Result: Production build succeeds, dist/ contains index.html
    Failure Indicators: Build errors, missing dist/
    Evidence: .sisyphus/evidence/task-16-build.txt
  ```

  **Commit**: YES
  - Message: `chore(frontend): add Vercel deployment config`
  - Files: `frontend/vercel.json`, `frontend/.env.production`

- [ ] 17. Dockerfile & Docker Compose

  **What to do**:
  - Create `backend/Dockerfile`:
    ```dockerfile
    FROM python:3.12-slim
    
    # Install uv
    COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
    
    WORKDIR /app
    
    # Copy dependency files first (better layer caching)
    COPY pyproject.toml uv.lock ./
    RUN uv sync --frozen --no-dev
    
    # Copy application code
    COPY src/ src/
    COPY seed.py .
    
    # Create data directory for SQLite
    RUN mkdir -p data
    
    EXPOSE 8000
    
    # Run with single worker (SSE broadcaster requirement)
    CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
    ```
  - Create `docker-compose.yml` (project root):
    ```yaml
    services:
      backend:
        build:
          context: ./backend
          dockerfile: Dockerfile
        ports:
          - "8000:8000"
        volumes:
          - plant-data:/app/data  # Persist SQLite
        env_file:
          - .env
        restart: unless-stopped
        healthcheck:
          test: ["CMD", "curl", "-sf", "http://localhost:8000/api/health"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 10s
    
    volumes:
      plant-data:
    ```
  - Ensure `--workers 1` is used (SSE broadcaster breaks with multiple workers)
  - Add `.dockerignore` in backend: `__pycache__`, `.env`, `*.db`, `.git`, `node_modules`
  - Document in README: `docker compose up -d` to start, `docker compose down -v` warning about data loss

  **Must NOT do**:
  - NO multi-stage build (keep simple)
  - NO nginx reverse proxy in compose
  - NO multiple workers
  - NO frontend in Docker (Vercel handles it)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard Dockerfile + compose config
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 18)
  - **Parallel Group**: Wave 5
  - **Blocks**: Tasks 18, 19
  - **Blocked By**: Task 4

  **References**:

  **External References**:
  - uv Docker: https://docs.astral.sh/uv/guides/integration/docker/
  - Docker Compose healthcheck: https://docs.docker.com/compose/compose-file/05-services/#healthcheck

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Docker build succeeds
    Tool: Bash
    Preconditions: Dockerfile exists
    Steps:
      1. Run: docker build -t plant-health-backend ./backend
      2. Assert: exit code 0
      3. Assert: output contains "Successfully built" or "Successfully tagged"
    Expected Result: Docker image builds without errors
    Failure Indicators: Build failure, missing dependencies
    Evidence: .sisyphus/evidence/task-17-docker-build.txt

  Scenario: Docker compose brings up healthy backend
    Tool: Bash
    Preconditions: docker-compose.yml exists, .env configured
    Steps:
      1. Run: docker compose up -d
      2. Wait 15s for startup
      3. Run: curl -sf http://localhost:8000/api/health | python3 -m json.tool
      4. Assert: response contains "status": "healthy"
      5. Run: docker compose down
    Expected Result: Backend healthy in container
    Failure Indicators: Container crash, health check fails
    Evidence: .sisyphus/evidence/task-17-compose.txt
  ```

  **Commit**: YES
  - Message: `chore(backend): add Dockerfile and docker-compose.yml`
  - Files: `backend/Dockerfile`, `docker-compose.yml`, `backend/.dockerignore`

- [ ] 18. GitHub Action for GHCR Publish

  **What to do**:
  - Create `.github/workflows/publish.yml`:
    ```yaml
    name: Build and Publish Backend Image
    
    on:
      push:
        branches: [main]
        paths:
          - 'backend/pyproject.toml'
    
    jobs:
      check-version:
        runs-on: ubuntu-latest
        outputs:
          version_changed: ${{ steps.check.outputs.changed }}
          version: ${{ steps.check.outputs.version }}
        steps:
          - uses: actions/checkout@v4
            with:
              fetch-depth: 2
          - name: Check version change
            id: check
            run: |
              CURRENT=$(grep -m1 '^version = ' backend/pyproject.toml | cut -d'"' -f2)
              PREVIOUS=$(git show HEAD~1:backend/pyproject.toml 2>/dev/null | grep -m1 '^version = ' | cut -d'"' -f2 || echo "")
              if [ "$CURRENT" != "$PREVIOUS" ]; then
                echo "changed=true" >> $GITHUB_OUTPUT
                echo "version=$CURRENT" >> $GITHUB_OUTPUT
              else
                echo "changed=false" >> $GITHUB_OUTPUT
              fi
    
      build-and-push:
        needs: check-version
        if: needs.check-version.outputs.version_changed == 'true'
        runs-on: ubuntu-latest
        permissions:
          contents: read
          packages: write
        steps:
          - uses: actions/checkout@v4
          
          - name: Log in to GHCR
            uses: docker/login-action@v3
            with:
              registry: ghcr.io
              username: ${{ github.actor }}
              password: ${{ secrets.GITHUB_TOKEN }}
          
          - name: Build and push
            uses: docker/build-push-action@v5
            with:
              context: ./backend
              push: true
              tags: |
                ghcr.io/${{ github.repository }}/backend:latest
                ghcr.io/${{ github.repository }}/backend:${{ needs.check-version.outputs.version }}
    ```
  - Version detection: compare current vs previous `pyproject.toml` version field
  - Tags: `latest` + version-specific (e.g., `0.1.0`)
  - Only triggers on push to `main` that changes `backend/pyproject.toml`

  **Must NOT do**:
  - NO frontend CI/CD (Vercel handles it)
  - NO test step in CI (no automated tests)
  - NO deployment step (just image push)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Standard GitHub Actions workflow file
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 17)
  - **Parallel Group**: Wave 5
  - **Blocks**: Task 19
  - **Blocked By**: Task 17

  **References**:

  **Pattern References**:
  - `backend/pyproject.toml` (Task 1) — version field location
  - `backend/Dockerfile` (Task 17) — build context

  **External References**:
  - GitHub Actions docker/login-action: https://github.com/docker/login-action
  - GitHub Actions docker/build-push-action: https://github.com/docker/build-push-action
  - GHCR authentication: uses GITHUB_TOKEN, no separate secret needed

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Workflow file is valid YAML
    Tool: Bash
    Preconditions: Workflow file exists
    Steps:
      1. Run: python3 -c "import yaml; yaml.safe_load(open('.github/workflows/publish.yml'))"
      2. Assert: exit code 0 (valid YAML)
      3. Run: cat .github/workflows/publish.yml
      4. Assert: contains "ghcr.io"
      5. Assert: contains "pyproject.toml"
      6. Assert: contains "docker/build-push-action"
    Expected Result: Valid YAML with correct GHCR and version detection config
    Failure Indicators: YAML parse error, missing GHCR reference
    Evidence: .sisyphus/evidence/task-18-workflow.txt
  ```

  **Commit**: YES
  - Message: `ci: add GitHub Action for GHCR publish on version change`
  - Files: `.github/workflows/publish.yml`

- [ ] 19. End-to-End Integration Verification

  **What to do**:
  - This task verifies the COMPLETE system works end-to-end, not just individual components
  - Start fresh: clean database, run seed script, start backend, start frontend
  - Verify the full data pipeline:
    1. Seed data populates DB → verify via API
    2. Frontend loads and shows seed data in charts
    3. POST new sensor reading → SSE pushes to frontend → chart updates
    4. Trigger analysis → PocketFlow pipeline runs → result appears in dashboard
    5. Configure plant species → analysis uses species context
    6. Docker build + compose → same flow works in container
  - Fix any integration issues discovered (mismatched API response formats, CORS issues, SSE event format mismatches, etc.)
  - Run ALL acceptance criteria from ALL previous tasks as a regression check
  - Capture evidence screenshots and command outputs

  **Must NOT do**:
  - NO new features — only verify and fix integration bugs
  - NO scope expansion

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex multi-component integration testing requiring holistic understanding
  - **Skills**: [`playwright`]
    - `playwright`: Browser automation for frontend verification

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on ALL tasks)
  - **Parallel Group**: Wave 5 (final, after all others)
  - **Blocks**: F1-F4
  - **Blocked By**: ALL tasks (1-18)

  **References**:

  **Pattern References**:
  - ALL previous tasks — this verifies their combined output
  - Acceptance criteria from every task

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Full pipeline — seed → API → dashboard
    Tool: Bash + Playwright
    Preconditions: Clean state
    Steps:
      1. Clean DB: rm -f backend/data/plant_health.db
      2. Run: cd backend && uv run python seed.py
      3. Start backend: cd backend && uv run uvicorn src.main:app --port 8000 &
      4. Start frontend: cd frontend && npm run dev &
      5. Wait 10s
      6. Navigate to http://localhost:5173 (Playwright)
      7. Assert: chart shows 24h of data
      8. Assert: sensor cards show values
      9. Assert: analysis card shows most recent analysis
    Expected Result: Complete dashboard with all seed data
    Evidence: .sisyphus/evidence/task-19-full-pipeline.png

  Scenario: Live update pipeline — POST → SSE → dashboard
    Tool: Bash + Playwright
    Preconditions: Backend + frontend running
    Steps:
      1. Open http://localhost:5173 in Playwright
      2. Note current latest reading timestamp
      3. POST new reading: curl -X POST http://localhost:8000/api/sensor-data \
           -H "Content-Type: application/json" \
           -d '{"soil_moisture":30,"temperature":28,"humidity":45,"light":1200}'
      4. Wait 5s
      5. Assert: dashboard shows updated values (different timestamp)
    Expected Result: Dashboard updates in real-time via SSE
    Evidence: .sisyphus/evidence/task-19-live-update.png

  Scenario: Analysis pipeline — trigger → AI → dashboard
    Tool: Bash + Playwright
    Preconditions: 5+ readings in DB
    Steps:
      1. Open http://localhost:5173
      2. Click [data-testid="analyze-button"]
      3. Wait for result (timeout: 60s — LLM may be slow)
      4. Assert: [data-testid="health-score"] shows updated number
      5. Assert: [data-testid="analysis-card"] shows issues or "healthy" status
    Expected Result: AI analysis completes and displays on dashboard
    Evidence: .sisyphus/evidence/task-19-analysis.png

  Scenario: Docker deployment works
    Tool: Bash
    Preconditions: Docker installed
    Steps:
      1. Run: docker compose up -d
      2. Wait 15s
      3. Run: curl -sf http://localhost:8000/api/health
      4. Assert: healthy response
      5. Run: curl -sf http://localhost:8000/api/sensor-data?hours=24
      6. Assert: returns valid JSON
      7. Run: docker compose down
    Expected Result: Containerized backend fully functional
    Evidence: .sisyphus/evidence/task-19-docker.txt
  ```

  **Commit**: YES
  - Message: `chore: end-to-end integration verification`
  - Files: evidence files only

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run linter + type checks where applicable. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify `aiosqlite` usage (no `sqlite3` in async code). Verify `AsyncNode`/`AsyncFlow` usage (no sync PocketFlow for I/O).
  Output: `Lint [PASS/FAIL] | Type Check [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill for UI)
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (sensor POST → SSE → dashboard update). Test edge cases: empty state, invalid input, ESP32 offline simulation. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| After Task(s) | Commit Message | Files |
|---------------|---------------|-------|
| 1 | `chore: scaffold monorepo with backend, frontend, firmware structure` | all scaffolding files |
| 2 | `feat(firmware): add ESP32 sensor reading and HTTP POST sketch` | `firmware/` |
| 3 | `feat(backend): add SQLite schema and async database module` | `backend/db/` |
| 4 | `feat(backend): add sensor ingest and historical data API endpoints` | `backend/api/`, `backend/models/` |
| 5 | `feat(frontend): scaffold React+Vite with Shadcn UI and Tailwind v4` | `frontend/` |
| 6, 7 | `feat(backend): add PocketFlow sensor analysis agent and LLM utils` | `backend/agents/`, `backend/utils/` |
| 8, 9 | `feat(backend): add PocketFlow diagnosis, care, research agents and flow wiring` | `backend/agents/`, `backend/flow.py` |
| 10 | `feat(backend): add SSE broadcaster and stream endpoint` | `backend/api/stream.py`, `backend/sse.py` |
| 11 | `feat(frontend): add dashboard layout with sensor time-series charts` | `frontend/src/components/`, `frontend/src/pages/` |
| 12 | `feat(backend): add seed data script for development` | `backend/seed.py` |
| 13, 14 | `feat(frontend): add AI analysis card, species config, and state handling` | `frontend/src/components/` |
| 15 | `feat(frontend): add animations, design polish, and final styling` | `frontend/src/` |
| 16 | `chore(frontend): add Vercel deployment config` | `frontend/vercel.json` |
| 17 | `chore(backend): add Dockerfile and docker-compose.yml` | `Dockerfile`, `docker-compose.yml` |
| 18 | `ci: add GitHub Action for GHCR publish on version change` | `.github/workflows/` |
| 19 | `chore: end-to-end integration verification` | evidence files |

---

## Success Criteria

### Verification Commands
```bash
# Backend health
curl -sf http://localhost:8000/api/health | jq -r '.status'
# Expected: "healthy"

# Sensor data ingest (valid)
curl -sf -X POST http://localhost:8000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture":45.2,"temperature":23.5,"humidity":65.0,"light":750}' | jq -r '.status'
# Expected: "ok"

# Sensor data ingest (invalid — validation)
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:8000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture":-5,"temperature":200}'
# Expected: 422

# Historical data retrieval
curl -sf http://localhost:8000/api/sensor-data?hours=24 | jq '.readings | length'
# Expected: > 0 (after seeding)

# AI analysis trigger
curl -sf -X POST http://localhost:8000/api/analyze | jq 'has("health_score")'
# Expected: true

# SSE stream connectivity
timeout 20 curl -sf -N http://localhost:8000/api/stream 2>&1 | grep -m1 "event:"
# Expected: matches "event:" within 20s

# Docker build
docker build -t plant-health-backend ./backend
# Expected: exit code 0

# Docker compose
docker compose up -d && sleep 10 && curl -sf http://localhost:8000/api/health | jq -r '.status'
# Expected: "healthy"
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] ESP32 firmware compiles in Arduino IDE
- [ ] All API endpoints return expected responses
- [ ] Dashboard renders with seed data
- [ ] Dashboard renders empty states gracefully
- [ ] SSE streaming works end-to-end
- [ ] PocketFlow pipeline produces structured JSON analysis
- [ ] Docker build and compose work
- [ ] GitHub Action is syntactically valid

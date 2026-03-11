# Plant Health Monitor

An IoT sensor data collection and AI-powered plant health analysis system.

## Architecture

- **Backend**: FastAPI + SQLite + LiteLLM for AI-powered analysis
- **Frontend**: React + Vite
- **Firmware**: ESP32 microcontroller for sensor integration

## Project Structure

```
.
├── backend/              # FastAPI backend service
│   ├── src/
│   │   ├── __init__.py
│   │   ├── main.py      # FastAPI app definition
│   │   └── config.py    # Configuration and thresholds
│   ├── data/            # SQLite database location
│   └── pyproject.toml   # uv project configuration
├── frontend/            # React + Vite frontend
├── firmware/            # ESP32 firmware
└── .github/workflows/   # CI/CD pipelines
```

## Setup

### Prerequisites

- Python 3.11+
- [uv](https://github.com/astral-sh/uv) package manager

### Backend Setup

```bash
cd backend
uv sync
uv run python -m uvicorn src.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Key environment variables:
- `OPENAI_API_KEY` — OpenAI API key for LLM analysis
- `TAVILY_API_KEY` — Tavily API key for web search
- `DATABASE_PATH` — SQLite database path
- `SENSOR_INTERVAL_SECONDS` — Sensor reading interval

## Features

- Real-time sensor data collection
- AI-powered plant health analysis
- Web API for sensor data and analysis
- Configurable sensor thresholds

## Development

The project uses:
- **Backend**: FastAPI, uvicorn, aiosqlite, LiteLLM, PocketFlow
- **Frontend**: React, Vite
- **Package Manager**: uv

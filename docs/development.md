# Development Guide

This guide helps you set up and run the plant health monitoring system on your local machine.

## Prerequisites

Install these tools before you start.

*   Python 3.11 or higher
*   [uv package manager](https://github.com/astral-sh/uv)
*   Node.js 18 or higher and npm
*   Git
*   (Optional) Arduino IDE for ESP32 firmware development

## Clone and Setup

First, grab the code from the repository.

```bash
git clone <repository-url>
cd plant-health
```

The project is a monorepo containing the backend service, frontend application, and ESP32 firmware.

## Environment Configuration

The backend and frontend both need configuration. Start by copying the example environment file from the project root.

```bash
cp .env.example .env
```

Fill in the variables in your `.env` file. The table below lists every variable you can use.

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| OPENAI_API_KEY | Required for AI analysis | sk-... |
| TAVILY_API_KEY | Optional, for web research | tvly-... |
| VITE_BACKEND_URL | Frontend API URL | http://localhost:8000 |
| DATABASE_PATH | SQLite path | data/plant_health.db |
| SENSOR_INTERVAL_SECONDS | Reading interval | 60 |
| SOIL_MOISTURE_LOW | Low threshold % | 20 |
| SOIL_MOISTURE_HIGH | High threshold % | 80 |
| TEMPERATURE_LOW | Low threshold °C | 15 |
| TEMPERATURE_HIGH | High threshold °C | 35 |
| HUMIDITY_LOW | Low threshold % | 30 |
| HUMIDITY_HIGH | High threshold % | 80 |
| LIGHT_LOW | Low light level threshold (%) | 50 |
| LIGHT_HIGH | High light level threshold (%) | 101 |
| MIN_READINGS_FOR_ANALYSIS | Minimum readings before analysis | 5 |
| ANALYSIS_COOLDOWN_MINUTES | Cooldown between analyses | 30 |
| LLM_MAX_BUDGET | Max LLM spend in USD | 10.0 |
| CORS_ORIGINS | Allowed origins | http://localhost:5173 |

## Backend Setup

Follow these steps to get the FastAPI server running.

1.  Move into the backend folder.
    ```bash
    cd backend
    ```
2.  Install dependencies with uv.
    ```bash
    uv sync
    ```
3.  Start the development server.
    ```bash
    uv run uvicorn src.main:app --reload
    ```
4.  Check the health endpoint at http://localhost:8000/api/health to verify it works.

## Seed Data

You can populate the database with realistic data for testing. The `seed.py` script generates a full day of history.

*   Run the script: `uv run python seed.py`
*   It creates 1440 sensor readings (one per minute for 24 hours).
*   The process adds 3 analysis results to the history.
*   Finally, it sets the plant species to "Monstera deliciosa".

## Frontend Setup

The frontend is a React application built with Vite.

1.  Enter the frontend directory.
    ```bash
    cd frontend
    ```
2.  Install the required packages.
    ```bash
    npm install
    ```
3.  Launch the development server.
    ```bash
    npm run dev
    ```
4.  View the app at http://localhost:5173.

## Running Both Together

It's best to use two separate terminal windows or tabs. Run the backend in one and the frontend in the other. This lets you see logs from both services simultaneously.

## Code Quality

Maintain code standards using these tools.

### Backend
*   **pytest**: Runs the test suite.
*   **black**: Formats your code.
*   **ruff**: Checks for linting errors.

Commands:
*   `uv run pytest`
*   `uv run black src/`

### Frontend
*   **eslint**: Finds problems in your JavaScript/TypeScript.
*   **typescript**: Ensures type safety.

Commands:
*   `npm run lint`
*   `npm run build`

## Project Structure

Here is how the files are organized in the repository.

```
plant-health
├── backend/              # FastAPI backend
│   ├── data/             # SQLite database files
│   ├── src/              # Python source code
│   │   ├── agents/       # AI logic and agent flows
│   │   ├── api/          # API route definitions
│   │   ├── main.py       # Main application entry
│   │   └── config.py     # App configuration
│   ├── pyproject.toml    # Python dependencies
│   └── seed.py           # Data seeding script
├── docs/                 # Documentation files
├── firmware/             # ESP32 sensor code
├── frontend/             # React frontend
│   ├── src/              # React components and logic
│   ├── package.json      # Node dependencies
│   └── vite.config.ts    # Build configuration
└── README.md             # Project overview
```

## Troubleshooting

If you run into trouble, check these common issues.

*   **Port already in use**: If 8000 or 5173 are taken, find the process using them or change the port in the start command.
*   **Missing API keys**: AI analysis fails without keys, but the system still performs basic rule-based checks.
*   **Database locked errors**: This usually happens if multiple processes write to the database. Restarting the server usually clears it.
*   **CORS errors**: Ensure your frontend URL matches what you set in `CORS_ORIGINS`.

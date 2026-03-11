# Deployment Guide

## Overview

The Plant Health Monitoring System is designed for a split deployment architecture. The backend runs as a containerized Python application suitable for Docker-ready environments, while the frontend is optimized for static hosting platforms like Vercel.

## Docker Deployment (Backend)

### Building the Image

Navigate to the backend directory and build the Docker image using the provided Dockerfile.

```bash
cd backend
docker build -t plant-health-backend .
```

### Running the Container

Start the backend container by mapping the internal port 8000 to your host, loading environment variables, and mounting a volume for persistent storage.

```bash
docker run -p 8000:8000 --env-file .env -v plant-data:/app/data plant-health-backend
```

### Using Docker Compose

For easier management, use Docker Compose from the infrastructure directory.

```bash
cd infra
docker compose up -d
```

The `docker-compose.yml` file is located in the `infra/` directory. It uses `../backend` as the build context and loads environment variables from `../.env`.

### Dockerfile Details

The backend `Dockerfile` follows modern Python containerization practices:

- **Base Image**: Uses `python:3.12-slim` for a small footprint.
- **Dependency Management**: Integrates `uv` from `ghcr.io/astral-sh/uv:latest` for high-speed package installation.
- **Layer Caching**: Employs a two-stage copy process, adding `pyproject.toml` and `uv.lock` before the source code to cache dependency layers.
- **Data Directory**: Creates a `data/` directory specifically for the SQLite database.
- **Single Worker**: Configured to run with exactly one worker. This is mandatory because the Server-Sent Events (SSE) broadcaster uses in-memory fan-out queues that do not share state across multiple processes.
- **Networking**: Exposes port 8000.

### Health Check

The API includes a dedicated health check endpoint at `GET /api/health`. It returns a JSON response indicating the system status:

```json
{
  "status": "healthy",
  "db": "connected",
  "version": "0.1.0"
}
```

## Docker Compose Configuration

The following `docker-compose.yml` provides a production-ready setup for the backend service.

```yaml
services:
  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - plant-data:/app/data
    env_file:
      - ../.env
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

## Vercel Deployment (Frontend)

The React frontend is designed for seamless deployment on Vercel.

- **Configuration**: The `vercel.json` file is pre-configured with SPA rewrites to ensure client-side routing works correctly.
- **Environment Variables**: You must set the `VITE_BACKEND_URL` environment variable to point to your live backend API.
- **Deployment Steps**:
  1. Install the Vercel CLI (`npm i -g vercel`).
  2. Run `vercel link` to connect your project.
  3. Run `vercel deploy --prod` to publish.
- **Note**: Ensure that `frontend/.env.production` or your Vercel dashboard has `VITE_BACKEND_URL` set to your production backend URL.

## CI/CD Pipeline

### GitHub Actions

The repository includes a GitHub Action for automated container publishing located at `.github/workflows/publish.yml`.

- **Trigger**: The workflow runs on every push to the `main` branch that modifies `backend/pyproject.toml`.
- **Logic**: It compares the version string in `pyproject.toml` with the previous commit. If the version has changed, it builds and pushes a new image to the GitHub Container Registry (GHCR).
- **Tags**: Images are tagged with both `:latest` and the specific version number, e.g., `ghcr.io/{owner}/{repo}/backend:0.1.0`.
- **Permissions**: The job requires `contents:read` and `packages:write` permissions.
- **Authentication**: It uses the automatic `GITHUB_TOKEN` for registry authentication; no manual secrets are required for this step.

## Production Environment Variables

Ensure these variables are correctly configured in your production environment.

| Variable | Requirement | Description |
| :--- | :--- | :--- |
| `OPENAI_API_KEY` | Required | API key used for LLM plant diagnosis and care advice. |
| `DATABASE_PATH` | Optional | Path to the SQLite database file. Default is `data/plant_health.db`. |
| `CORS_ORIGINS` | Required | List of allowed origins. Set this to your exact frontend Vercel URL. |
| `LLM_MAX_BUDGET` | Recommended | Cost cap for AI operations. Use a lower value like `5.0` for production. |

## Production Considerations

- **Concurrency**: Stick to a single-worker configuration. The SSE in-memory broadcaster requires a single process to maintain active connections.
- **Persistence**: SQLite is a single-file database. Use Docker volumes as shown in the Compose configuration to ensure data persists across container restarts.
- **Reverse Proxy**: The backend does not include built-in rate limiting. We recommend placing a reverse proxy like Nginx or Caddy in front of the container for SSL termination and traffic control.
- **Security**: Always set `CORS_ORIGINS` to your specific frontend domain rather than a wildcard to prevent unauthorized access.
- **Monitoring**: Use the `/api/health` endpoint with your monitoring tool to track backend uptime and database connectivity.

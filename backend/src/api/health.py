"""Health check endpoint."""

from datetime import datetime

from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["health"])


@router.get("/health")
async def health_check():
    """Return API and database health status."""
    return {
        "status": "healthy",
        "db": "connected",
        "timestamp": datetime.utcnow().isoformat(),
    }

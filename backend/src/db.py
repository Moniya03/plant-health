"""Async SQLite database module using aiosqlite.

NEVER use `import sqlite3` — use aiosqlite exclusively.
SQLite WAL mode is REQUIRED to prevent "database is locked" errors
during concurrent SSE reads + sensor write operations.
"""

import json
import aiosqlite
from src.config import DATABASE_PATH
import os

# Module-level connection (lazy init)
_db: aiosqlite.Connection | None = None


async def init_db() -> None:
    """Initialize database: create tables, enable WAL mode, insert default plant config."""
    global _db
    # Ensure data directory exists
    os.makedirs(os.path.dirname(DATABASE_PATH) if os.path.dirname(DATABASE_PATH) else ".", exist_ok=True)
    
    conn = await aiosqlite.connect(DATABASE_PATH)
    conn.row_factory = aiosqlite.Row
    
    # MANDATORY: WAL mode prevents "database is locked" with concurrent readers/writers
    await conn.execute("PRAGMA journal_mode=WAL")
    await conn.execute("PRAGMA synchronous=NORMAL")
    
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS sensor_readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            soil_moisture REAL NOT NULL,
            temperature REAL NOT NULL,
            humidity REAL NOT NULL,
            light REAL NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    
    await conn.execute("""
        CREATE INDEX IF NOT EXISTS idx_readings_created_at 
        ON sensor_readings(created_at)
    """)
    
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS analysis_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            health_score INTEGER NOT NULL,
            status TEXT NOT NULL,
            issues TEXT NOT NULL DEFAULT '[]',
            recommendations TEXT NOT NULL DEFAULT '[]',
            analysis_type TEXT NOT NULL,
            model_used TEXT,
            raw_response TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    
    await conn.execute("""
        CREATE TABLE IF NOT EXISTS plant_config (
            id INTEGER PRIMARY KEY DEFAULT 1,
            species TEXT NOT NULL DEFAULT 'Unknown',
            name TEXT NOT NULL DEFAULT 'My Plant',
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    """)
    
    # Insert default plant_config if empty (singleton row)
    cursor = await conn.execute("SELECT COUNT(*) FROM plant_config")
    count = (await cursor.fetchone())[0]
    if count == 0:
        await conn.execute("""
            INSERT INTO plant_config (id, species, name) VALUES (1, 'Unknown', 'My Plant')
        """)
    
    await conn.commit()
    _db = conn


async def get_db() -> aiosqlite.Connection:
    """Get database connection. Call init_db() first."""
    global _db
    if _db is None:
        await init_db()
    return _db


async def insert_reading(soil_moisture: float, temperature: float, humidity: float, light: float) -> int:
    """Insert a sensor reading. Returns the new row id."""
    db = await get_db()
    cursor = await db.execute(
        """INSERT INTO sensor_readings (soil_moisture, temperature, humidity, light) 
           VALUES (?, ?, ?, ?)""",
        (soil_moisture, temperature, humidity, light)
    )
    await db.commit()
    return cursor.lastrowid


async def get_readings(hours: int = 24, limit: int = 1000) -> list[dict]:
    """Get historical readings within the past N hours."""
    db = await get_db()
    cursor = await db.execute(
        """SELECT id, soil_moisture, temperature, humidity, light, created_at
           FROM sensor_readings 
           WHERE created_at >= datetime('now', ?)
           ORDER BY created_at ASC
           LIMIT ?""",
        (f"-{hours} hours", limit)
    )
    rows = await cursor.fetchall()
    return [dict(row) for row in rows]


async def get_latest_reading() -> dict | None:
    """Get the most recent sensor reading."""
    db = await get_db()
    cursor = await db.execute(
        """SELECT id, soil_moisture, temperature, humidity, light, created_at
           FROM sensor_readings 
           ORDER BY created_at DESC 
           LIMIT 1"""
    )
    row = await cursor.fetchone()
    return dict(row) if row else None


async def insert_analysis(
    health_score: int,
    status: str,
    issues: list[str],
    recommendations: list[str],
    analysis_type: str,
    model_used: str | None = None,
    raw_response: str | None = None,
) -> int:
    """Insert an analysis result. Returns the new row id."""
    db = await get_db()
    cursor = await db.execute(
        """INSERT INTO analysis_results 
           (health_score, status, issues, recommendations, analysis_type, model_used, raw_response)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            health_score,
            status,
            json.dumps(issues),
            json.dumps(recommendations),
            analysis_type,
            model_used,
            raw_response,
        )
    )
    await db.commit()
    return cursor.lastrowid


async def get_latest_analysis() -> dict | None:
    """Get the most recent analysis result."""
    db = await get_db()
    cursor = await db.execute(
        """SELECT id, health_score, status, issues, recommendations, 
                  analysis_type, model_used, created_at
           FROM analysis_results 
           ORDER BY created_at DESC 
           LIMIT 1"""
    )
    row = await cursor.fetchone()
    if not row:
        return None
    result = dict(row)
    result["issues"] = json.loads(result["issues"])
    result["recommendations"] = json.loads(result["recommendations"])
    return result


async def get_analysis_history(limit: int = 10) -> list[dict]:
    """Get recent analysis results."""
    db = await get_db()
    cursor = await db.execute(
        """SELECT id, health_score, status, issues, recommendations,
                  analysis_type, model_used, created_at
           FROM analysis_results 
           ORDER BY created_at DESC 
           LIMIT ?""",
        (limit,)
    )
    rows = await cursor.fetchall()
    results = []
    for row in rows:
        r = dict(row)
        r["issues"] = json.loads(r["issues"])
        r["recommendations"] = json.loads(r["recommendations"])
        results.append(r)
    return results


async def get_plant_config() -> dict:
    """Get current plant species and name (singleton)."""
    db = await get_db()
    cursor = await db.execute(
        "SELECT id, species, name, updated_at FROM plant_config WHERE id = 1"
    )
    row = await cursor.fetchone()
    return dict(row) if row else {"species": "Unknown", "name": "My Plant"}


async def update_plant_config(species: str, name: str) -> dict:
    """Update plant species and name. Returns updated config."""
    db = await get_db()
    await db.execute(
        """UPDATE plant_config 
           SET species = ?, name = ?, updated_at = datetime('now')
           WHERE id = 1""",
        (species, name)
    )
    await db.commit()
    return await get_plant_config()


async def get_reading_count() -> int:
    """Count total sensor readings (for min-readings check)."""
    db = await get_db()
    cursor = await db.execute("SELECT COUNT(*) FROM sensor_readings")
    result = await cursor.fetchone()
    return result[0] if result else 0

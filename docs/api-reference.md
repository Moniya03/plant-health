# API Reference

Base URL: http://localhost:8000

The API includes interactive documentation at /docs (Swagger UI) and /redoc (ReDoc).

## Sensor Data Endpoints

### POST /api/sensor-data
Submit a sensor reading.

**Request body**
```json
{
  "soil_moisture": 45.2,
  "temperature": 23.5,
  "humidity": 65.0,
  "light": 1200.0
}
```

**Field constraints**
* soil_moisture: 0-100 (percentage)
* temperature: -40 to 80 (°C)
* humidity: 0-100 (percentage)
* light: 0-200000 (lux)

**Responses**
* 201 Created:
  ```json
  {"status": "created", "id": 1}
  ```
* 422 Unprocessable Entity: Validation error (field out of range)

**Side effect**
Broadcasts SSE "sensor_data" event.

**curl example**
```bash
curl -X POST http://localhost:8000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{"soil_moisture": 45.2, "temperature": 23.5, "humidity": 65.0, "light": 1200.0}'
```

### GET /api/sensor-data
Get historical readings.

**Query parameters**
* limit (optional, default 100)

**Responses**
* 200 OK:
  ```json
  {
    "readings": [
      {
        "id": 1,
        "soil_moisture": 45.2,
        "temperature": 23.5,
        "humidity": 65.0,
        "light": 1200.0,
        "created_at": "2024-01-01T00:00:00"
      }
    ]
  }
  ```

**curl example**
```bash
curl http://localhost:8000/api/sensor-data?limit=10
```

### GET /api/sensor-data/latest
Get the most recent reading.

**Responses**
* 200 OK: Single reading object
* 404 Not Found: No readings available

**curl example**
```bash
curl http://localhost:8000/api/sensor-data/latest
```

## Analysis Endpoints

### POST /api/analyze
Trigger AI analysis based on recent sensor data.

**Request body**
None required.

**Responses**
* 200 OK:
  ```json
  {
    "health_score": 75,
    "status": "warning",
    "issues": ["Soil moisture is low (15%)"],
    "recommendations": ["Water your plant thoroughly"],
    "analysis_type": "ai_routine",
    "model_used": "gpt-4o-mini",
    "created_at": "2024-01-01T12:00:00"
  }
  ```
* 400 Bad Request: Not enough sensor readings (needs MIN_READINGS_FOR_ANALYSIS)
* 500 Internal Server Error: LLM or pipeline error

**Analysis type values**
* rule_based: No LLM required
* ai_routine: LLM used for minor issues
* ai_critical: LLM used for critical issues

**Side effect**
Broadcasts SSE "analysis" event.

**curl example**
```bash
curl -X POST http://localhost:8000/api/analyze
```

### GET /api/analysis/latest
Get the most recent analysis.

**Responses**
* 200 OK: Single analysis object (same structure as POST /api/analyze response)
* 404 Not Found: No analyses available

**curl example**
```bash
curl http://localhost:8000/api/analysis/latest
```

### GET /api/analysis/history
Get analysis history.

**Query parameters**
* limit (optional, default 10)

**Responses**
* 200 OK:
  ```json
  {
    "analyses": [...],
    "count": 3
  }
  ```

**curl example**
```bash
curl http://localhost:8000/api/analysis/history?limit=5
```

## Plant Configuration Endpoints

### GET /api/plant/species
Get the current plant configuration.

**Responses**
* 200 OK:
  ```json
  {
    "species": "Monstera deliciosa",
    "name": "My Monstera",
    "updated_at": "2024-01-01T00:00:00"
  }
  ```

**curl example**
```bash
curl http://localhost:8000/api/plant/species
```

### PUT /api/plant/species
Update the plant configuration.

**Request body**
```json
{
  "species": "Monstera deliciosa",
  "name": "My Monstera"
}
```

**Responses**
* 200 OK: Updated plant config object

**curl example**
```bash
curl -X PUT http://localhost:8000/api/plant/species \
  -H "Content-Type: application/json" \
  -d '{"species": "Ficus lyrata", "name": "My Fiddle Leaf"}'
```

## System Endpoints

### GET /api/health
Health check endpoint.

**Responses**
* 200 OK:
  ```json
  {
    "status": "healthy",
    "db": "connected",
    "version": "0.1.0"
  }
  ```

**curl example**
```bash
curl http://localhost:8000/api/health
```

### GET /api/stream
SSE event stream.

**Response**
Content-Type: text/event-stream

**Events**
* sensor_data: New sensor reading received (JSON data)
* analysis: New analysis completed (JSON data)
* ping: Keepalive sent every 15 seconds (empty data)

**Example event format**
```
event: sensor_data
data: {"soil_moisture": 45.2, "temperature": 23.5, "humidity": 65.0, "light": 1200.0}

event: ping
data:
```

**Notes**
Use the EventSource API in JavaScript for automatic reconnection.

**curl example**
```bash
curl -N http://localhost:8000/api/stream
```

## Error Responses
The API uses a standard error format for non-2xx responses.

```json
{"detail": "Error message description"}
```

**Common status codes**
* 200: Success
* 201: Created
* 400: Bad request
* 404: Not found
* 422: Validation error
* 500: Server error

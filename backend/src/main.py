from fastapi import FastAPI

app = FastAPI(
    title="Plant Health Monitor API",
    description="IoT sensor data collection and AI-powered plant health analysis",
    version="0.1.0",
)

@app.get("/")
async def root():
    return {"message": "Plant Health Monitor API"}

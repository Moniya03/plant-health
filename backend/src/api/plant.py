"""Plant configuration endpoints."""

from fastapi import APIRouter

from src.db import get_plant_config, update_plant_config
from src.models import PlantConfig

router = APIRouter(prefix="/api/plant", tags=["plant"])


@router.get("/species", response_model=PlantConfig)
async def get_species():
    """Return current plant species and name."""
    config = await get_plant_config()
    return PlantConfig(
        species=config["species"],
        name=config["name"],
        updated_at=config.get("updated_at"),
    )


@router.put("/species", response_model=PlantConfig)
async def update_species(plant: PlantConfig):
    """Update plant species and name."""
    updated = await update_plant_config(species=plant.species, name=plant.name)
    return PlantConfig(
        species=updated["species"],
        name=updated["name"],
        updated_at=updated.get("updated_at"),
    )

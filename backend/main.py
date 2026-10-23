"""Ejecutar desde la raíz: python -m uvicorn backend.main:app --reload."""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from backend.app.api.v1.endpoints.map import router
from backend.app.infrastructure.persistence.json_graph_repository import JsonGrafoRepository

DEFAULT_DATASET = Path(__file__).resolve().parents[1] / "dataset" / "dataset_grafo.json"


def create_app(dataset_path: Path | None = None) -> FastAPI:
    @asynccontextmanager
    async def lifespan(app: FastAPI):
        path = dataset_path or Path(os.environ.get("RUTEA_DATASET_PATH", str(DEFAULT_DATASET)))
        app.state.repository = None
        try:
            app.state.repository = JsonGrafoRepository(path)
        except (OSError, ValueError, KeyError, TypeError):
            logging.getLogger(__name__).exception("No se pudo cargar el dataset: %s", path)
        yield

    app = FastAPI(title="RUTEA API", version="0.1.0", lifespan=lifespan)
    app.include_router(router)

    @app.get("/api/health", tags=["Estado"])
    def health():
        return {"status": "ok", "dataset_disponible": app.state.repository is not None}

    return app


app = create_app()

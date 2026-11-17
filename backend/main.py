"""Ejecutar desde la raíz: python -m uvicorn backend.main:app --reload."""
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from backend.app.api.v1.endpoints.map import router
from backend.app.api.v1.endpoints.routes import router as routes_router
from backend.app.application.services.calcular_ruta import CalcularRuta
from backend.app.infrastructure.persistence.json_graph_repository import JsonGrafoRepository
from backend.app.application.dtos.grafo import RespuestaEstado

DEFAULT_DATASET = Path(__file__).resolve().parent / "dataset" / "dataset_grafo.json"


def create_app(dataset_path: Path | None = None, *, inicializar: bool = False) -> FastAPI:
    inicializado = False

    def cargar_servicios(app: FastAPI) -> None:
        nonlocal inicializado
        if inicializado:
            return
        path = dataset_path or Path(os.environ.get("RUTEA_DATASET_PATH", str(DEFAULT_DATASET)))
        app.state.repository = None
        app.state.rutas = None
        try:
            repository = JsonGrafoRepository(path)
            rutas = CalcularRuta(repository)
            # Publicar ambos servicios solo tras completar toda la inicialización.
            app.state.repository = repository
            app.state.rutas = rutas
        except (OSError, ValueError, KeyError, TypeError):
            logging.getLogger(__name__).exception("No se pudo cargar el dataset: %s", path)
        inicializado = True

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        cargar_servicios(app)
        yield

    app = FastAPI(title="RUTEA API", version="0.1.0", lifespan=lifespan)
    app.state.repository = None
    app.state.rutas = None
    app.include_router(router)
    app.include_router(routes_router)

    @app.get("/api/health", tags=["Estado"], response_model=RespuestaEstado)
    def health():
        return {"status": "ok", "dataset_disponible": app.state.repository is not None}

    if inicializar:
        cargar_servicios(app)
    return app


app = create_app()

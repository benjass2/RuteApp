from fastapi import HTTPException, Request

from backend.app.application.services.consultar_grafo import ConsultarGrafo
from backend.app.application.services.calcular_ruta import CalcularRuta


def consultar_grafo(request: Request) -> ConsultarGrafo:
    repository = request.app.state.snapshot[0]
    if repository is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta backend/dataset/script_descarga.py.")
    return ConsultarGrafo(repository)


def calcular_ruta(request: Request) -> CalcularRuta:
    service = request.app.state.snapshot[1]
    if service is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta backend/dataset/script_descarga.py.")
    return service

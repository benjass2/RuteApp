from fastapi import HTTPException, Request

from backend.app.application.services.consultar_grafo import ConsultarGrafo
from backend.app.application.services.calcular_ruta import CalcularRuta


def consultar_grafo(request: Request) -> ConsultarGrafo:
    repository = request.app.state.repository
    if repository is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta dataset/script_descarga.py.")
    return ConsultarGrafo(repository)


def calcular_ruta(request: Request) -> CalcularRuta:
    service = request.app.state.rutas
    if service is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta dataset/script_descarga.py.")
    return service

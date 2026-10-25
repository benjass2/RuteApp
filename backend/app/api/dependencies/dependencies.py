from fastapi import HTTPException, Request

from backend.app.application.services.consultar_grafo import ConsultarGrafo
from backend.app.application.services.calcular_ruta import CalcularRuta


def consultar_grafo(request: Request) -> ConsultarGrafo:
    zona = request.query_params.get("zona", "centro")
    if zona not in request.app.state.zonas:
        raise HTTPException(422, "Zona desconocida.")
    repository = request.app.state.zonas[zona][0]
    if repository is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta backend/dataset/script_descarga.py.")
    return ConsultarGrafo(repository)


def calcular_ruta(request: Request) -> CalcularRuta:
    zona = request.query_params.get("zona", "centro")
    if zona not in request.app.state.zonas:
        raise HTTPException(422, "Zona desconocida.")
    service = request.app.state.zonas[zona][1]
    if service is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta backend/dataset/script_descarga.py.")
    return service

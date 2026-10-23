from fastapi import HTTPException, Request

from backend.app.application.services.consultar_grafo import ConsultarGrafo


def consultar_grafo(request: Request) -> ConsultarGrafo:
    repository = request.app.state.repository
    if repository is None:
        raise HTTPException(503, "Dataset no disponible. Ejecuta dataset/script_descarga.py.")
    return ConsultarGrafo(repository)

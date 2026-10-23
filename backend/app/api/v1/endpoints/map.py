from dataclasses import asdict

from fastapi import APIRouter, Depends, Query

from backend.app.api.dependencies.dependencies import consultar_grafo
from backend.app.application.services.consultar_grafo import ConsultarGrafo

router = APIRouter(prefix="/api/grafo", tags=["Grafo"])


@router.get("/resumen")
def resumen(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.resumen()


@router.get("/nodos")
def nodos(offset: int = Query(0, ge=0), limite: int = Query(100, ge=1, le=2000),
          service: ConsultarGrafo = Depends(consultar_grafo)):
    grafo = service.repository.obtener()
    return {"total": len(grafo.nodos), "nodos": [asdict(nodo) for nodo in
            list(grafo.nodos.values())[offset:offset + limite]]}


@router.get("/geojson")
def geojson(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.geojson()

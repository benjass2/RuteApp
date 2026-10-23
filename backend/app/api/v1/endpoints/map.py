from dataclasses import asdict

from fastapi import APIRouter, Depends, Query

from backend.app.api.dependencies.dependencies import consultar_grafo
from backend.app.application.services.consultar_grafo import ConsultarGrafo
from backend.app.domain.algorithm.divide_conquer import dividir_cuadrantes
from backend.app.application.dtos.mst import RespuestaMST

router = APIRouter(prefix="/api/grafo", tags=["Grafo"])


@router.get("/mst", response_model=RespuestaMST)
def mst(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.mst()


@router.get("/sectores")
def sectores(service: ConsultarGrafo = Depends(consultar_grafo)):
    grupos = dividir_cuadrantes(service.repository.obtener().nodos)
    return {"criterio": "centro de caja geográfica; cortes al norte/este",
            "sectores": [{"id": id, "total": len(nodos), "nodos": nodos}
                         for id, nodos in grupos.items()]}


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

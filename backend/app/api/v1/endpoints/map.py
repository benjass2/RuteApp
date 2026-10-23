from fastapi import APIRouter, Depends, Query

from backend.app.api.dependencies.dependencies import consultar_grafo
from backend.app.application.services.consultar_grafo import ConsultarGrafo
from backend.app.application.dtos.mst import RespuestaMST
from backend.app.application.dtos.grafo import RespuestaNodos, RespuestaResumen, RespuestaSectores
from backend.app.application.dtos.geojson import ColeccionCalles

router = APIRouter(prefix="/api/grafo", tags=["Grafo"])


@router.get("/mst", response_model=RespuestaMST)
def mst(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.mst()


@router.get("/sectores", response_model=RespuestaSectores)
def sectores(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.sectores()


@router.get("/resumen", response_model=RespuestaResumen)
def resumen(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.resumen()


@router.get("/nodos", response_model=RespuestaNodos)
def nodos(offset: int = Query(0, ge=0), limite: int = Query(100, ge=1, le=2000),
          service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.nodos(offset, limite)


@router.get("/geojson", response_model=ColeccionCalles)
def geojson(service: ConsultarGrafo = Depends(consultar_grafo)):
    return service.geojson()

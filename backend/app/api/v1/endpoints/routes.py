from fastapi import APIRouter, Depends, HTTPException

from backend.app.api.dependencies.dependencies import calcular_ruta
from backend.app.application.dtos.ruta import (
    RespuestaRuta, SolicitudConectividad, SolicitudRuta,
    RespuestaComparacion, SolicitudComparacion,
)
from backend.app.application.services.calcular_ruta import CalcularRuta
from backend.app.domain.algorithm.dijkstra import SinRutaError

router = APIRouter(prefix="/api", tags=["Rutas"])


@router.post("/rutas/punto-a-punto", response_model=RespuestaRuta)
def ruta(payload: SolicitudRuta, service: CalcularRuta = Depends(calcular_ruta)):
    try:
        return service.ejecutar(payload.origen, payload.destino, payload.minuto_dia, payload.algoritmo)
    except SinRutaError as exc:
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/rutas/comparar", response_model=RespuestaComparacion)
def comparar(payload: SolicitudComparacion, service: CalcularRuta = Depends(calcular_ruta)):
    try:
        return service.comparar(payload.origen, payload.destino, payload.minuto_dia)
    except SinRutaError as exc:
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/grafo/conectividad")
def conectividad(payload: SolicitudConectividad, service: CalcularRuta = Depends(calcular_ruta)):
    try:
        return service.conectividad(payload.origen, payload.destinos)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

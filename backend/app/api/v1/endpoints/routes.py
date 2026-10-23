from fastapi import APIRouter, Depends, HTTPException

from backend.app.api.dependencies.dependencies import calcular_ruta
from backend.app.application.dtos.ruta import (
    RespuestaRuta, SolicitudConectividad, SolicitudRuta,
    RespuestaComparacion, SolicitudComparacion,
)
from backend.app.application.services.calcular_ruta import CalcularRuta
from backend.app.domain.algorithm.dijkstra import SinRutaError
from backend.app.application.dtos.multientrega import (
    SolicitudMultiEntrega, RespuestaMultiEntrega, RespuestaComparacionMulti,
    SolicitudComparacionMulti,
)
from backend.app.application.services.calcular_multientrega import CalcularMultiEntrega
from backend.app.application.dtos.grafo import RespuestaConectividad

router = APIRouter(prefix="/api", tags=["Rutas"])


@router.post("/rutas/multi-entrega", response_model=RespuestaMultiEntrega)
def multi_entrega(payload: SolicitudMultiEntrega, service: CalcularRuta = Depends(calcular_ruta)):
    try:
        return CalcularMultiEntrega(service).ejecutar(
            payload.origen, payload.destinos, payload.minuto_dia,
            payload.algoritmo, payload.volver_origen)
    except SinRutaError as exc:
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@router.post("/rutas/multi-entrega/comparar", response_model=RespuestaComparacionMulti)
def comparar_multi(payload: SolicitudComparacionMulti, service: CalcularRuta = Depends(calcular_ruta)):
    try:
        return CalcularMultiEntrega(service).comparar(
            payload.origen, payload.destinos, payload.minuto_dia, payload.volver_origen)
    except SinRutaError as exc:
        raise HTTPException(404, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


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


@router.post("/grafo/conectividad", response_model=RespuestaConectividad)
def conectividad(payload: SolicitudConectividad, service: CalcularRuta = Depends(calcular_ruta)):
    try:
        return service.conectividad(payload.origen, payload.destinos)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc

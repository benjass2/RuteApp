from typing import Literal

from pydantic import BaseModel, Field
from backend.app.application.dtos.base import NodoId, SolicitudBase
from backend.app.application.dtos.geojson import Geometria


class SolicitudComparacion(SolicitudBase):
    origen: NodoId
    destino: NodoId
    minuto_dia: int = Field(default=480, ge=0, le=1439, strict=True)


class SolicitudRuta(SolicitudComparacion):
    algoritmo: Literal["dijkstra", "bellman_ford"] = "dijkstra"


class SolicitudConectividad(SolicitudBase):
    origen: NodoId
    destinos: list[NodoId] = Field(min_length=1, max_length=100)


class RespuestaRuta(BaseModel):
    algoritmo: str
    origen: str
    destino: str
    minuto_dia: int
    nodos: list[str]
    tiempo_ms: float
    tiempo_algoritmo_ms: float
    distancia_km: float
    costo_ponderado_m: float
    nodos_evaluados: int
    trafico: str = "simulado"
    geometria: Geometria


class RespuestaComparacion(BaseModel):
    resultados: list[RespuestaRuta]
    costos_equivalentes: bool
    diferencia_costo_m: float
    razon_tiempo_bf_sobre_dijkstra: float | None

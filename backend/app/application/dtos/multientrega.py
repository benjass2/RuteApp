from typing import Literal

from pydantic import BaseModel, Field, model_validator
from backend.app.application.dtos.base import NodoId, SolicitudBase
from backend.app.application.dtos.geojson import Geometria


class SolicitudComparacionMulti(SolicitudBase):
    origen: NodoId
    destinos: list[NodoId] = Field(min_length=1, max_length=8)
    minuto_dia: int = Field(default=480, ge=0, le=1439, strict=True)
    volver_origen: bool = Field(default=True, strict=True)

    @model_validator(mode="after")
    def validar_paradas(self):
        if len(set(self.destinos)) != len(self.destinos) or self.origen in self.destinos:
            raise ValueError("Las paradas deben ser únicas y distintas del origen")
        return self


class SolicitudMultiEntrega(SolicitudComparacionMulti):
    destinos: list[NodoId] = Field(min_length=1, max_length=12)
    algoritmo: Literal["held_karp", "backtracking"] = "held_karp"

    @model_validator(mode="after")
    def validar_limite_motor(self):
        if self.algoritmo == "backtracking" and len(self.destinos) > 8:
            raise ValueError("Backtracking admite como máximo 8 paradas")
        return self


class RespuestaMultiEntrega(BaseModel):
    algoritmo: str
    orden_visita: list[str]
    nodos: list[str]
    volver_origen: bool
    minuto_dia: int
    distancia_km: float
    costo_ponderado_m: float
    tiempo_ms: float
    tiempo_matriz_ms: float
    tiempo_algoritmo_ms: float
    estados_evaluados: int
    nodos_evaluados_matriz: int
    trafico: str = "simulado"
    geometria: Geometria


class RespuestaComparacionMulti(BaseModel):
    resultados: list[RespuestaMultiEntrega]
    costos_equivalentes: bool
    tiempo_total_ms: float

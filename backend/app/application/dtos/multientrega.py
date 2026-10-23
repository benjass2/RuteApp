from typing import Literal

from pydantic import BaseModel, Field, model_validator


class SolicitudMultiEntrega(BaseModel):
    origen: str = Field(min_length=1, max_length=100)
    destinos: list[str] = Field(min_length=1, max_length=12)
    minuto_dia: int = Field(default=480, ge=0, le=1439, strict=True)
    algoritmo: Literal["held_karp", "backtracking"] = "held_karp"
    volver_origen: bool = Field(default=True, strict=True)

    @model_validator(mode="after")
    def validar_paradas(self):
        if len(set(self.destinos)) != len(self.destinos) or self.origen in self.destinos:
            raise ValueError("Las paradas deben ser únicas y distintas del origen")
        if any(not id or len(id) > 100 for id in self.destinos):
            raise ValueError("ID de parada inválido")
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
    geometria: dict


class RespuestaComparacionMulti(BaseModel):
    resultados: list[RespuestaMultiEntrega]
    costos_equivalentes: bool
    tiempo_total_ms: float

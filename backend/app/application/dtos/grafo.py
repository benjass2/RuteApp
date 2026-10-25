from typing import Literal

from pydantic import BaseModel


class RespuestaEstado(BaseModel):
    status: Literal["ok"]
    dataset_disponible: bool


class RespuestaResumen(BaseModel):
    nodos: int
    aristas: int
    dirigido: bool
    fuente: str
    atribucion: str


class NodoDTO(BaseModel):
    id: str
    lat: float
    lon: float


class RespuestaNodos(BaseModel):
    total: int
    nodos: list[NodoDTO]


class SectorDTO(BaseModel):
    id: Literal["SO", "SE", "NO", "NE"]
    total: int
    nodos: list[str]


class RespuestaSectores(BaseModel):
    criterio: str
    sectores: list[SectorDTO]


class DestinoConectividad(BaseModel):
    id: str
    misma_componente: bool


class RespuestaConectividad(BaseModel):
    origen: str
    tipo: Literal["debil"]
    garantiza_ruta_dirigida: Literal[False]
    destinos: list[DestinoConectividad]

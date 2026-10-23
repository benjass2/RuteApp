from typing import Literal

from pydantic import BaseModel
from backend.app.application.dtos.geojson import ColeccionCalles


class RespuestaMST(BaseModel):
    algoritmo: Literal["kruskal"] = "kruskal"
    proyeccion: Literal["no_dirigida"] = "no_dirigida"
    criterio_peso: Literal["longitud_m"] = "longitud_m"
    nodos: int
    aristas_seleccionadas: int
    aristas_evaluadas: int
    componentes: int
    es_conexo: bool
    es_arbol: bool
    distancia_km: float
    tiempo_ms: float
    tiempo_algoritmo_ms: float
    atribucion: str
    geojson: ColeccionCalles

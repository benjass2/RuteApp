"""Carga y valida una sola vez el dataset; nunca realiza llamadas externas."""
import json
from pathlib import Path
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field, field_validator

from backend.app.domain.model.graph import Arista, Grafo, Nodo


class _NodoArchivo(BaseModel):
    model_config = ConfigDict(strict=True, allow_inf_nan=False)
    id: str | None = None
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class _AristaArchivo(BaseModel):
    model_config = ConfigDict(strict=True, allow_inf_nan=False)
    origen: str = Field(min_length=1)
    destino: str = Field(min_length=1)
    longitud_m: float = Field(gt=0)
    nombre: str
    sentido_unico: bool
    geometria: list[tuple[Annotated[float, Field(ge=-180, le=180)],
                          Annotated[float, Field(ge=-90, le=90)]]] = Field(default_factory=list)

    @field_validator("geometria", mode="before")
    @classmethod
    def validar_geometria(cls, valor):
        # JSON representa las tuplas como arrays; mantener estrictos los números.
        if not isinstance(valor, list) or len(valor) == 1:
            raise ValueError("Geometría debe estar vacía o tener al menos dos puntos")
        if any(not isinstance(p, list) or len(p) != 2 for p in valor):
            raise ValueError("Cada coordenada debe tener longitud y latitud")
        return [tuple(p) for p in valor]


class _ArchivoGrafo(BaseModel):
    nodos: dict[str, _NodoArchivo] = Field(min_length=1)
    aristas: list[_AristaArchivo] = Field(min_length=1)


class JsonGrafoRepository:
    def __init__(self, path: Path):
        data = _ArchivoGrafo.model_validate(json.loads(path.read_text(encoding="utf-8")))
        nodos = {}
        for id, item in data.nodos.items():
            if not id.strip() or (item.id is not None and item.id != id):
                raise ValueError(f"Identificador de nodo inconsistente: {id}")
            nodo = Nodo(id, item.lat, item.lon)
            nodos[nodo.id] = nodo
        aristas = []
        for item in data.aristas:
            arista = Arista(
                item.origen, item.destino, item.longitud_m,
                item.nombre, item.sentido_unico, tuple(item.geometria),
            )
            if arista.origen not in nodos or arista.destino not in nodos:
                raise ValueError("Arista con nodo inexistente")
            aristas.append(arista)
        self._grafo = Grafo(nodos, tuple(aristas))

    def obtener(self) -> Grafo:
        return self._grafo

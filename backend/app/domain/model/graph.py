"""Entidades independientes de FastAPI, OSMnx y almacenamiento."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Nodo:
    id: str
    lat: float
    lon: float


@dataclass(frozen=True)
class Arista:
    origen: str
    destino: str
    longitud_m: float
    nombre: str
    sentido_unico: bool
    geometria: tuple[tuple[float, float], ...] = ()  # (lon, lat)


@dataclass(frozen=True)
class Grafo:
    nodos: dict[str, Nodo]
    aristas: tuple[Arista, ...]

    def adyacencia(self) -> dict[str, list[Arista]]:
        """Cada arista JSON es un arco dirigido; no crear inversas implícitas."""
        resultado: dict[str, list[Arista]] = {id: [] for id in self.nodos}
        for arista in self.aristas:
            resultado[arista.origen].append(arista)
        return resultado

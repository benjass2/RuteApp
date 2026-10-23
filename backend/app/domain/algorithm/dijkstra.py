"""Caminos mínimos con heapq sobre arcos dirigidos y pesos positivos."""
from dataclasses import dataclass
from heapq import heappop, heappush
from math import inf

from backend.app.domain.algorithm.trafico import factor_trafico
from backend.app.domain.model.graph import Arista


class SinRutaError(ValueError):
    pass


@dataclass(frozen=True)
class ResultadoCamino:
    aristas: tuple[Arista, ...]
    costo: float
    nodos_evaluados: int


def dijkstra(adyacencia: dict[str, list[Arista]], origen: str, destino: str,
             minuto: int) -> ResultadoCamino:
    if origen not in adyacencia or destino not in adyacencia:
        raise ValueError("Nodo inexistente")
    factor_trafico("", minuto)  # Validar incluso si origen == destino.
    distancias = {origen: 0.0}
    anteriores: dict[str, Arista] = {}
    cola = [(0.0, origen)]
    evaluados = 0
    while cola:
        costo, actual = heappop(cola)
        if costo != distancias[actual]:
            continue
        evaluados += 1
        if actual == destino:
            camino = []
            while actual != origen:
                arista = anteriores[actual]
                camino.append(arista)
                actual = arista.origen
            return ResultadoCamino(tuple(reversed(camino)), costo, evaluados)
        for arista in adyacencia[actual]:
            peso = arista.longitud_m * factor_trafico(arista.nombre, minuto)
            nuevo = costo + peso
            if nuevo < distancias.get(arista.destino, inf):
                distancias[arista.destino] = nuevo
                anteriores[arista.destino] = arista
                heappush(cola, (nuevo, arista.destino))
    raise SinRutaError("No existe ruta respetando los sentidos de circulación")

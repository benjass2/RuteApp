"""Bosque mínimo de la proyección no dirigida, ponderado por longitud física.

Conserva el arco original elegido (y su geometría) sin modificar el grafo vial.
Arcos inversos, paralelos y bucles se descartan al detectar un ciclo con UFDS.
Tiempo O(V + E log E), memoria O(V + E).
"""
from dataclasses import dataclass

from backend.app.domain.algorithm.ufds import UFDS
from backend.app.domain.model.graph import Arista, Grafo


@dataclass(frozen=True)
class ResultadoKruskal:
    aristas: tuple[Arista, ...]
    longitud_m: float
    componentes: int
    aristas_evaluadas: int


def kruskal(grafo: Grafo) -> ResultadoKruskal:
    ufds = UFDS(grafo.nodos)
    componentes = len(grafo.nodos)
    seleccionadas = []
    evaluadas = 0
    # sort estable: empates conservan el orden del dataset.
    for arista in sorted(grafo.aristas, key=lambda a: a.longitud_m):
        if componentes <= 1:
            break
        evaluadas += 1
        if ufds.conectados(arista.origen, arista.destino):
            continue
        ufds.unir(arista.origen, arista.destino)
        seleccionadas.append(arista)
        componentes -= 1
    return ResultadoKruskal(tuple(seleccionadas),
                           sum(a.longitud_m for a in seleccionadas),
                           componentes, evaluadas)

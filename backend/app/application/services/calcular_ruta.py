"""Índices precalculados una vez por proceso y orquestación de rutas."""
from time import perf_counter
from math import isclose

from backend.app.domain.algorithm.dijkstra import SinRutaError, dijkstra
from backend.app.domain.algorithm.bellman_ford import bellman_ford
from backend.app.domain.algorithm.ufds import UFDS
from backend.app.domain.repositories.graph_repository import GrafoRepository


class CalcularRuta:
    def __init__(self, repository: GrafoRepository):
        self.grafo = repository.obtener()
        self.adyacencia = self.grafo.adyacencia()
        self.ufds = UFDS(self.grafo.nodos)
        for arista in self.grafo.aristas:
            self.ufds.unir(arista.origen, arista.destino)

    def validar_nodos(self, ids: list[str]) -> None:
        if any(id not in self.grafo.nodos for id in ids):
            raise ValueError("Uno o más nodos no existen en el dataset")

    def conectividad(self, origen: str, destinos: list[str]) -> dict:
        self.validar_nodos([origen, *destinos])
        return {"origen": origen, "tipo": "debil",
                "garantiza_ruta_dirigida": False,
                "destinos": [{"id": id, "misma_componente": self.ufds.conectados(origen, id)}
                             for id in destinos]}

    def comparar(self, origen: str, destino: str, minuto: int) -> dict:
        resultados = [self.ejecutar(origen, destino, minuto, algoritmo)
                      for algoritmo in ("dijkstra", "bellman_ford")]
        a, b = resultados
        tiempo_a = a["tiempo_algoritmo_ms"]
        return {"resultados": resultados,
                "costos_equivalentes": isclose(a["costo_ponderado_m"], b["costo_ponderado_m"],
                                              rel_tol=1e-9, abs_tol=1e-6),
                "diferencia_costo_m": abs(a["costo_ponderado_m"] - b["costo_ponderado_m"]),
                "razon_tiempo_bf_sobre_dijkstra":
                    b["tiempo_algoritmo_ms"] / tiempo_a if tiempo_a > 0 else None}

    def ejecutar(self, origen: str, destino: str, minuto: int,
                 algoritmo: str = "dijkstra") -> dict:
        inicio = perf_counter()
        algoritmos = {"dijkstra": dijkstra, "bellman_ford": bellman_ford}
        if algoritmo not in algoritmos:
            raise ValueError("Algoritmo no soportado")
        self.validar_nodos([origen, destino])
        if not self.ufds.conectados(origen, destino):
            raise SinRutaError("Los nodos pertenecen a componentes desconectadas")
        inicio_algoritmo = perf_counter()
        resultado = algoritmos[algoritmo](self.adyacencia, origen, destino, minuto)
        tiempo_algoritmo_ms = (perf_counter() - inicio_algoritmo) * 1000
        coordenadas = []
        for arista in resultado.aristas:
            a, b = self.grafo.nodos[arista.origen], self.grafo.nodos[arista.destino]
            segmento = list(arista.geometria or ((a.lon, a.lat), (b.lon, b.lat)))
            if coordenadas and coordenadas[-1] == segmento[0]:
                segmento = segmento[1:]
            coordenadas.extend(segmento)
        nodo = self.grafo.nodos[origen]
        geometria = ({"type": "LineString", "coordinates": coordenadas} if coordenadas else
                     {"type": "Point", "coordinates": (nodo.lon, nodo.lat)})
        return {"algoritmo": algoritmo, "origen": origen, "destino": destino,
                "minuto_dia": minuto, "nodos": [origen, *[a.destino for a in resultado.aristas]],
                "tiempo_ms": (perf_counter() - inicio) * 1000,
                "tiempo_algoritmo_ms": tiempo_algoritmo_ms,
                "distancia_km": sum(a.longitud_m for a in resultado.aristas) / 1000,
                "costo_ponderado_m": resultado.costo,
                "nodos_evaluados": resultado.nodos_evaluados,
                "trafico": "simulado", "geometria": geometria}

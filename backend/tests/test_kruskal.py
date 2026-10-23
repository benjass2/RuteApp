from itertools import combinations
from random import Random
import unittest

from backend.app.domain.algorithm.mst_kruskal import kruskal
from backend.app.domain.algorithm.ufds import UFDS
from backend.app.domain.model.graph import Arista, Grafo, Nodo


def edge(a, b, length):
    return Arista(a, b, length, "Calle", True)


def graph(ids, edges):
    return Grafo({id: Nodo(id, -12.1, -77.0) for id in ids}, tuple(edges))


class KruskalTests(unittest.TestCase):
    def test_inverse_parallel_and_loop(self):
        grafo = graph("abc", [edge("a", "a", .1), edge("a", "b", 10),
                              edge("b", "a", 1), edge("a", "b", 5),
                              edge("b", "c", 2), edge("a", "c", 20)])
        result = kruskal(grafo)
        self.assertEqual(result.longitud_m, 3)
        self.assertEqual(result.componentes, 1)
        self.assertEqual(len(result.aristas), 2)
        self.assertEqual(result.aristas[0], grafo.aristas[2])
        self.assertEqual(len(grafo.aristas), 6)  # No mutar el grafo dirigido.

    def test_disconnected_and_isolated(self):
        result = kruskal(graph("abcde", [edge("a", "b", 2), edge("c", "d", 3)]))
        self.assertEqual(result.componentes, 3)
        self.assertEqual(result.longitud_m, 5)
        self.assertEqual(len(result.aristas), 5 - result.componentes)
        self.assertEqual(kruskal(graph("", [])).componentes, 0)
        single = kruskal(graph("a", []))
        self.assertEqual(single.componentes, 1)
        self.assertEqual(single.aristas, ())

    def test_minimality_against_enumeration(self):
        random = Random(2026)
        for _ in range(12):
            ids = "abcd"
            edges = [edge(a, b, random.randint(1, 20)) for a, b in combinations(ids, 2)]
            costos = []
            for candidato in combinations(edges, 3):
                # Oráculo independiente: expansión de vecinos desde un nodo.
                visitados = {"a"}
                for _ in ids:
                    for a in candidato:
                        if a.origen in visitados or a.destino in visitados:
                            visitados.update((a.origen, a.destino))
                if len(visitados) == len(ids):
                    costos.append(sum(a.longitud_m for a in candidato))
            result = kruskal(graph(ids, edges))
            self.assertEqual(result.longitud_m, min(costos))
            ufds = UFDS(ids)
            for a in result.aristas:
                self.assertFalse(ufds.conectados(a.origen, a.destino))
                ufds.unir(a.origen, a.destino)

"""Oráculo independiente Floyd-Warshall sobre pequeños grafos deterministas."""
from math import inf
from random import Random
import unittest

from backend.app.domain.algorithm.bellman_ford import bellman_ford
from backend.app.domain.algorithm.dijkstra import SinRutaError, dijkstra
from backend.app.domain.algorithm.trafico import factor_trafico
from backend.app.domain.model.graph import Arista


class ShortestPathTests(unittest.TestCase):
    def test_algorithms_against_floyd_warshall(self):
        random = Random(2026)
        for _ in range(8):
            ids = [str(i) for i in range(6)]
            adj = {id: [] for id in ids}
            dist = {(a, b): 0.0 if a == b else inf for a in ids for b in ids}
            minuto = random.choice([0, 480, 1080, 1439])
            for a in ids:
                for b in ids:
                    if a != b and random.random() < 0.3:
                        edge = Arista(a, b, random.randint(1, 100),
                                      random.choice(["Avenida Uno", "Calle Dos"]), True)
                        adj[a].append(edge)
                        dist[a, b] = edge.longitud_m * factor_trafico(edge.nombre, minuto)
            for k in ids:
                for a in ids:
                    for b in ids:
                        dist[a, b] = min(dist[a, b], dist[a, k] + dist[k, b])
            for algoritmo in (dijkstra, bellman_ford):
                for a in ids:
                    for b in ids:
                        with self.subTest(algoritmo=algoritmo.__name__, origen=a, destino=b):
                            if dist[a, b] == inf:
                                with self.assertRaises(SinRutaError):
                                    algoritmo(adj, a, b, minuto)
                            else:
                                result = algoritmo(adj, a, b, minuto)
                                self.assertAlmostEqual(result.costo, dist[a, b])
                                actual = a
                                for edge in result.aristas:
                                    self.assertEqual(actual, edge.origen)
                                    actual = edge.destino
                                self.assertEqual(actual, b)

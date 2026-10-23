from itertools import permutations
from math import inf
from random import Random
import unittest

from backend.app.domain.algorithm.backtracking import backtracking
from backend.app.domain.algorithm.dijkstra import SinRutaError
from backend.app.domain.algorithm.divide_conquer import dividir_cuadrantes
from backend.app.domain.algorithm.tsp_dp import held_karp
from backend.app.domain.model.graph import Nodo


class TSPTests(unittest.TestCase):
    def test_solvers_against_permutations(self):
        random = Random(2026)
        for n in range(2, 7):
            for _ in range(4):
                matriz = [[0 if i == j else (inf if random.random() < .2 else random.randint(0, 50))
                           for j in range(n)] for i in range(n)]
                for volver in (False, True):
                    secuencias = [(0, *p) + ((0,) if volver else ())
                                  for p in permutations(range(1, n))]
                    costo = min(sum(matriz[i][j] for i, j in zip(p, p[1:])) for p in secuencias)
                    for solver in (held_karp, backtracking):
                        with self.subTest(n=n, volver=volver, solver=solver.__name__):
                            if costo == inf:
                                with self.assertRaises(SinRutaError):
                                    solver(matriz, volver)
                            else:
                                result = solver(matriz, volver)
                                self.assertEqual(result.costo, costo)
                                visitas = result.orden[1:-1] if volver else result.orden[1:]
                                self.assertEqual(sorted(visitas), list(range(1, n)))
                                self.assertEqual(sum(matriz[i][j] for i, j in
                                                     zip(result.orden, result.orden[1:])), costo)

    def test_limits_and_invalid_matrices(self):
        for solver in (held_karp, backtracking):
            for matriz in ([], [[0]], [[0, 1]], [[0, -1], [1, 0]], [[0, float("nan")], [1, 0]]):
                with self.assertRaises(ValueError):
                    solver(matriz)
        with self.assertRaises(ValueError):
            backtracking([[0] * 10 for _ in range(10)])
        with self.assertRaises(ValueError):
            held_karp([[0] * 14 for _ in range(14)])

    def test_quadrants_partition_and_boundaries(self):
        nodos = {id: Nodo(id, lat, lon) for id, lat, lon in (
            ("a", -2, -2), ("b", -2, 2), ("c", 2, -2), ("d", 2, 2), ("centro", 0, 0))}
        sectores = dividir_cuadrantes(nodos)
        self.assertEqual(sectores, {"SO": ["a"], "SE": ["b"], "NO": ["c"], "NE": ["d", "centro"]})
        self.assertEqual(sum(map(len, dividir_cuadrantes({}).values())), 0)

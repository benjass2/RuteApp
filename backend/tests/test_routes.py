import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient

from backend.main import create_app


class RouteTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        path = Path(self.directory.name) / "graph.json"
        # Dos caminos: la avenida es menor en distancia pero se congestiona más.
        data = {"nodos": {id: {"lat": -12.1, "lon": -77.0}
                          for id in ("a", "b", "c", "d", "aislado")},
                "aristas": [self.edge("a", "b", 50, "Avenida Principal"),
                            self.edge("b", "d", 50, "Avenida Principal"),
                            self.edge("a", "c", 60, "Calle Local"),
                            self.edge("c", "d", 60, "Calle Local"),
                            self.edge("a", "b", 500, "Avenida Principal")]}
        path.write_text(json.dumps(data), encoding="utf-8")
        self.client = self.enterContext(TestClient(create_app(path)))

    @staticmethod
    def edge(a, b, length, name):
        return {"origen": a, "destino": b, "longitud_m": length,
                "nombre": name, "sentido_unico": True}

    def route(self, origen="a", destino="d", minuto=0, algoritmo="dijkstra"):
        return self.client.post("/api/rutas/punto-a-punto", json={
            "origen": origen, "destino": destino, "minuto_dia": minuto, "algoritmo": algoritmo})

    def test_bellman_ford_and_comparison(self):
        for minuto, esperado in ((0, ["a", "b", "d"]), (480, ["a", "c", "d"])):
            response = self.route(minuto=minuto, algoritmo="bellman_ford")
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()["nodos"], esperado)
            comparacion = self.client.post("/api/rutas/comparar", json={
                "origen": "a", "destino": "d", "minuto_dia": minuto})
            self.assertEqual(comparacion.status_code, 200)
            data = comparacion.json()
            self.assertTrue(data["costos_equivalentes"])
            self.assertEqual(data["diferencia_costo_m"], 0)
            self.assertEqual([r["algoritmo"] for r in data["resultados"]],
                             ["dijkstra", "bellman_ford"])
            for r in data["resultados"]:
                self.assertGreaterEqual(r["tiempo_algoritmo_ms"], 0)
                self.assertGreaterEqual(r["tiempo_ms"], r["tiempo_algoritmo_ms"])

    def test_bellman_ford_edge_cases(self):
        self.assertEqual(self.route("d", "a", algoritmo="bellman_ford").status_code, 404)
        self.assertEqual(self.route(destino="aislado", algoritmo="bellman_ford").status_code, 404)
        self.assertEqual(self.route(destino="missing", algoritmo="bellman_ford").status_code, 422)
        same = self.route("a", "a", algoritmo="bellman_ford").json()
        self.assertEqual(same["nodos"], ["a"])
        self.assertEqual(same["costo_ponderado_m"], 0)
        self.assertEqual(self.route(algoritmo="otro").status_code, 422)
        self.assertEqual(self.client.post("/api/rutas/comparar", json={
            "origen": "d", "destino": "a"}).status_code, 404)

    def test_traffic_changes_route_and_parallel_edges(self):
        valle = self.route().json()
        pico = self.route(minuto=480).json()
        self.assertEqual(valle["nodos"], ["a", "b", "d"])
        self.assertEqual(pico["nodos"], ["a", "c", "d"])
        self.assertAlmostEqual(valle["distancia_km"], 0.1)
        self.assertAlmostEqual(pico["costo_ponderado_m"], 240)
        self.assertGreaterEqual(valle["tiempo_ms"], 0)

    def test_weak_connectivity_does_not_guarantee_route(self):
        result = self.client.post("/api/grafo/conectividad", json={
            "origen": "d", "destinos": ["a", "aislado"]}).json()
        self.assertEqual([d["misma_componente"] for d in result["destinos"]], [True, False])
        self.assertFalse(result["garantiza_ruta_dirigida"])
        self.assertEqual(self.route("d", "a").status_code, 404)
        self.assertEqual(self.route(destino="aislado").status_code, 404)

    def test_same_node(self):
        result = self.route("a", "a").json()
        self.assertEqual(result["distancia_km"], 0)
        self.assertEqual(result["nodos"], ["a"])
        self.assertEqual(result["geometria"]["type"], "Point")

    def test_validation(self):
        self.assertEqual(self.route(destino="missing").status_code, 422)
        for minuto in (-1, 1440, True, 5.5):
            self.assertEqual(self.route(minuto=minuto).status_code, 422)

    def test_multi_delivery_open_route_and_comparison(self):
        payload = {"origen": "a", "destinos": ["d", "b"], "minuto_dia": 0,
                   "volver_origen": False}
        for algoritmo in ("held_karp", "backtracking"):
            response = self.client.post("/api/rutas/multi-entrega", json={**payload, "algoritmo": algoritmo})
            self.assertEqual(response.status_code, 200, response.text)
            data = response.json()
            self.assertEqual(data["orden_visita"], ["a", "b", "d"])
            self.assertEqual(data["nodos"], ["a", "b", "d"])
            self.assertEqual(data["costo_ponderado_m"], 100)
            self.assertAlmostEqual(data["distancia_km"], .1)
        response = self.client.post("/api/rutas/multi-entrega/comparar", json=payload)
        self.assertEqual(response.status_code, 200, response.text)
        self.assertTrue(response.json()["costos_equivalentes"])
        self.assertEqual(self.client.post("/api/rutas/multi-entrega", json={
            **payload, "volver_origen": True}).status_code, 404)

    def test_multi_delivery_validation(self):
        for destinos in ([], ["b", "b"], ["a"], ["missing"], ["aislado"], ["b"] * 13):
            response = self.client.post("/api/rutas/multi-entrega", json={
                "origen": "a", "destinos": destinos})
            self.assertIn(response.status_code, (422, 404))
        payload = {"origen": "a", "destinos": [str(i) for i in range(9)], "algoritmo": "backtracking"}
        self.assertEqual(self.client.post("/api/rutas/multi-entrega", json=payload).status_code, 422)
        payload["algoritmo"] = "held_karp"
        self.assertEqual(self.client.post("/api/rutas/multi-entrega/comparar", json=payload).status_code, 422)

    def test_sector_endpoint(self):
        response = self.client.get("/api/grafo/sectores")
        self.assertEqual(response.status_code, 200)
        grupos = response.json()["sectores"]
        self.assertEqual(len(grupos), 4)
        self.assertEqual(sum(s["total"] for s in grupos), 5)

    def test_missing_dataset(self):
        with TestClient(create_app(Path(self.directory.name) / "missing.json")) as client:
            self.assertFalse(client.get("/api/health").json()["dataset_disponible"])
            self.assertEqual(client.post("/api/rutas/punto-a-punto", json={
                "origen": "a", "destino": "d"}).status_code, 503)


if __name__ == "__main__":
    unittest.main()

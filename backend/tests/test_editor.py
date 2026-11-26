import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient
from backend.main import create_app


class EditorTests(unittest.TestCase):
    def test_edit_rebuild_persist_and_restore(self):
        with TemporaryDirectory() as directory:
            original = Path(directory) / "graph.json"
            data = {"nodos": {
                "a": {"lat": -12.1, "lon": -77},
                "b": {"lat": -12.11, "lon": -77}},
                "aristas": [{"origen": "a", "destino": "b", "longitud_m": 100,
                             "nombre": "Calle", "sentido_unico": True}]}
            original.write_text(json.dumps(data), encoding="utf-8")
            app = create_app(original)
            def edit(c, operacion, id="nuevo", **extra):
                return c.post("/api/grafo/editor", json={
                    "operacion": operacion, "id": id, "lat": -12.12, "lon": -77,
                    **extra})
            def ruta(c, algoritmo="dijkstra"):
                return c.post("/api/rutas/punto-a-punto", json={
                    "origen": "a", "destino": "nuevo", "algoritmo": algoritmo})
            with TestClient(app) as c:
                self.assertEqual(edit(c, "agregar", conexiones=["b"]).status_code, 200)
                a, b = ruta(c).json(), ruta(c, "bellman_ford").json()
                self.assertAlmostEqual(a["costo_ponderado_m"], b["costo_ponderado_m"])
                for algoritmo in ("held_karp", "backtracking"):
                    result = c.post("/api/rutas/multi-entrega", json={
                        "origen": "b", "destinos": ["nuevo"],
                        "algoritmo": algoritmo, "volver_origen": True})
                    self.assertEqual(result.status_code, 200)
                    self.assertIn("nuevo", result.json()["nodos"])
                old = a["distancia_km"]
                self.assertEqual(edit(c, "actualizar", lat=-12.13).status_code, 200)
                self.assertGreater(ruta(c).json()["distancia_km"], old)
                before = app.state.editor_path.read_bytes()
                self.assertEqual(edit(c, "agregar").status_code, 422)
                self.assertEqual(app.state.editor_path.read_bytes(), before)
                self.assertEqual(edit(c, "agregar", id="aislado").status_code, 200)
                result = c.post("/api/rutas/punto-a-punto", json={"origen": "a", "destino": "aislado"})
                self.assertEqual(result.status_code, 404)
            with TestClient(create_app(original)) as c:
                self.assertEqual(ruta(c).status_code, 200)
                self.assertEqual(edit(c, "eliminar", id="b").status_code, 200)
                self.assertEqual(ruta(c).status_code, 404)
                self.assertEqual(edit(c, "restaurar").status_code, 200)
                self.assertEqual(c.get("/api/grafo/resumen").json()["nodos"], 2)
            self.assertEqual(json.loads(original.read_text(encoding="utf-8")), data)

    def test_update_connections_preserves_unmodified_arcs(self):
        with TemporaryDirectory() as directory:
            original = Path(directory) / "graph.json"
            data = {"nodos": {
                "a": {"lat": -12.1, "lon": -77},
                "b": {"lat": -12.11, "lon": -77},
                "c": {"lat": -12.12, "lon": -77}},
                "aristas": [{"origen": "a", "destino": "b", "longitud_m": 100,
                             "nombre": "Calle original", "sentido_unico": True}]}
            original.write_text(json.dumps(data), encoding="utf-8")
            app = create_app(original)
            with TestClient(app) as client:
                base = {"operacion": "actualizar", "id": "a", "lat": -12.1, "lon": -77}
                self.assertEqual(client.post("/api/grafo/editor", json=base).status_code, 200)
                saved = json.loads(app.state.editor_path.read_text(encoding="utf-8"))
                self.assertEqual(saved["aristas"], data["aristas"])
                self.assertEqual(client.post("/api/grafo/editor", json={
                    **base, "conexiones": ["c"], "bidireccional": False}).status_code, 200)
                for algoritmo in ("dijkstra", "bellman_ford"):
                    self.assertEqual(client.post("/api/rutas/punto-a-punto", json={
                        "origen": "a", "destino": "c", "algoritmo": algoritmo}).status_code, 200)
                    self.assertEqual(client.post("/api/rutas/punto-a-punto", json={
                        "origen": "c", "destino": "a", "algoritmo": algoritmo}).status_code, 404)
                before = app.state.editor_path.read_bytes()
                self.assertEqual(client.post("/api/grafo/editor", json={
                    **base, "conexiones": ["c"]}).status_code, 422)
                self.assertEqual(before, app.state.editor_path.read_bytes())
                self.assertEqual(client.post("/api/grafo/editor", json={
                    **base, "quitar_conexiones": ["c"]}).status_code, 200)
                self.assertEqual(client.post("/api/rutas/punto-a-punto", json={
                    "origen": "a", "destino": "c"}).status_code, 404)
                saved = json.loads(app.state.editor_path.read_text(encoding="utf-8"))
                self.assertEqual(saved["aristas"], data["aristas"])

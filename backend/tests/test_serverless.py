import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import create_app
from backend.app.infrastructure.persistence.json_graph_repository import JsonGrafoRepository


class ServerlessTests(unittest.TestCase):
    def test_eager_initialization_and_single_load(self):
        data = {"nodos": {"a": {"lat": -12.1, "lon": -77}, "b": {"lat": -12.2, "lon": -77.1}},
                "aristas": [{"origen": "a", "destino": "b", "nombre": "Calle",
                             "longitud_m": 100, "sentido_unico": True}]}
        with TemporaryDirectory() as directory:
            path = Path(directory) / "graph.json"
            path.write_text(json.dumps(data), encoding="utf-8")
            with patch("backend.main.JsonGrafoRepository", wraps=JsonGrafoRepository) as loader:
                app = create_app(path, inicializar=True)
                # Sin context manager: TestClient no ejecuta lifespan.
                client = TestClient(app)
                self.assertTrue(client.get("/api/health").json()["dataset_disponible"])
                result = client.post("/api/rutas/punto-a-punto", json={"origen": "a", "destino": "b"})
                self.assertEqual(result.status_code, 200)
                self.assertAlmostEqual(result.json()["distancia_km"], .1)
                self.assertEqual(client.get("/api/desconocido").status_code, 404)
                client.close()
                with TestClient(app) as client:
                    self.assertEqual(client.get("/api/grafo/resumen").status_code, 200)
                self.assertEqual(loader.call_count, 1)

    def test_missing_dataset_is_unavailable_without_lifespan(self):
        with TemporaryDirectory() as directory:
            with self.assertLogs("backend.main", level="ERROR"):
                app = create_app(Path(directory) / "missing.json", inicializar=True)
            with TestClient(app) as client:
                self.assertFalse(client.get("/api/health").json()["dataset_disponible"])
                self.assertEqual(client.get("/api/grafo/resumen").status_code, 503)

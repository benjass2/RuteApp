import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from fastapi.testclient import TestClient
from backend.main import create_app


class ZonasTests(unittest.TestCase):
    def test_isolation_and_unknown_zone(self):
        with TemporaryDirectory() as directory:
            paths = []
            for name in ("centro", "sur"):
                path = Path(directory) / f"{name}.json"
                path.write_text(json.dumps({"nodos": {
                    name: {"lat": -12.1, "lon": -77}}, "aristas": [
                        {"origen": name, "destino": name, "nombre": "Calle",
                         "longitud_m": 10, "sentido_unico": True}]}), encoding="utf-8")
                paths.append(path)
            with TestClient(create_app(paths[0], zonas_paths={"sur": paths[1]})) as client:
                for zona in ("centro", "sur"):
                    self.assertTrue(client.get(f"/api/health?zona={zona}").json()["dataset_disponible"])
                    data = client.get(f"/api/grafo/nodos?zona={zona}").json()
                    self.assertIn(zona, str(data))
                body = {"origen": "centro", "destino": "centro"}
                self.assertEqual(client.post("/api/rutas/punto-a-punto", json=body).status_code, 200)
                self.assertEqual(client.post("/api/rutas/punto-a-punto?zona=sur", json=body).status_code, 422)
                self.assertEqual(client.get("/api/grafo/resumen?zona=otra").status_code, 422)
                self.assertEqual(client.get("/api/health?zona=otra").status_code, 422)
                page = client.get("/api/grafo/geojson?zona=sur&limite=1").json()
                self.assertEqual(len(page["features"]), 1)
                self.assertEqual(client.get("/api/grafo/geojson?zona=sur&offset=1&limite=1").json()["features"], [])

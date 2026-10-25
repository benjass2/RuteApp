import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

from backend.app.infrastructure.persistence.json_graph_repository import JsonGrafoRepository
from backend.app.application.services.consultar_grafo import ConsultarGrafo


class GraphTests(unittest.TestCase):
    def setUp(self):
        self.directory = TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.path = Path(self.directory.name) / "grafo.json"
        self.data = {"nodos": {"1": {"lat": -12.1, "lon": -77.0},
                               "2": {"lat": -12.2, "lon": -77.1}},
                     "aristas": [{"origen": "1", "destino": "2", "longitud_m": 100,
                                  "nombre": "Prueba", "sentido_unico": True}]}

    def repository(self):
        self.path.write_text(json.dumps(self.data), encoding="utf-8")
        return JsonGrafoRepository(self.path)

    def test_direction_and_memory_cache(self):
        repository = self.repository()
        self.path.unlink()
        grafo = repository.obtener()
        self.assertEqual(len(grafo.adyacencia()["1"]), 1)
        self.assertEqual(grafo.adyacencia()["2"], [])
        self.assertIs(grafo, repository.obtener())

    def test_invalid_endpoint(self):
        self.data["aristas"][0]["destino"] = "missing"
        with self.assertRaises(ValueError):
            self.repository()

    def test_invalid_weight(self):
        self.data["aristas"][0]["longitud_m"] = -1
        with self.assertRaises(ValueError):
            self.repository()

    def test_geojson_coordinate_order(self):
        service = ConsultarGrafo(self.repository())
        self.assertEqual(service.resumen()["nodos"], 2)
        coords = service.geojson()["features"][0]["geometry"]["coordinates"]
        self.assertEqual(coords[0], (-77.0, -12.1))


if __name__ == "__main__":
    unittest.main()

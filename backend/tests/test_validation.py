import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient

from backend.main import create_app
from backend.app.application.dtos.multientrega import SolicitudComparacionMulti, SolicitudMultiEntrega
from backend.app.application.dtos.ruta import SolicitudRuta, SolicitudConectividad
from backend.app.domain.algorithm.trafico import factor_trafico
from backend.app.infrastructure.persistence.json_graph_repository import JsonGrafoRepository


class ValidationTests(unittest.TestCase):
    def test_request_contracts(self):
        self.assertEqual(SolicitudRuta(origen="  a ", destino="b").origen, "a")
        for cls, payload in (
            (SolicitudRuta, {"origen": " ", "destino": "b"}),
            (SolicitudRuta, {"origen": "a", "destino": "b", "hora": 8}),
            (SolicitudConectividad, {"origen": "a", "destinos": [" "]}),
            (SolicitudConectividad, {"origen": "a", "destinos": [1]}),
            (SolicitudMultiEntrega, {"origen": "a", "destinos": ["b", " b "]}),
            (SolicitudComparacionMulti, {"origen": "a", "destinos": [str(i) for i in range(9)]}),
            (SolicitudComparacionMulti, {"origen": "a", "destinos": ["b"], "algoritmo": "held_karp"}),
        ):
            with self.subTest(payload=payload), self.assertRaises(ValueError):
                cls(**payload)

    def test_invalid_dataset_stays_unavailable(self):
        malformed = [[], {"nodos": [], "aristas": []},
                     {"nodos": {"a": {"lat": 0, "lon": 0}}, "aristas": [None]}]
        with TemporaryDirectory() as directory:
            path = Path(directory) / "graph.json"
            for data in malformed:
                path.write_text(json.dumps(data), encoding="utf-8")
                with self.subTest(data=data), self.assertLogs("backend.main", level="ERROR"):
                    with TestClient(create_app(path)) as client:
                        self.assertFalse(client.get("/api/health").json()["dataset_disponible"])
                        self.assertEqual(client.get("/api/grafo/resumen").status_code, 503)

    def test_dataset_geometry_and_scalar_validation(self):
        with TemporaryDirectory() as directory:
            path = Path(directory) / "graph.json"
            valid = {"nodos": {"a": {"lat": 0, "lon": 0}}, "aristas": [{
                "origen": "a", "destino": "a", "nombre": "Calle", "longitud_m": 1,
                "sentido_unico": True}]}
            for key, value in (("geometria", [[0, 0]]), ("geometria", [[0], [0, 0]]),
                               ("geometria", [[0, 0], [181, 0]]), ("longitud_m", True),
                               ("longitud_m", float("inf")), ("sentido_unico", "false")):
                data = json.loads(json.dumps(valid))
                data["aristas"][0][key] = value
                path.write_text(json.dumps(data), encoding="utf-8")
                with self.subTest(key=key, value=value), self.assertRaises(ValueError):
                    JsonGrafoRepository(path)
            path.write_text(json.dumps(valid), encoding="utf-8")
            with patch("backend.main.CalcularRuta", side_effect=ValueError("Índice inválido")):
                with self.assertLogs("backend.main", level="ERROR"):
                    with TestClient(create_app(path)) as client:
                        self.assertFalse(client.get("/api/health").json()["dataset_disponible"])
                        self.assertEqual(client.get("/api/grafo/geojson").status_code, 503)

    def test_domain_rejects_invalid_time(self):
        for value in (True, 1.5, -1, 1440):
            with self.assertRaises(ValueError):
                factor_trafico("Calle", value)

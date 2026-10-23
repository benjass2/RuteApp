"""Carga y valida una sola vez el dataset; nunca realiza llamadas externas."""
import json
import math
from pathlib import Path

from backend.app.domain.model.graph import Arista, Grafo, Nodo


class JsonGrafoRepository:
    def __init__(self, path: Path):
        data = json.loads(path.read_text(encoding="utf-8"))
        nodos = {}
        for id, item in data["nodos"].items():
            nodo = Nodo(str(id), float(item["lat"]), float(item["lon"]))
            if not (-90 <= nodo.lat <= 90 and -180 <= nodo.lon <= 180):
                raise ValueError(f"Coordenadas inválidas: {id}")
            nodos[nodo.id] = nodo
        aristas = []
        for item in data["aristas"]:
            if not isinstance(item["sentido_unico"], bool):
                raise ValueError("sentido_unico debe ser booleano")
            arista = Arista(
                str(item["origen"]), str(item["destino"]),
                float(item["longitud_m"]), str(item["nombre"]),
                item["sentido_unico"],
                tuple(tuple(map(float, p)) for p in item.get("geometria", [])),
            )
            if arista.origen not in nodos or arista.destino not in nodos:
                raise ValueError("Arista con nodo inexistente")
            if not math.isfinite(arista.longitud_m) or arista.longitud_m <= 0:
                raise ValueError("Longitud de arista inválida")
            if any(len(p) != 2 or not (-180 <= p[0] <= 180 and -90 <= p[1] <= 90)
                   for p in arista.geometria):
                raise ValueError("Geometría inválida")
            aristas.append(arista)
        if not nodos or not aristas:
            raise ValueError("Dataset vacío")
        self._grafo = Grafo(nodos, tuple(aristas))

    def obtener(self) -> Grafo:
        return self._grafo

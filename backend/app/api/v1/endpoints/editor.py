"""Edición local serializada con publicación de snapshots completos."""
import json
import os
from math import asin, cos, radians, sin, sqrt
from pathlib import Path
from tempfile import NamedTemporaryFile
from threading import RLock

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ConfigDict, Field

from backend.app.infrastructure.persistence.json_graph_repository import JsonGrafoRepository
from backend.app.application.services.calcular_ruta import CalcularRuta

router = APIRouter(prefix="/api/grafo/editor", tags=["Editor de red"])


class CambioRed(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)
    operacion: str = Field(pattern="^(agregar|actualizar|eliminar|restaurar)$")
    id: str = Field(default="", max_length=100)
    lat: float = Field(default=0, ge=-90, le=90)
    lon: float = Field(default=0, ge=-180, le=180)
    conexiones: list[str] = Field(default_factory=list, max_length=20)
    bidireccional: bool = True
    quitar_conexiones: list[str] = Field(default_factory=list, max_length=100)


def distancia(a, b):
    lat1, lat2 = radians(a[1]), radians(b[1])
    h = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin(radians(b[0] - a[0]) / 2) ** 2
    return 6371008.8 * 2 * asin(sqrt(min(1, h)))


def inicializar_editor(app, original: Path):
    app.state.editor_original = original
    app.state.editor_path = original.with_name(original.stem + "_editable.json")
    app.state.editor_lock = RLock()


def modificar(data, cambio):
    nodos = data["nodos"]
    id = cambio.id.strip()
    if not id:
        raise ValueError("Indica un identificador de nodo.")
    if cambio.operacion == "agregar":
        if id in nodos:
            raise ValueError("Ese identificador ya existe.")
        nodos[id] = {"id": id, "lat": cambio.lat, "lon": cambio.lon}
    elif id not in nodos:
        raise ValueError("El nodo no existe.")
    elif cambio.operacion == "eliminar":
        if len(nodos) == 1:
            raise ValueError("Debe conservarse al menos un nodo en el dataset.")
        del nodos[id]
        data["aristas"] = [a for a in data["aristas"] if id not in (a["origen"], a["destino"])]
    elif (nodos[id]["lat"], nodos[id]["lon"]) != (cambio.lat, cambio.lon):
        nodos[id] = {"id": id, "lat": cambio.lat, "lon": cambio.lon}
        for arco in data["aristas"]:
            if id not in (arco["origen"], arco["destino"]):
                continue
            origen, destino = nodos[arco["origen"]], nodos[arco["destino"]]
            coords = arco.get("geometria") or [[origen["lon"], origen["lat"]], [destino["lon"], destino["lat"]]]
            if arco["origen"] == id:
                coords[0] = [cambio.lon, cambio.lat]
            if arco["destino"] == id:
                coords[-1] = [cambio.lon, cambio.lat]
            longitud = sum(distancia(a, b) for a, b in zip(coords, coords[1:]))
            if longitud <= 0:
                raise ValueError("El cambio produce un arco de longitud cero.")
            arco["geometria"], arco["longitud_m"] = coords, longitud
    if cambio.operacion in ("agregar", "actualizar"):
        if len(set(cambio.quitar_conexiones)) != len(cambio.quitar_conexiones):
            raise ValueError("Hay conexiones a quitar repetidas.")
        vecinos = {a["destino"] if a["origen"] == id else a["origen"]
                   for a in data["aristas"] if id in (a["origen"], a["destino"])}
        if any(v not in vecinos for v in cambio.quitar_conexiones):
            raise ValueError("Una conexión a quitar ya no existe.")
        if set(cambio.conexiones) & set(cambio.quitar_conexiones):
            raise ValueError("No agregues y quites la misma conexión en un cambio.")
        quitar = set(cambio.quitar_conexiones)
        data["aristas"] = [a for a in data["aristas"] if not (
            a["origen"] == id and a["destino"] in quitar or
            a["destino"] == id and a["origen"] in quitar)]
        if len(set(cambio.conexiones)) != len(cambio.conexiones):
            raise ValueError("Hay conexiones repetidas.")
        for vecino in cambio.conexiones:
            if vecino == id or vecino not in nodos:
                raise ValueError("Selecciona conexiones existentes distintas del nodo nuevo.")
            if any(a["origen"] == id and a["destino"] == vecino for a in data["aristas"]):
                raise ValueError("Ya existe una conexión saliente con ese nodo.")
            if cambio.bidireccional and any(a["origen"] == vecino and a["destino"] == id for a in data["aristas"]):
                raise ValueError("Ya existe una conexión entrante. Agrega solo el sentido faltante.")
            a, b = nodos[id], nodos[vecino]
            coords = [[a["lon"], a["lat"]], [b["lon"], b["lat"]]]
            longitud = distancia(*coords)
            if longitud <= 0:
                raise ValueError("Los extremos de una conexión deben ser distintos.")
            arista = {"origen": id, "destino": vecino, "longitud_m": longitud,
                      "nombre": "Conexión manual", "sentido_unico": not cambio.bidireccional,
                      "geometria": coords}
            data["aristas"].append(arista)
            if cambio.bidireccional:
                data["aristas"].append({**arista, "origen": vecino, "destino": id,
                                        "geometria": list(reversed(coords))})
    return data


@router.post("")
def editar(cambio: CambioRed, request: Request):
    app = request.app
    if os.environ.get("VERCEL"):
        raise HTTPException(503, "La edición persistente está disponible en el servidor local.")
    with app.state.editor_lock:
        original, destino = app.state.editor_original, app.state.editor_path
        temporal = None
        try:
            fuente = original if cambio.operacion == "restaurar" or not destino.exists() else destino
            data = json.loads(fuente.read_text(encoding="utf-8"))
            if cambio.operacion != "restaurar":
                data = modificar(data, cambio)
            with NamedTemporaryFile(mode="w", encoding="utf-8", dir=destino.parent,
                                    suffix=".tmp", delete=False) as archivo:
                temporal = Path(archivo.name)
                json.dump(data, archivo, ensure_ascii=False, allow_nan=False)
            repo = JsonGrafoRepository(temporal)
            rutas = CalcularRuta(repo)
            temporal.replace(destino)
            app.state.snapshot = (repo, rutas)
            app.state.repository, app.state.rutas = repo, rutas
        except ValueError as error:
            raise HTTPException(422, str(error)) from error
        except OSError as error:
            raise HTTPException(503, "No se pudo guardar la edición del dataset.") from error
        finally:
            if temporal is not None:
                temporal.unlink(missing_ok=True)
    return {"estado": "guardado"}

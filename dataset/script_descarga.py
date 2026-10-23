"""Extracción reproducible de OSM; requiere Internet solo durante este paso."""
import argparse
import json
from datetime import datetime, timezone
from pathlib import Path


def descargar(output: Path, min_nodos: int, min_aristas: int) -> None:
    import osmnx as ox

    lugares = ["Miraflores, Lima, Peru", "San Isidro, Lima, Peru"]
    # MultiDiGraph: conserva calles de un sentido y aristas paralelas.
    grafo = ox.graph_from_place(lugares, network_type="drive", simplify=True, retain_all=True)
    nodos = {str(id): {"id": str(id), "lat": float(d["y"]), "lon": float(d["x"])}
             for id, d in grafo.nodes(data=True)}
    aristas = []
    for u, v, key, d in grafo.edges(keys=True, data=True):
        nombre = d.get("name", "Sin nombre")
        if isinstance(nombre, list):
            nombre = " / ".join(map(str, nombre))
        geometria = d.get("geometry")
        coords = list(geometria.coords) if geometria is not None else [
            (grafo.nodes[u]["x"], grafo.nodes[u]["y"]),
            (grafo.nodes[v]["x"], grafo.nodes[v]["y"])]
        # Alinear la geometría con el origen incluso para los arcos inversos.
        inicio = (grafo.nodes[u]["x"], grafo.nodes[u]["y"])
        if sum((coords[-1][i] - inicio[i]) ** 2 for i in (0, 1)) < sum(
                (coords[0][i] - inicio[i]) ** 2 for i in (0, 1)):
            coords.reverse()
        aristas.append({"origen": str(u), "destino": str(v), "clave": str(key),
                        "longitud_m": float(d["length"]), "nombre": str(nombre),
                        "sentido_unico": bool(d.get("oneway", False)), "geometria": coords})
    if len(nodos) < min_nodos or len(aristas) < min_aristas:
        raise ValueError(f"Área insuficiente: {len(nodos)} nodos, {len(aristas)} aristas; "
                         "revisar cobertura antes de ajustar los mínimos.")
    data = {"metadata": {"fuente": "OpenStreetMap", "licencia": "ODbL-1.0",
                         "atribucion": "© OpenStreetMap contributors",
                         "url": "https://www.openstreetmap.org/copyright",
                         "lugares": lugares, "fecha_utc": datetime.now(timezone.utc).isoformat(),
                         "osmnx_version": ox.__version__, "aristas_dirigidas": True},
            "nodos": nodos, "aristas": aristas}
    output.parent.mkdir(parents=True, exist_ok=True)
    temporal = output.with_suffix(".tmp")
    temporal.write_text(json.dumps(data, ensure_ascii=False, allow_nan=False), encoding="utf-8")
    temporal.replace(output)
    print(f"Dataset guardado: {output} ({len(nodos)} nodos, {len(aristas)} aristas)")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=Path(__file__).with_name("dataset_grafo.json"))
    parser.add_argument("--min-nodos", type=int, default=1500)
    parser.add_argument("--min-aristas", type=int, default=3400)
    args = parser.parse_args()
    descargar(args.output, args.min_nodos, args.min_aristas)

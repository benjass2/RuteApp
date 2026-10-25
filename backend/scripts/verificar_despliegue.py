"""Comprueba artefactos locales y entrada ASGI. No publica ni usa credenciales."""
import math
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from api.index import app


def verificar() -> None:
    dist = ROOT / "frontend" / "dist"
    html = (dist / "index.html").read_text(encoding="utf-8")
    assets = re.findall(r'(?:src|href)="(/assets/[^\"]+)"', html)
    if not assets or any(not (dist / asset.lstrip("/")).is_file() for asset in assets):
        raise RuntimeError("Build de Vite incompleta. Ejecuta npm run build.")
    print(f"Frontend compilado: {len(assets)} referencias de assets verificadas")

    # Sin lifespan: verificar precisamente la inicialización explícita de api/index.py.
    client = TestClient(app)
    try:
        health = client.get("/api/health")
        if health.status_code != 200 or not health.json()["dataset_disponible"]:
            raise RuntimeError("La función no pudo cargar su dataset local")
        sizes = {}
        for path in ("/api/grafo/resumen", "/api/grafo/geojson", "/api/grafo/mst",
                     "/api/grafo/sectores", "/api/grafo/nodos?limite=2000", "/openapi.json", "/docs"):
            response = client.get(path)
            if response.status_code != 200:
                raise RuntimeError(f"{path}: HTTP {response.status_code}")
            if len(response.content) >= 4_500_000:
                raise RuntimeError(f"{path}: respuesta demasiado grande para el límite configurado de comprobación")
            sizes[path] = len(response.content)
        resumen = client.get("/api/grafo/resumen").json()
        if resumen["nodos"] < 1500 or resumen["aristas"] < 3400:
            raise RuntimeError("El dataset no alcanza los mínimos del proyecto")
        red = client.get("/api/grafo/geojson").json()
        edge = next(f["properties"] for f in red["features"]
                    if f["properties"]["origen"] != f["properties"]["destino"])
        response = client.post("/api/rutas/comparar", json={"origen": edge["origen"], "destino": edge["destino"], "minuto_dia": 480})
        if response.status_code != 200 or not response.json()["costos_equivalentes"]:
            raise RuntimeError("Falló la comparación de caminos mínimos")
        if any(not math.isfinite(r["costo_ponderado_m"]) for r in response.json()["resultados"]):
            raise RuntimeError("La ruta devolvió un costo inválido")
        missing = client.get("/api/ruta-inexistente")
        if missing.status_code != 404 or "application/json" not in missing.headers.get("content-type", ""):
            raise RuntimeError("Una ruta API inexistente no devolvió 404 JSON")
        print(f"Dataset real: {resumen['nodos']} nodos, {resumen['aristas']} arcos")
        for path, size in sizes.items():
            print(f"  OK {path}: {size:,} bytes")
        print("Entrada ASGI y rutas: OK. Rewrites/CDN de Vercel: requieren build y preview en la plataforma.")
    finally:
        client.close()


if __name__ == "__main__":
    verificar()

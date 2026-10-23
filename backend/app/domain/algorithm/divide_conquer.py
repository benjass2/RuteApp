"""Dividir dos veces por el centro de la caja geográfica: cuatro cuadrantes.

No elimina calles ni altera rutas: permite asignar nodos a sectores de flota.
O(V) tiempo y espacio. Los puntos sobre el corte pertenecen al norte/este.
"""
from backend.app.domain.model.graph import Nodo


def dividir_cuadrantes(nodos: dict[str, Nodo]) -> dict[str, list[str]]:
    sectores: dict[str, list[str]] = {s: [] for s in ("SO", "SE", "NO", "NE")}
    if not nodos:
        return sectores
    centro_lat = (min(n.lat for n in nodos.values()) + max(n.lat for n in nodos.values())) / 2
    centro_lon = (min(n.lon for n in nodos.values()) + max(n.lon for n in nodos.values())) / 2

    def dividir(ids: list[str], nivel: int, prefijo: str) -> None:
        if nivel == 2:
            sectores[prefijo] = ids
            return
        menores, mayores = [], []
        for id in ids:
            valor = nodos[id].lat if nivel == 0 else nodos[id].lon
            corte = centro_lat if nivel == 0 else centro_lon
            (menores if valor < corte else mayores).append(id)
        etiquetas = ("S", "N") if nivel == 0 else ("O", "E")
        dividir(menores, nivel + 1, prefijo + etiquetas[0])
        dividir(mayores, nivel + 1, prefijo + etiquetas[1])

    dividir(list(nodos), 0, "")
    return sectores

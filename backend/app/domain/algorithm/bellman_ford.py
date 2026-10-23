"""Relajación de aristas, O(V E), con terminación al no haber cambios.

El dominio vial admite únicamente longitudes positivas: no hay ciclos negativos.
La hora permanece fija durante todo el recorrido, igual que en Dijkstra.
"""
from math import inf

from backend.app.domain.algorithm.dijkstra import ResultadoCamino, SinRutaError
from backend.app.domain.algorithm.trafico import factor_trafico
from backend.app.domain.model.graph import Arista


def bellman_ford(adyacencia: dict[str, list[Arista]], origen: str, destino: str,
                 minuto: int) -> ResultadoCamino:
    if origen not in adyacencia or destino not in adyacencia:
        raise ValueError("Nodo inexistente")
    factor_trafico("", minuto)
    if origen == destino:
        return ResultadoCamino((), 0.0, 1)
    # Precalcular pesos evita repetir el modelo horario en cada pasada.
    aristas = [(a, a.longitud_m * factor_trafico(a.nombre, minuto))
               for lista in adyacencia.values() for a in lista]
    distancias = {origen: 0.0}
    anteriores: dict[str, Arista] = {}
    evaluados = set()
    for _ in range(len(adyacencia) - 1):
        cambio = False
        for arista, peso in aristas:
            costo = distancias.get(arista.origen, inf)
            if costo == inf:
                continue
            evaluados.add(arista.origen)
            if costo + peso < distancias.get(arista.destino, inf):
                distancias[arista.destino] = costo + peso
                anteriores[arista.destino] = arista
                cambio = True
        if not cambio:
            break
    if destino not in distancias:
        raise SinRutaError("No existe ruta respetando los sentidos de circulación")
    evaluados.add(destino)
    camino = []
    actual = destino
    while actual != origen:
        arista = anteriores[actual]
        camino.append(arista)
        actual = arista.origen
    return ResultadoCamino(tuple(reversed(camino)), distancias[destino], len(evaluados))

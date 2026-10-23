"""Cierre métrico dirigido por Dijkstra, optimización TSP y expansión vial."""
from math import inf, isclose
from time import perf_counter

from backend.app.application.services.calcular_ruta import CalcularRuta
from backend.app.domain.algorithm.backtracking import backtracking
from backend.app.domain.algorithm.dijkstra import SinRutaError, dijkstra
from backend.app.domain.algorithm.tsp_dp import held_karp


class CalcularMultiEntrega:
    def __init__(self, rutas: CalcularRuta):
        self.rutas = rutas

    def preparar(self, origen: str, destinos: list[str], minuto: int):
        self.rutas.validar_nodos([origen, *destinos])
        if not destinos or len(destinos) > 12 or len(set([origen, *destinos])) != len(destinos) + 1:
            raise ValueError("Se requieren de 1 a 12 destinos únicos distintos al origen")
        if not all(self.rutas.ufds.conectados(origen, d) for d in destinos):
            raise SinRutaError("Hay paradas en componentes desconectadas")
        puntos = [origen, *destinos]
        matriz = [[0.0 if i == j else inf for j in range(len(puntos))]
                  for i in range(len(puntos))]
        caminos = {}
        evaluados = 0
        for i, a in enumerate(puntos):
            for j, b in enumerate(puntos):
                if i == j:
                    continue
                try:
                    camino = dijkstra(self.rutas.adyacencia, a, b, minuto)
                except SinRutaError:
                    continue  # Una matriz asimétrica puede contener tramos inaccesibles.
                matriz[i][j] = camino.costo
                caminos[i, j] = camino.aristas
                evaluados += camino.nodos_evaluados
        return puntos, matriz, caminos, evaluados

    def resolver(self, preparado, minuto: int, algoritmo: str, volver: bool) -> dict:
        puntos, matriz, caminos, evaluados = preparado
        motores = {"held_karp": held_karp, "backtracking": backtracking}
        if algoritmo not in motores:
            raise ValueError("Algoritmo no soportado")
        inicio = perf_counter()
        resultado = motores[algoritmo](matriz, volver)
        tiempo_algoritmo = (perf_counter() - inicio) * 1000
        aristas = tuple(a for i, j in zip(resultado.orden, resultado.orden[1:])
                        for a in caminos[i, j])
        return {"algoritmo": algoritmo, "orden_visita": [puntos[i] for i in resultado.orden],
                "nodos": [puntos[0], *[a.destino for a in aristas]],
                "volver_origen": volver, "minuto_dia": minuto,
                "distancia_km": sum(a.longitud_m for a in aristas) / 1000,
                "costo_ponderado_m": resultado.costo, "tiempo_algoritmo_ms": tiempo_algoritmo,
                "estados_evaluados": resultado.estados_evaluados,
                "nodos_evaluados_matriz": evaluados, "trafico": "simulado",
                "geometria": self.rutas.geometria(puntos[0], aristas)}

    def ejecutar(self, origen: str, destinos: list[str], minuto: int,
                 algoritmo: str = "held_karp", volver: bool = True) -> dict:
        inicio = perf_counter()
        if algoritmo == "backtracking" and len(destinos) > 8:
            raise ValueError("Backtracking admite como máximo 8 paradas")
        preparado = self.preparar(origen, destinos, minuto)
        tiempo_matriz = (perf_counter() - inicio) * 1000
        resultado = self.resolver(preparado, minuto, algoritmo, volver)
        resultado.update(tiempo_matriz_ms=tiempo_matriz, tiempo_ms=(perf_counter() - inicio) * 1000)
        return resultado

    def comparar(self, origen: str, destinos: list[str], minuto: int, volver: bool) -> dict:
        if len(destinos) > 8:
            raise ValueError("La comparación admite como máximo 8 paradas")
        inicio = perf_counter()
        preparado = self.preparar(origen, destinos, minuto)
        tiempo_matriz = (perf_counter() - inicio) * 1000
        resultados = []
        for algoritmo in ("held_karp", "backtracking"):
            inicio_solver = perf_counter()
            resultado = self.resolver(preparado, minuto, algoritmo, volver)
            resultado.update(tiempo_matriz_ms=tiempo_matriz,
                             tiempo_ms=tiempo_matriz + (perf_counter() - inicio_solver) * 1000)
            resultados.append(resultado)
        a, b = resultados
        return {"resultados": resultados,
                "costos_equivalentes": isclose(a["costo_ponderado_m"], b["costo_ponderado_m"],
                                              rel_tol=1e-9, abs_tol=1e-6),
                "tiempo_total_ms": (perf_counter() - inicio) * 1000}

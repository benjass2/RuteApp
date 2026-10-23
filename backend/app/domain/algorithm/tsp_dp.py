"""Held-Karp: O(N² 2^N) tiempo y O(N 2^N) memoria, N clientes."""
from math import inf

from backend.app.domain.algorithm.tsp import ResultadoTSP, resultado, validar_matriz


def held_karp(matriz: list[list[float]], volver_origen: bool = True) -> ResultadoTSP:
    validar_matriz(matriz, 12)
    n = len(matriz) - 1
    dp: dict[tuple[int, int], float] = {}
    padre: dict[tuple[int, int], int] = {}
    for j in range(n):
        if matriz[0][j + 1] < inf:
            dp[1 << j, j] = matriz[0][j + 1]
            padre[1 << j, j] = -1
    for mascara in range(1, 1 << n):
        for j in range(n):
            costo = dp.get((mascara, j), inf)
            if costo == inf:
                continue
            for k in range(n):
                if mascara & (1 << k):
                    continue
                siguiente = mascara | (1 << k)
                nuevo = costo + matriz[j + 1][k + 1]
                if nuevo < dp.get((siguiente, k), inf):
                    dp[siguiente, k] = nuevo
                    padre[siguiente, k] = j
    completa = (1 << n) - 1
    costo, ultimo = min((dp.get((completa, j), inf) +
                         (matriz[j + 1][0] if volver_origen else 0), j) for j in range(n))
    if costo == inf:
        return resultado((), costo, len(dp))
    orden = []
    mascara = completa
    while ultimo != -1:
        orden.append(ultimo + 1)
        anterior = padre[mascara, ultimo]
        mascara ^= 1 << ultimo
        ultimo = anterior
    secuencia = (0, *reversed(orden)) + ((0,) if volver_origen else ())
    return resultado(secuencia, costo, len(dp))

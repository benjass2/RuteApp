"""Fuerza bruta con poda por costo acumulado, O(N!), máximo 8 clientes."""
from math import inf

from backend.app.domain.algorithm.tsp import ResultadoTSP, resultado, validar_matriz


def backtracking(matriz: list[list[float]], volver_origen: bool = True) -> ResultadoTSP:
    validar_matriz(matriz, 8)
    n = len(matriz) - 1
    mejor_costo = inf
    mejor_orden: tuple[int, ...] = ()
    estados = 0

    def visitar(orden: tuple[int, ...], mascara: int, costo: float) -> None:
        nonlocal mejor_costo, mejor_orden, estados
        estados += 1
        if costo >= mejor_costo:
            return  # Válido porque todos los costos son no negativos.
        ultimo = orden[-1]
        if mascara == (1 << n) - 1:
            total = costo + (matriz[ultimo][0] if volver_origen else 0)
            if total < mejor_costo:
                mejor_costo = total
                mejor_orden = orden + ((0,) if volver_origen else ())
            return
        for siguiente in range(1, n + 1):
            bit = 1 << (siguiente - 1)
            if not mascara & bit and matriz[ultimo][siguiente] < inf:
                visitar((*orden, siguiente), mascara | bit, costo + matriz[ultimo][siguiente])

    visitar((0,), 0, 0.0)
    return resultado(mejor_orden, mejor_costo, estados)

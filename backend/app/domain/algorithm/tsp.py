"""Contrato compartido de los optimizadores de secuencia (índice 0 = depósito)."""
from dataclasses import dataclass
from math import isfinite, inf

from backend.app.domain.algorithm.dijkstra import SinRutaError


@dataclass(frozen=True)
class ResultadoTSP:
    orden: tuple[int, ...]
    costo: float
    estados_evaluados: int


def validar_matriz(matriz: list[list[float]], limite: int) -> None:
    if not 2 <= len(matriz) <= limite + 1 or any(len(fila) != len(matriz) for fila in matriz):
        raise ValueError(f"Se requieren entre 1 y {limite} paradas y una matriz cuadrada")
    if any(costo != inf and (not isfinite(costo) or costo < 0)
           for fila in matriz for costo in fila):
        raise ValueError("Costos deben ser no negativos o infinito positivo")


def resultado(orden: tuple[int, ...], costo: float, estados: int) -> ResultadoTSP:
    if not isfinite(costo):
        raise SinRutaError("No existe una secuencia de entrega con las condiciones solicitadas")
    return ResultadoTSP(orden, costo, estados)

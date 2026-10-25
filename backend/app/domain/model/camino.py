"""Resultado y error compartidos por los motores de caminos mínimos."""
from dataclasses import dataclass

from backend.app.domain.model.graph import Arista


class SinRutaError(ValueError):
    """No hay recorrido válido bajo las condiciones solicitadas."""


@dataclass(frozen=True)
class ResultadoCamino:
    aristas: tuple[Arista, ...]
    costo: float
    nodos_evaluados: int

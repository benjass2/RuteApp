from typing import Protocol

from backend.app.domain.model.graph import Grafo


class GrafoRepository(Protocol):
    def obtener(self) -> Grafo: ...

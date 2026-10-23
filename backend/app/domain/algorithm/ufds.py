"""Union-Find con compresión de caminos y unión por tamaño."""
from collections.abc import Iterable


class UFDS:
    def __init__(self, elementos: Iterable[str]):
        self.padre = {x: x for x in elementos}
        self.tamano = {x: 1 for x in self.padre}

    def encontrar(self, x: str) -> str:
        while x != self.padre[x]:
            self.padre[x] = self.padre[self.padre[x]]
            x = self.padre[x]
        return x

    def unir(self, a: str, b: str) -> None:
        a, b = self.encontrar(a), self.encontrar(b)
        if a == b:
            return
        if self.tamano[a] < self.tamano[b]:
            a, b = b, a
        self.padre[b] = a
        self.tamano[a] += self.tamano[b]

    def conectados(self, a: str, b: str) -> bool:
        return self.encontrar(a) == self.encontrar(b)

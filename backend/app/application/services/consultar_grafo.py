from backend.app.domain.repositories.graph_repository import GrafoRepository
from backend.app.domain.algorithm.mst_kruskal import kruskal
from time import perf_counter


class ConsultarGrafo:
    def __init__(self, repository: GrafoRepository):
        self.repository = repository

    def resumen(self) -> dict:
        grafo = self.repository.obtener()
        return {
            "nodos": len(grafo.nodos), "aristas": len(grafo.aristas),
            "dirigido": True, "fuente": "OpenStreetMap",
            "atribucion": "© OpenStreetMap contributors",
        }

    def mst(self) -> dict:
        inicio = perf_counter()
        grafo = self.repository.obtener()
        inicio_algoritmo = perf_counter()
        resultado = kruskal(grafo)
        tiempo_algoritmo_ms = (perf_counter() - inicio_algoritmo) * 1000
        geojson = self.geojson(resultado.aristas)
        return {"algoritmo": "kruskal", "proyeccion": "no_dirigida",
                "criterio_peso": "longitud_m", "nodos": len(grafo.nodos),
                "aristas_seleccionadas": len(resultado.aristas),
                "aristas_evaluadas": resultado.aristas_evaluadas,
                "componentes": resultado.componentes,
                "es_conexo": resultado.componentes == 1,
                "es_arbol": resultado.componentes == 1,
                "distancia_km": resultado.longitud_m / 1000,
                "tiempo_algoritmo_ms": tiempo_algoritmo_ms,
                "tiempo_ms": (perf_counter() - inicio) * 1000,
                "atribucion": "© OpenStreetMap contributors", "geojson": geojson}

    def geojson(self, aristas=None) -> dict:
        grafo = self.repository.obtener()
        features = []
        for arista in grafo.aristas if aristas is None else aristas:
            origen, destino = grafo.nodos[arista.origen], grafo.nodos[arista.destino]
            features.append({
                "type": "Feature",
                "geometry": {"type": "LineString", "coordinates": arista.geometria or (
                    (origen.lon, origen.lat), (destino.lon, destino.lat))},
                "properties": {"origen": arista.origen, "destino": arista.destino,
                               "nombre": arista.nombre, "longitud_m": arista.longitud_m,
                               "sentido_unico": arista.sentido_unico},
            })
        return {"type": "FeatureCollection", "features": features}

from backend.app.domain.repositories.graph_repository import GrafoRepository


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

    def geojson(self) -> dict:
        grafo = self.repository.obtener()
        features = []
        for arista in grafo.aristas:
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

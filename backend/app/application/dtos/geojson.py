"""Contratos GeoJSON compartidos por rutas, red vial y MST."""
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

Coordenada = tuple[Annotated[float, Field(ge=-180, le=180)],
                   Annotated[float, Field(ge=-90, le=90)]]


class Punto(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    type: Literal["Point"]
    coordinates: Coordenada


class Linea(BaseModel):
    model_config = ConfigDict(allow_inf_nan=False)
    type: Literal["LineString"]
    coordinates: list[Coordenada] = Field(min_length=2)


Geometria = Annotated[Punto | Linea, Field(discriminator="type")]


class PropiedadesCalle(BaseModel):
    origen: str
    destino: str
    nombre: str
    longitud_m: float = Field(gt=0, allow_inf_nan=False)
    sentido_unico: bool


class CalleFeature(BaseModel):
    type: Literal["Feature"]
    geometry: Linea
    properties: PropiedadesCalle


class ColeccionCalles(BaseModel):
    type: Literal["FeatureCollection"]
    features: list[CalleFeature]

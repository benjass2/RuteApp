"""Convenciones de entrada compartidas; los contratos viven en application/dtos."""
from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

NodoId = Annotated[str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=100)]


class SolicitudBase(BaseModel):
    model_config = ConfigDict(extra="forbid")

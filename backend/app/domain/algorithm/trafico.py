"""Modelo académico determinista; no representa tráfico observado."""
from unicodedata import normalize


def factor_trafico(calle: str, minuto: int) -> float:
    if type(minuto) is not int or not 0 <= minuto <= 1439:
        raise ValueError("El minuto del día debe estar entre 0 y 1439")
    hora = minuto / 60
    # Picos triangulares continuos; valle=1, pico=2 en calles locales.
    pico = max(0.0, 1 - abs(hora - 8) / 2, 1 - abs(hora - 18) / 3)
    nombre = normalize("NFKD", calle.casefold())
    arterial = "avenida" in nombre or nombre.startswith(("av.", "av "))
    return 1 + pico * (1.5 if arterial else 1.0)

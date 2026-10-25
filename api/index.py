"""Adaptador ASGI de Vercel; las capas DDD permanecen en backend/."""
from backend.main import create_app

# La carga explícita no depende de que el adaptador ejecute lifespan.
# Cada proceso conserva su copia del grafo en RAM, sin descargas ni escrituras.
app = create_app(inicializar=True)

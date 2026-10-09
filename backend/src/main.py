import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router
from src.core.config import settings

# Configuração global de logs para monitorização
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        description="Motor Determinístico Focado em Governança para análise da Lei do Bem."
    )

    # Configuração CORS agressiva para permitir que o React (Milestone 2) aceda à API sem bloqueios
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], # Em produção restringe-se ao IP do Frontend
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Regista as rotas da API
    app.include_router(router, prefix=settings.API_V1_STR)

    @app.get("/health", tags=["Monitorização"])
    def health_check():
        """Endpoint rápido para o Load Balancer saber se o servidor está vivo."""
        return {"status": "ok", "service": settings.PROJECT_NAME, "version": settings.VERSION}

    return app

app = create_app()

# O uvicorn chamará esta instância 'app'
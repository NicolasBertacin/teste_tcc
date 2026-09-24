"""Ponto de entrada principal da API REST do TrendCommerce AI (FastAPI)."""

import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from src.api.routers import auth_router, products_router, forecast_router, trends_router, opportunity_router
from src.api.dependencies import get_db_instance, get_password_hash
from src.database.models import Base, User



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia inicialização e encerramento da aplicação."""
    db_manager = get_db_instance()
    Base.metadata.create_all(db_manager.engine)

    # Garantir usuário administrador padrão
    with db_manager.session() as session:
        admin_user = session.query(User).filter(User.email == "admin@trendecommerce.com").first()
        if not admin_user:
            admin_user = User(
                email="admin@trendecommerce.com",
                hashed_password=get_password_hash("admin123"),
                name="Administrador Master",
                is_active=True
            )
            session.add(admin_user)
            print("[TrendCommerce AI] Usuário administrador padrão (admin@trendecommerce.com) criado com sucesso.")
    yield


# Criação da aplicação FastAPI
app = FastAPI(
    title="TrendCommerce AI - API REST",
    description="API de Integração Fullstack para Previsão de Demanda, Tendências de E-commerce e Autenticação com Inteligência Artificial (XGBoost).",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# ==========================================
# Configuração de CORS
# ==========================================
origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# Inclusão dos Routers REST
# ==========================================
API_PREFIX = "/api/v1"
app.include_router(auth_router, prefix=API_PREFIX)
app.include_router(products_router, prefix=API_PREFIX)
app.include_router(forecast_router, prefix=API_PREFIX)
app.include_router(trends_router, prefix=API_PREFIX)
app.include_router(opportunity_router, prefix=API_PREFIX)


# ==========================================
# Servir Frontend Estático
# ==========================================
frontend_dir = Path(__file__).parent.parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/app", StaticFiles(directory=str(frontend_dir), html=True), name="frontend")


@app.get("/", tags=["Health & Status"], summary="Status e Redirecionamento da API")
def root():
    """Redireciona para o frontend ou retorna status da API."""
    if frontend_dir.exists():
        return RedirectResponse(url="/app/index.html")
    return {
        "system": "TrendCommerce AI API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/api/v1/health", tags=["Health & Status"], summary="Health check da API")
def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "model": "xgboost-demand-regressor"
    }

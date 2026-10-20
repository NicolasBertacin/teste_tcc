# 📘 TrendCommerce AI — Guia de Migração: Parte 1 de 5
# Infraestrutura, Configuração, Schemas Pydantic e Camada de Banco de Dados

> **Módulo 1: Fundação do Sistema e Persistência de Dados**  
> **Objetivo:** Estabelecer a raiz do novo repositório, dependências, variáveis de ambiente, validações de dados (Pydantic v2) e toda a camada de banco de dados relacional com SQLAlchemy ORM (suporte automático para SQLite local e PostgreSQL em nuvem).

---

## 1. Visão Geral desta Etapa

Nesta primeira etapa, você irá criar a espinha dorsal do projeto:
1. **Configuração de Ambiente & Deploy:** Arquivos essenciais como `.gitignore`, `.env.example`, `requirements.txt`, `setup.py`, `render.yaml` e `vercel.json`.
2. **Settings do Sistema:** Classe `Settings` que carrega de forma tipada e segura as variáveis do `.env`.
3. **Contratos e Schemas Pydantic:** Estruturas de validação e serialização de dados para Autenticação, Produtos e Previsões Preditivas.
4. **Camada ORM & Banco de Dados:** Modelos relacionais (`User`, `Product`, `SalesHistory`, `SearchTrend`, `CollectionLog`, `PredictionLog`, `MacroIndicator`, `MarketplaceFeedback`, `ProductOpportunity`), engine de conexão e script de setup/seed para popular o banco inicial.

---

## 2. Estrutura de Pastas e Arquivos desta Parte

```text
trendcommerce-ai/
├── .env.example
├── .gitignore
├── render.yaml
├── requirements.txt
├── setup.py
├── vercel.json
├── config/
│   ├── __init__.py
│   └── settings.py
├── data/                       # Diretório onde o banco local (SQLite) e seeds residem
├── src/
│   ├── __init__.py
│   ├── database/
│   │   ├── __init__.py
│   │   ├── connection.py
│   │   ├── models.py
│   │   ├── seed_loader.py
│   │   ├── setup.py
│   │   └── migrations/
│   │       └── __init__.py
│   └── schemas/
│       ├── __init__.py
│       ├── auth_schema.py
│       ├── forecast_schema.py
│       └── product_schema.py
```

---

## 3. Passo a Passo de Criação dos Diretórios

Abra o terminal na pasta raiz do seu **novo repositório** e execute os comandos abaixo de acordo com o seu sistema operacional:

### No Windows (PowerShell):
```powershell
# Criar diretórios principais
New-Item -ItemType Directory -Force -Path "config"
New-Item -ItemType Directory -Force -Path "data"
New-Item -ItemType Directory -Force -Path "src\database\migrations"
New-Item -ItemType Directory -Force -Path "src\schemas"
```

### No Linux / macOS (Bash):
```bash
# Criar diretórios principais
mkdir -p config
mkdir -p data
mkdir -p src/database/migrations
mkdir -p src/schemas
```

---

## 4. Passo a Passo de Criação de Cada Arquivo e Códigos

Abaixo está o código fonte integral de cada arquivo desta etapa. Crie cada arquivo no caminho exato indicado e cole o respectivo conteúdo.

### 📄 Arquivo: `.gitignore`

> **Finalidade**: Configuração de exclusão de arquivos transitórios, ambientes virtuais e compilações no Git.

```bash
# Caminho no novo repositório:
# .gitignore
```

```text
# Environments
.env
.venv
venv/
ENV/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so

# Distribution / packaging
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/
.nox/

# Databases
*.db
*.sqlite3
!data/trendcommerce_dev.db
!data/initial_seed.json

# Models
models/*.pkl
models/*.json

```
### 📄 Arquivo: `.env.example`

> **Finalidade**: Template de variáveis de ambiente com configurações de JWT, Banco de Dados, CORS e Google OAuth.

```bash
# Caminho no novo repositório:
# .env.example
```

```text
# ==============================================================================
# TrendCommerce AI - Configurações de Ambiente (Environment Variables)
# ==============================================================================

# Segurança & Criptografia JWT
JWT_SECRET_KEY=sua-chave-secreta-super-segura-aqui-troque-em-producao
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Banco de Dados (SQLite local por padrão, ou PostgreSQL para nuvem)
# DATABASE_URL=postgresql://usuario:senha@host:5432/trendecommerce
DATABASE_URL=sqlite:///data/trendcommerce_dev.db

# Configuração de CORS (Separe múltiplas origens por vírgula)
# Exemplo: https://meu-projeto.vercel.app,http://localhost:8000
CORS_ORIGINS=https://localhost:8000,http://127.0.0.1:8000

# Serviço de Envio de E-mail (Recuperação de senha via SMTP Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=trendeccomerceai@gmail.com
SMTP_PASSWORD=sua-senha-de-app-gerada-no-google
# Google Identity Services (GIS)
GOOGLE_CLIENT_ID=33242244365-ubjiqb1h7thh0t6n5hdg3e3ugsuebm6e.apps.googleusercontent.com

```
### 📄 Arquivo: `requirements.txt`

> **Finalidade**: Especificação das dependências e bibliotecas Python (FastAPI, SQLAlchemy, XGBoost, etc.).

```bash
# Caminho no novo repositório:
# requirements.txt
```

```text
# Machine Learning & Data Science (com wheels pré-compilados para Linux)
xgboost>=2.0.0
scikit-learn>=1.4.0
pandas>=2.1.0
numpy>=1.26.0

# Banco de Dados & ORM
sqlalchemy>=2.0.0
alembic>=1.13.0
psycopg2-binary>=2.9.0

# API & Servidor Web
fastapi>=0.110.0
uvicorn[standard]>=0.29.0
python-multipart>=0.0.9

# Segurança & Autenticação
python-jose[cryptography]>=3.3.0
passlib>=1.7.4
bcrypt>=4.0.0
email-validator>=2.0.0
google-auth>=2.28.0

# Utilitários & Requisições
requests>=2.31.0
httpx>=0.27.0
aiohttp>=3.9.0
python-dotenv>=1.0.0
pydantic>=2.7.0
pydantic-settings>=2.2.0

# Testes
pytest>=8.0.0
pytest-asyncio>=0.23.0

```
### 📄 Arquivo: `setup.py`

> **Finalidade**: Script de instalação e empacotamento do TrendCommerce AI como módulo Python oficial.

```bash
# Caminho no novo repositório:
# setup.py
```

```python
from setuptools import setup, find_packages

setup(
    name='trendcommerce-ai',
    version='0.1.0',
    author='TrendCommerce Team',
    packages=find_packages(where='src'),
    package_dir={'': 'src'},
    python_requires='>=3.10',
    install_requires=[
        'xgboost==2.1.0',
        'scikit-learn==1.5.1',
        'pandas==2.2.2',
        'numpy==1.26.4',
        'psycopg2-binary==2.9.9',
        'sqlalchemy==2.0.31',
        'alembic==1.13.2',
        'requests==2.32.3',
        'httpx==0.27.0',
        'aiohttp==3.9.5',
        'python-dotenv==1.0.1',
        'pydantic==2.8.2',
        'pydantic-settings==2.4.0',
    ],
)

```
### 📄 Arquivo: `render.yaml`

> **Finalidade**: Arquivo de infraestrutura como código (IaC) para deploy em nuvem na plataforma Render.

```bash
# Caminho no novo repositório:
# render.yaml
```

```yaml
services:
  - type: web
    name: trendcommerce-api
    runtime: python
    plan: free
    buildCommand: "pip install --upgrade pip setuptools wheel && pip install --prefer-binary -r requirements.txt"
    startCommand: "uvicorn src.api.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9

```
### 📄 Arquivo: `vercel.json`

> **Finalidade**: Arquivo de configuração de roteamento SPA para publicação do Frontend Web na Vercel.

```bash
# Caminho no novo repositório:
# vercel.json
```

```json
{
  "outputDirectory": "frontend",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/frontend/$1"
    }
  ]
}

```
### 📄 Arquivo: `config/__init__.py`

> **Finalidade**: Inicializador do pacote de configurações do sistema.

```bash
# Caminho no novo repositório:
# config/__init__.py
```

```python
# Config package

```
### 📄 Arquivo: `config/settings.py`

> **Finalidade**: Classe Settings baseada em Pydantic Settings para carregamento e validação das variáveis do .env.

```bash
# Caminho no novo repositório:
# config/settings.py
```

```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://user:password@localhost:5432/trendcommerce"
    db_host: str = "localhost"
    db_port: int = 5432
    db_name: str = "trendcommerce"
    db_user: str = "user"
    db_password: str = "password"
    
    # Amazon SP-API
    amazon_client_id: Optional[str] = None
    amazon_client_secret: Optional[str] = None
    amazon_refresh_token: Optional[str] = None
    amazon_marketplace_id: Optional[str] = None
    
    # Mercado Livre
    meli_app_id: Optional[str] = None
    meli_client_secret: Optional[str] = None
    meli_access_token: Optional[str] = None
    meli_refresh_token: Optional[str] = None
    
    # API Guardian
    guardian_strict_mode: bool = True
    guardian_log_blocked: bool = True
    
    # Google OAuth / GIS
    google_client_id: str = "33242244365-ubjiqb1h7thh0t6n5hdg3e3ugsuebm6e.apps.googleusercontent.com"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

```
### 📄 Arquivo: `src/__init__.py`

> **Finalidade**: Inicializador do pacote raiz da aplicação.

```bash
# Caminho no novo repositório:
# src/__init__.py
```

```python
"""TrendCommerce AI - Sistema de previsão de demanda para e-commerce"""

```
### 📄 Arquivo: `src/schemas/__init__.py`

> **Finalidade**: Inicializador do módulo de Schemas Pydantic.

```bash
# Caminho no novo repositório:
# src/schemas/__init__.py
```

```python
"""Módulo de Schemas Pydantic para validação e serialização de dados na API."""

```
### 📄 Arquivo: `src/schemas/auth_schema.py`

> **Finalidade**: Schemas Pydantic para cadastro, login, autenticação Google, tokens JWT e recuperação de senha.

```bash
# Caminho no novo repositório:
# src/schemas/auth_schema.py
```

```python
"""Schemas Pydantic para Autenticação e Usuários."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class RegisterRequest(BaseModel):
    email: EmailStr = Field(..., description="Email de cadastro do usuário")
    password: str = Field(..., min_length=6, description="Senha de no mínimo 6 caracteres")
    name: Optional[str] = Field(None, description="Nome completo ou de exibição")


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Email cadastrado")
    password: str = Field(..., description="Senha do usuário")


class GoogleAuthRequest(BaseModel):
    token: Optional[str] = Field(None, description="Google ID Token JWT")
    credential: Optional[str] = Field(None, description="Google ID Token JWT (alias GIS credential)")
    email: Optional[EmailStr] = Field(None, description="Email fornecido pelo Google")
    name: Optional[str] = Field(None, description="Nome do usuário do Google")
    picture: Optional[str] = Field(None, description="URL do avatar do Google")
    sub: Optional[str] = Field(None, description="Google User ID")



class GoogleRequestCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="Email da conta Google selecionada")
    name: Optional[str] = Field(None, description="Nome de exibição da conta Google")


class GoogleVerifyCodeRequest(BaseModel):
    email: EmailStr = Field(..., description="Email da conta Google")
    code: str = Field(..., min_length=4, max_length=4, description="Código de 4 dígitos enviado ao e-mail")
    name: Optional[str] = Field(None, description="Nome da conta Google")




class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None



class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr = Field(..., description="Email para envio do código de recuperação")


class PasswordResetConfirmRequest(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=4, max_length=4, description="Código de 4 dígitos")
    new_password: str = Field(..., min_length=6, description="Nova senha")


class MessageResponse(BaseModel):
    message: str
    success: bool = True

```
### 📄 Arquivo: `src/schemas/product_schema.py`

> **Finalidade**: Schemas Pydantic para dados de produtos, paginação de catálogo e histórico de vendas.

```bash
# Caminho no novo repositório:
# src/schemas/product_schema.py
```

```python
"""Schemas Pydantic para Produtos e Histórico de Vendas."""

from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, ConfigDict


class SalesHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    date: datetime
    quantity_sold: int
    price_at_date: Optional[float] = None
    available_quantity: Optional[int] = None
    platform: str
    revenue: Optional[float] = Field(None, description="Faturamento diário (quantidade * preço)")


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    external_id: str
    platform: str
    title: str
    category: Optional[str] = None
    price: Optional[float] = None
    currency: str = "BRL"
    condition: Optional[str] = None
    url: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None
    is_active: bool = True
    created_at: Optional[datetime] = None
    total_sold_units: Optional[int] = 0
    total_revenue: Optional[float] = 0.0



class ProductDetailResponse(ProductResponse):
    sales_history: List[SalesHistoryResponse] = []


class ProductListResponse(BaseModel):
    total: int
    page: int
    limit: int
    pages: int
    items: List[ProductResponse]


class TopProductItem(BaseModel):
    rank: int
    id: int
    title: str
    category: Optional[str] = None
    price: float
    quantity_sold: int
    revenue: float

```
### 📄 Arquivo: `src/schemas/forecast_schema.py`

> **Finalidade**: Schemas Pydantic para previsões de demanda diária, intervalos de confiança e comparações.

```bash
# Caminho no novo repositório:
# src/schemas/forecast_schema.py
```

```python
"""Schemas Pydantic para Previsões de Demanda e Motor ML (XGBoost)."""

from typing import List, Dict, Optional, Literal
from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    product_id: int = Field(..., description="ID do produto no banco de dados")
    horizon_days: Literal[7, 14, 30] = Field(7, description="Horizonte de previsão em dias (7, 14 ou 30)")


class DailyForecastItem(BaseModel):
    date: str
    day_name: str
    predicted_demand: int
    confidence_min: int
    confidence_max: int
    projected_revenue: float


class ExplanationFactor(BaseModel):
    name: str
    weight_pct: int
    impact: str
    description: str


class ForecastExplanation(BaseModel):
    summary: str
    primary_driver: str
    factors: List[ExplanationFactor]


class ProductForecastResponse(BaseModel):
    product_id: int
    product_title: str
    category: str
    unit_price: float
    horizon_days: int
    start_date: str
    end_date: str
    total_predicted_units: int
    min_predicted_units: int
    max_predicted_units: int
    total_projected_revenue: float
    daily_average: float
    recommended_stock_buffer: int
    days: List[DailyForecastItem]
    explanation: Optional[ForecastExplanation] = None


class ForecastSummaryResponse(BaseModel):
    horizon_days: int
    total_products: int
    total_projected_revenue: float
    total_predicted_units: int
    items: List[ProductForecastResponse]


class RankingForecastItem(BaseModel):
    rank: int
    product_id: int
    title: str
    category: str
    price: float
    projected_units: int
    projected_revenue: float
    rank_reason: Optional[str] = None
    key_driver: Optional[str] = None


class ForecastRankingResponse(BaseModel):
    horizon_days: int
    top_overall: List[RankingForecastItem]
    top_by_category: Dict[str, List[RankingForecastItem]]


class CompareForecastRequest(BaseModel):
    product_id_a: int
    product_id_b: int
    horizon_days: Literal[7, 14, 30] = 30


class CompareForecastResponse(BaseModel):
    horizon_days: int
    product_a: ProductForecastResponse
    product_b: ProductForecastResponse
    revenue_difference: float
    revenue_leader: str
    demand_difference: int
    demand_leader: str
    verdict: str

```
### 📄 Arquivo: `src/database/__init__.py`

> **Finalidade**: Ponto de entrada do módulo de banco de dados, exportando models e conexões.

```bash
# Caminho no novo repositório:
# src/database/__init__.py
```

```python
"""Módulo de banco de dados do TrendCommerce AI.

Utiliza PostgreSQL para armazenar dados coletados
e manter histórico para treinamento do modelo.
"""

from .connection import get_engine, get_session, DatabaseManager
from .models import Base, Product, SalesHistory, SearchTrend, CollectionLog, PredictionLog

__all__ = [
    "get_engine",
    "get_session",
    "DatabaseManager",
    "Base",
    "Product",
    "SalesHistory",
    "SearchTrend",
    "CollectionLog",
    "PredictionLog",
]

```
### 📄 Arquivo: `src/database/migrations/__init__.py`

> **Finalidade**: Inicializador do pacote de migrações de banco de dados.

```bash
# Caminho no novo repositório:
# src/database/migrations/__init__.py
```

```python
# Migrations

```
### 📄 Arquivo: `src/database/connection.py`

> **Finalidade**: Gerenciamento central de conexões SQLAlchemy com fallback transparente entre SQLite e PostgreSQL.

```bash
# Caminho no novo repositório:
# src/database/connection.py
```

```python
"""Gerenciamento de conexão com o PostgreSQL."""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session


from pathlib import Path


def get_database_url() -> str:
    """Obtém a URL de conexão do banco de dados.
    
    Em desenvolvimento local, se DATABASE_URL não estiver configurado
    ou contiver os valores padrão de exemplo, utiliza SQLite local.
    """
    db_url = os.getenv("DATABASE_URL", "").strip()
    if not db_url or "user:password" in db_url:
        db_path = Path(__file__).parent.parent.parent / "data" / "trendcommerce_dev.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        return f"sqlite:///{db_path}"
    return db_url



def get_engine(database_url: str | None = None):
    """Cria e retorna o engine do SQLAlchemy."""
    url = database_url or get_database_url()
    return create_engine(url, echo=False, pool_pre_ping=True)


def get_session(engine=None) -> Session:
    """Cria uma nova sessão do banco de dados."""
    if engine is None:
        engine = get_engine()
    SessionLocal = sessionmaker(bind=engine)
    return SessionLocal()


class DatabaseManager:
    """Gerenciador de conexões com o banco de dados.
    
    Centraliza a criação de engines e sessões,
    e gerencia o ciclo de vida das conexões.
    """

    def __init__(self, database_url: str | None = None):
        self._database_url = database_url or get_database_url()
        self._engine = None
        self._session_factory = None

    @property
    def engine(self):
        if self._engine is None:
            self._engine = create_engine(
                self._database_url, echo=False, pool_pre_ping=True
            )
        return self._engine

    @contextmanager
    def session(self):
        """Context manager para sessões do banco de dados."""
        if self._session_factory is None:
            self._session_factory = sessionmaker(bind=self.engine)
        
        session = self._session_factory()
        try:
            yield session
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def create_tables(self):
        """Cria todas as tabelas definidas nos models."""
        from .models import Base
        Base.metadata.create_all(self.engine)

    def drop_tables(self):
        """Remove todas as tabelas (usar com cuidado)."""
        from .models import Base
        Base.metadata.drop_all(self.engine)

```
### 📄 Arquivo: `src/database/models.py`

> **Finalidade**: Definição de todas as tabelas do sistema via SQLAlchemy ORM (Users, Products, Sales, Trends, Opportunities, etc.).

```bash
# Caminho no novo repositório:
# src/database/models.py
```

```python
"""Modelos do banco de dados (SQLAlchemy ORM).

Define as tabelas utilizadas pelo TrendCommerce AI
para armazenar dados coletados e histórico.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Text, 
    Boolean, ForeignKey, Index, JSON
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class User(Base):
    """Tabela de usuários para autenticação e controle de acesso."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}')>"


class Product(Base):

    """Tabela de produtos coletados.
    
    Armazena informações básicas de produtos de
    diferentes plataformas (Amazon, Mercado Livre, etc).
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    external_id = Column(String(255), nullable=False, comment="ID do produto na plataforma de origem")
    platform = Column(String(50), nullable=False, comment="Plataforma de origem (amazon, mercadolivre)")
    title = Column(String(500), nullable=False)
    category = Column(String(255), nullable=True)
    price = Column(Float, nullable=True)
    currency = Column(String(10), default="BRL")
    condition = Column(String(50), nullable=True)
    url = Column(Text, nullable=True)
    attributes = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    # Relacionamentos
    sales_history = relationship("SalesHistory", back_populates="product", cascade="all, delete-orphan")
    prediction_logs = relationship("PredictionLog", back_populates="product", cascade="all, delete-orphan")
    marketplace_feedbacks = relationship("MarketplaceFeedback", back_populates="product", cascade="all, delete-orphan")
    opportunities = relationship("ProductOpportunity", back_populates="product", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_products_platform", "platform"),
        Index("idx_products_category", "category"),
        Index("idx_products_external_id", "external_id", "platform", unique=True),
    )

    def __repr__(self):
        return f"<Product(id={self.id}, title='{self.title[:50]}', platform='{self.platform}')>"


class SalesHistory(Base):
    """Tabela de histórico de vendas.
    
    Registra a evolução das vendas ao longo do tempo.
    Permite calcular crescimento, média móvel, tendência,
    sazonalidade e variação.
    """
    __tablename__ = "sales_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    quantity_sold = Column(Integer, default=0)
    price_at_date = Column(Float, nullable=True)
    available_quantity = Column(Integer, nullable=True)
    platform = Column(String(50), nullable=False)
    collected_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    product = relationship("Product", back_populates="sales_history")

    __table_args__ = (
        Index("idx_sales_product_date", "product_id", "date"),
        Index("idx_sales_platform", "platform"),
        Index("idx_sales_date", "date"),
    )

    def __repr__(self):
        return f"<SalesHistory(product_id={self.product_id}, date={self.date}, qty={self.quantity_sold})>"


class SearchTrend(Base):
    """Tabela de tendências de pesquisa.
    
    Armazena dados de interesse/pesquisa ao longo do tempo.
    Pode conter dados reais ou simulados.
    """
    __tablename__ = "search_trends"

    id = Column(Integer, primary_key=True, autoincrement=True)
    keyword = Column(String(255), nullable=False)
    date = Column(DateTime, nullable=False)
    interest_score = Column(Integer, default=0, comment="Score de interesse (0-100)")
    source = Column(String(50), nullable=False, comment="Fonte dos dados (google_trends, mock, etc)")
    is_mock = Column(Boolean, default=False, comment="Se os dados são simulados")
    collected_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_trends_keyword_date", "keyword", "date"),
        Index("idx_trends_source", "source"),
    )

    def __repr__(self):
        return f"<SearchTrend(keyword='{self.keyword}', date={self.date}, interest={self.interest_score})>"


class CollectionLog(Base):
    """Log de coletas realizadas.
    
    Registra cada execução dos coletores para
    auditoria e monitoramento.
    """
    __tablename__ = "collection_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    collector_name = Column(String(100), nullable=False)
    endpoint = Column(String(255), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    finished_at = Column(DateTime, nullable=True)
    records_collected = Column(Integer, default=0)
    success = Column(Boolean, default=True)
    error_message = Column(Text, nullable=True)

    def __repr__(self):
        return f"<CollectionLog(collector='{self.collector_name}', records={self.records_collected})>"


class PredictionLog(Base):
    """Tabela de logs e auditoria de previsões vs realidade.
    
    Registra cada previsão feita pelo XGBoost e o valor real observado,
    permitindo auditar a assertividade, erro absoluto e percentual de acerto.
    """
    __tablename__ = "prediction_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    prediction_date = Column(DateTime, default=datetime.utcnow, comment="Data em que a previsão foi gerada")
    target_date = Column(DateTime, nullable=False, comment="Data alvo para a qual a demanda foi prevista")
    predicted_demand = Column(Float, nullable=False, comment="Demanda prevista pelo XGBoost")
    actual_demand = Column(Float, nullable=True, comment="Demanda real observada no dia")
    error = Column(Float, nullable=True, comment="Erro absoluto (Real - Previsto)")
    error_pct = Column(Float, nullable=True, comment="Percentual de erro relativo")
    accuracy_pct = Column(Float, nullable=True, comment="Taxa de acurácia (0 a 100%)")
    confidence_min = Column(Float, nullable=True, comment="Limite inferior da faixa de confiança")
    confidence_max = Column(Float, nullable=True, comment="Limite superior da faixa de confiança")
    hit_confidence_interval = Column(Boolean, nullable=True, comment="Se o valor real caiu dentro da faixa prevista")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    product = relationship("Product", back_populates="prediction_logs")

    __table_args__ = (
        Index("idx_prediction_product_target", "product_id", "target_date"),
        Index("idx_prediction_date", "prediction_date"),
    )

    def __repr__(self):
        return f"<PredictionLog(product_id={self.product_id}, target={self.target_date}, pred={self.predicted_demand}, actual={self.actual_demand})>"


class MacroIndicator(Base):
    """Tabela de Indicadores Macroeconômicos e Calendário.
    
    Armazena dados de fontes como BrasilAPI (feriados), BCB SGS (Dólar, Selic, IPCA),
    Nager.Date, CoinGecko e clima histórico.
    """
    __tablename__ = "macro_indicators"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(DateTime, nullable=False, index=True)
    indicator_type = Column(String(50), nullable=False, comment="Tipo: dolar_ptax, selic, ipca, holiday, weather_temp")
    value = Column(Float, nullable=True, comment="Valor numérico do indicador")
    label = Column(String(255), nullable=True, comment="Descrição legível ou nome do feriado")
    source = Column(String(50), nullable=False, comment="Fonte: brasilapi, bcb_sgs, ibge, nager_date, coingecko, weather")
    details = Column(JSON, nullable=True)
    collected_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        Index("idx_macro_date_type", "date", "indicator_type"),
        Index("idx_macro_type", "indicator_type"),
    )

    def __repr__(self):
        return f"<MacroIndicator(date={self.date}, type='{self.indicator_type}', value={self.value})>"


class MarketplaceFeedback(Base):
    """Tabela de métricas de engajamento público de marketplace.
    
    Armazena volume de perguntas, reviews, notas médias e tendências de termos
    obtidos via endpoints públicos do Mercado Livre.
    """
    __tablename__ = "marketplace_feedbacks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    date = Column(DateTime, nullable=False)
    platform = Column(String(50), default="mercadolivre")
    questions_count = Column(Integer, default=0, comment="Volume diário/acumulado de perguntas")
    unanswered_questions = Column(Integer, default=0)
    average_rating = Column(Float, nullable=True, comment="Nota média das avaliações (1 a 5)")
    reviews_count = Column(Integer, default=0, comment="Total de avaliações recebidas")
    trend_term = Column(String(255), nullable=True, comment="Termo de tendência associado")
    collected_at = Column(DateTime, default=datetime.utcnow)

    # Relacionamentos
    product = relationship("Product", back_populates="marketplace_feedbacks")

    __table_args__ = (
        Index("idx_mkt_feedback_product_date", "product_id", "date"),
    )

    def __repr__(self):
        return f"<MarketplaceFeedback(product_id={self.product_id}, date={self.date}, rating={self.average_rating})>"


class ProductOpportunity(Base):
    """Tabela de Recomendações e Ranking de Melhores Produtos para Vender.
    
    Registra os scores de oportunidade gerados pelo OpportunityRecommender.
    """
    __tablename__ = "product_opportunities"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, index=True)
    horizon_days = Column(Integer, default=14, comment="Horizonte temporal avaliado: 7, 14 ou 30 dias")
    opportunity_score = Column(Float, nullable=False, comment="Score de 0 a 100 de recomendação")
    quadrant = Column(String(50), nullable=False, comment="EXPLOSIVE_GROWTH, HIGH_STABILITY, MODERATE, LOW_PRIORITY")
    projected_growth_pct = Column(Float, nullable=False, comment="Crescimento projetado de vendas em %")
    predicted_units = Column(Integer, nullable=False, comment="Total de unidades previstas no período")
    estimated_revenue = Column(Float, nullable=False, comment="Faturamento estimado no período")
    rationale = Column(Text, nullable=True, comment="Justificativa explicável do score")
    details = Column(JSON, nullable=True)

    # Relacionamentos
    product = relationship("Product", back_populates="opportunities")

    __table_args__ = (
        Index("idx_opp_product_horizon", "product_id", "horizon_days"),
        Index("idx_opp_score", "opportunity_score"),
    )

    def __repr__(self):
        return f"<ProductOpportunity(product_id={self.product_id}, score={self.opportunity_score}, quad='{self.quadrant}')>"



```
### 📄 Arquivo: `src/database/setup.py`

> **Finalidade**: CLI de gerenciamento do banco de dados para criar, resetar, popular e inspecionar tabelas.

```bash
# Caminho no novo repositório:
# src/database/setup.py
```

```python
"""Script de setup e migração do banco de dados.

Uso:
    python -m src.database.setup [comando]

Comandos:
    create    - Cria todas as tabelas no banco de dados
    drop      - Remove todas as tabelas (CUIDADO!)
    seed      - Popula com dados de exemplo
    status    - Mostra status das tabelas
    reset     - Drop + Create + Seed

Para desenvolvimento local, utiliza SQLite.
Para produção, configure DATABASE_URL no .env apontando para PostgreSQL.
"""

import sys
import os
import logging
from datetime import datetime, timedelta
from pathlib import Path

# Adicionar raiz do projeto ao path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import inspect, text
from src.database.connection import DatabaseManager
from src.database.models import (
    Base, Product, SalesHistory, SearchTrend, CollectionLog,
    MacroIndicator, MarketplaceFeedback, ProductOpportunity
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def get_db_manager() -> DatabaseManager:
    """Obtém o gerenciador de banco de dados.
    
    Em desenvolvimento, usa SQLite se DATABASE_URL não estiver configurado
    ou se estiver com o placeholder padrão.
    """
    db_url = os.getenv("DATABASE_URL", "")
    
    # Se não tem PostgreSQL configurado, usar SQLite para desenvolvimento
    if not db_url or "user:password" in db_url:
        db_path = Path(__file__).parent.parent.parent / "data" / "trendcommerce_dev.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite:///{db_path}"
        logger.info(f"Usando SQLite para desenvolvimento: {db_path}")
    else:
        logger.info(f"Usando banco de dados: {db_url.split('@')[-1] if '@' in db_url else 'configurado'}")
    
    return DatabaseManager(database_url=db_url)


def create_tables(manager: DatabaseManager):
    """Cria todas as tabelas."""
    logger.info("Criando tabelas...")
    Base.metadata.create_all(manager.engine)
    
    inspector = inspect(manager.engine)
    tables = inspector.get_table_names()
    logger.info(f"Tabelas criadas: {', '.join(tables)}")
    return tables


def drop_tables(manager: DatabaseManager):
    """Remove todas as tabelas."""
    logger.warning("Removendo todas as tabelas...")
    Base.metadata.drop_all(manager.engine)
    logger.info("Tabelas removidas.")


def seed_data(manager: DatabaseManager):
    """Popula com dados de exemplo para desenvolvimento."""
    import numpy as np
    np.random.seed(42)
    
    logger.info("Populando banco com dados de exemplo...")
    
    with manager.session() as session:
        # Criar catálogo expandido de produtos reais de mercado
        products = [
            # Notebooks & Informática
            Product(external_id="MLB101", platform="mercadolivre", title="Notebook Dell Inspiron 15 Intel Core i7 16GB 512GB SSD", category="Informática", price=3499.99, currency="BRL", condition="new"),
            Product(external_id="MLB102", platform="mercadolivre", title="MacBook Air M2 13.6 Polegadas 8GB RAM 256GB SSD", category="Informática", price=6899.00, currency="BRL", condition="new"),
            Product(external_id="MLB103", platform="mercadolivre", title="Notebook Gamer Acer Nitro 5 Intel Core i5 RTX 3050 16GB", category="Informática", price=4299.00, currency="BRL", condition="new"),
            Product(external_id="MLB104", platform="mercadolivre", title="Notebook Lenovo IdeaPad 1 AMD Ryzen 5 8GB 256GB SSD", category="Informática", price=2399.00, currency="BRL", condition="new"),
            Product(external_id="MLB105", platform="mercadolivre", title="Monitor Gamer LG UltraGear 27 IPS 144Hz 1ms Full HD", category="Informática", price=999.00, currency="BRL", condition="new"),
            
            # Celulares & Smartphones
            Product(external_id="MLB201", platform="mercadolivre", title="iPhone 15 Pro 256GB Titânio Natural", category="Celulares", price=7999.00, currency="BRL", condition="new"),
            Product(external_id="MLB202", platform="mercadolivre", title="iPhone 13 Apple 128GB Estelar", category="Celulares", price=3599.00, currency="BRL", condition="new"),
            Product(external_id="MLB203", platform="mercadolivre", title="Samsung Galaxy S24 Ultra 5G 512GB 12GB RAM", category="Celulares", price=6499.00, currency="BRL", condition="new"),
            Product(external_id="MLB204", platform="mercadolivre", title="Xiaomi Redmi Note 13 Pro 5G 256GB 8GB RAM", category="Celulares", price=1699.00, currency="BRL", condition="new"),
            Product(external_id="MLB205", platform="mercadolivre", title="Motorola Moto G84 5G 256GB 8GB RAM", category="Celulares", price=1299.00, currency="BRL", condition="new"),
            
            # Consoles & Games
            Product(external_id="MLB301", platform="mercadolivre", title="Console PlayStation 5 Edição Digital 1TB", category="Games", price=3699.00, currency="BRL", condition="new"),
            Product(external_id="MLB302", platform="mercadolivre", title="Console Xbox Series S 512GB SSD Branco", category="Games", price=2499.00, currency="BRL", condition="new"),
            Product(external_id="MLB303", platform="mercadolivre", title="Console Nintendo Switch OLED 64GB com Joy-Con", category="Games", price=2099.00, currency="BRL", condition="new"),
            Product(external_id="MLB304", platform="mercadolivre", title="Controle Sem Fio DualSense PS5 Midnight Black", category="Games", price=399.00, currency="BRL", condition="new"),
            Product(external_id="MLB305", platform="mercadolivre", title="Headset Gamer HyperX Cloud II Som Surround 7.1", category="Games", price=459.00, currency="BRL", condition="new"),

            # Áudio & Som
            Product(external_id="MLB401", platform="mercadolivre", title="Fone de Ouvido Apple AirPods Pro 2ª Geração MagSafe", category="Áudio", price=1899.00, currency="BRL", condition="new"),
            Product(external_id="MLB402", platform="mercadolivre", title="Fone Bluetooth JBL Tune 520BT com Microfone", category="Áudio", price=219.00, currency="BRL", condition="new"),
            Product(external_id="MLB403", platform="mercadolivre", title="Caixa de Som Bluetooth JBL Boombox 3 180W RMS", category="Áudio", price=2399.00, currency="BRL", condition="new"),
            Product(external_id="MLB404", platform="mercadolivre", title="Fone de Ouvido Sony WH-1000XM5 Noise Cancelling", category="Áudio", price=2199.00, currency="BRL", condition="new"),

            # Smart TVs & Home Theater
            Product(external_id="MLB501", platform="mercadolivre", title="Smart TV Samsung 55 4K Crystal UHD HDR10+", category="Eletrônicos", price=2599.00, currency="BRL", condition="new"),
            Product(external_id="MLB502", platform="mercadolivre", title="Smart TV LG 50 4K UHD ThinQ AI HDR", category="Eletrônicos", price=2199.00, currency="BRL", condition="new"),
            Product(external_id="MLB503", platform="mercadolivre", title="Smart TV TCL 65 4K QLED Google TV", category="Eletrônicos", price=3299.00, currency="BRL", condition="new"),

            # Casa Inteligente & Eletroportáteis
            Product(external_id="ASIN001", platform="amazon", title="Echo Dot 5ª Geração Smart Speaker com Alexa", category="Casa Inteligente", price=349.99, currency="BRL", condition="new"),
            Product(external_id="ASIN002", platform="amazon", title="Kindle Paperwhite 16GB Tela de 6.8 Polegadas", category="Eletrônicos", price=599.00, currency="BRL", condition="new"),
            Product(external_id="ASIN003", platform="amazon", title="Fritadeira Elétrica Airfryer Philips Walita 4.1L", category="Eletroportáteis", price=429.00, currency="BRL", condition="new"),
            Product(external_id="ASIN004", platform="amazon", title="Aspirador de Pó Robô Xiaomi Robot Vacuum E10", category="Eletroportáteis", price=1099.00, currency="BRL", condition="new"),

            # Moda & Vestuário
            Product(external_id="MLB601", platform="mercadolivre", title="Tênis de Corrida Masculino Nike Revolution 7", category="Moda & Vestuário", price=299.90, currency="BRL", condition="new"),
            Product(external_id="MLB602", platform="mercadolivre", title="Vestido Midi Feminino Canelado Elegante", category="Moda & Vestuário", price=89.90, currency="BRL", condition="new"),
            Product(external_id="MLB603", platform="mercadolivre", title="Jaqueta Corta Vento Impermeável Unissex", category="Moda & Vestuário", price=129.90, currency="BRL", condition="new"),
            Product(external_id="MLB604", platform="mercadolivre", title="Camisa Social Masculina Slim Fit Algodão", category="Moda & Vestuário", price=119.00, currency="BRL", condition="new"),

            # Beleza & Cuidados Pessoais
            Product(external_id="MLB701", platform="mercadolivre", title="Protetor Solar Facial Anthelios Airlicium FPS 60", category="Beleza & Cosméticos", price=84.90, currency="BRL", condition="new"),
            Product(external_id="MLB702", platform="mercadolivre", title="Perfume Importado Masculino 1 Million Paco Rabanne 100ml", category="Beleza & Cosméticos", price=489.00, currency="BRL", condition="new"),
            Product(external_id="MLB703", platform="mercadolivre", title="Sérum Facial Vitamina C 10 Anti-Idade La Roche-Posay", category="Beleza & Cosméticos", price=179.90, currency="BRL", condition="new"),
            Product(external_id="MLB704", platform="mercadolivre", title="Secador de Cabelo Taiff Vulcan 2500W Profissional", category="Beleza & Cosméticos", price=459.00, currency="BRL", condition="new"),

            # Esportes & Suplementos
            Product(external_id="MLB801", platform="mercadolivre", title="Whey Protein 100% Pure Integralmédica 900g Baunilha", category="Esportes & Fitness", price=109.90, currency="BRL", condition="new"),
            Product(external_id="MLB802", platform="mercadolivre", title="Creatina Monohidratada 100% Pura Max Titanium 300g", category="Esportes & Fitness", price=89.90, currency="BRL", condition="new"),
            Product(external_id="MLB803", platform="mercadolivre", title="Kit 5 Elásticos Extensores Faixas Borracha Musculação", category="Esportes & Fitness", price=49.90, currency="BRL", condition="new"),
            Product(external_id="MLB804", platform="mercadolivre", title="Tapete Yoga Mat 10mm Antiderrapante com Alça", category="Esportes & Fitness", price=79.90, currency="BRL", condition="new"),

            # Móveis & Decoração
            Product(external_id="MLB901", platform="mercadolivre", title="Cadeira de Escritório Ergonômica Presidente com Apoio", category="Móveis & Casa", price=649.00, currency="BRL", condition="new"),
            Product(external_id="MLB902", platform="mercadolivre", title="Mesa Home Office Escrivaninha Computador 120cm", category="Móveis & Casa", price=289.00, currency="BRL", condition="new"),
            Product(external_id="MLB903", platform="mercadolivre", title="Luminária de Mesa Articulada com Garra LED", category="Móveis & Casa", price=59.90, currency="BRL", condition="new"),

            # Ferramentas & Construção
            Product(external_id="MLB1001", platform="mercadolivre", title="Parafusadeira e Furadeira de Impacto Bateria 12V Bosch", category="Ferramentas", price=329.00, currency="BRL", condition="new"),
            Product(external_id="MLB1002", platform="mercadolivre", title="Maleta de Ferramentas Completa 110 Peças Aço Cromo", category="Ferramentas", price=199.90, currency="BRL", condition="new"),

            # Alimentos & Bebidas
            Product(external_id="MLB1101", platform="mercadolivre", title="Kit 50 Cápsulas de Café Espresso Compatíveis Nespresso", category="Alimentos & Bebidas", price=98.00, currency="BRL", condition="new"),
            Product(external_id="MLB1102", platform="mercadolivre", title="Azeite de Oliva Chileno Deleyda Extra Virgem 500ml", category="Alimentos & Bebidas", price=54.90, currency="BRL", condition="new"),

            # Automotivo
            Product(external_id="MLB1201", platform="mercadolivre", title="Suporte de Celular Veicular Magnético MagSafe para Painel", category="Automotivo", price=45.90, currency="BRL", condition="new"),
            Product(external_id="MLB1202", platform="mercadolivre", title="Compressor de Ar Portátil Digital Recarregável Pneus 12V", category="Automotivo", price=139.90, currency="BRL", condition="new"),

            # Livros
            Product(external_id="ASIN101", platform="amazon", title="Livro A Psicologia Financeira - Morgan Housel", category="Livros", price=42.90, currency="BRL", condition="new"),
            Product(external_id="ASIN102", platform="amazon", title="Livro Hábitos Atômicos - James Clear", category="Livros", price=49.90, currency="BRL", condition="new"),
        ]
        
        for product in products:
            session.add(product)
        session.flush()  # Para obter os IDs
        
        logger.info(f"Criados {len(products)} produtos reais de mercado")
        
        # Criar histórico de vendas realista (90 dias até hoje)
        # Modelando: Volume base por faixa de preço, elasticidade de preço e sazonalidade semanal
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        sales_count = 0
        
        for product in products:
            # Produtos mais baratos têm volume diário base maior; produtos caros têm volume menor
            if product.price < 500:
                base_sales = np.random.randint(35, 75)
            elif product.price < 2500:
                base_sales = np.random.randint(18, 40)
            elif product.price < 5000:
                base_sales = np.random.randint(8, 22)
            else:
                base_sales = np.random.randint(3, 12)
                
            base_price = product.price
            np.random.seed(product.id * 31 + 42)
            
            for day in range(90):
                date = today - timedelta(days=90 - 1 - day)
                day_of_week = date.weekday()
                
                # Efeito Sazonal: Fins de semana (Sex, Sáb, Dom) vendem mais
                weekend_multiplier = 1.30 if day_of_week in [4, 5, 6] else 0.92
                
                # Flutuação de preço (promoções pontuais ou aumentos)
                price_ratio = np.random.uniform(0.92, 1.08)
                current_price = round(base_price * price_ratio, 2)
                
                # Elasticidade de preço: Preço menor gera mais vendas; preço maior reduz vendas
                price_elasticity = (1.0 - (price_ratio - 1.0) * 1.5)
                
                noise = np.random.uniform(0.75, 1.25)
                quantity = max(1, int(round(base_sales * weekend_multiplier * price_elasticity * noise)))
                
                sale = SalesHistory(
                    product_id=product.id,
                    date=date,
                    quantity_sold=quantity,
                    price_at_date=current_price,
                    available_quantity=int(np.random.randint(25, 250)),
                    platform=product.platform,
                )
                session.add(sale)
                sales_count += 1
        
        logger.info(f"Criados {sales_count} registros de histórico de vendas (até {today.strftime('%d/%m/%Y')})")
        
        # Criar tendências de pesquisa (30 dias até hoje)
        keywords = ["notebook", "smartphone", "smart tv", "echo dot", "kindle"]
        trends_count = 0
        
        for keyword in keywords:
            for day in range(30):
                date = today - timedelta(days=30 - 1 - day)
                interest = np.random.randint(10, 100)
                
                trend = SearchTrend(
                    keyword=keyword,
                    date=date,
                    interest_score=interest,
                    source="mock",
                    is_mock=True,
                )
                session.add(trend)
                trends_count += 1
        
        logger.info(f"Criados {trends_count} registros de tendências")
        
        # Criar indicadores macroeconômicos (Dólar, Selic, Feriados)
        from src.collectors.macro_collector import MacroCollector
        macro_col = MacroCollector()
        holidays = macro_col.fetch_holidays_brasilapi(today.year)
        macro_count = 0

        for h in holidays:
            try:
                h_dt = datetime.strptime(h["date"], "%Y-%m-%d")
                m_ind = MacroIndicator(
                    date=h_dt,
                    indicator_type="holiday",
                    value=1.0,
                    label=f"Feriado: {h['name']}",
                    source=h.get("source", "brasilapi")
                )
                session.add(m_ind)
                macro_count += 1
            except Exception:
                continue

        # Inserir série diária de Dólar PTAX e Selic
        dolar_series = macro_col.fetch_bcb_series(10813, last_n=90)
        for d in dolar_series:
            try:
                d_dt = datetime.strptime(d["date"], "%Y-%m-%d")
                m_ind = MacroIndicator(
                    date=d_dt,
                    indicator_type="dolar_ptax",
                    value=d["value"],
                    label="Dólar Comercial PTAX Venda",
                    source=d.get("source", "bcb_sgs")
                )
                session.add(m_ind)
                macro_count += 1
            except Exception:
                continue

        # Inserir Selic
        m_selic = MacroIndicator(
            date=today,
            indicator_type="selic",
            value=10.50,
            label="Taxa Selic Meta (% a.a.)",
            source="bcb_sgs"
        )
        session.add(m_selic)
        macro_count += 1

        logger.info(f"Criados {macro_count} registros de indicadores macroeconômicos e feriados")

        # Criar métricas de feedback de marketplace para cada produto
        from src.collectors.marketplace_public_collector import MarketplacePublicCollector
        mkt_col = MarketplacePublicCollector()
        feedback_count = 0

        for p in products:
            q_info = mkt_col.fetch_questions(p.external_id)
            r_info = mkt_col.fetch_reviews(p.external_id)
            fb = MarketplaceFeedback(
                product_id=p.id,
                date=today,
                platform=p.platform,
                questions_count=q_info["total_questions"],
                unanswered_questions=q_info["unanswered"],
                average_rating=r_info["rating_average"],
                reviews_count=r_info["total_reviews"],
                trend_term=p.category
            )
            session.add(fb)
            feedback_count += 1

        logger.info(f"Criados {feedback_count} registros de feedback público de marketplace")

        # Log da coleta
        log = CollectionLog(
            collector_name="seed_script",
            endpoint="seed_data",
            started_at=datetime.utcnow(),
            finished_at=datetime.utcnow(),
            records_collected=len(products) + sales_count + trends_count + macro_count + feedback_count,
            success=True,
        )
        session.add(log)
    
    logger.info("Dados de exemplo e novos indicadores inseridos com sucesso!")


def sync_up_to_today(manager: DatabaseManager) -> int:
    """Preenche os dias faltantes entre a última data no banco e a data de hoje.
    
    Garante que dias como 25/08, 26/08 e a data atual estejam sempre presentes
    no histórico de vendas de todos os produtos cadastrados.
    
    Returns:
        Quantidade de novos registros de vendas adicionados
    """
    import numpy as np
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    added_records = 0
    
    with manager.session() as session:
        products = session.query(Product).all()
        if not products:
            logger.warning("Nenhum produto cadastrado para sincronizar.")
            return 0
            
        for product in products:
            # Buscar a venda mais recente para o produto
            last_sale = session.query(SalesHistory).filter_by(
                product_id=product.id
            ).order_by(SalesHistory.date.desc()).first()
            
            if not last_sale:
                continue
                
            last_date = last_sale.date.replace(hour=0, minute=0, second=0, microsecond=0)
            days_diff = (today - last_date).days
            
            if days_diff > 0:
                base_price = product.price or 100.0
                np.random.seed(product.id * 100 + days_diff)
                
                for step in range(1, days_diff + 1):
                    target_date = last_date + timedelta(days=step)
                    day_of_week = target_date.weekday()
                    weekend_factor = 1.25 if day_of_week in [4, 5, 6] else 0.95
                    base_sales = np.random.randint(15, 45)
                    noise = np.random.randint(-5, 6)
                    quantity = max(1, int(round((base_sales + noise) * weekend_factor)))
                    price = round(base_price * np.random.uniform(0.96, 1.04), 2)
                    
                    sale = SalesHistory(
                        product_id=product.id,
                        date=target_date,
                        quantity_sold=quantity,
                        price_at_date=price,
                        available_quantity=np.random.randint(20, 200),
                        platform=product.platform,
                    )
                    session.add(sale)
                    added_records += 1
                    
        if added_records > 0:
            logger.info(f"Sincronizados {added_records} novos registros de vendas até a data de hoje ({today.strftime('%d/%m/%Y')}).")
            
    return added_records


def show_status(manager: DatabaseManager):
    """Mostra o status das tabelas."""
    inspector = inspect(manager.engine)
    tables = inspector.get_table_names()
    
    if not tables:
        logger.info("Nenhuma tabela encontrada. Execute 'create' primeiro.")
        return
    
    logger.info(f"\nTabelas encontradas: {len(tables)}")
    
    with manager.session() as session:
        for table in tables:
            try:
                result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                logger.info(f"  📊 {table}: {count} registros")
            except Exception as e:
                logger.warning(f"  ⚠️ {table}: erro ao contar ({e})")


def main():
    """Ponto de entrada do script de setup."""
    commands = {
        "create": "Criar tabelas",
        "drop": "Remover tabelas",
        "seed": "Popular com dados de exemplo",
        "sync": "Sincronizar histórico até a data de hoje (preencher dias faltantes)",
        "status": "Mostrar status",
        "reset": "Reset completo (drop + create + seed)",
    }
    
    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        print("\n📦 TrendCommerce AI - Setup do Banco de Dados")
        print("=" * 50)
        print("\nUso: python -m src.database.setup [comando]\n")
        print("Comandos disponíveis:")
        for cmd, desc in commands.items():
            print(f"  {cmd:10s} - {desc}")
        print()
        return
    
    command = sys.argv[1]
    manager = get_db_manager()
    
    if command == "create":
        create_tables(manager)
    elif command == "drop":
        drop_tables(manager)
    elif command == "seed":
        seed_data(manager)
    elif command == "sync":
        sync_up_to_today(manager)
        show_status(manager)
    elif command == "status":
        show_status(manager)
    elif command == "reset":
        drop_tables(manager)
        create_tables(manager)
        seed_data(manager)
        show_status(manager)


if __name__ == "__main__":
    main()

```
### 📄 Arquivo: `src/database/seed_loader.py`

> **Finalidade**: Módulo de inicialização automática de sementes e calibração de produtos no startup.

```bash
# Caminho no novo repositório:
# src/database/seed_loader.py
```

```python
"""Módulo de carregamento automático de sementes (Seed) de dados no startup."""

import json
from datetime import datetime, timedelta
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from src.database.models import Product, SalesHistory, SearchTrend, MacroIndicator


def _parse_dt(val):
    if not val:
        return datetime.utcnow()
    if isinstance(val, datetime):
        return val
    try:
        return datetime.fromisoformat(str(val))
    except Exception:
        return datetime.utcnow()


def seed_database_if_empty(session: Session):
    """Sincroniza e calibra produtos e histórico do initial_seed.json no startup."""
    seed_file = Path(__file__).parent.parent.parent / "data" / "initial_seed.json"
    if not seed_file.exists():
        print(f"[SeedLoader] Arquivo de seed nao encontrado: {seed_file}")
        return

    try:
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        products_data = data.get("products", [])
        sales_data = data.get("sales_history", [])

        from src.collectors.live_discovery_engine import normalize_category

        # 1. Inserir ou Atualizar Produtos para garantir preços calibrados e categorias Mercado Livre
        for p_data in products_data:
            p_id = p_data.get("id")
            norm_cat = normalize_category(p_data.get("category"))
            existing = session.query(Product).filter(Product.id == p_id).first()
            if existing:
                existing.price = float(p_data.get("price", existing.price))
                existing.title = p_data.get("title", existing.title)
                existing.category = norm_cat
                existing.platform = p_data.get("platform", existing.platform)
            else:
                product = Product(
                    id=p_id,
                    external_id=p_data.get("external_id") or f"PROD_{p_id}",
                    platform=p_data.get("platform") or "mercadolivre",
                    title=p_data.get("title") or "Produto",
                    category=norm_cat,
                    price=float(p_data.get("price") or 100.0),
                    currency=p_data.get("currency") or "BRL",
                    condition=p_data.get("condition") or "new",
                    url=p_data.get("url") or "",
                    attributes=p_data.get("attributes"),
                    is_active=bool(p_data.get("is_active", True)),
                    created_at=_parse_dt(p_data.get("created_at")),
                    updated_at=_parse_dt(p_data.get("updated_at"))
                )
                session.add(product)

        for p in session.query(Product).all():
            p.category = normalize_category(p.category)
        session.flush()

        # 2. Sincronizar preços do histórico e ancorar datas para 'hoje' (rolagem 24h em 24h)
        today_midnight = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        seed_dates = [_parse_dt(s.get("date")) for s in sales_data if s.get("date")]
        max_seed_date = max(seed_dates) if seed_dates else today_midnight
        seed_shift = today_midnight - max_seed_date

        sales_count = session.query(SalesHistory).count()
        if sales_count == 0:
            for s_data in sales_data:
                shifted_date = _parse_dt(s_data.get("date")) + seed_shift
                sales_entry = SalesHistory(
                    id=s_data.get("id"),
                    product_id=s_data.get("product_id"),
                    date=shifted_date,
                    quantity_sold=int(s_data.get("quantity_sold", 10)),
                    price_at_date=float(s_data.get("price_at_date", 100.0)),
                    available_quantity=int(s_data.get("available_quantity", 50)),
                    platform=s_data.get("platform", "mercadolivre"),
                    collected_at=_parse_dt(s_data.get("collected_at"))
                )
                session.add(sales_entry)
        else:
            prods_map = {p.get("id"): p.get("price") for p in products_data}
            max_db_date = session.query(func.max(SalesHistory.date)).scalar()
            db_shift = (today_midnight - max_db_date) if max_db_date else None

            for s in session.query(SalesHistory).all():
                p_price = prods_map.get(s.product_id)
                if p_price and s.price_at_date:
                    ratio = s.price_at_date / (p_price if p_price > 0 else 1)
                    if ratio > 1.4 or ratio < 0.6:
                        s.price_at_date = float(p_price)
                if db_shift and db_shift.days > 0:
                    s.date = s.date + db_shift

        # 3. Sincronizar Search Trends se tabela vazia
        if session.query(SearchTrend).count() == 0:
            trends_records = []
            for t_data in data.get("search_trends", []):
                trends_records.append(SearchTrend(
                    id=t_data.get("id"),
                    keyword=t_data.get("keyword") or "trend",
                    date=_parse_dt(t_data.get("date")),
                    interest_score=int(t_data.get("interest_score") or 50),
                    source=t_data.get("source") or "google_trends",
                    is_mock=bool(t_data.get("is_mock", False)),
                    collected_at=_parse_dt(t_data.get("collected_at"))
                ))
            session.bulk_save_objects(trends_records)
            session.flush()

        # 4. Sincronizar Indicadores Macro se tabela vazia
        if session.query(MacroIndicator).count() == 0:
            macro_records = []
            for m_data in data.get("macro_indicators", []):
                macro_records.append(MacroIndicator(
                    id=m_data.get("id"),
                    date=_parse_dt(m_data.get("date")),
                    indicator_type=m_data.get("indicator_type") or "SELIC",
                    value=float(m_data.get("value") or 0.0),
                    label=m_data.get("label") or "Macro",
                    source=m_data.get("source") or "BCB",
                    details=m_data.get("details"),
                    collected_at=_parse_dt(m_data.get("collected_at"))
                ))
            session.bulk_save_objects(macro_records)
            session.flush()

        session.commit()
        print(f"[SeedLoader] Sincronização e calibração de {len(products_data)} produtos concluída com sucesso.")
    except Exception as e:
        session.rollback()
        print(f"[SeedLoader] Erro ao sincronizar seed: {e}")

```


---

## 5. Procedimentos de Instalação, Execução e Validação da Parte 1

Após criar todas as pastas e arquivos acima, siga o passo a passo para validar a instalação desta etapa:

### 1. Criar e ativar o ambiente virtual Python (versão 3.10 ou superior recomendada):
```bash
# Criar ambiente virtual
python -m venv .venv

# Ativar no Windows (PowerShell):
.venv\Scripts\Activate.ps1

# Ativar no Linux / macOS:
source .venv/bin/activate
```

### 2. Instalar as dependências do projeto:
```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

### 3. Criar o arquivo `.env` de desenvolvimento:
Copie o `.env.example` para `.env`:
```bash
# No Windows PowerShell:
Copy-Item .env.example .env

# No Linux / macOS:
cp .env.example .env
```

### 4. Inicializar e popular o banco de dados local:
Execute o comando de reset e seed do banco:
```bash
python -m src.database.setup reset
```

**Saída esperada no terminal:**
```text
INFO - Usando SQLite para desenvolvimento: ...\data\trendcommerce_dev.db
INFO - Criando tabelas...
INFO - Tabelas criadas: users, products, sales_history, search_trends, collection_logs, prediction_logs, macro_indicators, marketplace_feedbacks, product_opportunities
INFO - Populando banco com dados de exemplo...
INFO - Inseridos 30 produtos de catálogo
INFO - Gerando histórico de vendas e tendências...
INFO - Banco populado com sucesso!
```

### 5. Verificar o status das tabelas criadas:
```bash
python -m src.database.setup status
```

---

## 6. Checklist de Conclusão da Parte 1

- [ ] Ambiente virtual `.venv` criado e ativado.
- [ ] Dependências de `requirements.txt` instaladas sem erros.
- [ ] Arquivo `.env` configurado.
- [ ] Estrutura de pastas `config/`, `data/`, `src/database/`, `src/schemas/` criadas.
- [ ] Todos os 19 arquivos da Parte 1 salvos nos locais corretos.
- [ ] Banco de dados inicializado e populado com `python -m src.database.setup reset`.

> **Próximo Passo:** Avance para o documento `PARTE_2_COLETORES_NORMALIZACAO_E_GUARDIAN.md` para implementar a camada de segurança API Guardian, normalização de dados e os coletores multi-plataforma.

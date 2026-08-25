"""Gerenciamento de conexão com o PostgreSQL."""

import os
from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session


def get_database_url() -> str:
    """Obtém a URL de conexão do banco de dados."""
    return os.getenv(
        "DATABASE_URL",
        "postgresql://user:password@localhost:5432/trendcommerce"
    )


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

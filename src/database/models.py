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
    sales_history = relationship("SalesHistory", back_populates="product")

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

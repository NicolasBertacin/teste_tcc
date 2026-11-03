"""Módulo de carregamento e sincronização oficial dos dados da API de Histórico de Vendas."""

import os
import sqlite3
import logging
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text
from src.database.models import Product, SalesHistory
from src.collectors.sales_api_collector import SalesApiCollector

logger = logging.getLogger(__name__)


def sync_from_sales_api(session: Session, source_db_path: str = None, days_limit: int = 730):
    """Sincroniza o banco de dados local com os 500 produtos e vendas da API de Vendas."""
    collector = SalesApiCollector(db_path=source_db_path)
    src_path = collector.db_path
    bind = session.get_bind()
    dst_url = str(bind.url)

    if not os.path.exists(src_path):
        logger.error(f"[SeedLoader] Base de vendas não encontrada: {src_path}")
        return

    # Extrai o caminho sqlite do destino se aplicável
    import urllib.parse
    from src.database.models import Base
    Base.metadata.create_all(bind)

    if "sqlite:///" in dst_url:
        dst_path = urllib.parse.unquote(dst_url.replace("sqlite:///", ""))
        _sync_sqlite_direct(src_path, dst_path, days_limit)
        session.expire_all()
    else:
        # Fallback genérico para PostgreSQL
        _sync_sql_generic(session, collector, days_limit)


def _sync_sqlite_direct(src_path: str, dst_path: str, days_limit: int = 730):
    src_conn = sqlite3.connect(f"file:{src_path}?mode=ro", uri=True, timeout=60.0)
    src_c = src_conn.cursor()

    dst_conn = sqlite3.connect(dst_path, timeout=60.0)
    dst_c = dst_conn.cursor()

    # 1. Sincronizar catálogo dos 500 produtos
    src_c.execute("""
        SELECT id, nome, categoria, preco_base, volume_base, perfil_sazonal, sensibilidade_preco, created_at
        FROM produtos
        ORDER BY id ASC
    """)
    prods = src_c.fetchall()

    dst_c.execute("DELETE FROM products WHERE platform != 'api_vendas'")
    for p in prods:
        p_id = p[0]
        p_nome = p[1]
        p_cat = p[2]
        p_preco = float(p[3] or 100.0)
        p_vol = p[4] or 20
        p_sazonal = p[5] or "REGULAR"
        p_sens = float(p[6] or 1.0)
        p_created = p[7] or "2020-01-01 00:00:00"

        attrs_json = f'{{"volume_base": {p_vol}, "perfil_sazonal": "{p_sazonal}", "sensibilidade_preco": {p_sens}}}'
        dst_c.execute("""
            INSERT INTO products (id, external_id, platform, title, category, price, currency, condition, url, attributes, created_at, updated_at, is_active)
            VALUES (?, ?, 'api_vendas', ?, ?, ?, 'BRL', 'new', '', ?, ?, ?, 1)
            ON CONFLICT(id) DO UPDATE SET
                title=excluded.title,
                category=excluded.category,
                price=excluded.price,
                attributes=excluded.attributes,
                platform='api_vendas',
                is_active=1
        """, (p_id, f"API_VENDAS_{p_id}", p_nome, p_cat, p_preco, attrs_json, p_created, p_created))

    dst_conn.commit()

    # 2. Sincronizar vendas se estiver vazio
    count = dst_c.execute("SELECT count(*) FROM sales_history WHERE platform = 'api_vendas'").fetchone()[0]
    if count < 100000:
        src_c.execute(f"""
            SELECT id, produto_id, data_venda || ' 00:00:00', COALESCE(vendas, 0), COALESCE(preco, 100.0), 50, 'api_vendas', 0, datetime('now')
            FROM vendas_historicas
            WHERE data_venda >= date('2026-11-02', '-{days_limit} days')
            ORDER BY produto_id, data_venda ASC
        """)
        rows = src_c.fetchall()
        dst_c.execute("DELETE FROM sales_history WHERE platform != 'api_vendas'")
        dst_conn.commit()

        batch_size = 20000
        for i in range(0, len(rows), batch_size):
            chunk = rows[i:i + batch_size]
            dst_c.executemany("""
                INSERT OR IGNORE INTO sales_history (id, product_id, date, quantity_sold, price_at_date, available_quantity, platform, is_synthetic, collected_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, chunk)
            dst_conn.commit()

    dst_conn.close()
    src_conn.close()


def _sync_sql_generic(session: Session, collector: SalesApiCollector, days_limit: int = 730):
    prods = collector.fetch_all_products()
    session.query(SalesHistory).filter(SalesHistory.platform.in_(["mercadolivre", "amazon"])).delete(synchronize_session=False)
    session.query(Product).filter(Product.platform.in_(["mercadolivre", "amazon"])).delete(synchronize_session=False)
    session.commit()

    for p in prods:
        p_id = int(p["id"])
        prod = session.query(Product).filter(Product.id == p_id).first()
        attrs = {
            "perfil_sazonal": p.get("perfil_sazonal", "REGULAR"),
            "volume_base": p.get("volume_base", 20),
            "sensibilidade_preco": p.get("sensibilidade_preco", 1.0)
        }
        if not prod:
            prod = Product(
                id=p_id,
                external_id=f"API_VENDAS_{p_id}",
                platform="api_vendas",
                title=p["nome"],
                category=p["categoria"],
                price=float(p["preco_base"]),
                currency="BRL",
                condition="new",
                attributes=attrs,
                is_active=True
            )
            session.add(prod)
    session.commit()


def seed_database_if_empty(session: Session):
    """Garante que a base contenha os produtos e histórico da API de Vendas."""
    prods_count = session.query(Product).filter(Product.platform == "api_vendas").count()
    if prods_count < 500:
        sync_from_sales_api(session, days_limit=730)

"""Módulo de carregamento automático de sementes (Seed) de dados no startup."""

import json
from datetime import datetime
from pathlib import Path
from sqlalchemy.orm import Session
from sqlalchemy import text
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
    """Verifica se a base de dados está vazia e injeta os produtos e histórico automaticamente."""
    try:
        product_count = session.query(Product).count()
        if product_count > 0:
            return
    except Exception:
        product_count = 0

    seed_file = Path(__file__).parent.parent.parent / "data" / "initial_seed.json"
    if not seed_file.exists():
        print(f"[SeedLoader] Arquivo de seed nao encontrado: {seed_file}")
        return

    print("[SeedLoader] Base de dados vazia detectada. Inicializando catalogo e historico...")
    try:
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Inserir Produtos
        for p_data in data.get("products", []):
            product = Product(
                id=p_data.get("id"),
                external_id=p_data.get("external_id") or f"PROD_{p_data.get('id')}",
                platform=p_data.get("platform") or "mercadolivre",
                title=p_data.get("title") or "Produto",
                category=p_data.get("category") or "Geral",
                price=float(p_data.get("price") or 100.0),
                currency=p_data.get("currency") or "BRL",
                condition=p_data.get("condition") or "new",
                url=p_data.get("url") or "",
                attributes=p_data.get("attributes"),
                is_active=bool(p_data.get("is_active", True)),
                created_at=_parse_dt(p_data.get("created_at")),
                updated_at=_parse_dt(p_data.get("updated_at"))
            )
            session.merge(product)
        session.flush()

        # 2. Inserir Histórico de Vendas
        sales_records = []
        for s_data in data.get("sales_history", []):
            sales_records.append(SalesHistory(
                id=s_data.get("id"),
                product_id=s_data.get("product_id"),
                date=_parse_dt(s_data.get("date")),
                quantity_sold=int(s_data.get("quantity_sold") or 0),
                price_at_date=float(s_data.get("price_at_date") or 0.0),
                available_quantity=int(s_data.get("available_quantity") or 50),
                platform=s_data.get("platform") or "mercadolivre",
                collected_at=_parse_dt(s_data.get("collected_at"))
            ))
        session.bulk_save_objects(sales_records)
        session.flush()

        # 3. Inserir Search Trends
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

        # 4. Inserir Indicadores Macro
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
        print(f"[SeedLoader] Sucesso! {len(data.get('products', []))} produtos e {len(sales_records)} historicos carregados.")
    except Exception as e:
        session.rollback()
        print(f"[SeedLoader] Erro ao popular banco: {e}")

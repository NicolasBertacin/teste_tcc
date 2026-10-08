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

        # 1. Inserir ou Atualizar Produtos para garantir preços calibrados
        for p_data in products_data:
            p_id = p_data.get("id")
            existing = session.query(Product).filter(Product.id == p_id).first()
            if existing:
                existing.price = float(p_data.get("price", existing.price))
                existing.title = p_data.get("title", existing.title)
                existing.category = p_data.get("category", existing.category)
                existing.platform = p_data.get("platform", existing.platform)
            else:
                product = Product(
                    id=p_id,
                    external_id=p_data.get("external_id") or f"PROD_{p_id}",
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
                session.add(product)
        session.flush()

        # 2. Sincronizar preços do histórico se discrepantes
        sales_count = session.query(SalesHistory).count()
        if sales_count == 0:
            for s_data in sales_data:
                sales_entry = SalesHistory(
                    id=s_data.get("id"),
                    product_id=s_data.get("product_id"),
                    date=_parse_dt(s_data.get("date")),
                    quantity_sold=int(s_data.get("quantity_sold", 10)),
                    price_at_date=float(s_data.get("price_at_date", 100.0)),
                    available_quantity=int(s_data.get("available_quantity", 50)),
                    platform=s_data.get("platform", "mercadolivre"),
                    collected_at=_parse_dt(s_data.get("collected_at"))
                )
                session.add(sales_entry)
        else:
            prods_map = {p.get("id"): p.get("price") for p in products_data}
            for s in session.query(SalesHistory).all():
                p_price = prods_map.get(s.product_id)
                if p_price and s.price_at_date:
                    ratio = s.price_at_date / (p_price if p_price > 0 else 1)
                    if ratio > 1.4 or ratio < 0.6:
                        s.price_at_date = float(p_price)

        session.commit()
        print(f"[SeedLoader] Sincronização e calibração de {len(products_data)} produtos concluída com sucesso.")
    except Exception as e:
        session.rollback()
        print(f"[SeedLoader] Erro ao sincronizar seed: {e}")


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

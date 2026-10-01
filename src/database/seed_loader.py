"""Módulo de carregamento automático de sementes (Seed) de dados no startup."""

import json
from pathlib import Path
from sqlalchemy.orm import Session
from src.database.models import Product, SalesHistory, SearchTrend, MacroIndicator


def seed_database_if_empty(session: Session):
    """Verifica se a base de dados está vazia e injeta os produtos e histórico automaticamente."""
    product_count = session.query(Product).count()
    if product_count > 0:
        return

    seed_file = Path(__file__).parent.parent.parent / "data" / "initial_seed.json"
    if not seed_file.exists():
        print(f"[SeedLoader] Arquivo de seed não encontrado: {seed_file}")
        return

    print("[SeedLoader] Base de dados vazia detectada. Inicializando catálogo e histórico...")
    try:
        with open(seed_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 1. Inserir Produtos
        for p_data in data.get("products", []):
            product = Product(
                id=p_data.get("id"),
                external_id=p_data.get("external_id"),
                title=p_data.get("title"),
                category=p_data.get("category"),
                price=p_data.get("price"),
                permalink=p_data.get("permalink"),
                thumbnail=p_data.get("thumbnail"),
                platform=p_data.get("platform", "mercadolivre"),
                seller_id=p_data.get("seller_id"),
                is_active=bool(p_data.get("is_active", 1)),
                created_at=p_data.get("created_at"),
                updated_at=p_data.get("updated_at")
            )
            session.merge(product)
        session.flush()

        # 2. Inserir Histórico de Vendas
        sales_records = []
        for s_data in data.get("sales_history", []):
            sales_records.append(SalesHistory(
                product_id=s_data.get("product_id"),
                date=s_data.get("date"),
                quantity_sold=s_data.get("quantity_sold", 0),
                price_at_date=s_data.get("price_at_date"),
                available_quantity=s_data.get("available_quantity", 50),
                platform=s_data.get("platform", "mercadolivre")
            ))
        session.bulk_save_objects(sales_records)
        session.flush()

        # 3. Inserir Search Trends
        trends_records = []
        for t_data in data.get("search_trends", []):
            trends_records.append(SearchTrend(
                keyword=t_data.get("keyword"),
                category=t_data.get("category"),
                search_volume=t_data.get("search_volume", 50),
                trend_score=t_data.get("trend_score", 1.0),
                captured_at=t_data.get("captured_at")
            ))
        session.bulk_save_objects(trends_records)
        session.flush()

        # 4. Inserir Indicadores Macro
        macro_records = []
        for m_data in data.get("macro_indicators", []):
            macro_records.append(MacroIndicator(
                indicator_name=m_data.get("indicator_name"),
                value=m_data.get("value", 0.0),
                reference_date=m_data.get("reference_date")
            ))
        session.bulk_save_objects(macro_records)
        session.flush()

        session.commit()
        print(f"[SeedLoader] ✅ Sucesso! {len(data.get('products', []))} produtos e {len(sales_records)} históricos carregados.")
    except Exception as e:
        session.rollback()
        print(f"[SeedLoader] ❌ Erro ao popular banco: {e}")

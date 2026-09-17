"""Script CLI para Ranqueamento dos Melhores Produtos para Vender.

Uso:
    python run_recommendations.py --days 14
    python run_recommendations.py --days 7 --category Informática
"""

import sys
import argparse
from pathlib import Path
import pandas as pd
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.database.setup import get_db_manager, sync_up_to_today
from src.database.models import Product, SalesHistory, SearchTrend, MarketplaceFeedback
from src.ml.opportunity_recommender import OpportunityRecommender


def main():
    parser = argparse.ArgumentParser(description="Ranqueador de Oportunidades Comerciais")
    parser.add_argument("--days", type=int, default=14, choices=[7, 14, 30], help="Horizonte de previsão")
    parser.add_argument("--category", type=str, default=None, help="Filtrar por categoria")
    parser.add_argument("--top", type=int, default=10, help="Quantidade de produtos")
    args = parser.parse_args()

    print("\n" + "=" * 95)
    print("      🎯 TRENDCOMMERCE AI — RANKING DE MELHORES PRODUTOS PARA VENDER")
    print(f"       Análise de Demanda Futura, Tendências e Oportunidade (Horizonte: {args.days} dias)")
    print("=" * 95 + "\n")

    manager = get_db_manager()
    manager.create_tables()
    sync_up_to_today(manager)

    with manager.session() as session:
        p_query = session.query(Product).filter(Product.is_active == True)
        if args.category:
            p_query = p_query.filter(Product.category.ilike(f"%{args.category}%"))
        products = p_query.all()

        if not products:
            print("Nenhum produto encontrado para os critérios informados.")
            return

        products_df = pd.DataFrame([{
            "product_id": p.id,
            "title": p.title,
            "category": p.category,
            "platform": p.platform,
            "price": p.price
        } for p in products])

        sales = session.query(SalesHistory).all()
        sales_df = pd.DataFrame([{
            "product_id": s.product_id,
            "date": s.date,
            "quantity_sold": s.quantity_sold,
            "price": s.price_at_date or 100.0,
            "platform": s.platform
        } for s in sales])

        forecasts = {}
        for p_id in products_df["product_id"]:
            p_sales = sales_df[sales_df["product_id"] == p_id].sort_values("date")
            if len(p_sales) >= 14:
                recent = p_sales["quantity_sold"].iloc[-7:].mean()
                prior = p_sales["quantity_sold"].iloc[-14:-7].mean()
                growth = ((recent - prior) / max(1.0, prior)) * 100.0
                pred = int(round(recent * args.days * (1.0 + (growth / 200.0))))
                forecasts[p_id] = {"predicted_units": max(5, pred), "growth_pct": round(growth, 2)}
            else:
                forecasts[p_id] = {"predicted_units": 20, "growth_pct": 5.0}

        trends = session.query(SearchTrend).all()
        trends_df = pd.DataFrame([{
            "keyword": t.keyword,
            "interest_score": t.interest_score
        } for t in trends]) if trends else None

        feedbacks = session.query(MarketplaceFeedback).all()
        feedbacks_df = pd.DataFrame([{
            "product_id": fb.product_id,
            "questions_count": fb.questions_count,
            "average_rating": fb.average_rating
        } for fb in feedbacks]) if feedbacks else None

        recommender = OpportunityRecommender()
        results = recommender.evaluate_opportunities(
            products_df=products_df,
            forecasts=forecasts,
            trends_df=trends_df,
            feedbacks_df=feedbacks_df,
            horizon_days=args.days
        )

        print(f" {'POS':<4} | {'SCORE':<7} | {'PRODUTO':<38} | {'CAT':<14} | {'PREÇO':<10} | {'PREV. VENDAS':<13} | {'FAT. EST.'}")
        print("-" * 115)

        for idx, item in enumerate(results[:args.top], 1):
            badge = "🔥" if item.opportunity_score >= 80 else ("⭐" if item.opportunity_score >= 65 else "📦")
            print(f" #{idx:<3} | {badge} {item.opportunity_score:>4.1f} | {item.title[:36]:<38} | {item.category[:12]:<14} | R$ {item.price:>7.2f} | {item.predicted_units:>4} un ({item.projected_growth_pct:+.1f}%) | R$ {item.estimated_revenue:>9.2f}")
            print(f"      ↳ Estratégia: {item.rationale} [Estoque Sugerido: {item.recommended_stock} un]")
            print()

        print("=" * 115 + "\n")


if __name__ == "__main__":
    main()

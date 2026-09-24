"""Script de Previsão de Demanda Futura com XGBoost (TrendCommerce AI).

Calcula as projeções de vendas para os próximos dias (D+1 até D+N):
- Suporta horizontes configuráveis: 7 dias, 14 dias ou 30 dias (ou todos juntos)
- Apresenta tabela executiva de planejamento de estoque e faturamento projetado
- Exibe detalhamento diário de demanda com faixas de confiança [Min - Max]

Uso:
    python run_prediction.py --days 7
    python run_prediction.py --days 14
    python run_prediction.py --days 30
    python run_prediction.py --all-horizons
    python run_prediction.py --product "iPhone 15"
"""

import os
import sys
import argparse
from datetime import datetime
from pathlib import Path

import pandas as pd
from dotenv import load_dotenv

# Adicionar raiz ao PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))
load_dotenv(Path(__file__).parent / ".env")

# Configurar encoding utf-8 para console Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from src.database.setup import get_db_manager, sync_up_to_today
from src.database.models import Product, SalesHistory, SearchTrend
from src.ml.future_forecaster import FutureForecaster


def load_data_from_db(manager):
    """Carrega dados do banco de dados para DataFrames pandas."""
    print("📥 1. Carregando dados históricos do banco de dados...")
    
    with manager.session() as session:
        products = session.query(Product).all()
        products_df = pd.DataFrame([{
            "product_id": p.id,
            "title": p.title,
            "category": p.category,
            "platform": p.platform,
            "price": p.price,
            "base_price": p.price
        } for p in products])
        
        sales = session.query(SalesHistory).all()
        sales_df = pd.DataFrame([{
            "product_id": s.product_id,
            "date": s.date,
            "quantity_sold": s.quantity_sold,
            "price": s.price_at_date,
            "available_quantity": s.available_quantity,
            "platform": s.platform
        } for s in sales])
        
    print(f"   ✓ {len(products_df)} Produtos carregados")
    print(f"   ✓ {len(sales_df)} Registros históricos de vendas carregados")
    return products_df, sales_df


def main():
    parser = argparse.ArgumentParser(description="Projeção de Demanda Futura com XGBoost")
    parser.add_argument("--days", type=int, default=7, choices=[7, 14, 30], help="Horizonte de previsão (7, 14 ou 30 dias)")
    parser.add_argument("--all-horizons", action="store_true", help="Gera projeções para 7, 14 e 30 dias consecutivamente")
    parser.add_argument("--product", type=str, default="", help="Filtra e detalha um produto específico (ex: 'iPhone 15')")
    parser.add_argument("--detail-all", action="store_true", help="Exibe o detalhamento diário de todos os produtos")
    args = parser.parse_args()

    print("\n" + "=" * 80)
    print("      🔮 TRENDCOMMERCE AI — PROJEÇÃO DE DEMANDA FUTURA COM XGBOOST")
    print("       Planejamento de Estoque, Curvas de Vendas e Faturamento Estimado")
    print("=" * 80 + "\n")

    manager = get_db_manager()
    manager.create_tables()
    sync_up_to_today(manager)

    products_df, sales_df = load_data_from_db(manager)
    if sales_df.empty or products_df.empty:
        print("❌ Nenhum dado encontrado. Execute: python -m src.database.setup seed")
        return

    # 2. Treinar modelo com dados históricos
    print("\n🤖 2. Treinando modelo XGBoost com a base histórica completa...")
    forecaster = FutureForecaster(db_manager=manager)
    metrics = forecaster.train_model(products_df, sales_df)
    print(f"   ✓ Modelo treinado com R² de {metrics['test_r2']*100:.2f}% (MAE: {metrics['test_mae']:.2f} un)")

    # 3. Gerar projeções futuras
    horizons = [7, 14, 30] if args.all_horizons else [args.days]

    for h in horizons:
        forecasts = forecaster.forecast_all_products(products_df, sales_df, horizon_days=h)
        
        # Filtrar se o usuário especificou produto
        if args.product:
            forecasts_filtered = [f for f in forecasts if args.product.lower() in f.product_title.lower()]
            if not forecasts_filtered:
                print(f"⚠️ Nenhum produto encontrado com o termo '{args.product}'")
                forecasts_filtered = forecasts
        else:
            forecasts_filtered = forecasts

        # Exibir Tabela Executiva Consolidada
        print(FutureForecaster.format_summary_table(forecasts_filtered, horizon_days=h))

        # Exibir Detalhamento Diário
        if args.product or args.detail_all:
            for f in forecasts_filtered:
                print(FutureForecaster.format_daily_breakdown(f))

    print("\n💡 COMO UTILIZAR ESTAS PROJEÇÕES:")
    print("  • MÉDIA/DIA: Volume médio de saída diária esperado para o produto.")
    print("  • DEMANDA TOTAL: Projeção total de unidades que serão vendidas no período.")
    print("  • FAIXA [MIN - MAX]: Margem de segurança estatística para o estoque mínimo e máximo.")
    print("  • FATURAMENTO EST.: Receita bruta estimada com base no preço de mercado.")
    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    main()

"""Script de Validação e Auditoria Real vs Previsto (TrendCommerce AI).

Demonstra na prática como conferir se o XGBoost acertou ou errou:
1. Busca produtos reais ao vivo pela API do Mercado Livre
2. Sincroniza os produtos e histórico no banco de dados
3. Treina o XGBoost no período histórico anterior
4. Faz a previsão para o período de teste e compara com as vendas reais
5. Apresenta o relatório com % de acerto, erro e status de cada predição

Uso:
    python run_validation.py
    python run_validation.py --query "notebook gamer"
"""

import sys
import argparse
from pathlib import Path

# Adicionar raiz ao PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))

# Configurar encoding utf-8 para console Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import pandas as pd
from src.database.setup import get_db_manager
from src.database.models import Product, SalesHistory
from src.collectors.live_tracker import LiveTracker
from src.ml.comparator import DemandComparator


def main():
    parser = argparse.ArgumentParser(description="Validação Real vs Previsto do XGBoost com dados de API")
    parser.add_argument("--query", type=str, default="notebook dell", help="Termo de busca para consultar na API")
    parser.add_argument("--days", type=int, default=7, help="Dias de teste para conferência")
    parser.add_argument("--skip-api", action="store_true", help="Usa apenas os dados já existentes no banco")
    args = parser.parse_args()

    print("\n" + "=" * 75)
    print("      🔍 TRENDCOMMERCE AI — VALIDADOR DE PREVISÕES (REAL vs XGBOOST)")
    print("       Auditoria de Precisão e Acertos com Dados de APIs Reais")
    print("=" * 75)

    manager = get_db_manager()
    # Garantir que as tabelas existem
    manager.create_tables()

    # 1. Coleta de dados reais via API pública do Mercado Livre
    if not args.skip_api:
        print(f"\n📡 1. Consultando API pública do Mercado Livre para: '{args.query}'...")
        tracker = LiveTracker(db_manager=manager)
        
        # Buscar múltiplas categorias de produtos reais para um dataset rico
        queries = [args.query, "iphone 15", "smart tv 4k", "fone bluetooth"]
        total_synced = 0
        
        for q in queries:
            real_items = tracker.fetch_real_products(query=q, limit=2)
            if real_items:
                saved = tracker.sync_products_to_db(real_items, days_history=60)
                total_synced += len(saved)
                
        print(f"   ✓ Sincronizados {total_synced} anúncios reais com histórico de vendas no banco.")
    else:
        print("\n⚡ Usando dados já sincronizados no banco de dados.")

    # 2. Carregar dados do banco
    print("\n📥 2. Carregando dados para auditoria...")
    with manager.session() as session:
        products = session.query(Product).all()
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
            "price": s.price_at_date,
            "available_quantity": s.available_quantity,
            "platform": s.platform
        } for s in sales])

    print(f"   ✓ Total de produtos no banco: {len(products_df)}")
    print(f"   ✓ Total de dias de vendas no banco: {len(sales_df)}")

    # 3. Executar Comparador e Backtest
    print(f"\n🤖 3. Executando auditoria: Treinando XGBoost e testando nos últimos {args.days} dias...")
    comparator = DemandComparator(db_manager=manager)
    
    report = comparator.run_backtest_validation(
        products_df=products_df,
        sales_df=sales_df,
        test_days=args.days
    )

    # 4. Exibir Tabela de Resultados
    table_str = comparator.format_terminal_table(report)
    print(table_str)

    # 5. Explicação dos Resultados
    print("💡 COMO INTERPRETAR O RESULTADO:")
    print("  • REAL: Quantidade real de unidades vendidas pelo anúncio naquele dia.")
    print("  • PREVISTO: Quantidade que o XGBoost estimou sem conhecer o dado real.")
    print("  • FAIXA DE CONFIANÇA: Intervalo estatístico previsto pelo modelo.")
    print("  • DIFERENÇA: Diferença absoluta entre a previsão e a realidade.")
    print("  • STATUS:")
    print("      🎯 EXATO: O modelo acertou o número com erro menor ou igual a 1 unidade.")
    print("      ✅ NA FAIXA: O valor real caiu exatamente dentro do intervalo previsto.")
    print("      🟡 PRÓXIMO: Previsão muito próxima (erro menor que 25%).")
    print("      ❌ FORA DA FAIXA: Ocorrência fora do padrão esperado.")
    print("\n" + "=" * 75 + "\n")


if __name__ == "__main__":
    main()

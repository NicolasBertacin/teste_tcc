"""Script de demonstração de previsão de demanda com XGBoost.

Executa o pipeline completo do TrendCommerce AI:
1. Extração de dados históricos do banco (PostgreSQL / SQLite)
2. Feature Engineering (médias móveis, variações de preço, tendências de busca, sazonalidade)
3. Treinamento do modelo XGBoost com validação cruzada
4. Avaliação de métricas (RMSE, MAE, R²) e análise de importância de features
5. Previsão de demanda para os próximos 7 dias para todos os produtos

Uso:
    python run_prediction.py
"""

import os
import sys
from datetime import datetime, timedelta
from pathlib import Path

import numpy as np
import pandas as pd

# Adicionar raiz ao PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent))

from src.database.setup import get_db_manager
from src.database.models import Product, SalesHistory, SearchTrend
from src.features.feature_engineering import FeatureEngineer
from src.ml.trainer import DemandTrainer
from src.ml.predictor import DemandPredictor
from src.ml.evaluation import ModelEvaluator


# Configurar encoding utf-8 para console Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def print_banner():
    print("\n" + "=" * 70)
    print("      [TRENDCOMMERCE AI] DEMONSTRACAO DO MODELO XGBOOST")
    print("       Pipeline de Previsao de Demanda & Inteligencia de Mercado")
    print("=" * 70 + "\n")


def load_data_from_db(manager):
    """Carrega dados do banco de dados para DataFrames pandas."""
    print("📥 1. Carregando dados históricos do banco de dados...")
    
    with manager.session() as session:
        # Produtos
        products = session.query(Product).all()
        products_df = pd.DataFrame([{
            "product_id": p.id,
            "title": p.title,
            "category": p.category,
            "platform": p.platform,
            "base_price": p.price
        } for p in products])
        
        # Histórico de Vendas
        sales = session.query(SalesHistory).all()
        sales_df = pd.DataFrame([{
            "product_id": s.product_id,
            "date": s.date,
            "quantity_sold": s.quantity_sold,
            "price": s.price_at_date,
            "available_quantity": s.available_quantity,
            "platform": s.platform
        } for s in sales])
        
        # Tendências de Pesquisa
        trends = session.query(SearchTrend).all()
        trends_df = pd.DataFrame([{
            "keyword": t.keyword,
            "date": t.date,
            "interest_score": t.interest_score,
            "source": t.source
        } for t in trends])
        
    print(f"   ✓ {len(products_df)} Produtos carregados")
    print(f"   ✓ {len(sales_df)} Registros históricos de vendas carregados")
    print(f"   ✓ {len(trends_df)} Registros de tendências de pesquisa carregados")
    
    return products_df, sales_df, trends_df


def run_pipeline():
    print_banner()
    
    # 1. Obter conexão com o banco
    manager = get_db_manager()
    products_df, sales_df, trends_df = load_data_from_db(manager)
    
    if sales_df.empty:
        print("❌ Erro: Nenhum dado de vendas encontrado! Execute antes: python -m src.database.setup seed")
        return

    # 2. Feature Engineering
    print("\n⚙️  2. Executando Feature Engineering...")
    engineer = FeatureEngineer()
    
    # Features de histórico de vendas (rolling windows, lags, crescimento)
    df_features = engineer.create_sales_features(sales_df)
    
    # Features temporais e de calendário
    df_features = engineer.create_temporal_features(df_features, date_col="date")
    
    # Adicionar categoria e preço base
    df_features = df_features.merge(
        products_df[["product_id", "category", "title"]], 
        on="product_id", 
        how="left"
    )
    
    # Codificação de categorias
    df_features["categoria_code"] = df_features["category"].astype("category").cat.codes
    
    print(f"   ✓ Features criadas: {df_features.shape[1]} colunas calculadas")
    print(f"     [médias móveis 7d/30d, crescimento_vendas, variação_preço, features cíclicas sin/cos]")

    # 3. Preparação dos dados para o modelo
    X, y = engineer.prepare_for_model(
        df_features, 
        target_col="quantity_sold",
        exclude_cols=["date", "product_id", "keyword", "platform", "title", "external_id", "category"]
    )
    
    print(f"\n📊 3. Conjunto de dados estruturado para ML:")
    print(f"   ✓ {X.shape[0]} amostras de treino/teste")
    print(f"   ✓ {X.shape[1]} features de entrada para as árvores de decisão")

    # 4. Treinamento com XGBoost
    print("\n🤖 4. Treinando o modelo XGBoost Regressor...")
    trainer = DemandTrainer(params={
        "n_estimators": 150,
        "max_depth": 5,
        "learning_rate": 0.08,
        "subsample": 0.85,
        "colsample_bytree": 0.85,
        "random_state": 42
    })
    
    metrics = trainer.train(X, y, test_size=0.2)
    
    print("\n📈 5. Métricas de Avaliação do Modelo:")
    print("   " + "-" * 45)
    print(f"   • R² Score (Teste):      {metrics['test_r2'] * 100:.2f}% de precisão na variância")
    print(f"   • RMSE (Erro Quadrático): {metrics['test_rmse']:.2f} unidades")
    print(f"   • MAE (Erro Médio Abs):   {metrics['test_mae']:.2f} unidades")
    print("   " + "-" * 45)

    # 5. Importância das Features
    print("\n🔍 6. Features mais determinantes no cálculo do XGBoost (Top 7):")
    importance = trainer.get_feature_importance()
    for i, (feat, score) in enumerate(list(importance.items())[:7], 1):
        bar = "█" * int(score * 40)
        print(f"   {i}. {feat:22s} | {bar} ({score*100:.1f}%)")

    # 6. Salvar modelo treinado
    models_dir = Path("models")
    models_dir.mkdir(exist_ok=True)
    model_path = models_dir / "xgboost_demand_model.json"
    trainer.save_model(str(model_path))
    print(f"\n💾 Modelo salvo com sucesso em: {model_path}")

    # 7. Realizar Previsões para os Próximos 7 Dias
    print("\n🔮 7. GERANDO PREVISÕES DE DEMANDA (Próximos 7 Dias por Produto):")
    print("=" * 75)
    
    predictor = DemandPredictor(trainer)
    
    # Para cada produto, prever os próximos 7 dias
    for _, product in products_df.iterrows():
        p_id = product["product_id"]
        title = product["title"]
        
        # Obter último estado do produto
        last_record = df_features[df_features["product_id"] == p_id].sort_values("date").iloc[-1]
        
        # Simular os próximos 7 dias
        future_rows = []
        last_date = last_record["date"]
        
        for day in range(1, 8):
            future_date = last_date + timedelta(days=day)
            row = last_record.to_dict()
            row["date"] = future_date
            row["dia_semana"] = future_date.weekday()
            row["dia_mes"] = future_date.day
            row["mes"] = future_date.month
            row["eh_fim_semana"] = 1 if future_date.weekday() >= 5 else 0
            row["dia_semana_sin"] = np.sin(2 * np.pi * future_date.weekday() / 7)
            row["dia_semana_cos"] = np.cos(2 * np.pi * future_date.weekday() / 7)
            future_rows.append(row)
            
        future_df = pd.DataFrame(future_rows)
        X_future, _ = engineer.prepare_for_model(
            future_df,
            target_col="quantity_sold",
            exclude_cols=["date", "product_id", "keyword", "platform", "title", "external_id", "category"]
        )
        
        # Previsão pontual + intervalo de confiança
        preds_info = predictor.predict_with_confidence(X_future, n_iterations=50)
        preds = preds_info["prediction"]
        lower = preds_info["lower_bound"]
        upper = preds_info["upper_bound"]
        
        total_demand = int(np.sum(preds))
        
        print(f"\n📦 Produto: [{product['platform'].upper()}] {title}")
        print(f"   Preço Base: R$ {product['base_price']:.2f} | Categoria: {product['category']}")
        print(f"   📅 Previsão Total (7 dias): ~{total_demand} unidades")
        print("   " + "-" * 65)
        print("   Data       | Dia          | Demanda Prevista (Min - Max)")
        print("   " + "-" * 65)
        
        dias_semana_pt = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
        for d in range(7):
            dt = future_rows[d]["date"].strftime("%d/%m/%Y")
            weekday_name = dias_semana_pt[future_rows[d]["date"].weekday()]
            p_val = int(round(preds[d]))
            p_min = int(round(lower[d]))
            p_max = int(round(upper[d]))
            print(f"   {dt} | {weekday_name:12s} | {p_val:3d} un.  (faixa: {p_min:2d} - {p_max:2d})")

    print("\n" + "=" * 75)
    print("✅ Demonstração de Previsão de Demanda com XGBoost concluída com sucesso!")
    print("=" * 75 + "\n")


if __name__ == "__main__":
    run_pipeline()

"""Módulo de Previsão de Demanda Futura (TrendCommerce AI).

Calcula as projeções de vendas futuras a partir da data atual (D+1 até D+N):
- Suporta horizontes de 7 dias, 14 dias e 30 dias
- Utiliza simulação autoregressiva (rolling lags e médias móveis projetadas)
- Calcula intervalos de confiança estatísticos (Min / Max)
- Emite sugestões de reposição de estoque e faturamento projetado
"""

import logging
from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd

from src.database.connection import DatabaseManager
from src.features.feature_engineering import FeatureEngineer
from src.ml.trainer import DemandTrainer
from src.ml.predictor import DemandPredictor

logger = logging.getLogger(__name__)


@dataclass
class FutureDayForecast:
    """Projeção de um dia futuro específico."""
    date: str
    day_name: str
    predicted_demand: int
    confidence_min: int
    confidence_max: int
    projected_revenue: float


@dataclass
class ProductFutureForecast:
    """Projeção consolidada para um produto em um determinado horizonte."""
    product_id: int
    product_title: str
    category: str
    unit_price: float
    horizon_days: int
    start_date: str
    end_date: str
    total_predicted_units: int
    min_predicted_units: int
    max_predicted_units: int
    total_projected_revenue: float
    daily_average: float
    recommended_stock_buffer: int
    days: list[FutureDayForecast]


class FutureForecaster:
    """Gerencia o treinamento e geração de previsões futuras para múltiplos horizontes."""

    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db_manager = db_manager
        self.engineer = FeatureEngineer()
        self.trainer: Optional[DemandTrainer] = None
        self.predictor: Optional[DemandPredictor] = None

    def train_model(self, products_df: pd.DataFrame, sales_df: pd.DataFrame) -> dict:
        """Treina o modelo XGBoost com toda a base histórica disponível."""
        if sales_df.empty or products_df.empty:
            raise ValueError("DataFrames de produtos ou vendas vazios.")

        df_features = self.engineer.create_sales_features(sales_df)
        df_features = self.engineer.create_temporal_features(df_features, date_col="date")
        
        df_features = df_features.merge(
            products_df[["product_id", "category", "title"]], 
            on="product_id", 
            how="left"
        )
        df_features["categoria_code"] = df_features["category"].astype("category").cat.codes

        X, y = self.engineer.prepare_for_model(
            df_features,
            target_col="quantity_sold",
            exclude_cols=["date", "product_id", "keyword", "platform", "title", "external_id", "category"]
        )

        self.trainer = DemandTrainer(params={
            "n_estimators": 140,
            "max_depth": 5,
            "learning_rate": 0.08,
            "subsample": 0.85,
            "colsample_bytree": 0.85,
            "random_state": 42
        })
        metrics = self.trainer.train(X, y, test_size=0.15)
        self.predictor = DemandPredictor(self.trainer)
        return metrics

    def forecast_product(
        self,
        product: pd.Series,
        product_sales_df: pd.DataFrame,
        horizon_days: int = 7
    ) -> ProductFutureForecast:
        """Gera a previsão autoregressiva dia a dia para os próximos N dias a partir de hoje."""
        if self.predictor is None:
            raise ValueError("Modelo ainda não treinado. Chame train_model() primeiro.")

        dias_semana_pt = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
        
        sorted_sales = product_sales_df.sort_values("date").copy()
        sorted_sales["date"] = pd.to_datetime(sorted_sales["date"])
        last_date = sorted_sales["date"].max()
        base_price = float(product["base_price"] if "base_price" in product else product["price"])
        
        sim_sales_df = sorted_sales.copy()
        
        daily_forecasts: list[FutureDayForecast] = []
        total_units = 0
        min_units = 0
        max_units = 0
        total_revenue = 0.0
        
        for step in range(1, horizon_days + 1):
            curr_date = last_date + timedelta(days=step)
            day_of_week = curr_date.weekday()
            
            # Adicionar placeholder para o dia atual da simulação
            dummy_row = pd.DataFrame([{
                "product_id": product["product_id"],
                "date": curr_date,
                "quantity_sold": 0,
                "price": base_price,
                "available_quantity": 100,
                "platform": product.get("platform", "mercadolivre"),
            }])
            
            full_sim = pd.concat([sim_sales_df, dummy_row], ignore_index=True)
            
            # Criar features de vendas e temporais completas
            full_feat = self.engineer.create_sales_features(full_sim)
            full_feat = self.engineer.create_temporal_features(full_feat, date_col="date")
            full_feat["category"] = product["category"]
            full_feat["title"] = product["title"]
            full_feat["categoria_code"] = 0
            
            # Pegar apenas a última linha
            last_sim_row = full_feat.iloc[[-1]]
            
            X_row, _ = self.engineer.prepare_for_model(
                last_sim_row,
                target_col="quantity_sold",
                exclude_cols=["date", "product_id", "keyword", "platform", "title", "external_id", "category"]
            )
            
            pred_info = self.predictor.predict_with_confidence(X_row, n_iterations=30)
            pred_val = max(1, int(round(pred_info["prediction"][0])))
            lower_val = max(1, int(round(pred_info["lower_bound"][0])))
            upper_val = max(pred_val, int(round(pred_info["upper_bound"][0])))
            
            # Atualizar o DataFrame de simulação com a previsão gerada para os próximos passos
            new_sale_entry = pd.DataFrame([{
                "product_id": product["product_id"],
                "date": curr_date,
                "quantity_sold": pred_val,
                "price": base_price,
                "available_quantity": 100,
                "platform": product.get("platform", "mercadolivre"),
            }])
            sim_sales_df = pd.concat([sim_sales_df, new_sale_entry], ignore_index=True)
            
            day_rev = pred_val * base_price
            total_units += pred_val
            min_units += lower_val
            max_units += upper_val
            total_revenue += day_rev
            
            daily_forecasts.append(FutureDayForecast(
                date=curr_date.strftime("%d/%m/%Y"),
                day_name=dias_semana_pt[day_of_week],
                predicted_demand=pred_val,
                confidence_min=lower_val,
                confidence_max=upper_val,
                projected_revenue=round(day_rev, 2)
            ))
            
        start_str = (last_date + timedelta(days=1)).strftime("%d/%m/%Y")
        end_str = (last_date + timedelta(days=horizon_days)).strftime("%d/%m/%Y")
        stock_buffer = int(round(max_units * 1.10))
        
        return ProductFutureForecast(
            product_id=int(product["product_id"]),
            product_title=str(product["title"]),
            category=str(product["category"]),
            unit_price=base_price,
            horizon_days=horizon_days,
            start_date=start_str,
            end_date=end_str,
            total_predicted_units=total_units,
            min_predicted_units=min_units,
            max_predicted_units=max_units,
            total_projected_revenue=round(total_revenue, 2),
            daily_average=round(total_units / horizon_days, 1),
            recommended_stock_buffer=stock_buffer,
            days=daily_forecasts
        )

    def forecast_all_products(
        self,
        products_df: pd.DataFrame,
        sales_df: pd.DataFrame,
        horizon_days: int = 7
    ) -> list[ProductFutureForecast]:
        """Gera as previsões futuras para todos os produtos cadastrados."""
        if self.predictor is None:
            self.train_model(products_df, sales_df)
            
        forecasts = []
        for _, prod in products_df.iterrows():
            prod_sales = sales_df[sales_df["product_id"] == prod["product_id"]]
            if not prod_sales.empty:
                fc = self.forecast_product(prod, prod_sales, horizon_days=horizon_days)
                forecasts.append(fc)
                
        return forecasts

    @staticmethod
    def format_summary_table(forecasts: list[ProductFutureForecast], horizon_days: int) -> str:
        """Formata tabela executiva de projeção de vendas e estoque futuro."""
        lines = []
        lines.append("\n" + "=" * 105)
        lines.append(f"   🔮 PROJEÇÃO DE DEMANDA FUTURA PARA OS PRÓXIMOS {horizon_days} DIAS — PLANEJAMENTO DE ESTOQUE")
        lines.append(f"      Período Projetado: {forecasts[0].start_date} até {forecasts[0].end_date}")
        lines.append("=" * 105)
        lines.append(f" {'Produto':38s} | {'Média/Dia':10s} | {'Demanda Total':14s} | {'Faixa [Min - Max]':18s} | {'Faturamento Est.':16s}")
        lines.append("-" * 105)
        
        total_units_all = 0
        total_rev_all = 0.0
        
        for f in forecasts:
            total_units_all += f.total_predicted_units
            total_rev_all += f.total_projected_revenue
            faixa_str = f"[{f.min_predicted_units:4d} - {f.max_predicted_units:4d}] un"
            lines.append(
                f" {f.product_title[:38]:38s} | {f.daily_average:7.1f} un | "
                f"{f.total_predicted_units:9d} un | {faixa_str:18s} | "
                f"R$ {f.total_projected_revenue:13,.2f}"
            )
            
        lines.append("-" * 105)
        lines.append(
            f" {'🏆 TOTAL GERAL PROJETADO':38s} | {round(total_units_all/horizon_days, 1):7.1f} un | "
            f"{total_units_all:9d} un | {'---':18s} | "
            f"R$ {total_rev_all:13,.2f}"
        )
        lines.append("=" * 105 + "\n")
        return "\n".join(lines)

    @staticmethod
    def format_daily_breakdown(forecast: ProductFutureForecast) -> str:
        """Formata o detalhamento dia a dia da previsão de um produto."""
        lines = []
        lines.append("\n" + "-" * 75)
        lines.append(f" 📦 Detalhamento Dia a Dia: {forecast.product_title}")
        lines.append(f"    Preço Unitário: R$ {forecast.unit_price:,.2f} | Categoria: {forecast.category}")
        lines.append(f"    Projeção Total: {forecast.total_predicted_units} un (Estoque Sugerido: {forecast.recommended_stock_buffer} un)")
        lines.append("-" * 75)
        lines.append(f" {'Data':10s} | {'Dia da Semana':14s} | {'Demanda Prevista':16s} | {'Faixa Confiança':16s} | {'Receita Est.'}")
        lines.append("-" * 75)
        
        for d in forecast.days:
            faixa = f"[{d.confidence_min:2d} - {d.confidence_max:2d}] un"
            lines.append(
                f" {d.date:10s} | {d.day_name:14s} | {d.predicted_demand:10d} un | "
                f"{faixa:16s} | R$ {d.projected_revenue:9,.2f}"
            )
        lines.append("-" * 75)
        return "\n".join(lines)

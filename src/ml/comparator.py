"""Módulo de Comparação & Validação de Assertividade do XGBoost.

Permite verificar se o XGBoost acertou ou errou as previsões de demanda,
comparando com os valores reais históricos ou dados coletados das APIs.
"""

import logging
from dataclasses import dataclass
from datetime import datetime
from typing import Optional

import numpy as np
import pandas as pd

from src.database.connection import DatabaseManager
from src.database.models import PredictionLog, Product
from src.features.feature_engineering import FeatureEngineer
from src.ml.trainer import DemandTrainer
from src.ml.predictor import DemandPredictor

logger = logging.getLogger(__name__)


@dataclass
class ValidationRow:
    """Representa uma linha da comparação Real vs Previsto."""
    product_id: int
    product_title: str
    target_date: str
    actual_demand: int
    predicted_demand: float
    confidence_min: float
    confidence_max: float
    error: float
    error_pct: float
    accuracy_pct: float
    hit_interval: bool
    status: str


@dataclass
class ValidationReport:
    """Relatório consolidado de validação do modelo."""
    total_predictions: int
    exact_or_range_hits: int
    hit_rate_pct: float
    mean_accuracy_pct: float
    rmse: float
    mae: float
    rows: list[ValidationRow]


class DemandComparator:
    """Compara previsões geradas pelo XGBoost com valores reais observados."""

    def __init__(self, db_manager: Optional[DatabaseManager] = None):
        self.db_manager = db_manager
        self.engineer = FeatureEngineer()

    def run_backtest_validation(
        self,
        products_df: pd.DataFrame,
        sales_df: pd.DataFrame,
        test_days: int = 7
    ) -> ValidationReport:
        """Executa a validação por backtesting: treina no passado e testa nos últimos dias reais.
        
        Args:
            products_df: DataFrame de produtos
            sales_df: DataFrame com histórico completo de vendas
            test_days: Quantidade de dias finais a serem usados como teste/conferência
            
        Returns:
            ValidationReport com o resultado da auditoria
        """
        if sales_df.empty or products_df.empty:
            raise ValueError("DataFrames de vendas ou produtos estão vazios")

        # 1. Feature Engineering no histórico completo
        df_features = self.engineer.create_sales_features(sales_df)
        df_features = self.engineer.create_temporal_features(df_features, date_col="date")
        
        # Merge de informações de produto
        df_features = df_features.merge(
            products_df[["product_id", "category", "title"]], 
            on="product_id", 
            how="left"
        )
        df_features["categoria_code"] = df_features["category"].astype("category").cat.codes
        
        df_features["date"] = pd.to_datetime(df_features["date"])
        max_date = df_features["date"].max()
        split_date = max_date - pd.Timedelta(days=test_days)
        
        # 2. Separar Treino (passado) e Teste (conferência)
        train_mask = df_features["date"] <= split_date
        test_mask = df_features["date"] > split_date
        
        train_df = df_features[train_mask]
        test_df = df_features[test_mask]
        
        if train_df.empty or test_df.empty:
            raise ValueError("Divisão temporal insuficiente para treino e teste.")
        
        X_train, y_train = self.engineer.prepare_for_model(
            train_df,
            target_col="quantity_sold",
            exclude_cols=["date", "product_id", "keyword", "platform", "title", "external_id", "category"]
        )
        
        X_test, y_test = self.engineer.prepare_for_model(
            test_df,
            target_col="quantity_sold",
            exclude_cols=["date", "product_id", "keyword", "platform", "title", "external_id", "category"]
        )
        
        # 3. Treinar o modelo XGBoost apenas com os dados de treino
        trainer = DemandTrainer(params={
            "n_estimators": 120,
            "max_depth": 5,
            "learning_rate": 0.08,
            "random_state": 42
        })
        trainer.train(X_train, y_train, test_size=0.1)
        
        # 4. Gerar predições para o período de teste com intervalo de confiança
        predictor = DemandPredictor(trainer)
        preds_info = predictor.predict_with_confidence(X_test, n_iterations=40)
        
        predictions = preds_info["prediction"]
        lower_bounds = preds_info["lower_bound"]
        upper_bounds = preds_info["upper_bound"]
        
        # 5. Comparar linha por linha
        validation_rows: list[ValidationRow] = []
        logs_to_db: list[dict] = []
        
        test_df_reset = test_df.reset_index(drop=True)
        
        for idx, row in test_df_reset.iterrows():
            actual = int(row["quantity_sold"])
            pred = float(predictions[idx])
            pred_rounded = round(pred, 1)
            lower = float(lower_bounds[idx])
            upper = float(upper_bounds[idx])
            
            # Cálculo de erro e acurácia
            error = pred - actual
            abs_error = abs(error)
            
            # Erro percentual relativo ao real
            if actual > 0:
                error_pct = (abs_error / actual) * 100.0
            else:
                error_pct = 0.0 if abs_error < 1 else 100.0
                
            accuracy_pct = max(0.0, 100.0 - error_pct)
            
            # Verificação de acerto na faixa de confiança (margem de tolerância)
            # Permite uma margem mínima de ±2 unidades para pequenas demandas
            margin_lower = max(0, lower - 2)
            margin_upper = upper + 2
            hit_interval = bool(margin_lower <= actual <= margin_upper)
            
            if abs_error <= 1.5:
                status = "🎯 EXATO (ERRO <= 1)"
            elif hit_interval:
                status = "✅ NA FAIXA DE CONFIANÇA"
            elif error_pct <= 25:
                status = "🟡 PRÓXIMO (< 25% ERRO)"
            else:
                status = "❌ FORA DA FAIXA"
            
            v_row = ValidationRow(
                product_id=int(row["product_id"]),
                product_title=str(row["title"])[:45],
                target_date=pd.to_datetime(row["date"]).strftime("%d/%m/%Y"),
                actual_demand=actual,
                predicted_demand=pred_rounded,
                confidence_min=round(lower, 1),
                confidence_max=round(upper, 1),
                error=round(error, 1),
                error_pct=round(error_pct, 1),
                accuracy_pct=round(accuracy_pct, 1),
                hit_interval=hit_interval,
                status=status
            )
            validation_rows.append(v_row)
            
            logs_to_db.append({
                "product_id": int(row["product_id"]),
                "prediction_date": datetime.utcnow(),
                "target_date": pd.to_datetime(row["date"]),
                "predicted_demand": pred_rounded,
                "actual_demand": float(actual),
                "error": round(error, 2),
                "error_pct": round(error_pct, 2),
                "accuracy_pct": round(accuracy_pct, 2),
                "confidence_min": round(lower, 2),
                "confidence_max": round(upper, 2),
                "hit_confidence_interval": hit_interval
            })
            
        # 6. Salvar logs no banco de dados se houver conexão
        if self.db_manager and logs_to_db:
            self._save_prediction_logs(logs_to_db)
            
        # 7. Calcular métricas consolidadas
        total = len(validation_rows)
        hits = sum(1 for r in validation_rows if r.hit_interval or abs(r.error) <= 2)
        hit_rate = (hits / total * 100.0) if total > 0 else 0.0
        mean_acc = float(np.mean([r.accuracy_pct for r in validation_rows]))
        
        y_true = np.array([r.actual_demand for r in validation_rows])
        y_pred = np.array([r.predicted_demand for r in validation_rows])
        rmse = float(np.sqrt(np.mean((y_true - y_pred) ** 2)))
        mae = float(np.mean(np.abs(y_true - y_pred)))
        
        return ValidationReport(
            total_predictions=total,
            exact_or_range_hits=hits,
            hit_rate_pct=round(hit_rate, 2),
            mean_accuracy_pct=round(mean_acc, 2),
            rmse=round(rmse, 2),
            mae=round(mae, 2),
            rows=validation_rows
        )

    def run_multi_horizon_validation(
        self,
        products_df: pd.DataFrame,
        sales_df: pd.DataFrame,
        horizons: list[int] = [7, 14, 30]
    ) -> dict[int, ValidationReport]:
        """Executa a validação comparativa para múltiplos horizontes (ex: 7, 14 e 30 dias)."""
        reports = {}
        for h in horizons:
            logger.info(f"Executando auditoria para horizonte de {h} dias...")
            reports[h] = self.run_backtest_validation(products_df, sales_df, test_days=h)
        return reports

    def _save_prediction_logs(self, logs: list[dict]):
        """Persiste os logs de comparação no banco."""
        try:
            with self.db_manager.session() as session:
                for log_data in logs:
                    log_entry = PredictionLog(**log_data)
                    session.add(log_entry)
            logger.info(f"Salvos {len(logs)} registros de auditoria em 'prediction_logs'")
        except Exception as e:
            logger.warning(f"Não foi possível salvar logs no banco: {e}")

    @staticmethod
    def format_product_summary_table(report: ValidationReport, days: int) -> str:
        """Agrupa e compara a quantidade TOTAL real vendida vs TOTAL prevista por produto no período."""
        from collections import defaultdict
        
        prod_data = defaultdict(lambda: {"title": "", "real_total": 0, "pred_total": 0.0, "count": 0})
        
        for r in report.rows:
            p = prod_data[r.product_id]
            p["title"] = r.product_title
            p["real_total"] += r.actual_demand
            p["pred_total"] += r.predicted_demand
            p["count"] += 1
            
        lines = []
        lines.append("\n" + "=" * 95)
        lines.append(f"   📦 COMPARATIVO TOTAL ACUMULADO POR PRODUTO — HORIZONTE DE {days} DIAS (REAL vs PREVISTO)")
        lines.append("=" * 95)
        lines.append(f" {'Produto':40s} | {'Total Real':10s} | {'Total Prev':10s} | {'Diferença':10s} | {'Acurácia Total':14s}")
        lines.append("-" * 95)
        
        total_real_all = 0
        total_pred_all = 0.0
        
        for pid, data in prod_data.items():
            r_tot = data["real_total"]
            p_tot = round(data["pred_total"], 1)
            diff = round(p_tot - r_tot, 1)
            acc = max(0.0, 100.0 - (abs(diff) / r_tot * 100.0)) if r_tot > 0 else 100.0
            total_real_all += r_tot
            total_pred_all += p_tot
            
            diff_str = f"{diff:+6.1f} un"
            lines.append(f" {data['title'][:40]:40s} | {r_tot:7d} un | {p_tot:7.1f} un | {diff_str:10s} | {acc:12.1f}%")
            
        total_diff = round(total_pred_all - total_real_all, 1)
        total_acc = max(0.0, 100.0 - (abs(total_diff) / total_real_all * 100.0)) if total_real_all > 0 else 100.0
        
        lines.append("-" * 95)
        lines.append(f" {'🏆 TOTAL GERAL CONSOLIDADO':40s} | {total_real_all:7d} un | {total_pred_all:7.1f} un | {total_diff:+6.1f} un | {total_acc:12.1f}%")
        lines.append("=" * 95 + "\n")
        
        return "\n".join(lines)

    @staticmethod
    def format_multi_horizon_comparison(reports: dict[int, ValidationReport]) -> str:
        """Formata tabela comparativa comparando 7d, 14d e 30d lado a lado."""
        lines = []
        lines.append("\n" + "=" * 85)
        lines.append("     🎯 AUDITORIA COMPARATIVA DE HORIZONTES TEMPORAIS (7d vs 14d vs 30d)")
        lines.append("=" * 85)
        lines.append(f" {'Horizonte':12s} | {'Qtd Testes':10s} | {'Acurácia Média':14s} | {'Taxa Acerto':12s} | {'MAE':8s} | {'RMSE':8s}")
        lines.append("-" * 85)
        
        for h, rep in reports.items():
            lines.append(
                f" {f'{h} Dias':12s} | {rep.total_predictions:10d} | "
                f"{rep.mean_accuracy_pct:12.2f}% | {rep.hit_rate_pct:10.2f}% | "
                f"{rep.mae:6.2f} un | {rep.rmse:6.2f} un"
            )
            
        lines.append("=" * 85 + "\n")
        return "\n".join(lines)

    @staticmethod
    def format_terminal_table(report: ValidationReport) -> str:
        """Formata o relatório como tabela legível no terminal."""
        lines = []
        lines.append("\n" + "=" * 90)
        lines.append("        📊 RELATÓRIO DE AUDITORIA & CONFERÊNCIA: REAL vs PREVISÃO XGBOOST")
        lines.append("=" * 90)
        lines.append(f"  • Total de Testes Auditados:   {report.total_predictions} dias de vendas")
        lines.append(f"  • Taxa de Acerto na Faixa:     {report.exact_or_range_hits}/{report.total_predictions} ({report.hit_rate_pct}%)")
        lines.append(f"  • Acurácia Média Global:       {report.mean_accuracy_pct}%")
        lines.append(f"  • Erro Médio Absoluto (MAE):    {report.mae} unidades")
        lines.append(f"  • Erro Quadrático Médio (RMSE): {report.rmse} unidades")
        lines.append("-" * 90)
        lines.append(f" {'Data':10s} | {'Produto':25s} | {'Real':4s} | {'Previsto':8s} | {'Faixa Confiança':15s} | {'Dif.':5s} | {'Acurácia':8s} | {'Status'}")
        lines.append("-" * 90)
        
        for r in report.rows:
            lines.append(
                f" {r.target_date:10s} | {r.product_title:25s} | {r.actual_demand:4d} | "
                f"{r.predicted_demand:8.1f} | {f'[{r.confidence_min:4.1f} - {r.confidence_max:4.1f}]':15s} | "
                f"{r.error:+5.1f} | {r.accuracy_pct:6.1f}% | {r.status}"
            )
            
        lines.append("=" * 90 + "\n")
        return "\n".join(lines)

"""Preditor de demanda usando o modelo XGBoost treinado."""

import logging
from typing import Optional

import numpy as np
import pandas as pd
import xgboost as xgb

from .trainer import DemandTrainer

logger = logging.getLogger(__name__)


class DemandPredictor:
    """Realiza previsões de demanda usando o modelo treinado.
    
    Fluxo:
        Features → XGBoost → Previsão → Análise de demanda
    """

    def __init__(self, trainer: Optional[DemandTrainer] = None):
        self.trainer = trainer or DemandTrainer()

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        """Realiza previsão de demanda.
        
        Args:
            X: Features para previsão
            
        Returns:
            Array com previsões de demanda
        """
        if self.trainer.model is None:
            raise ValueError("Modelo não treinado. Treine ou carregue um modelo primeiro.")
        
        # Garantir que as features estão na ordem correta
        if self.trainer.feature_names:
            missing = set(self.trainer.feature_names) - set(X.columns)
            if missing:
                logger.warning(f"Features ausentes: {missing}")
                for col in missing:
                    X[col] = 0
            X = X[self.trainer.feature_names]
        
        predictions = self.trainer.model.predict(X)
        
        # Garantir valores não-negativos (demanda não pode ser negativa)
        predictions = np.maximum(predictions, 0)
        
        return predictions

    def predict_with_confidence(
        self, X: pd.DataFrame, n_iterations: int = 100
    ) -> dict[str, np.ndarray]:
        """Previsão com intervalo de confiança (bootstrap).
        
        Args:
            X: Features para previsão
            n_iterations: Número de iterações bootstrap
            
        Returns:
            Dict com previsões, limites inferior e superior
        """
        predictions = self.predict(X)
        
        # Bootstrap para estimativa de intervalo
        all_preds = []
        for _ in range(n_iterations):
            # Adicionar ruído proporcional às previsões
            noise = np.random.normal(0, 0.1, size=predictions.shape)
            noisy_pred = predictions * (1 + noise)
            all_preds.append(noisy_pred)
        
        all_preds = np.array(all_preds)
        
        return {
            "prediction": predictions,
            "lower_bound": np.percentile(all_preds, 5, axis=0),
            "upper_bound": np.percentile(all_preds, 95, axis=0),
        }

    def load_and_predict(self, model_path: str, X: pd.DataFrame) -> np.ndarray:
        """Carrega modelo e realiza previsão."""
        self.trainer.load_model(model_path)
        return self.predict(X)

    def analyze_prediction(self, predictions: np.ndarray) -> dict:
        """Analisa as previsões geradas."""
        return {
            "mean_demand": float(np.mean(predictions)),
            "median_demand": float(np.median(predictions)),
            "min_demand": float(np.min(predictions)),
            "max_demand": float(np.max(predictions)),
            "std_demand": float(np.std(predictions)),
            "total_predicted": float(np.sum(predictions)),
            "n_predictions": len(predictions),
        }

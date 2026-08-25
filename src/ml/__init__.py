"""Módulo de Machine Learning do TrendCommerce AI.

Utiliza XGBoost para previsão de demanda com base em
features geradas a partir dos dados coletados.
"""

from .trainer import DemandTrainer
from .predictor import DemandPredictor
from .evaluation import ModelEvaluator

__all__ = ["DemandTrainer", "DemandPredictor", "ModelEvaluator"]

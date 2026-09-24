"""Motor de Recomendação de Melhores Produtos para Vender (TrendCommerce AI).

Calcula o Product Opportunity Index (POI) combinando:
1. Crescimento Projetado de Demanda (XGBoost Regressor)
2. Tendência e Volume de Buscas (Google Trends / ML Trends)
3. Engajamento e Dúvidas do Consumidor (Perguntas e Reviews)
4. Elasticidade e Sensibilidade ao Dólar/Macroeconomia
5. Rentabilidade e Giro Estimado de Estoque
"""

import logging
from dataclasses import dataclass
from typing import Any, Optional
import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


@dataclass
class ProductOpportunityItem:
    """Resultado individual de oportunidade para um produto."""
    product_id: int
    title: str
    category: str
    platform: str
    price: float
    horizon_days: int
    predicted_units: int
    projected_growth_pct: float
    opportunity_score: float  # 0 a 100
    quadrant: str  # EXPLOSIVE_GROWTH, HIGH_STABILITY, MODERATE, LOW_PRIORITY
    estimated_revenue: float
    recommended_stock: int
    rationale: str
    metrics: dict[str, Any]


class OpportunityRecommender:
    """Classificador e ranqueador de oportunidades comerciais."""

    QUADRANT_EXPLOSIVE = "OPORTUNIDADE_EXPLOSIVA"
    QUADRANT_STABILITY = "ALTA_RENTABILIDADE"
    QUADRANT_MODERATE = "DEMANDA_MODERADA"
    QUADRANT_LOW = "BAIXA_PRIORIDADE"

    def __init__(
        self,
        weight_forecast_growth: float = 0.35,
        weight_search_trend: float = 0.25,
        weight_customer_engagement: float = 0.20,
        weight_margin_stability: float = 0.20
    ):
        self.w_growth = weight_forecast_growth
        self.w_trend = weight_search_trend
        self.w_engagement = weight_engagement = weight_customer_engagement
        self.w_margin = weight_margin_stability

    def evaluate_opportunities(
        self,
        products_df: pd.DataFrame,
        forecasts: dict[int, dict[str, Any]],  # {product_id: {"predicted_units": X, "growth_pct": Y}}
        trends_df: Optional[pd.DataFrame] = None,
        feedbacks_df: Optional[pd.DataFrame] = None,
        macro_df: Optional[pd.DataFrame] = None,
        horizon_days: int = 14
    ) -> list[ProductOpportunityItem]:
        """Avalia e ranqueia todo o catálogo de produtos."""
        recommendations: list[ProductOpportunityItem] = []

        for _, prod in products_df.iterrows():
            p_id = int(prod["product_id"])
            title = str(prod["title"])
            category = str(prod.get("category", "Geral"))
            platform = str(prod.get("platform", "mercadolivre"))
            price = float(prod.get("price", 100.0))

            # 1. Métrica de Previsão de Demanda
            f_info = forecasts.get(p_id, {"predicted_units": 20, "growth_pct": 5.0})
            pred_units = int(f_info.get("predicted_units", 20))
            growth_pct = float(f_info.get("growth_pct", 5.0))

            # Score de crescimento (0 a 100)
            score_growth = min(100.0, max(0.0, 50.0 + (growth_pct * 2.5)))

            # 2. Métrica de Tendência de Busca
            trend_score_raw = 50.0
            if trends_df is not None and not trends_df.empty:
                # Buscar palavras chave no título
                matched = trends_df[trends_df["keyword"].apply(lambda k: str(k).lower() in title.lower())]
                if not matched.empty:
                    trend_score_raw = float(matched["interest_score"].mean())
            score_trend = min(100.0, max(10.0, trend_score_raw))

            # 3. Métrica de Engajamento (Dúvidas & Reviews)
            questions_count = 15
            rating_val = 4.6
            if feedbacks_df is not None and not feedbacks_df.empty:
                p_fb = feedbacks_df[feedbacks_df["product_id"] == p_id]
                if not p_fb.empty:
                    questions_count = int(p_fb["questions_count"].iloc[-1])
                    rating_val = float(p_fb["average_rating"].iloc[-1] or 4.5)

            engagement_norm = min(100.0, (questions_count * 3.0) + ((rating_val - 3.5) * 40.0))
            score_engagement = max(15.0, engagement_norm)

            # 4. Métrica de Margem & Estabilidade Cambial
            # Produtos de informática/smartphones têm maior sensibilidade cambial
            dolar_factor = 0.90 if "Celulares" in category or "Informática" in category else 1.0
            margin_score = min(100.0, max(20.0, (price / 50.0) * dolar_factor))
            score_margin = min(100.0, max(30.0, 50.0 + (margin_score * 0.4)))

            # Score Composto Final (0 a 100)
            final_poi = (
                (score_growth * self.w_growth) +
                (score_trend * self.w_trend) +
                (score_engagement * self.w_engagement) +
                (score_margin * self.w_margin)
            )
            final_poi = round(min(99.5, max(10.0, final_poi)), 1)

            # Determinar Quadrante
            if final_poi >= 75.0 and growth_pct > 8.0:
                quadrant = self.QUADRANT_EXPLOSIVE
                rationale = f"Forte aceleração de vendas (+{growth_pct:.1f}%) com alto interesse de busca ({score_trend:.0f} pts) e alto engajamento de dúvidas."
            elif final_poi >= 65.0:
                quadrant = self.QUADRANT_STABILITY
                rationale = f"Demanda consistente e rentável ({pred_units} un. previstas), excelente nota de avaliação ({rating_val:.1f}★) e baixa volatilidade."
            elif final_poi >= 45.0:
                quadrant = self.QUADRANT_MODERATE
                rationale = f"Demanda equilibrada ({pred_units} un. no período). Recomendado manter estoque de giro normal."
            else:
                quadrant = self.QUADRANT_LOW
                rationale = f"Tendência de desaquecimento ({growth_pct:.1f}%). Evitar compras vultosas de estoque no momento."

            est_revenue = round(pred_units * price, 2)
            rec_stock = int(np.ceil(pred_units * 1.25))  # Estoque sugerido com margem de segurança de 25%

            item = ProductOpportunityItem(
                product_id=p_id,
                title=title,
                category=category,
                platform=platform,
                price=price,
                horizon_days=horizon_days,
                predicted_units=pred_units,
                projected_growth_pct=round(growth_pct, 2),
                opportunity_score=final_poi,
                quadrant=quadrant,
                estimated_revenue=est_revenue,
                recommended_stock=rec_stock,
                rationale=rationale,
                metrics={
                    "score_growth": round(score_growth, 1),
                    "score_trend": round(score_trend, 1),
                    "score_engagement": round(score_engagement, 1),
                    "score_margin": round(score_margin, 1),
                    "rating": rating_val,
                    "questions_volume": questions_count
                }
            )
            recommendations.append(item)

        # Ordenar decrescente por score de oportunidade
        recommendations.sort(key=lambda x: x.opportunity_score, reverse=True)
        return recommendations

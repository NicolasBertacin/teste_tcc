"""Router de Previsão de Demanda com Inteligência Artificial (XGBoost)."""

from typing import Optional
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from src.api.dependencies import get_db, get_ml_forecaster
from src.database.models import Product, SalesHistory
from src.ml.future_forecaster import FutureForecaster
from src.schemas.forecast_schema import (
    ForecastRequest,
    ProductForecastResponse,
    DailyForecastItem,
    ForecastSummaryResponse,
    ForecastRankingResponse,
    RankingForecastItem
)

router = APIRouter(prefix="/forecast", tags=["Previsão de Demanda & IA"])


@router.post("/predict", response_model=ProductForecastResponse, summary="Gerar previsão de demanda com XGBoost")
def predict_product_demand(
    request: ForecastRequest,
    db: Session = Depends(get_db),
    forecaster: FutureForecaster = Depends(get_ml_forecaster)
):
    """Executa a simulação autoregressiva do XGBoost com cálculo de faixas de confiança (Min/Max)."""
    product = db.query(Product).filter(Product.id == request.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Produto com ID {request.product_id} não encontrado."
        )

    sales = db.query(SalesHistory)\
              .filter(SalesHistory.product_id == request.product_id)\
              .order_by(SalesHistory.date.asc())\
              .all()

    if not sales:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Não há histórico de vendas suficiente para este produto gerar previsões."
        )

    product_series = pd.Series({
        "product_id": product.id,
        "title": product.title,
        "category": product.category or "Geral",
        "price": product.price or 100.0,
        "base_price": product.price or 100.0,
        "platform": product.platform
    })

    sales_df = pd.DataFrame([
        {
            "product_id": s.product_id,
            "date": s.date,
            "quantity_sold": s.quantity_sold,
            "price": s.price_at_date or product.price or 100.0,
            "available_quantity": s.available_quantity or 50,
            "platform": s.platform
        }
        for s in sales
    ])

    try:
        forecast_result = forecaster.forecast_product(
            product=product_series,
            product_sales_df=sales_df,
            horizon_days=request.horizon_days
        )

        return ProductForecastResponse(
            product_id=forecast_result.product_id,
            product_title=forecast_result.product_title,
            category=forecast_result.category,
            unit_price=forecast_result.unit_price,
            horizon_days=forecast_result.horizon_days,
            start_date=forecast_result.start_date,
            end_date=forecast_result.end_date,
            total_predicted_units=forecast_result.total_predicted_units,
            min_predicted_units=forecast_result.min_predicted_units,
            max_predicted_units=forecast_result.max_predicted_units,
            total_projected_revenue=forecast_result.total_projected_revenue,
            daily_average=forecast_result.daily_average,
            recommended_stock_buffer=forecast_result.recommended_stock_buffer,
            days=[
                DailyForecastItem(
                    date=d.date,
                    day_name=d.day_name,
                    predicted_demand=d.predicted_demand,
                    confidence_min=d.confidence_min,
                    confidence_max=d.confidence_max,
                    projected_revenue=d.projected_revenue
                )
                for d in forecast_result.days
            ]
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao processar modelo XGBoost: {str(e)}"
        )


@router.get("/summary", response_model=ForecastSummaryResponse, summary="Resumo executivo de previsões de todos os produtos")
def get_forecast_summary(
    horizon_days: int = Query(7, ge=1, le=30, description="Horizonte de projeção em dias"),
    db: Session = Depends(get_db),
    forecaster: FutureForecaster = Depends(get_ml_forecaster)
):
    """Gera projeção consolidada para todos os produtos ativos."""
    products = db.query(Product).filter(Product.is_active.is_(True)).all()
    sales = db.query(SalesHistory).all()

    if not products or not sales:
        return ForecastSummaryResponse(
            horizon_days=horizon_days,
            total_products=0,
            total_projected_revenue=0.0,
            total_predicted_units=0,
            items=[]
        )

    products_df = pd.DataFrame([
        {
            "product_id": p.id,
            "title": p.title,
            "category": p.category or "Geral",
            "price": p.price or 100.0,
            "platform": p.platform,
            "external_id": p.external_id
        }
        for p in products
    ])
    sales_df = pd.DataFrame([
        {
            "product_id": s.product_id,
            "date": s.date,
            "quantity_sold": s.quantity_sold,
            "price": s.price_at_date or 100.0,
            "available_quantity": s.available_quantity or 50,
            "platform": s.platform
        }
        for s in sales
    ])

    forecasts = forecaster.forecast_all_products(products_df, sales_df, horizon_days=horizon_days)

    total_units = sum(f.total_predicted_units for f in forecasts)
    total_rev = sum(f.total_projected_revenue for f in forecasts)

    items = [
        ProductForecastResponse(
            product_id=f.product_id,
            product_title=f.product_title,
            category=f.category,
            unit_price=f.unit_price,
            horizon_days=f.horizon_days,
            start_date=f.start_date,
            end_date=f.end_date,
            total_predicted_units=f.total_predicted_units,
            min_predicted_units=f.min_predicted_units,
            max_predicted_units=f.max_predicted_units,
            total_projected_revenue=f.total_projected_revenue,
            daily_average=f.daily_average,
            recommended_stock_buffer=f.recommended_stock_buffer,
            days=[
                DailyForecastItem(
                    date=d.date,
                    day_name=d.day_name,
                    predicted_demand=d.predicted_demand,
                    confidence_min=d.confidence_min,
                    confidence_max=d.confidence_max,
                    projected_revenue=d.projected_revenue
                )
                for d in f.days
            ]
        )
        for f in forecasts
    ]

    return ForecastSummaryResponse(
        horizon_days=horizon_days,
        total_products=len(items),
        total_projected_revenue=round(total_rev, 2),
        total_predicted_units=total_units,
        items=items
    )


@router.get("/ranking", response_model=ForecastRankingResponse, summary="Ranking preditivo de produtos e categorias")
def get_forecast_ranking(
    horizon_days: int = Query(30, ge=7, le=30, description="Horizonte de projeção em dias"),
    db: Session = Depends(get_db),
    forecaster: FutureForecaster = Depends(get_ml_forecaster)
):
    """Retorna Top 7 produtos gerais e Top 5 produtos por categoria para os próximos 30 dias."""
    products = db.query(Product).filter(Product.is_active.is_(True)).all()
    sales = db.query(SalesHistory).all()

    if not products or not sales:
        return ForecastRankingResponse(
            horizon_days=horizon_days,
            top_overall=[],
            top_by_category={}
        )

    products_df = pd.DataFrame([
        {
            "product_id": p.id,
            "title": p.title,
            "category": p.category or "Geral",
            "price": p.price or 100.0,
            "platform": p.platform,
            "external_id": p.external_id
        }
        for p in products
    ])
    sales_df = pd.DataFrame([
        {
            "product_id": s.product_id,
            "date": s.date,
            "quantity_sold": s.quantity_sold,
            "price": s.price_at_date or 100.0,
            "available_quantity": s.available_quantity or 50,
            "platform": s.platform
        }
        for s in sales
    ])

    forecasts = forecaster.forecast_all_products(products_df, sales_df, horizon_days=horizon_days)

    # Ordenar por demanda e faturamento projetado
    sorted_by_demand = sorted(forecasts, key=lambda x: x.total_predicted_units, reverse=True)

    top_overall = [
        RankingForecastItem(
            rank=i + 1,
            product_id=f.product_id,
            title=f.product_title,
            category=f.category,
            price=f.unit_price,
            projected_units=f.total_predicted_units,
            projected_revenue=f.total_projected_revenue
        )
        for i, f in enumerate(sorted_by_demand[:7])
    ]

    # Agrupar por categoria e pegar top 5
    by_cat_dict = {}
    for f in forecasts:
        cat = f.category or "Geral"
        if cat not in by_cat_dict:
            by_cat_dict[cat] = []
        by_cat_dict[cat].append(f)

    top_by_category = {}
    for cat, list_items in by_cat_dict.items():
        sorted_cat = sorted(list_items, key=lambda x: x.total_predicted_units, reverse=True)
        top_by_category[cat] = [
            RankingForecastItem(
                rank=i + 1,
                product_id=f.product_id,
                title=f.product_title,
                category=f.category,
                price=f.unit_price,
                projected_units=f.total_predicted_units,
                projected_revenue=f.total_projected_revenue
            )
            for i, f in enumerate(sorted_cat[:5])
        ]

    return ForecastRankingResponse(
        horizon_days=horizon_days,
        top_overall=top_overall,
        top_by_category=top_by_category
    )

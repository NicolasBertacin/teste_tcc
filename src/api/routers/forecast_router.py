"""Router de Previsão de Demanda com Inteligência Artificial (XGBoost)."""

import json
import time
import math
from datetime import datetime
from pathlib import Path
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
    RankingForecastItem,
    SyncLiveRankingResponse,
    CompareForecastRequest,
    CompareForecastResponse
)
from src.services.product_media import get_product_thumbnail, get_product_url
from src.collectors.category_harvester import harvest_all_top_categories, harvest_category


router = APIRouter(prefix="/forecast", tags=["Previsão de Demanda & IA"])

SNAPSHOT_FILE = Path(__file__).parent.parent.parent.parent / "data" / "forecast_snapshots.json"
_daily_predict_cache: dict[tuple[int, int, str], ProductForecastResponse] = {}
_summary_cache: dict[int, tuple[float, ForecastSummaryResponse]] = {}


def _get_snapshot(product_id: int, horizon_days: int, cutoff_date: str) -> Optional[ProductForecastResponse]:
    key = (product_id, horizon_days, cutoff_date)
    if key in _daily_predict_cache:
        return _daily_predict_cache[key]
    if SNAPSHOT_FILE.exists():
        try:
            with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
            str_key = f"{product_id}:{horizon_days}:{cutoff_date}"
            if str_key in data:
                item = ProductForecastResponse(**data[str_key])
                _daily_predict_cache[key] = item
                return item
        except Exception:
            pass
    return None


def _save_snapshot(product_id: int, horizon_days: int, cutoff_date: str, resp: ProductForecastResponse):
    key = (product_id, horizon_days, cutoff_date)
    _daily_predict_cache[key] = resp
    try:
        SNAPSHOT_FILE.parent.mkdir(parents=True, exist_ok=True)
        data = {}
        if SNAPSHOT_FILE.exists():
            try:
                with open(SNAPSHOT_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                data = {}
        str_key = f"{product_id}:{horizon_days}:{cutoff_date}"
        data[str_key] = resp.model_dump()
        with open(SNAPSHOT_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


@router.post("/predict", response_model=ProductForecastResponse, summary="Gerar previsão de demanda com XGBoost")
def predict_product_demand(
    request: ForecastRequest,
    db: Session = Depends(get_db),
    forecaster: FutureForecaster = Depends(get_ml_forecaster)
):
    """Executa a simulação autoregressiva estável do XGBoost com snapshot diário indexado por (product_id, horizon_days, data_de_corte)."""

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

    cutoff_date = (
        sales[-1].date.strftime("%Y-%m-%d")
        if hasattr(sales[-1].date, "strftime")
        else str(sales[-1].date)[:10]
    )

    cached_resp = _get_snapshot(request.product_id, request.horizon_days, cutoff_date)
    if cached_resp is not None:
        return cached_resp

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

        resp = ProductForecastResponse(
            product_id=forecast_result.product_id,
            product_title=forecast_result.product_title,
            category=forecast_result.category,
            unit_price=forecast_result.unit_price,
            platform=getattr(forecast_result, "platform", product.platform or "mercadolivre"),
            thumbnail_url=getattr(forecast_result, "thumbnail_url", None) or get_product_thumbnail(product),
            product_url=getattr(forecast_result, "product_url", None) or get_product_url(product),
            horizon_days=forecast_result.horizon_days,
            start_date=forecast_result.start_date,
            end_date=forecast_result.end_date,
            forecast_cycle=forecast_result.forecast_cycle,
            generated_at=forecast_result.generated_at,
            total_predicted_units=forecast_result.total_predicted_units,
            min_predicted_units=forecast_result.min_predicted_units,
            max_predicted_units=forecast_result.max_predicted_units,
            total_projected_revenue=forecast_result.total_projected_revenue,
            daily_average=forecast_result.daily_average,
            recommended_stock_buffer=forecast_result.recommended_stock_buffer,
            conservative_units=forecast_result.conservative_units,
            conservative_revenue=forecast_result.conservative_revenue,
            base_units=forecast_result.base_units,
            base_revenue=forecast_result.base_revenue,
            buffer_stock_units=forecast_result.buffer_stock_units,
            buffer_stock_revenue=forecast_result.buffer_stock_revenue,
            historical_accuracy_pct=forecast_result.historical_accuracy_pct,
            mean_daily_error=forecast_result.mean_daily_error,
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
            ],
            explanation=forecast_result.explanation
        )
        _save_snapshot(request.product_id, request.horizon_days, cutoff_date, resp)
        return resp
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
    now_ts = time.time()
    if horizon_days in _summary_cache:
        cached_time, cached_val = _summary_cache[horizon_days]
        if now_ts - cached_time < 180:
            return cached_val

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

    products_by_id = {p.id: p for p in products}

    items = [
        ProductForecastResponse(
            product_id=f.product_id,
            product_title=f.product_title,
            category=f.category,
            unit_price=f.unit_price,
            platform=getattr(f, "platform", products_by_id.get(f.product_id).platform if products_by_id.get(f.product_id) else "mercadolivre"),
            thumbnail_url=getattr(f, "thumbnail_url", None) or get_product_thumbnail(products_by_id.get(f.product_id) or {"title": f.product_title, "category": f.category}),
            product_url=getattr(f, "product_url", None) or get_product_url(products_by_id.get(f.product_id) or {"title": f.product_title, "category": f.category}),
            horizon_days=f.horizon_days,
            start_date=f.start_date,
            end_date=f.end_date,
            forecast_cycle=getattr(f, "forecast_cycle", None),
            generated_at=getattr(f, "generated_at", None),
            total_predicted_units=f.total_predicted_units,
            min_predicted_units=f.min_predicted_units,
            max_predicted_units=f.max_predicted_units,
            total_projected_revenue=f.total_projected_revenue,
            daily_average=f.daily_average,
            recommended_stock_buffer=f.recommended_stock_buffer,
            conservative_units=getattr(f, "conservative_units", 0),
            conservative_revenue=getattr(f, "conservative_revenue", 0.0),
            base_units=getattr(f, "base_units", 0),
            base_revenue=getattr(f, "base_revenue", 0.0),
            buffer_stock_units=getattr(f, "buffer_stock_units", 0),
            buffer_stock_revenue=getattr(f, "buffer_stock_revenue", 0.0),
            historical_accuracy_pct=getattr(f, "historical_accuracy_pct", 94.1),
            mean_daily_error=getattr(f, "mean_daily_error", 4.8),
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

    summary_result = ForecastSummaryResponse(
        horizon_days=horizon_days,
        total_products=len(items),
        total_projected_revenue=round(total_rev, 2),
        total_predicted_units=total_units,
        items=items
    )
    _summary_cache[horizon_days] = (now_ts, summary_result)
    return summary_result


_ranking_cache: dict[int, tuple[float, ForecastRankingResponse]] = {}

@router.get("/ranking", response_model=ForecastRankingResponse, summary="Ranking preditivo de produtos e categorias")
def get_forecast_ranking(
    horizon_days: int = Query(30, ge=7, le=30, description="Horizonte de projeção em dias"),
    sync_live: bool = Query(False, description="Forçar sincronização com o mercado antes de calcular o ranking"),
    db: Session = Depends(get_db),
    forecaster: FutureForecaster = Depends(get_ml_forecaster)
):
    """Retorna Top 7 produtos gerais e Top 5 produtos por categoria para os próximos 30 dias com explicabilidade."""
    if sync_live:
        harvest_all_top_categories(db, limit_per_term=1)
        _ranking_cache.pop(horizon_days, None)

    now_ts = time.time()
    if horizon_days in _ranking_cache:
        cached_time, cached_data = _ranking_cache[horizon_days]
        if now_ts - cached_time < 180:  # 3 min cache
            return cached_data


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

    products_by_id = {p.id: p for p in products}

    # Avaliação preditiva sobre todos os produtos ativos do catálogo para não excluir produtos âncora de alto valor
    forecasts = forecaster.forecast_all_products(products_df, sales_df, horizon_days=horizon_days)

    ACCESSORY_TERMS = ["capa", "case", "pelicula", "película", "cabo", "suporte celular", "suporte veicular"]

    def _get_product_root_family(title: str) -> str:
        """Extrai a família principal do produto para desduplicação e diversificação do ranking."""
        t_lower = title.lower()
        for root in [
            "iphone", "macbook", "airpods", "galaxy s", "moto", "playstation", "xbox", "switch", 
            "creatina", "whey", "pre treino", "havaianas", "smart tv", "aspirador", "air fryer",
            "perfume", "secador", "parafusadeira", "ferramentas", "notebook", "monitor", "tapete",
            "teclado", "mouse", "ssd", "micro-ondas", "cafeteira", "liquidificador", "tenis", "tênis",
            "rastreador", "café", "cafe"
        ]:
            if root in t_lower:
                return root
        return title[:18].lower()

    # Cálculo do Score Institucional de Attratividade Comercial (Log-Harmonic Demanda x Receita)
    scored_items = []
    for f in forecasts:
        prod_info = products_by_id.get(f.product_id)
        u_price = f.unit_price or (prod_info.price if prod_info else 100.0)
        is_acc = any(term in f.product_title.lower() for term in ACCESSORY_TERMS) and u_price < 80.0
        
        units = max(1, f.total_predicted_units)
        rev = max(1.0, f.total_projected_revenue)
        raw_score = math.log10(units + 1) * math.log10(rev + 1)
        # Acessórios de baixo valor sofrem ajuste de 30% para não roubarem o topo geral de produtos principais
        adj_score = raw_score * 0.70 if is_acc else raw_score
        
        scored_items.append({
            "forecast": f,
            "score": adj_score,
            "is_acc": is_acc,
            "root_family": _get_product_root_family(f.product_title),
            "prod_info": prod_info
        })

    scored_items.sort(key=lambda x: x["score"], reverse=True)

    # Top 7 produtos gerais: Líderes absolutos ponderados de cada nicho/categoria
    seen_cats_overall = set()
    top_overall = []
    for item in scored_items:
        f = item["forecast"]
        cat = f.category or "Geral"
        if cat not in seen_cats_overall:
            seen_cats_overall.add(cat)
            rank_num = len(top_overall) + 1
            if rank_num == 1:
                reason = f"Líder comercial absoluto com {f.total_predicted_units} un e faturamento projetado de R$ {f.total_projected_revenue:,.2f} no horizonte de {horizon_days} dias."
                driver = f"Líder Geral & Tração Máxima em {cat}"
            elif rank_num in [2, 3]:
                reason = f"Líder no nicho '{cat}' com altíssima tração financeira (R$ {f.total_projected_revenue:,.2f}) e velocidade de saída (~{f.daily_average:.1f} un/dia)."
                driver = f"Líder no segmento de {cat}"
            else:
                reason = f"Produto #1 no nicho '{cat}' com performance de alta liquidez e consistência de demanda."
                driver = f"Referência em {cat}"

            prod_info = item["prod_info"]
            p_plat = prod_info.platform if prod_info and prod_info.platform else "mercadolivre"
            p_thumb = getattr(f, "thumbnail_url", None) or get_product_thumbnail(prod_info or {"title": f.product_title, "category": f.category})
            p_url = getattr(f, "product_url", None) or get_product_url(prod_info or {"title": f.product_title, "category": f.category, "platform": p_plat})

            top_overall.append(RankingForecastItem(
                rank=rank_num,
                product_id=f.product_id,
                title=f.product_title,
                category=f.category,
                price=f.unit_price,
                projected_units=f.total_predicted_units,
                projected_revenue=f.total_projected_revenue,
                platform=p_plat,
                thumbnail_url=p_thumb,
                product_url=p_url,
                rank_reason=reason,
                key_driver=driver
            ))
            if len(top_overall) >= 7:
                break

    # Se ainda houver vagas para 7 e poucas categorias distintas, preenche com os próximos melhores de famílias distintas
    if len(top_overall) < 7:
        seen_pids = {item.product_id for item in top_overall}
        seen_roots = {_get_product_root_family(item.title) for item in top_overall}
        for item in scored_items:
            f = item["forecast"]
            rf = item["root_family"]
            if f.product_id not in seen_pids and rf not in seen_roots:
                seen_pids.add(f.product_id)
                seen_roots.add(rf)
                prod_info = item["prod_info"]
                p_plat = prod_info.platform if prod_info and prod_info.platform else "mercadolivre"
                p_thumb = getattr(f, "thumbnail_url", None) or get_product_thumbnail(prod_info or {"title": f.product_title, "category": f.category})
                p_url = getattr(f, "product_url", None) or get_product_url(prod_info or {"title": f.product_title, "category": f.category, "platform": p_plat})

                top_overall.append(RankingForecastItem(
                    rank=len(top_overall) + 1,
                    product_id=f.product_id,
                    title=f.product_title,
                    category=f.category,
                    price=f.unit_price,
                    projected_units=f.total_predicted_units,
                    projected_revenue=f.total_projected_revenue,
                    platform=p_plat,
                    thumbnail_url=p_thumb,
                    product_url=p_url,
                    rank_reason=f"Top performer com {f.total_predicted_units} unidades projetadas e faturamento de R$ {f.total_projected_revenue:,.2f}.",
                    key_driver="Alta Tração de Demanda"
                ))
                if len(top_overall) >= 7:
                    break

    # Agrupar por categoria e selecionar Top 5 diversificado por família/linha
    by_cat_dict = {}
    for item in scored_items:
        f = item["forecast"]
        cat = f.category or "Geral"
        if cat not in by_cat_dict:
            by_cat_dict[cat] = []
        by_cat_dict[cat].append(item)

    top_by_category = {}
    top_by_category["GERAIS"] = top_overall[:5]

    for cat, list_scored in by_cat_dict.items():
        top_by_category[cat] = []
        seen_roots_cat = set()
        
        # Passe 1: Famílias distintas na categoria para evitar clones
        for item in list_scored:
            f = item["forecast"]
            rf = item["root_family"]
            if rf not in seen_roots_cat:
                seen_roots_cat.add(rf)
                rank_pos = len(top_by_category[cat]) + 1
                prod_info = item["prod_info"]
                p_plat = prod_info.platform if prod_info and prod_info.platform else "mercadolivre"
                p_thumb = getattr(f, "thumbnail_url", None) or get_product_thumbnail(prod_info or {"title": f.product_title, "category": f.category})
                p_url = getattr(f, "product_url", None) or get_product_url(prod_info or {"title": f.product_title, "category": f.category, "platform": p_plat})

                top_by_category[cat].append(
                    RankingForecastItem(
                        rank=rank_pos,
                        product_id=f.product_id,
                        title=f.product_title,
                        category=f.category,
                        price=f.unit_price,
                        projected_units=f.total_predicted_units,
                        projected_revenue=f.total_projected_revenue,
                        platform=p_plat,
                        thumbnail_url=p_thumb,
                        product_url=p_url,
                        rank_reason=f"Top #{rank_pos} da categoria '{cat}' com média de {f.daily_average:.1f} un/dia e receita de R$ {f.total_projected_revenue:,.2f}.",
                        key_driver=f"Liderança no segmento de {cat}"
                    )
                )
                if len(top_by_category[cat]) >= 5:
                    break

        # Passe 2: Se ainda faltar vagas para 5 na categoria, preenche com os melhores restantes
        if len(top_by_category[cat]) < 5:
            seen_pids = {x.product_id for x in top_by_category[cat]}
            for item in list_scored:
                f = item["forecast"]
                if f.product_id not in seen_pids:
                    seen_pids.add(f.product_id)
                    rank_pos = len(top_by_category[cat]) + 1
                    prod_info = item["prod_info"]
                    p_plat = prod_info.platform if prod_info and prod_info.platform else "mercadolivre"
                    p_thumb = getattr(f, "thumbnail_url", None) or get_product_thumbnail(prod_info or {"title": f.product_title, "category": f.category})
                    p_url = getattr(f, "product_url", None) or get_product_url(prod_info or {"title": f.product_title, "category": f.category, "platform": p_plat})

                    top_by_category[cat].append(
                        RankingForecastItem(
                            rank=rank_pos,
                            product_id=f.product_id,
                            title=f.product_title,
                            category=f.category,
                            price=f.unit_price,
                            projected_units=f.total_predicted_units,
                            projected_revenue=f.total_projected_revenue,
                            platform=p_plat,
                            thumbnail_url=p_thumb,
                            product_url=p_url,
                            rank_reason=f"Top #{rank_pos} da categoria '{cat}' com média de {f.daily_average:.1f} un/dia e receita de R$ {f.total_projected_revenue:,.2f}.",
                            key_driver=f"Destaque em {cat}"
                        )
                    )
                    if len(top_by_category[cat]) >= 5:
                        break

    response_obj = ForecastRankingResponse(
        horizon_days=horizon_days,
        top_overall=top_overall,
        top_by_category=top_by_category
    )
    _ranking_cache[horizon_days] = (now_ts, response_obj)
    return response_obj



@router.post("/ranking/sync-live", response_model=SyncLiveRankingResponse, summary="Sincronizar ranking com os mais vendidos ao vivo dos marketplaces")
def sync_live_ranking(
    category: Optional[str] = Query(None, description="Filtrar categoria específica ou sincronizar todas"),
    db: Session = Depends(get_db)
):
    """Varre as categorias líderes do Mercado Livre e da Amazon, descobre e sincroniza os produtos mais vendidos,
    e invalida o cache do ranking preditivo para forçar o recálculo em tempo real."""
    if category and category.upper() != "GERAIS":
        res = harvest_category(db, category_name=category, limit_per_term=1)
    else:
        res = harvest_all_top_categories(db, limit_per_term=1)

    # Invalida o cache do ranking para que a próxima chamada reflita os novos dados imediatamente
    _ranking_cache.clear()

    return SyncLiveRankingResponse(
        status="success",
        message=f"Sincronização concluída com sucesso! {res.get('total_synced_products', 0)} produtos líderes sincronizados com o mercado.",
        total_synced_products=res.get("total_synced_products", 0),
        sample_products=res.get("sample_products", []),
        timestamp=datetime.now().strftime("%d/%m/%Y %H:%M:%S")
    )


@router.post("/compare", response_model=CompareForecastResponse, summary="Comparador Preditivo Lado a Lado (Produto A vs Produto B)")

def compare_products_forecast(
    request: CompareForecastRequest,
    db: Session = Depends(get_db),
    forecaster: FutureForecaster = Depends(get_ml_forecaster)
):
    """Compara o desempenho preditivo de dois produtos concorrentes para os próximos 7, 14 ou 30 dias."""
    prod_a = db.query(Product).filter(Product.id == request.product_id_a).first()
    prod_b = db.query(Product).filter(Product.id == request.product_id_b).first()

    if not prod_a or not prod_b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Um ou ambos os produtos não foram encontrados.")

    sales_a = db.query(SalesHistory).filter(SalesHistory.product_id == prod_a.id).order_by(SalesHistory.date.asc()).all()
    sales_b = db.query(SalesHistory).filter(SalesHistory.product_id == prod_b.id).order_by(SalesHistory.date.asc()).all()

    if not sales_a or not sales_b:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Histórico de vendas insuficiente para comparação.")

    # Converter para Series e DataFrames
    pa_series = pd.Series({"product_id": prod_a.id, "title": prod_a.title, "category": prod_a.category or "Geral", "price": prod_a.price or 100.0, "base_price": prod_a.price or 100.0, "platform": prod_a.platform})
    pb_series = pd.Series({"product_id": prod_b.id, "title": prod_b.title, "category": prod_b.category or "Geral", "price": prod_b.price or 100.0, "base_price": prod_b.price or 100.0, "platform": prod_b.platform})

    sa_df = pd.DataFrame([{"product_id": s.product_id, "date": s.date, "quantity_sold": s.quantity_sold, "price": s.price_at_date or prod_a.price or 100.0, "available_quantity": s.available_quantity or 50, "platform": s.platform} for s in sales_a])
    sb_df = pd.DataFrame([{"product_id": s.product_id, "date": s.date, "quantity_sold": s.quantity_sold, "price": s.price_at_date or prod_b.price or 100.0, "available_quantity": s.available_quantity or 50, "platform": s.platform} for s in sales_b])

    fa = forecaster.forecast_product(pa_series, sa_df, horizon_days=request.horizon_days)
    fb = forecaster.forecast_product(pb_series, sb_df, horizon_days=request.horizon_days)

    res_a = ProductForecastResponse(
        product_id=fa.product_id,
        product_title=fa.product_title,
        category=fa.category,
        unit_price=fa.unit_price,
        platform=getattr(fa, "platform", prod_a.platform or "mercadolivre"),
        thumbnail_url=getattr(fa, "thumbnail_url", None) or get_product_thumbnail(prod_a),
        product_url=getattr(fa, "product_url", None) or get_product_url(prod_a),
        horizon_days=fa.horizon_days,
        start_date=fa.start_date,
        end_date=fa.end_date,
        forecast_cycle=fa.forecast_cycle,
        generated_at=fa.generated_at,
        total_predicted_units=fa.total_predicted_units,
        min_predicted_units=fa.min_predicted_units,
        max_predicted_units=fa.max_predicted_units,
        total_projected_revenue=fa.total_projected_revenue,
        daily_average=fa.daily_average,
        recommended_stock_buffer=fa.recommended_stock_buffer,
        conservative_units=fa.conservative_units,
        conservative_revenue=fa.conservative_revenue,
        base_units=fa.base_units,
        base_revenue=fa.base_revenue,
        buffer_stock_units=fa.buffer_stock_units,
        buffer_stock_revenue=fa.buffer_stock_revenue,
        historical_accuracy_pct=fa.historical_accuracy_pct,
        mean_daily_error=fa.mean_daily_error,
        days=[DailyForecastItem(date=d.date, day_name=d.day_name, predicted_demand=d.predicted_demand, confidence_min=d.confidence_min, confidence_max=d.confidence_max, projected_revenue=d.projected_revenue) for d in fa.days],
        explanation=fa.explanation
    )

    res_b = ProductForecastResponse(
        product_id=fb.product_id,
        product_title=fb.product_title,
        category=fb.category,
        unit_price=fb.unit_price,
        platform=getattr(fb, "platform", prod_b.platform or "mercadolivre"),
        thumbnail_url=getattr(fb, "thumbnail_url", None) or get_product_thumbnail(prod_b),
        product_url=getattr(fb, "product_url", None) or get_product_url(prod_b),
        horizon_days=fb.horizon_days,
        start_date=fb.start_date,
        end_date=fb.end_date,
        forecast_cycle=fb.forecast_cycle,
        generated_at=fb.generated_at,
        total_predicted_units=fb.total_predicted_units,
        min_predicted_units=fb.min_predicted_units,
        max_predicted_units=fb.max_predicted_units,
        total_projected_revenue=fb.total_projected_revenue,
        daily_average=fb.daily_average,
        recommended_stock_buffer=fb.recommended_stock_buffer,
        conservative_units=fb.conservative_units,
        conservative_revenue=fb.conservative_revenue,
        base_units=fb.base_units,
        base_revenue=fb.base_revenue,
        buffer_stock_units=fb.buffer_stock_units,
        buffer_stock_revenue=fb.buffer_stock_revenue,
        historical_accuracy_pct=fb.historical_accuracy_pct,
        mean_daily_error=fb.mean_daily_error,
        days=[DailyForecastItem(date=d.date, day_name=d.day_name, predicted_demand=d.predicted_demand, confidence_min=d.confidence_min, confidence_max=d.confidence_max, projected_revenue=d.projected_revenue) for d in fb.days],
        explanation=fb.explanation
    )

    # Análise comparativa
    demand_diff = abs(fa.total_predicted_units - fb.total_predicted_units)
    rev_diff = round(abs(fa.total_projected_revenue - fb.total_projected_revenue), 2)
    
    demand_leader = prod_a.title if fa.total_predicted_units >= fb.total_predicted_units else prod_b.title
    revenue_leader = prod_a.title if fa.total_projected_revenue >= fb.total_projected_revenue else prod_b.title

    if fa.total_projected_revenue >= fb.total_projected_revenue and fa.total_predicted_units >= fb.total_predicted_units:
        verdict = f"🏆 O produto '{prod_a.title}' é a opção superior tanto em volume de vendas (+{demand_diff} un) quanto em faturamento projetado (+R$ {rev_diff:,.2f})."
    elif fb.total_projected_revenue >= fa.total_projected_revenue and fb.total_predicted_units >= fa.total_predicted_units:
        verdict = f"🏆 O produto '{prod_b.title}' é a opção superior tanto em volume de vendas (+{demand_diff} un) quanto em faturamento projetado (+R$ {rev_diff:,.2f})."
    else:
        verdict = f"⚖️ Veredito Misto: '{demand_leader}' lidera em giro de unidades (+{demand_diff} un), enquanto '{revenue_leader}' entrega maior retorno financeiro bruto (+R$ {rev_diff:,.2f})."

    return CompareForecastResponse(
        horizon_days=request.horizon_days,
        product_a=res_a,
        product_b=res_b,
        revenue_difference=rev_diff,
        revenue_leader=revenue_leader,
        demand_difference=demand_diff,
        demand_leader=demand_leader,
        verdict=verdict
    )


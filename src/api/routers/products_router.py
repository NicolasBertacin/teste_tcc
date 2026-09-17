"""Router de Produtos, Categorias e Séries Históricas de Vendas."""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from src.api.dependencies import get_db
from src.database.models import Product, SalesHistory
from src.schemas.product_schema import (
    ProductResponse,
    ProductDetailResponse,
    ProductListResponse,
    SalesHistoryResponse,
    TopProductItem
)

router = APIRouter(prefix="/products", tags=["Produtos & Histórico"])


@router.get("", response_model=ProductListResponse, summary="Listar produtos com busca e paginação")
def list_products(
    page: int = Query(1, ge=1, description="Número da página"),
    limit: int = Query(20, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, description="Filtro de busca por nome ou categoria"),
    category: Optional[str] = Query(None, description="Filtro de categoria"),
    platform: Optional[str] = Query(None, description="Filtro de plataforma (mercadolivre, amazon)"),
    db: Session = Depends(get_db)
):
    """Retorna lista de produtos cadastrados com paginação e totalizadores de vendas."""
    query = db.query(Product).filter(Product.is_active.is_(True))

    if search:
        search_fmt = f"%{search}%"
        query = query.filter(
            (Product.title.ilike(search_fmt)) | (Product.category.ilike(search_fmt))
        )

    if category:
        query = query.filter(Product.category == category)

    if platform:
        query = query.filter(Product.platform == platform)

    total = query.count()
    offset = (page - 1) * limit
    products = query.order_by(Product.id).offset(offset).limit(limit).all()

    # Agregar totais de venda por produto
    items = []
    for prod in products:
        sales_agg = db.query(
            func.sum(SalesHistory.quantity_sold).label("total_units"),
            func.sum(SalesHistory.quantity_sold * func.coalesce(SalesHistory.price_at_date, prod.price or 0.0)).label("total_rev")
        ).filter(SalesHistory.product_id == prod.id).first()

        total_units = int(sales_agg.total_units or 0)
        total_rev = float(sales_agg.total_rev or 0.0)

        item = ProductResponse(
            id=prod.id,
            external_id=prod.external_id,
            platform=prod.platform,
            title=prod.title,
            category=prod.category,
            price=prod.price,
            currency=prod.currency,
            condition=prod.condition,
            url=prod.url,
            attributes=prod.attributes,
            is_active=prod.is_active,
            created_at=prod.created_at,
            total_sold_units=total_units,
            total_revenue=round(total_rev, 2)
        )
        items.append(item)

    pages = (total + limit - 1) // limit if total > 0 else 1

    return ProductListResponse(
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        items=items
    )


@router.get("/categories", response_model=List[str], summary="Listar todas as categorias distintas")
def get_categories(db: Session = Depends(get_db)):
    """Retorna lista única de categorias presentes na base de produtos."""
    categories = db.query(Product.category).filter(Product.category.isnot(None)).distinct().all()
    return [c[0] for c in categories if c[0]]


@router.get("/top-sales", response_model=List[TopProductItem], summary="Ranking dos produtos mais vendidos")
def get_top_selling_products(
    limit: int = Query(10, ge=1, le=50, description="Quantidade de produtos no ranking"),
    category: Optional[str] = Query(None, description="Filtro opcional de categoria"),
    db: Session = Depends(get_db)
):
    """Retorna os produtos com maior volume histórico de vendas acumuladas."""
    query = db.query(
        Product.id,
        Product.title,
        Product.category,
        Product.price,
        func.sum(SalesHistory.quantity_sold).label("total_sold"),
        func.sum(SalesHistory.quantity_sold * func.coalesce(SalesHistory.price_at_date, Product.price)).label("total_revenue")
    ).join(SalesHistory, Product.id == SalesHistory.product_id)

    if category:
        query = query.filter(Product.category == category)

    results = query.group_by(Product.id, Product.title, Product.category, Product.price)\
                   .order_by(desc("total_sold"))\
                   .limit(limit)\
                   .all()

    items = []
    for rank, (p_id, title, cat, price, total_sold, total_rev) in enumerate(results, start=1):
        items.append(TopProductItem(
            rank=rank,
            id=p_id,
            title=title,
            category=cat or "Geral",
            price=float(price or 0.0),
            quantity_sold=int(total_sold or 0),
            revenue=round(float(total_rev or 0.0), 2)
        ))
    return items


@router.get("/{product_id}", response_model=ProductDetailResponse, summary="Obter detalhes de um produto específico")
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Retorna as informações completas de um produto e seu histórico recente."""
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")

    sales = db.query(SalesHistory)\
              .filter(SalesHistory.product_id == product_id)\
              .order_by(SalesHistory.date.desc())\
              .limit(30)\
              .all()

    sales_history_list = []
    total_units = 0
    total_rev = 0.0

    for s in reversed(sales):
        unit_price = s.price_at_date or prod.price or 0.0
        rev = round(s.quantity_sold * unit_price, 2)
        total_units += s.quantity_sold
        total_rev += rev

        sales_history_list.append(SalesHistoryResponse(
            id=s.id,
            product_id=s.product_id,
            date=s.date,
            quantity_sold=s.quantity_sold,
            price_at_date=unit_price,
            available_quantity=s.available_quantity,
            platform=s.platform,
            revenue=rev
        ))

    return ProductDetailResponse(
        id=prod.id,
        external_id=prod.external_id,
        platform=prod.platform,
        title=prod.title,
        category=prod.category,
        price=prod.price,
        currency=prod.currency,
        condition=prod.condition,
        url=prod.url,
        attributes=prod.attributes,
        is_active=prod.is_active,
        created_at=prod.created_at,
        total_sold_units=total_units,
        total_revenue=round(total_rev, 2),
        sales_history=sales_history_list
    )


@router.get("/{product_id}/history", response_model=List[SalesHistoryResponse], summary="Obter série temporal de vendas")
def get_product_sales_history(
    product_id: int,
    days: int = Query(30, ge=7, le=365, description="Quantidade de dias históricos"),
    db: Session = Depends(get_db)
):
    """Retorna os dados cronológicos de vendas para alimentação de gráficos no frontend."""
    prod = db.query(Product).filter(Product.id == product_id).first()
    if not prod:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado.")

    sales = db.query(SalesHistory)\
              .filter(SalesHistory.product_id == product_id)\
              .order_by(SalesHistory.date.desc())\
              .limit(days)\
              .all()

    history = []
    for s in reversed(sales):
        price = s.price_at_date or prod.price or 0.0
        history.append(SalesHistoryResponse(
            id=s.id,
            product_id=s.product_id,
            date=s.date,
            quantity_sold=s.quantity_sold,
            price_at_date=price,
            available_quantity=s.available_quantity,
            platform=s.platform,
            revenue=round(s.quantity_sold * price, 2)
        ))
    return history

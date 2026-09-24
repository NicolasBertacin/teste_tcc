"""Testes unitários e de integração para a API FastAPI do TrendCommerce AI."""

import pytest
from fastapi.testclient import TestClient
from src.api.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    """Testa endpoint de health check."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"


def test_auth_login_and_me(client):
    """Testa login com credenciais válidas e obtenção do usuário autenticado."""
    response = client.post("/api/v1/auth/login", json={
        "email": "admin@trendecommerce.com",
        "password": "admin123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@trendecommerce.com"

    token = data["access_token"]
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@trendecommerce.com"


def test_auth_register_duplicate(client):
    """Testa tentativa de cadastro duplicado."""
    response = client.post("/api/v1/auth/register", json={
        "email": "admin@trendecommerce.com",
        "password": "outrasenha123",
        "name": "Admin Duplicado"
    })
    assert response.status_code == 400


def test_auth_forgot_and_reset_password(client):
    """Testa fluxo de recuperação de senha com código OTP."""
    req_resp = client.post("/api/v1/auth/forgot-password", json={
        "email": "admin@trendecommerce.com"
    })
    assert req_resp.status_code == 200
    assert req_resp.json()["success"] is True
    assert "admin@trendecommerce.com" in req_resp.json()["message"]

    reset_resp = client.post("/api/v1/auth/reset-password", json={
        "email": "admin@trendecommerce.com",
        "code": "1234",
        "new_password": "novasenhaforte123"
    })
    assert reset_resp.status_code == 200

    # Restaurar senha admin
    client.post("/api/v1/auth/reset-password", json={
        "email": "admin@trendecommerce.com",
        "code": "1234",
        "new_password": "admin123"
    })


def test_products_list_and_categories(client):
    """Testa listagem paginada e categorias de produtos."""
    response = client.get("/api/v1/products?page=1&limit=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["page"] == 1
    assert len(data["items"]) > 0

    cat_resp = client.get("/api/v1/products/categories")
    assert cat_resp.status_code == 200
    assert isinstance(cat_resp.json(), list)


def test_top_selling_products(client):
    """Testa ranking dos produtos mais vendidos."""
    response = client.get("/api/v1/products/top-sales?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) > 0
    assert data[0]["rank"] == 1
    assert "quantity_sold" in data[0]


def test_product_detail_and_history(client):
    """Testa obtenção de detalhes e histórico temporal de um produto."""
    prod_resp = client.get("/api/v1/products/1")
    assert prod_resp.status_code == 200
    assert prod_resp.json()["id"] == 1

    hist_resp = client.get("/api/v1/products/1/history?days=14")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) > 0
    assert "quantity_sold" in history[0]


def test_forecast_predict_xgboost(client):
    """Testa execução do modelo de Machine Learning (XGBoost) para previsão futura."""
    response = client.post("/api/v1/forecast/predict", json={
        "product_id": 1,
        "horizon_days": 7
    })
    assert response.status_code == 200
    data = response.json()
    assert data["product_id"] == 1
    assert data["horizon_days"] == 7
    assert len(data["days"]) == 7
    assert data["total_predicted_units"] > 0
    assert data["total_projected_revenue"] > 0
    assert "confidence_min" in data["days"][0]
    assert "confidence_max" in data["days"][0]


def test_forecast_ranking(client):
    """Testa ranking preditivo de 30 dias."""
    response = client.get("/api/v1/forecast/ranking?horizon_days=30")
    assert response.status_code == 200
    data = response.json()
    assert len(data["top_overall"]) <= 7
    assert isinstance(data["top_by_category"], dict)


def test_trends_search(client):
    """Testa busca de tendências de pesquisa."""
    response = client.get("/api/v1/trends/search?limit=10")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

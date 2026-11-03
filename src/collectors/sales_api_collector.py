"""Coletor Oficial da API Local de Histórico de Vendas (TrendCommerce AI).

Consome a API local de vendas (http://127.0.0.1:8000) e a base de alta
performance historico_vendas.db (500 produtos e 1.249.000 registros).
Substitui integralmente as antigas APIs do Mercado Livre e Amazon.
"""

import os
import sqlite3
import logging
from typing import List, Dict, Any, Optional
import requests

from .base_collector import BaseCollector, CollectorResult

logger = logging.getLogger(__name__)


class SalesApiCollector(BaseCollector):
    """Coletor integrado para a API Local de Histórico de Vendas."""

    DEFAULT_BASE_URL = "http://127.0.0.1:8000"
    DEFAULT_DB_PATH = r"C:\Users\Aluno\Desktop\API_Historico_Vendas\data\historico_vendas.db"

    def __init__(self, base_url: Optional[str] = None, db_path: Optional[str] = None):
        super().__init__(name="Sales History Local API")
        self.base_url = (base_url or os.getenv("SALES_API_URL", self.DEFAULT_BASE_URL)).rstrip("/")
        self.db_path = db_path or os.getenv("SALES_DB_PATH", self.DEFAULT_DB_PATH)
        self._is_authenticated = True

    def authenticate(self) -> bool:
        """A API local de vendas não requer autenticação bearer."""
        self._is_authenticated = True
        return True

    def validate_response(self, response: Any) -> bool:
        """Valida a resposta da API."""
        return isinstance(response, (list, dict))

    def is_api_online(self) -> bool:
        """Verifica se a API HTTP está respondendo."""
        try:
            resp = requests.get(f"{self.base_url}/health", timeout=2)
            if resp.status_code == 200:
                data = resp.json()
                return data.get("status") == "healthy" and data.get("database_connected", False)
        except Exception:
            pass
        return False

    def fetch_categories(self) -> List[str]:
        """Obtém a lista dos 5 nichos comerciais da plataforma."""
        if self.is_api_online():
            try:
                resp = requests.get(f"{self.base_url}/categorias", timeout=5)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning(f"Erro ao buscar categorias via HTTP: {e}")

        # Contingência direta via SQLite
        return self._fetch_categories_sqlite()

    def _fetch_categories_sqlite(self) -> List[str]:
        if not os.path.exists(self.db_path):
            return ["Beleza e cuidados pessoais", "Casa e decoração", "Eletrônicos", "Esportes e fitness", "Moda e acessórios"]
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT DISTINCT categoria FROM produtos ORDER BY categoria")
        cats = [r[0] for r in c.fetchall() if r[0]]
        conn.close()
        return cats

    def fetch_all_products(self) -> List[Dict[str, Any]]:
        """Obtém o catálogo completo de todos os produtos cadastrados."""
        if self.is_api_online():
            try:
                resp = requests.get(f"{self.base_url}/produtos", params={"page": 1, "page_size": 500}, timeout=10)
                if resp.status_code == 200:
                    data = resp.json()
                    if isinstance(data, list) and len(data) > 0:
                        return data
                    if isinstance(data, dict) and "data" in data:
                        return data["data"]
            except Exception as e:
                logger.warning(f"Erro ao buscar produtos via HTTP: {e}")

        return self._fetch_products_sqlite()

    def _fetch_products_sqlite(self) -> List[Dict[str, Any]]:
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Arquivo da base de vendas não encontrado: {self.db_path}")

        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("""
            SELECT id, nome, categoria, preco_base, volume_base, perfil_sazonal,
                   grupo_anomalia, sensibilidade_preco, created_at
            FROM produtos
            ORDER BY id ASC
        """)
        rows = c.fetchall()
        conn.close()

        products = []
        for r in rows:
            products.append({
                "id": r[0],
                "nome": r[1],
                "categoria": r[2],
                "preco_base": float(r[3] or 0.0),
                "volume_base": int(r[4] or 0),
                "perfil_sazonal": r[5] or "REGULAR",
                "grupo_anomalia": r[6] or "SEM_ANOMALIA",
                "sensibilidade_preco": float(r[7] or 1.0),
                "created_at": r[8]
            })
        return products

    def fetch_seasonality_profiles(self) -> List[Dict[str, Any]]:
        """Obtém o detalhamento dos perfis sazonais."""
        if self.is_api_online():
            try:
                resp = requests.get(f"{self.base_url}/sazonalidade", timeout=5)
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning(f"Erro ao buscar perfis sazonais via HTTP: {e}")

        # Perfis padrões de referência da base
        return [
            {"perfil": "NATAL_FIM_DE_ANO", "meses_pico": [11, 12], "descricao": "Pico natalino e fim de ano"},
            {"perfil": "BLACK_FRIDAY_TECH", "meses_pico": [11], "descricao": "Pico Black Friday"},
            {"perfil": "VERAO_CALOR", "meses_pico": [12, 1, 2], "descricao": "Pico de verão e calor"},
            {"perfil": "FITNESS_ANO_NOVO", "meses_pico": [1, 2], "descricao": "Resoluções de ano novo e fitness"},
            {"perfil": "VOLTA_AS_AULAS", "meses_pico": [1, 2], "descricao": "Material e equipamentos escolares"},
            {"perfil": "INVERNO_FRIO", "meses_pico": [5, 6, 7], "descricao": "Inverno e roupas térmicas"},
            {"perfil": "DIA_DAS_MAES", "meses_pico": [5], "descricao": "Presentes e utilidades dia das mães"},
            {"perfil": "DIA_DOS_NAMORADOS", "meses_pico": [6], "descricao": "Cosméticos e presentes namorados"},
            {"perfil": "DIA_DOS_PAIS", "meses_pico": [8], "descricao": "Presentes masculinos dia dos pais"},
            {"perfil": "MULTISSAZONAL_TECH", "meses_pico": [2, 7, 11, 12], "descricao": "Múltiplos picos no ano"},
            {"perfil": "REGULAR", "meses_pico": [], "descricao": "Consumo estável anual"}
        ]

    def fetch_sales_history_bulk(self, days_limit: Optional[int] = None) -> List[tuple]:
        """Extrai vendas em massa com máxima performance diretamente do SQLite.
        
        Retorna tuplas (produto_id, data_venda, vendas, preco, categoria).
        """
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Base de vendas não encontrada: {self.db_path}")

        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        if days_limit:
            query = f"""
                SELECT produto_id, data_venda, vendas, preco, categoria
                FROM vendas_historicas
                WHERE data_venda >= date('2026-11-02', '-{days_limit} days')
                ORDER BY produto_id, data_venda ASC
            """
        else:
            query = """
                SELECT produto_id, data_venda, vendas, preco, categoria
                FROM vendas_historicas
                ORDER BY produto_id, data_venda ASC
            """
        c.execute(query)
        rows = c.fetchall()
        conn.close()
        return rows

    def collect(self, **kwargs) -> CollectorResult:
        """Implementação da interface BaseCollector."""
        endpoint = kwargs.get("endpoint", "products")
        try:
            if endpoint == "products":
                return self._create_success_result(self.fetch_all_products())
            elif endpoint == "categories":
                return self._create_success_result(self.fetch_categories())
            elif endpoint == "seasonality":
                return self._create_success_result(self.fetch_seasonality_profiles())
            else:
                return self._create_error_result(f"Endpoint não suportado: {endpoint}")
        except Exception as e:
            logger.error(f"Erro na coleta SalesApiCollector: {e}")
            return self._create_error_result(str(e))

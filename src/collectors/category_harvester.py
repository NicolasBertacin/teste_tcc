"""Coletor e Sincronizador de Categorias do Mercado Livre e Amazon — TrendCommerce AI.

Varre os principais nichos de mercado, descobre produtos populares em tempo real
e os sincroniza com a base de dados preditiva para geração de rankings fiéis ao mercado.
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session

from src.database.models import Product
from src.collectors.live_discovery_engine import live_discovery

logger = logging.getLogger(__name__)

# Mapeamento consolidado dos produtos e termos mais vendidos por categoria no e-commerce brasileiro (Mercado Livre e Amazon)
TOP_MARKET_CATEGORIES: Dict[str, List[str]] = {
    "Tecnologia": [
        # Smartphones líderes
        "iPhone 15 Pro Max", "Samsung Galaxy S24 Ultra", "Xiaomi Redmi Note 13", "Motorola Edge 50",
        # Informática & Hardware
        "Notebook Dell Inspiron", "MacBook Air M2", "SSD 1TB Kingston NV2", "Monitor Gamer 24 AOC",
        "Placa de Vídeo RTX 4060", "Placa de Vídeo GeForce GT 710",
        # Games & Consoles
        "PlayStation 5 Slim", "Console Xbox Series S", "Nintendo Switch OLED", "Controle PS5 DualSense", "Headset Gamer HyperX",
        # Áudio & Smart Devices
        "Apple AirPods Pro 2", "Fone Bluetooth JBL Tune 520", "Echo Dot 5ª Geração Alexa", "Caixa de Som JBL Flip 6"
    ],
    "Eletrodomésticos": [
        "Fritadeira Air Fryer Mondial 5L", "Cafeteira Nespresso Essenza", "Aspirador Robo WAP",
        "Liquidificador Osterizer", "Micro-ondas 20L Consul"
    ],
    "Esportes e Fitness": [
        "Creatina Monohidratada 300g Max Titanium", "Whey Protein 100% Growth", "Pre Treino C4 Beta Pump",
        "Tenis Nike Revolution 7", "Smartwatch Galaxy Watch 6"
    ],
    "Casa e Móveis": [
        "Fechadura Digital Intelbras", "Lampada Inteligente Positivo", "Camera de Seguranca Wi-Fi",
        "Cadeira de Escritório Ergonômica"
    ],
    "Beleza e Cuidado Pessoal": [
        "Perfume Sauvage Dior", "Perfume 1 Million Paco Rabanne", "Protetor Solar La Roche-Posay Anthelios",
        "Secador de Cabelo Taiff 2000W"
    ],
    "Ferramentas": [
        "Parafusadeira e Furadeira de Impacto Bosch", "Jogo de Ferramentas Tramontina 110 Pecas",
        "Lavadora de Alta Pressao Karcher"
    ],
    "Moda": [
        "Chinelo Havaianas Top Branco", "Chinelo Havaianas Top Preto", "Camiseta Básica Algodão 100%",
        "Tenis Olympikus Corre 3"
    ],
    "Acessórios para Veículos": [
        "Suporte Veicular para Celular", "Compressor de Ar Portátil Digital Recarregável", "Rastreador Veicular GPS"
    ],
    "Supermercado": [
        "Café Especial 100% Arábica 500g", "Azeite de Oliva Extra Virgem 500ml"
    ],
    "Livros": [
        "Livro A Psicologia Financeira", "Livro Hábitos Atômicos", "Livro O Homem Mais Rico da Babilônia"
    ]
}

# Lista plana com todos os termos semente para varredura completa
TOP_MARKET_SEEDS: List[str] = [
    term for terms in TOP_MARKET_CATEGORIES.values() for term in terms
]


def harvest_category(db: Session, category_name: str, limit_per_term: int = 1) -> Dict[str, Any]:
    """Varre e sincroniza os produtos mais vendidos de uma categoria específica."""
    terms = TOP_MARKET_CATEGORIES.get(category_name, [])
    if not terms:
        # Tenta busca flexível por case-insensitive
        for cat, cat_terms in TOP_MARKET_CATEGORIES.items():
            if cat.lower() == category_name.lower():
                terms = cat_terms
                break

    if not terms:
        terms = [category_name]

    total_added = 0
    synced_titles = []

    for term in terms:
        try:
            prods = live_discovery.discover_and_import(term, db, max_items=limit_per_term)
            for p in prods:
                if p.title not in synced_titles:
                    synced_titles.append(p.title)
                    total_added += 1
        except Exception as e:
            logger.error(f"Erro ao colher termo '{term}' na categoria '{category_name}': {e}")

    return {
        "status": "success",
        "category": category_name,
        "total_synced_products": total_added,
        "sample_products": synced_titles[:10]
    }


def harvest_all_top_categories(db: Session, limit_per_term: int = 1) -> Dict[str, Any]:
    """Varre todos os termos semente de mercado e sincroniza o catálogo com a base local."""
    total_added = 0
    synced_titles = []

    for term in TOP_MARKET_SEEDS:
        try:
            prods = live_discovery.discover_and_import(term, db, max_items=limit_per_term)
            for p in prods:
                if p.title not in synced_titles:
                    synced_titles.append(p.title)
                    total_added += 1
        except Exception as e:
            logger.error(f"Erro ao colher termo '{term}': {e}")

    return {
        "status": "success",
        "total_synced_products": total_added,
        "sample_products": synced_titles[:10]
    }

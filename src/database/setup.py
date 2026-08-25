"""Script de setup e migração do banco de dados.

Uso:
    python -m src.database.setup [comando]

Comandos:
    create    - Cria todas as tabelas no banco de dados
    drop      - Remove todas as tabelas (CUIDADO!)
    seed      - Popula com dados de exemplo
    status    - Mostra status das tabelas
    reset     - Drop + Create + Seed

Para desenvolvimento local, utiliza SQLite.
Para produção, configure DATABASE_URL no .env apontando para PostgreSQL.
"""

import sys
import os
import logging
from datetime import datetime, timedelta
from pathlib import Path

# Adicionar raiz do projeto ao path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import inspect, text
from src.database.connection import DatabaseManager
from src.database.models import Base, Product, SalesHistory, SearchTrend, CollectionLog

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)


def get_db_manager() -> DatabaseManager:
    """Obtém o gerenciador de banco de dados.
    
    Em desenvolvimento, usa SQLite se DATABASE_URL não estiver configurado
    ou se estiver com o placeholder padrão.
    """
    db_url = os.getenv("DATABASE_URL", "")
    
    # Se não tem PostgreSQL configurado, usar SQLite para desenvolvimento
    if not db_url or "user:password" in db_url:
        db_path = Path(__file__).parent.parent.parent / "data" / "trendcommerce_dev.db"
        db_path.parent.mkdir(parents=True, exist_ok=True)
        db_url = f"sqlite:///{db_path}"
        logger.info(f"Usando SQLite para desenvolvimento: {db_path}")
    else:
        logger.info(f"Usando banco de dados: {db_url.split('@')[-1] if '@' in db_url else 'configurado'}")
    
    return DatabaseManager(database_url=db_url)


def create_tables(manager: DatabaseManager):
    """Cria todas as tabelas."""
    logger.info("Criando tabelas...")
    Base.metadata.create_all(manager.engine)
    
    inspector = inspect(manager.engine)
    tables = inspector.get_table_names()
    logger.info(f"Tabelas criadas: {', '.join(tables)}")
    return tables


def drop_tables(manager: DatabaseManager):
    """Remove todas as tabelas."""
    logger.warning("Removendo todas as tabelas...")
    Base.metadata.drop_all(manager.engine)
    logger.info("Tabelas removidas.")


def seed_data(manager: DatabaseManager):
    """Popula com dados de exemplo para desenvolvimento."""
    import numpy as np
    np.random.seed(42)
    
    logger.info("Populando banco com dados de exemplo...")
    
    with manager.session() as session:
        # Criar produtos de exemplo
        products = [
            Product(
                external_id="MLB001",
                platform="mercadolivre",
                title="Notebook Dell Inspiron 15 Intel Core i7 16GB 512GB SSD",
                category="Eletrônicos",
                price=3499.99,
                currency="BRL",
                condition="new",
            ),
            Product(
                external_id="MLB002",
                platform="mercadolivre",
                title="iPhone 15 Pro 256GB",
                category="Celulares",
                price=7999.00,
                currency="BRL",
                condition="new",
            ),
            Product(
                external_id="MLB003",
                platform="mercadolivre",
                title="Smart TV Samsung 55\" 4K Crystal UHD",
                category="Eletrônicos",
                price=2599.00,
                currency="BRL",
                condition="new",
            ),
            Product(
                external_id="ASIN001",
                platform="amazon",
                title="Echo Dot 5ª Geração com Alexa",
                category="Eletrônicos",
                price=349.99,
                currency="BRL",
                condition="new",
            ),
            Product(
                external_id="ASIN002",
                platform="amazon",
                title="Kindle Paperwhite 16GB",
                category="Eletrônicos",
                price=599.00,
                currency="BRL",
                condition="new",
            ),
        ]
        
        for product in products:
            session.add(product)
        session.flush()  # Para obter os IDs
        
        logger.info(f"Criados {len(products)} produtos de exemplo")
        
        # Criar histórico de vendas (90 dias)
        sales_count = 0
        for product in products:
            base_sales = np.random.randint(5, 50)
            base_price = product.price
            
            for day in range(90):
                date = datetime.now() - timedelta(days=90 - day)
                quantity = max(0, base_sales + np.random.randint(-10, 15))
                price = round(base_price * np.random.uniform(0.9, 1.1), 2)
                
                sale = SalesHistory(
                    product_id=product.id,
                    date=date,
                    quantity_sold=quantity,
                    price_at_date=price,
                    available_quantity=np.random.randint(10, 200),
                    platform=product.platform,
                )
                session.add(sale)
                sales_count += 1
        
        logger.info(f"Criados {sales_count} registros de histórico de vendas")
        
        # Criar tendências de pesquisa (30 dias)
        keywords = ["notebook", "smartphone", "smart tv", "echo dot", "kindle"]
        trends_count = 0
        
        for keyword in keywords:
            for day in range(30):
                date = datetime.now() - timedelta(days=30 - day)
                interest = np.random.randint(10, 100)
                
                trend = SearchTrend(
                    keyword=keyword,
                    date=date,
                    interest_score=interest,
                    source="mock",
                    is_mock=True,
                )
                session.add(trend)
                trends_count += 1
        
        logger.info(f"Criados {trends_count} registros de tendências")
        
        # Log da coleta
        log = CollectionLog(
            collector_name="seed_script",
            endpoint="seed_data",
            started_at=datetime.now(),
            finished_at=datetime.now(),
            records_collected=len(products) + sales_count + trends_count,
            success=True,
        )
        session.add(log)
    
    logger.info("Dados de exemplo inseridos com sucesso!")


def show_status(manager: DatabaseManager):
    """Mostra o status das tabelas."""
    inspector = inspect(manager.engine)
    tables = inspector.get_table_names()
    
    if not tables:
        logger.info("Nenhuma tabela encontrada. Execute 'create' primeiro.")
        return
    
    logger.info(f"\nTabelas encontradas: {len(tables)}")
    
    with manager.session() as session:
        for table in tables:
            try:
                result = session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.scalar()
                logger.info(f"  📊 {table}: {count} registros")
            except Exception as e:
                logger.warning(f"  ⚠️ {table}: erro ao contar ({e})")


def main():
    """Ponto de entrada do script de setup."""
    commands = {
        "create": "Criar tabelas",
        "drop": "Remover tabelas",
        "seed": "Popular com dados de exemplo",
        "status": "Mostrar status",
        "reset": "Reset completo (drop + create + seed)",
    }
    
    if len(sys.argv) < 2 or sys.argv[1] not in commands:
        print("\n📦 TrendCommerce AI - Setup do Banco de Dados")
        print("=" * 50)
        print("\nUso: python -m src.database.setup [comando]\n")
        print("Comandos disponíveis:")
        for cmd, desc in commands.items():
            print(f"  {cmd:10s} - {desc}")
        print()
        return
    
    command = sys.argv[1]
    manager = get_db_manager()
    
    if command == "create":
        create_tables(manager)
    elif command == "drop":
        confirm = input("⚠️  Tem certeza que deseja remover todas as tabelas? (s/N): ")
        if confirm.lower() == "s":
            drop_tables(manager)
        else:
            print("Operação cancelada.")
    elif command == "seed":
        seed_data(manager)
    elif command == "status":
        show_status(manager)
    elif command == "reset":
        confirm = input("⚠️  Isso vai APAGAR e RECRIAR o banco. Continuar? (s/N): ")
        if confirm.lower() == "s":
            drop_tables(manager)
            create_tables(manager)
            seed_data(manager)
            show_status(manager)
        else:
            print("Operação cancelada.")


if __name__ == "__main__":
    main()

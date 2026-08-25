# TrendCommerce AI

## Descrição
Sistema de inteligência artificial para previsão de demanda e análise de tendências no comércio eletrônico.

## Arquitetura
A arquitetura do sistema segue o seguinte pipeline:
APIs → API Guardian → Normalização → PostgreSQL → Feature Engineering → XGBoost → Previsão

## Tecnologias
- Python
- PostgreSQL
- XGBoost
- Amazon SP-API
- Mercado Livre API
- Google Trends

## Estrutura do Projeto
```
trendcommerce-ai/
├── config/
├── docs/
├── src/
├── .env.example
├── .gitignore
├── requirements.txt
├── setup.py
└── README.md
```

## Configuração
1. Instale as dependências: `pip install -r requirements.txt`
2. Configure as variáveis de ambiente: copie `.env.example` para `.env` e preencha os valores.
3. Configure o PostgreSQL de acordo com as variáveis de ambiente.

## Testes
Para rodar os testes, utilize o pytest:
```bash
pytest
```

## Licença
MIT License

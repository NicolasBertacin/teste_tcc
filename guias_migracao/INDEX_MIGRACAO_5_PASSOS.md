# 🚀 TrendCommerce AI — Guia Mestre de Migração em 5 Partes

> **Sistema Preditivo de Demanda, Tendências de Mercado e Inteligência de Preços para E-Commerce**  
> **Documento Índice e Roteiro de Migração para Novo Repositório**

---

## 📌 Apresentação

Este repositório foi modularizado em **5 documentos sequenciais, independentes e didáticos**, projetados para guiar a recriação passo a passo de toda a estrutura de pastas e códigos fonte em um novo repositório Git.

Cada parte contém:
1. **Estrutura de Pastas e Arquivos**: Diagrama em árvore da etapa.
2. **Comandos de Terminal**: Instruções de criação de diretórios para Windows (PowerShell) e Linux/macOS (Bash).
3. **Código Fonte Integral**: Todos os arquivos da etapa com código 100% completo, sem omissões e pronto para copiar e colar.
4. **Instruções de Validação e Teste**: Comandos práticos para certificar que a etapa está funcionando antes de prosseguir.
5. **Checklist de Conclusão**: Para acompanhamento do progresso.

---

## 🗺️ Mapa dos 5 Guias de Migração

| Parte | Documento | Tema Principal | Arquivos | Escopo e Responsabilidade |
|:---:|:---|:---|:---:|:---|
| **1** | [PARTE_1_INFRAESTRUTURA_E_BANCO_DE_DADOS.md](./PARTE_1_INFRAESTRUTURA_E_BANCO_DE_DADOS.md) | **Infraestrutura, Configurações, Schemas Pydantic e Banco de Dados** | 19 | Setup de ambiente, `.env.example`, `requirements.txt`, models SQLAlchemy (PostgreSQL / SQLite), schemas Pydantic v2 e scripts de setup/seed. |
| **2** | [PARTE_2_COLETORES_NORMALIZACAO_E_GUARDIAN.md](./PARTE_2_COLETORES_NORMALIZACAO_E_GUARDIAN.md) | **Segurança (API Guardian), Normalização e Coletores Multi-Canal** | 20 | Motor de governança e segurança (Whitelist, Checker, Credential Scanner), normalizador de dados e coletores da Amazon, Mercado Livre, Google Trends, Macro e Motor de Descoberta com IQR. |
| **3** | [PARTE_3_ENGENHARIA_FEATURES_E_MACHINE_LEARNING.md](./PARTE_3_ENGENHARIA_FEATURES_E_MACHINE_LEARNING.md) | **Engenharia de Features, Inteligência Artificial (XGBoost) e CLI** | 13 | Pipeline de features (médias móveis, lags, sazonalidade), treinamento e inferência do modelo XGBoost, recomendador de oportunidades, comparador e scripts de terminal (`run_validation.py`, etc.). |
| **4** | [PARTE_4_API_REST_FASTAPI_E_SERVICOS.md](./PARTE_4_API_REST_FASTAPI_E_SERVICOS.md) | **Camada de Aplicação REST API (FastAPI) e Serviços** | 10 | Servidor FastAPI, autenticação por tokens JWT e Google OAuth (GIS), serviço SMTP assíncrono de e-mails com código OTP e todos os roteadores REST. |
| **5** | [PARTE_5_FRONTEND_DASHBOARD_E_TESTES.md](./PARTE_5_FRONTEND_DASHBOARD_E_TESTES.md) | **Frontend Web (Vanilla & React SPA), Assets e Suíte de Testes (Pytest)** | 44 | Interface visual completa em Vanilla JS + React moderno (Dark Mode, gráficos Chart.js, rankings, simulações) e bateria de 81 testes automatizados com pytest. |

---

## 🏛️ Arquitetura em 3 Camadas do TrendCommerce AI

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. CAMADA DE APRESENTAÇÃO                       │
│              (Frontend Web / HTML5 / CSS3 / JavaScript / React)        │
│  • Dashboard de Inteligência de Mercado, Gráficos de Demanda Chart.js   │
│  • Formulários de Autenticação (JWT), Google OAuth e OTP por E-mail     │
│  • Simulador de Cenários de Elasticidade de Preço e Comparador         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON / REST via HTTP
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. CAMADA DE APLICAÇÃO & IA                     │
│                           (Backend API REST / FastAPI)                 │
│  • Routers: /auth, /products, /forecast, /opportunities, /trends       │
│  • Validação Estrita: Pydantic v2                                      │
│  • Segurança & Auditoria de APIs: API Guardian, Whitelist e Scanners   │
│  • Engenharia de Recursos: FeatureEngineer (Lags, Sazonalidade, IQR)   │
│  • Motor de Machine Learning: XGBoost Regressor (FutureForecaster)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.0 ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        3. CAMADA DE PERSISTÊNCIA                       │
│                     (PostgreSQL em Nuvem / SQLite Local)               │
│  • Tabelas: users, products, sales_history, search_trends, etc.       │
│  • Logs de Auditoria Preditiva: prediction_logs                        │
│  • Oportunidades Classificadas: product_opportunities                  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Guia Rápido de Execução da Migração

Se você estiver inicializando o novo repositório, a ordem natural de execução é:

### Passo 1: Inicializar o Repositório e a Parte 1
```bash
git init
# Siga as instruções do documento PARTE_1
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/Mac
pip install -r requirements.txt
python -m src.database.setup reset
```

### Passo 2: Adicionar a Governança e Coletores (Parte 2)
```bash
# Siga as instruções do documento PARTE_2
python sync_categories.py --limit 1
```

### Passo 3: Treinar o Modelo XGBoost (Parte 3)
```bash
# Siga as instruções do documento PARTE_3
python run_validation.py
python run_prediction.py --product-id 1 --horizon 14
```

### Passo 4: Subir a API REST (Parte 4)
```bash
# Siga as instruções do documento PARTE_4
uvicorn src.api.main:app --reload --port 8000
# Acesse http://localhost:8000/docs
```

### Passo 5: Iniciar o Frontend e Rodar os Testes (Parte 5)
```bash
# Siga as instruções do documento PARTE_5
python frontend/server.py
# Acesse http://localhost:3000

# Executar todos os 81 testes automatizados:
python -m pytest
```

---

## 📊 Estatísticas Finais da Base de Código

- **Linguagens**: Python 3.10+, JavaScript (ES6+), JSX (React), HTML5, CSS3, SQL.
- **Frameworks Principais**: FastAPI, SQLAlchemy, XGBoost, Scikit-Learn, Pandas, NumPy, Pydantic, Pytest.
- **Total de Arquivos Fonte**: 106 arquivos de código e configuração.
- **Cobertura de Testes**: 15 suítes com 81 testes passando (100% de sucesso).
- **Formatos Suportados de Banco**: SQLite (zero-configuração para desenvolvimento) e PostgreSQL (produção).

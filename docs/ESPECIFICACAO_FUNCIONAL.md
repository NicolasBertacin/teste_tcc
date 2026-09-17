# TrendCommerce AI — Especificação Funcional e Arquitetural do Sistema

> **Sistema Preditivo de Demanda, Tendências de Mercado e Inteligência de Preços para o Comércio Eletrônico**

---

## 1. Visão Geral do Sistema

O **TrendCommerce AI** é uma plataforma de inteligência artificial aplicada ao comércio eletrônico multi-canal (Amazon, Mercado Livre, Google Trends). 

O sistema tem como objetivo central unificar dados de vendas, variações de preço e tendências de busca do consumidor para alimentar modelos preditivos de Machine Learning (**XGBoost Regressor**), projetando o **volume de vendas diárias**, **faixas de confiança estatística** e **faturamento estimado** para qualquer categoria de produto, sem a necessidade de gestão de estoque.

---

## 2. Arquitetura em 3 Camadas (3-Tier)

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        1. CAMADA DE APRESENTAÇÃO                       │
│                     (Frontend Web / HTML5 / CSS3 / JS)                 │
│  • Dashboard de Inteligência de Mercado e Gráficos de Demanda          │
│  • Formulários de Autenticação (JWT) e Recuperação de Senha (OTP)      │
│  • Simulador de Cenários de Preço e Elasticidade                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ JSON / REST via HTTP (fetch)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        2. CAMADA DE APLICAÇÃO & IA                     │
│                           (Backend API REST / FastAPI)                 │
│  • Routers: /auth, /products, /forecast, /trends                       │
│  • Validação e Tipagem Estrita: Pydantic v2                            │
│  • Segurança & Auditoria de APIs: API Guardian & Whitelist             │
│  • Engenharia de Recursos: FeatureEngineer (Lags, Sazonalidade)        │
│  • Motor de Machine Learning: XGBoost Regressor (FutureForecaster)     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ SQLAlchemy 2.0 ORM
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        3. CAMADA DE PERSISTÊNCIA                       │
│                           (PostgreSQL Database)                        │
│  • Tabelas: products, sales_history, search_trends, prediction_logs    │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Módulos do Sistema e Funcionalidades

### Módulo 1: Predição de Demanda de Produtos (Core IA)
* **Previsão Multi-Horizonte:** Projeção diária do volume de vendas para horizontes configuráveis de **7, 14 e 30 dias** com algoritmo **XGBoost Regressor**.
* **Faixas de Confiança Estatística [Min – Max]:** Cálculo de intervalos de incerteza por bootstrap para planejamento probabilístico de vendas.
* **Projeção de Faturamento Estimado:** Cálculo da receita bruta esperada a partir da multiplicação da demanda diária prevista pelo preço unitário praticado.
* **Detecção Automática de Sazonalidade:** Reconhecimento de padrões periódicos (efeito fim de semana, início vs. fim de mês e proximidade de datas comemorativas).

### Módulo 2: Inteligência de Mercado & Tendências
* **Radar de Produtos em Alta (Trend Discovery):** Identificação de produtos com aceleração repentina de interesse no Google Trends e nos marketplaces.
* **Termômetro de Interesse de Busca:** Acompanhamento contínuo do índice de interesse histórico do consumidor (escala 0 a 100).
* **Análise de Elasticidade-Preço:** Mensuração da sensibilidade da demanda em relação às oscilações de preços dos concorrentes.
* **Monitoramento de Preços Concorrentes:** Comparação de preços praticados em múltiplos canais para um mesmo produto ou categoria.

### Módulo 3: Simulação de Cenários (*What-If Simulator*)
* **Simulador de Elasticidade de Preço:** Permite ao usuário alterar o preço de um produto e visualizar instantaneamente a readequação da curva de demanda prevista pela IA.
* **Simulador de Variação Cambial (Dólar):** Avaliação do impacto da cotação do dólar na demanda de produtos importados ou de tecnologia.
* **Simulador de Fatores Climáticos:** Projeção do impacto de variações térmicas e chuvas em categorias com sazonalidade climática (moda, praia, climatização).

### Módulo 4: Validação & Auditoria Científica do Modelo
* **Backtesting Automatizado (Real vs. Previsto):** Execução de testes retrospectivos para confrontar previsões passadas com o volume real vendido.
* **Métricas Científicas de Avaliação:** Geração de relatórios com **$R^2$ (coeficiente de determinação)**, **MAE (erro médio absoluto)** e **RMSE (raiz do erro quadrático médio)**.
* **Ranking de Importância das Variáveis (Feature Importance):** Demonstração da contribuição de cada fator (preço, buscas, histórico, calendário) na decisão do modelo.

### Módulo 5: Visualização, Relatórios e Exportação
* **Dashboard Interativo:** Painel visual com cards de KPIs, gráficos de séries temporais e tabelas detalhadas de projeções.
* **Exportação de Dados:** Download de relatórios executivos em formato CSV, Excel e PDF para suporte à tomada de decisão estratégica.

### Módulo 6: Segurança & Governança (API Guardian)
* **Auditoria de Requisições:** Bloqueio automático de qualquer chamada HTTP para domínios fora da whitelist estrita homologada.
* **Scanner de Credenciais:** Varredura estática de código para prevenção de vazamento acidental de tokens e chaves de API.
* **Autenticação Segura:** Proteção de rotas via tokens criptografados **JWT (JSON Web Tokens)**.

---

## 4. Requisitos do Sistema (TCC)

### Requisitos Funcionais (RF)

| Código | Nome do Requisito | Descrição |
|:---:|:---|:---|
| **RF01** | *Predição de Demanda* | O sistema deve calcular a previsão de vendas diárias de produtos para 7, 14 e 30 dias utilizando o XGBoost Regressor. |
| **RF02** | *Intervalo de Confiança* | O sistema deve calcular os limites mínimo e máximo prováveis de demanda diária para cada produto. |
| **RF03** | *Projeção de Faturamento* | O sistema deve calcular a receita bruta esperada a partir da multiplicação do volume previsto pelo preço do produto. |
| **RF04** | *Análise de Tendências* | O sistema deve cruzar o score de interesse do Google Trends com o histórico de vendas para refinar a projeção. |
| **RF05** | *Simulação de Preços* | O sistema deve permitir ao usuário simular a variação na demanda ao alterar o preço unitário do produto. |
| **RF06** | *Auditoria e Backtesting* | O sistema deve permitir avaliar o modelo contra dados históricos reais, calculando métricas $R^2$, MAE e RMSE. |
| **RF07** | *Importância de Atributos* | O sistema deve exibir quais variáveis tiveram maior relevância estatística na tomada de decisão do modelo preditivo. |
| **RF08** | *Exportação de Dados* | O sistema deve permitir a exportação das previsões e dados consolidados em formatos estruturados (CSV/Excel). |
| **RF09** | *Autenticação de Usuários* | O sistema deve gerenciar cadastro, autenticação via JWT e recuperação de senha de usuários autorizados. |

### Requisitos Não-Funcionais (RNF)

| Código | Nome do Requisito | Descrição |
|:---:|:---|:---|
| **RNF01** | *Segurança de APIs (Guardian)* | O sistema deve auditar todas as chamadas de rede externas e bloquear endpoints fora da whitelist autorizada. |
| **RNF02** | *Baixa Latência de Inferência* | As respostas de inferência preditiva do modelo devem ser entregues pelo FastAPI em menos de 200 milissegundos. |
| **RNF03** | *Escalabilidade Multi-Categoria* | O pipeline de Machine Learning deve ser independente de categoria, processando desde eletrônicos até moda, alimentos e cosméticos. |
| **RNF04** | *Integridade Transacional (ACID)* | O banco de dados relacional PostgreSQL deve garantir integridade e consistência no histórico de séries temporais. |
| **RNF05** | *Interface Responsiva* | A interface web deve ser totalmente responsiva e acessível em navegadores modernos desktop e mobile. |

---

## 5. Estrutura de Diretórios Recomendada para o Projeto

```text
trendecommerce-ai/
├── config/                   # Configurações do ambiente e constantes
├── docs/                     # Documentação técnica e especificações
│   ├── DOCUMENTATION.md
│   └── ESPECIFICACAO_FUNCIONAL.md
├── frontend/                 # Interface Web do Usuário
│   ├── index.html            # Telas de Login, Cadastro, Recuperação e Dashboard
│   ├── css/style.css         # Estilização visual (Cyber/Dark)
│   └── js/
│       ├── api.js            # Cliente HTTP centralizado (fetch)
│       ├── auth.js           # Gerenciamento de autenticação e sessão JWT
│       └── dashboard.js      # Renderização de gráficos e tabelas de projeção
├── src/                      # Código-fonte do Backend e IA
│   ├── api/                  # Camada REST (FastAPI)
│   │   ├── main.py           # Instância FastAPI, CORS e rotas estáticas
│   │   ├── dependencies.py   # Injeção de dependências (DB, JWT, ML)
│   │   └── routers/          # Endpoints (/auth, /products, /forecast, /trends)
│   ├── collectors/           # Coletores de dados (Mercado Livre, Amazon, Trends)
│   ├── database/             # Conexão e Models ORM (PostgreSQL)
│   │   ├── connection.py     # DatabaseManager
│   │   ├── models.py         # Product, SalesHistory, SearchTrend, PredictionLog
│   │   └── setup.py          # Script de migrações e seed
│   ├── features/             # Engenharia de atributos (Lags, Médias Móveis)
│   ├── guardian/             # Segurança e Whitelist (API Guardian)
│   ├── ml/                   # Modelagem Preditiva
│   │   ├── trainer.py        # Treinamento do XGBoost
│   │   ├── predictor.py      # Inferência e Bootstrap
│   │   ├── future_forecaster.py # Projeções futuras D+7/14/30
│   │   ├── comparator.py     # Validação Real vs Previsto
│   │   └── evaluation.py     # Métricas (RMSE, MAE, R²)
│   └── schemas/              # Modelos de validação Pydantic v2
├── requirements.txt          # Dependências do projeto
├── run_prediction.py         # Script CLI de inferência de demanda
└── run_validation.py         # Script CLI de validação por backtesting
```

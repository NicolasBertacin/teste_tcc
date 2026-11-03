# TrendCommerce AI — Sistema Preditivo de Demanda & Inteligência de Mercado

O **TrendCommerce AI** é uma plataforma fullstack de inteligência preditiva voltada para e-commerce. O sistema utiliza modelos avançados de Machine Learning (**XGBoost**) combinados com engenharia de variáveis temporais e sazonais para prever a demanda diária, faturamento futuro e sugerir níveis ideais de estoque para os próximos meses (horizontes de 7, 14 e 30 dias).

---

## 📌 Principais Funcionalidades

1. **Previsão de Demanda com XGBoost**:
   - Simulação autoregressiva com modelo treinado sobre séries históricas reais.
   - Cálculo de faixas de confiança (mínimo e máximo previsto), média diária e faturamento projetado.
   - Calibração de estoque de segurança contra rupturas e cenários de risco (conservador, base e buffer).
2. **Análise de Sazonalidade e Picos de Demanda (*Seasonal Lift*)**:
   - Detecção automática de aceleração sazonal para eventos do calendário varejista:
     - **Natal e Fim de Ano** (`NATAL_FIM_DE_ANO` — Novembro e Dezembro): produtos decorativos, brinquedos e árvores de natal.
     - **Black Friday Tech** (`BLACK_FRIDAY_TECH` — Novembro): smartphones, notebooks, consoles e hardware.
     - **Verão & Calor** (`VERAO_CALOR` — Dezembro, Janeiro e Fevereiro): protetor solar, ventiladores, moda praia e climatizadores.
     - **Inverno** (`INVERNO_FRIO` — Maio a Julho): aquecedores, casacos e cobertores.
     - **Volta às Aulas & Fitness** (`VOLTA_AS_AULAS`, `FITNESS_ANO_NOVO` — Janeiro e Fevereiro).
   - O algoritmo compara a projeção com a média histórica anual e calcula a porcentagem de alta (`seasonal_lift_pct`), destacando produtos com a badge **🔥 Alta Sazonalidade (+X% acima do normal)**.
3. **Ranking Preditivo dos Próximos Meses**:
   - Ranqueamento dos produtos líderes ponderados por volume de unidades, receita projetada e bônus sazonal.
   - Apuração do **Top 7 Produtos Gerais** e **Top 5 Produtos por Categoria**.
4. **Catálogo Oficial Consolidado**:
   - Totalmente integrado à **API de Histórico de Vendas**, sem dependência de scrapers instáveis de Mercado Livre ou Amazon.
   - **500 produtos** ativos divididos igualmente nas 5 categorias oficiais:
     - `Eletrônicos` (100 produtos)
     - `Beleza e cuidados pessoais` (100 produtos)
     - `Casa e decoração` (100 produtos)
     - `Esportes e fitness` (100 produtos)
     - `Moda e acessórios` (100 produtos)
5. **Dashboard Interativo em React**:
   - Interface dark/cyberpunk moderna com gráficos interativos via Canvas 2D.
   - Três visões principais: **IA Preditiva**, **Ranking Produtos** e **Análise Específica**.
   - Simulador de sensibilidade a preço para recalcular faturamento em tempo real.
   - Exportação de relatórios para planilhas Excel (`.xlsx`).

---

## 🏛️ Arquitetura do Sistema

```
┌─────────────────────────────────┐
│   API de Histórico de Vendas   │ (Porta 8000: api_vendas.exe)
│   500 produtos / 365.500 vendas │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       SalesApiCollector         │
│   Leitura HTTP & SQLite Seguro  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│ Banco de Dados TrendCommerce DB │ (SQLite local ou PostgreSQL)
│     products & sales_history    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       Feature Engineering       │ Lags (1, 7, 14, 30), Médias Móveis,
│      & Variáveis Sazonais       │ Indicadores Natal, Black Friday, Verão
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Motor Preditivo XGBoost     │ Inferência Autoregressiva, Seasonal Lift,
│        FutureForecaster         │ Score de Atratividade & Ranking
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│       FastAPI REST Backend      │ (Porta 8001: /api/v1)
│    Rotas: /forecast, /products  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Frontend Web SPA (React)    │ (Servido em /app ou via Live Server)
│  IaPreditiva, Ranking, Analise  │
└─────────────────────────────────┘
```

---

## 🚀 Como Inicializar o Sistema

### Pré-requisitos
- **Python 3.11+** com virtualenv configurada (`.venv`).
- Executável da base de vendas: `C:\Users\Aluno\Desktop\API_Historico_Vendas\api_vendas.exe`.

---

### Opção 1: Inicialização Automática (1 Clique no Windows)
Basta dar dois cliques no arquivo:
```cmd
iniciar_sistema.bat
```
O script irá:
1. Detectar e inicializar a API de Vendas na porta 8000 (caso ainda não esteja em execução).
2. Abrir automaticamente a interface Web no seu navegador em `http://localhost:8001/app/#/ia-preditiva`.
3. Iniciar o servidor FastAPI na porta 8001.

---

### Opção 2: Inicialização Manual via Terminal

#### Passo 1 — Iniciar a API de Histórico de Vendas (Porta 8000)
Abra um terminal e execute:
```cmd
C:\Users\Aluno\Desktop\API_Historico_Vendas\api_vendas.exe
```
> A API de vendas estará ativa respondendo em `http://127.0.0.1:8000`.

#### Passo 2 — Iniciar o Backend TrendCommerce AI (Porta 8001)
Abra outro terminal na pasta do projeto `teste_tcc`:
```powershell
# Ativar o ambiente virtual
.\.venv\Scripts\Activate.ps1

# Executar o FastAPI com recarregamento automático
python -m uvicorn src.api.main:app --host 127.0.0.1 --port 8001 --reload
```

#### Passo 3 — Acessar a Aplicação
Abra o navegador em:
- **Painel / Interface Web**: [http://localhost:8001/app](http://localhost:8001/app)
- **Documentação Swagger da API**: [http://localhost:8001/docs](http://localhost:8001/docs)

---

## 🔑 Credenciais Padrão de Acesso

Ao abrir a interface Web pela primeira vez, realize o login com a conta de administrador padrão:
- **E-mail:** `admin@trendecommerce.com`
- **Senha:** `admin123`

*(Você também pode cadastrar novos usuários ou usar a recuperação de senha via OTP na tela de login).*

---

## 🧪 Execução de Testes Automatizados

O sistema conta com suíte de testes unitários e de integração com cobertura de API, ML, engenharia de features e regras de segurança:

```powershell
# Executar todos os 83 testes
pytest

# Executar testes da API REST
pytest tests/test_api.py -v
```

---

## ☁️ Deploy e Hospedagem em Produção

O repositório já está configurado para deploy contínuo em serviços Cloud:

1. **Deploy no Render (Backend Python & FastAPI)**:
   - Arquivo de configuração: [`render.yaml`](render.yaml).
   - O Render lê a branch `master` do GitHub, instala as dependências via `requirements.txt` e inicia o uvicorn na porta configurada pelo ambiente (`$PORT`).
   - Para disparar novo deploy automaticamente, basta realizar um `git push origin master`.

2. **Deploy no Vercel (Frontend Estático)**:
   - Arquivo de configuração: [`vercel.json`](vercel.json).
   - O Vercel serve a pasta `/frontend` como aplicação estática com roteamento para SPA.

3. **Deploy Manual / CI/CD via Git**:
   Qualquer push efetuado para o repositório remoto no GitHub sincroniza as atualizações:
   ```bash
   git add .
   git commit -m "feat: migracao oficial para API de Vendas, modelo sazonal XGBoost e docs"
   git push origin master
   ```

---

## 📄 Licença
Este projeto é distribuído sob os termos da licença MIT.

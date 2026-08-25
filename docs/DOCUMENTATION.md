# TrendCommerce AI — Documentação Técnica Completa

## 1. Visão geral

O **TrendCommerce AI** é um sistema de inteligência artificial voltado para **previsão de demanda e análise de tendências no comércio eletrônico**.

A ideia central do projeto é reunir dados provenientes de diferentes fontes de e-commerce e comportamento de pesquisa para construir uma base histórica mais completa. Esses dados são armazenados em um banco de dados e posteriormente utilizados para treinar modelos de Machine Learning, principalmente o **XGBoost**, com o objetivo de melhorar a capacidade de previsão.

O sistema foi pensado principalmente para trabalhar com dados de plataformas como:

* Amazon
* Mercado Livre
* Google
* Outras plataformas de e-commerce que disponibilizem APIs ou dados autorizados

O objetivo não é simplesmente consultar produtos. A proposta é transformar diferentes informações em **features**, permitindo que o modelo encontre relações entre demanda, preços, tendências, categorias e outros fatores.

---

## 2. Objetivo do projeto

O objetivo principal do TrendCommerce AI é desenvolver um sistema capaz de auxiliar na previsão de demanda de produtos.

Uma representação simplificada do fluxo é:

```text
APIs / Fontes de dados
        ↓
Coleta de dados
        ↓
Validação
        ↓
API Guardian
        ↓
Normalização
        ↓
PostgreSQL
        ↓
Feature Engineering
        ↓
XGBoost
        ↓
Previsão
        ↓
Análise de demanda
```

A ideia é utilizar dados históricos para que o modelo consiga identificar padrões.

Por exemplo:

```text
Produto X
↓
Preço
↓
Categoria
↓
Histórico de vendas
↓
Tendência de pesquisa
↓
Posição / popularidade
↓
Período
↓
Modelo XGBoost
↓
Previsão de demanda
```

---

## 3. Arquitetura geral

A arquitetura planejada possui quatro partes principais:

### 3.1. Camada de coleta

Responsável por acessar as APIs autorizadas e coletar os dados.

Exemplos:

```text
Amazon SP-API
Mercado Livre API
Google Trends / dados de tendências
```

### 3.2. Camada de segurança e conformidade

É utilizada a arquitetura denominada **API Guardian**.

O Guardian funciona como uma camada de fiscalização das integrações.

Ele verifica:

* quais endpoints estão sendo utilizados;
* se a API está dentro da whitelist;
* se existem credenciais expostas;
* se a requisição segue as regras definidas;
* se o código está tentando utilizar uma API não autorizada.

### 3.3. Banco de dados

O projeto utiliza **PostgreSQL** como banco de dados principal.

A intenção é centralizar os dados coletados e manter histórico suficiente para treinamento do modelo.

### 3.4. Machine Learning

Os dados armazenados no PostgreSQL serão transformados em features e utilizados pelo modelo **XGBoost**.

---

## 4. XGBoost

O XGBoost é o algoritmo escolhido para realizar as previsões.

Ele trabalha com várias árvores de decisão combinadas, formando um modelo de Gradient Boosting.

No TrendCommerce AI, a ideia é fornecer ao modelo informações como:

```text
preço
categoria
produto
data
histórico de vendas
popularidade
tendência
posição
quantidade vendida
variações temporais
```

O modelo então aprende relações existentes nos dados históricos.

Por exemplo:

```text
Preço ↓
+
Pesquisa ↑
+
Vendas ↑
+
Popularidade ↑
        ↓
Possível aumento futuro da demanda
```

É importante destacar que o XGBoost não recebe simplesmente "dados de pesquisa".

Esses dados precisam ser transformados em **features numéricas ou categóricas** que possam ser utilizadas pelo modelo.

---

## 5. Feature Engineering

Uma das partes importantes do projeto é transformar os dados coletados pelas APIs em informações úteis para o modelo.

Por exemplo, uma tabela poderia inicialmente possuir:

```text
produto
data
preco
vendas
categoria
pesquisas
```

A partir dela podem ser criadas features como:

```text
preco_medio_7_dias
vendas_7_dias
vendas_30_dias
crescimento_vendas
crescimento_pesquisas
media_pesquisas
variacao_preco
tendencia_pesquisa
```

Assim, o XGBoost recebe informações mais relevantes para encontrar padrões.

---

## 6. PostgreSQL

O PostgreSQL foi escolhido para armazenar os dados coletados pelas APIs.

A função do banco é servir como uma camada histórica.

Em vez de consultar uma API toda vez que o modelo precisar de dados:

```text
API
 ↓
dados
 ↓
PostgreSQL
 ↓
modelo
```

os dados podem ser armazenados continuamente.

Isso permite construir um histórico próprio do TrendCommerce AI.

---

## 7. APIs utilizadas e estudadas

### 7.1. Amazon SP-API

Uma das principais integrações estudadas foi a **Amazon Selling Partner API (SP-API)**.

Foram considerados principalmente endpoints relacionados a:

#### Catalog Items

Endpoint utilizado no projeto:

```text
GET
https://sellingpartnerapi-na.amazon.com/catalog/2022-04-01/items
```

A finalidade é trabalhar com informações de catálogo/produtos.

#### Product Type Definitions

Também foi estudada a API:

```text
GET
https://sellingpartnerapi-na.amazon.com/definitions/2020-09-01
```

Ela está relacionada às definições de tipos de produtos.

No projeto, essas APIs fazem parte da camada de coleta de informações da Amazon.

---

## 8. Autenticação da Amazon

Durante o desenvolvimento foi identificado que algumas APIs não funcionam simplesmente fazendo uma requisição HTTP comum.

A Amazon SP-API utiliza mecanismos de autenticação e autorização.

Isso levou à separação das APIs em categorias:

```text
APIs que podem ser consultadas sem autenticação específica
        ↓
APIs que exigem autenticação
        ↓
APIs que exigem autorização mais complexa
```

Também foi identificado que as credenciais não devem ser colocadas diretamente no código.

A arquitetura definida para o projeto é utilizar variáveis de ambiente ou mecanismos seguros de configuração.

Exemplo conceitual:

```text
AMAZON_CLIENT_ID
AMAZON_CLIENT_SECRET
AMAZON_REFRESH_TOKEN
```

em vez de:

```python
client_secret = "minha-chave-secreta"
```

---

## 9. Mercado Livre

Outra integração importante estudada foi a API do **Mercado Livre**.

Foram considerados endpoints relacionados a:

* busca;
* produtos;
* categorias;
* tendências;
* highlights.

A arquitetura do projeto considera essas APIs como fontes complementares de informações.

Um exemplo de fluxo seria:

```text
Mercado Livre
      ↓
Produto
      ↓
Categoria
      ↓
Popularidade / tendência
      ↓
PostgreSQL
```

---

## 10. APIs do Mercado Livre analisadas

Durante o desenvolvimento foram estudados endpoints relacionados a:

### Search

Utilizado para realizar consultas de produtos.

```text
Search API
```

### Items

Informações relacionadas aos produtos/anúncios.

```text
Items API
```

### Categories

Informações de categorias.

```text
Categories API
```

### Trends

Dados relacionados a tendências.

```text
Trends API
```

### Highlights

Informações relacionadas a produtos destacados/populares.

```text
Highlights API
```

Esses dados podem complementar as informações obtidas de outras fontes.

---

## 11. Google Trends

Uma das principais necessidades identificadas no projeto foi utilizar **dados de pesquisa**.

A intenção é utilizar o comportamento das pesquisas como uma variável adicional para previsão de demanda.

O raciocínio é:

```text
Aumento das pesquisas
        ↓
possível aumento de interesse
        ↓
possível aumento da demanda
```

Porém, durante a pesquisa sobre a integração foi identificado um problema importante:

**o Google Trends não disponibiliza uma API pública oficial simples e gratuita equivalente a uma API convencional para esse uso.**

Por isso, foi investigada a possibilidade de obter esses dados através de bibliotecas e alternativas.

A utilização desses dados precisa respeitar as condições de uso da fonte.

---

## 12. Necessidade de dados de pesquisa

Essa foi uma das questões centrais do projeto.

A intenção original é treinar o XGBoost com mais informações além das vendas.

A ideia seria combinar:

```text
Vendas
+
Pesquisas
+
Preço
+
Popularidade
+
Categoria
+
Tendências
+
Histórico
```

Isso pode fornecer ao modelo mais contexto para identificar alterações na demanda.

Por exemplo:

```text
Produto A

Vendas:
100 → 110 → 130 → 160

Pesquisas:
500 → 700 → 1000 → 1500

Preço:
R$100 → R$100 → R$95 → R$95
```

Essas informações podem ser transformadas em features para o modelo.

---

## 13. Problema encontrado nas APIs de pesquisa

Foi identificado que plataformas como Google, Amazon, Mercado Livre e outras não necessariamente disponibilizam gratuitamente todos os dados necessários.

Principalmente:

* histórico completo de pesquisas;
* volume absoluto de pesquisas;
* dados internos de usuários;
* dados internos de vendas de terceiros;
* métricas proprietárias.

Portanto, não é correto simplesmente procurar uma API qualquer que exponha esses dados e utilizá-la.

A arquitetura do projeto passou a considerar somente dados obtidos por meios autorizados.

---

## 14. API Guardian

Um dos componentes mais importantes desenvolvidos para o TrendCommerce AI é o **API Guardian**.

O objetivo é criar uma camada de proteção para impedir que o sistema faça requisições incompatíveis com as regras definidas para o projeto.

A ideia é:

```text
Código
 ↓
API Guardian
 ↓
Verificação
 ↓
ACEITADO / BLOQUEADO
 ↓
API
```

---

## 15. Whitelist do API Guardian

Foi definida uma whitelist para controlar quais endpoints podem ser utilizados.

Entre as integrações consideradas estão:

### Amazon

* Catalog
* Product Type Definitions

### Mercado Livre

* Search
* Items
* Categories
* Trends
* Highlights

Se o código tentar realizar uma requisição para um endpoint que não esteja na whitelist, o Guardian deve identificar a tentativa.

---

## 16. Bloqueio de APIs não autorizadas

Uma das regras definidas para o Guardian é monitorar chamadas HTTP feitas através de bibliotecas como:

```text
urllib
requests
httpx
aiohttp
```

Caso uma chamada tente acessar um endpoint fora da whitelist definida, a política determina:

```text
BLOQUEADO
```

O objetivo é evitar que um desenvolvedor ou agente de IA adicione uma integração que não foi aprovada.

---

## 17. Credenciais

Outra regra definida no API Guardian é impedir credenciais hardcoded.

Não deve existir algo como:

```python
API_KEY = "123456789"
```

no código-fonte.

A preferência definida para o projeto é:

```text
Variáveis de ambiente
        ↓
Sistema de autenticação
        ↓
Requisição
```

Isso reduz o risco de uma chave ser publicada acidentalmente no GitHub.

---

## 18. Como o Guardian identifica uma requisição

O projeto também investigou como saber se uma requisição foi aceita ou bloqueada.

A arquitetura pode analisar o código antes da execução e identificar chamadas HTTP.

Por exemplo:

```python
requests.get("https://api.exemplo.com")
```

O Guardian verifica:

```text
Existe chamada HTTP?
        ↓
Qual biblioteca?
        ↓
Qual URL?
        ↓
Qual endpoint?
        ↓
Está na whitelist?
        ↓
Possui credenciais expostas?
        ↓
POLICY ENGINE
        ↓
ALLOW / BLOCK
```

Isso permite identificar chamadas potencialmente incompatíveis antes que sejam executadas.

---

## 19. Política do Guardian

O projeto criou uma política de segurança/conformidade para as APIs.

A lógica geral é:

```text
REQUISIÇÃO
    ↓
IDENTIFICAÇÃO
    ↓
VALIDAÇÃO DA URL
    ↓
VALIDAÇÃO DA API
    ↓
VALIDAÇÃO DAS CREDENCIAIS
    ↓
VALIDAÇÃO DA POLÍTICA
    ↓
┌───────────────┐
│               │
ALLOW         BLOCK
│               │
↓               ↓
API          mensagem de erro
```

---

## 20. Testes realizados

Durante o desenvolvimento foram realizados testes automatizados no projeto.

Um dos testes registrados foi:

```text
tests/test_checker.py
TestChecker::test_guarded_call_detection
```

Resultado:

```text
PASSED
```

Também foi executada uma suíte completa de testes.

Foi registrado:

```text
collected 56 items
```

com todos os testes relacionados ao mecanismo de política e verificação passando.

Isso demonstra que a estrutura do Guardian possui validação automatizada.

---

## 21. Integração com agentes de IA

Outro objetivo do projeto é utilizar agentes para auxiliar no desenvolvimento e fiscalização do código.

Foi planejado um agente capaz de atuar como um **engenheiro de software sênior**, analisando:

* estrutura do projeto;
* scripts;
* banco de dados;
* integrações;
* APIs;
* requisições HTTP;
* políticas;
* testes;
* possíveis erros.

A ideia é que o agente não apenas escreva código, mas também verifique se o código produzido está de acordo com a arquitetura definida.

---

## 22. GitHub e controle do projeto

O projeto também foi estruturado para trabalhar com repositório Git/GitHub.

A intenção é permitir que agentes analisem alterações no código e identifiquem problemas antes que mudanças inadequadas sejam incorporadas.

---

## 23. Pipeline de dados planejado

O pipeline geral do TrendCommerce AI pode ser representado assim:

```text
                 ┌──────────────┐
                 │    Amazon    │
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │ Mercado Livre│
                 └──────┬───────┘
                        │
                 ┌──────▼───────┐
                 │ Google Trends │
                 └──────┬───────┘
                        │
                        ▼
              ┌───────────────────┐
              │   API Guardian    │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Normalização      │
              │ dos dados         │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │    PostgreSQL     │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │ Feature Engineering│
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │      XGBoost      │
              └─────────┬─────────┘
                        │
                        ▼
              ┌───────────────────┐
              │    Previsão       │
              │     demanda      │
              └───────────────────┘
```

---

## 24. Dados que o sistema pretende armazenar

A estrutura conceitual dos dados inclui informações como:

```text
Produto
Categoria
Preço
Data
Plataforma
Histórico de vendas
Popularidade
Tendência
Pesquisas
```

Um registro poderia conceitualmente ser:

```text
produto: Notebook Dell
categoria: Eletrônicos
plataforma: Amazon
preco: 3500
data: 2026-08-20
vendas: ...
pesquisas: ...
popularidade: ...
```

Os dados históricos são importantes porque permitem criar séries temporais.

---

## 25. Histórico de vendas

Um dos pontos discutidos no projeto foi a necessidade de possuir uma tabela semelhante a:

```text
sales_history
```

A finalidade seria registrar a evolução das vendas ao longo do tempo.

Por exemplo:

```text
produto_id | data       | quantidade
-----------|------------|-----------
1          | 2026-08-01 | 10
1          | 2026-08-02 | 15
1          | 2026-08-03 | 22
```

Com isso seria possível calcular:

```text
crescimento
média móvel
tendência
sazonalidade
variação
```

e utilizar essas informações no XGBoost.

---

## 26. Relação entre APIs e Machine Learning

As APIs não são o modelo de IA.

Elas são fontes de dados.

O processo é:

```text
API
 ↓
Dados brutos
 ↓
Banco
 ↓
Tratamento
 ↓
Features
 ↓
XGBoost
```

Por isso, adicionar mais APIs não significa automaticamente melhorar o modelo.

A qualidade dos dados é mais importante que simplesmente aumentar a quantidade.

---

## 27. Estratégia de múltiplas plataformas

Uma das ideias do projeto é utilizar várias plataformas para obter uma visão mais ampla do mercado.

Por exemplo:

```text
Amazon
    ├── produtos
    ├── catálogo
    └── informações disponíveis via SP-API

Mercado Livre
    ├── produtos
    ├── categorias
    ├── busca
    ├── tendências
    └── highlights

Google
    └── tendências de pesquisa
```

Esses dados podem ser relacionados através de atributos comuns, como:

```text
produto
categoria
termo
data
plataforma
```

---

## 28. Principal desafio encontrado

O principal desafio identificado até agora não é o XGBoost.

É a **obtenção legal, consistente e histórica dos dados**.

O projeto precisa responder:

```text
Quais dados estão disponíveis?
        ↓
A API permite acesso?
        ↓
É necessário OAuth?
        ↓
Existe limite de requisições?
        ↓
Existe histórico?
        ↓
Os dados podem ser armazenados?
        ↓
Os dados podem ser utilizados para ML?
```

Somente depois disso os dados devem entrar no pipeline.

---

## 29. O que já foi desenvolvido/conceituado

Até o ponto atual, o projeto possui/concebeu:

### Arquitetura

* TrendCommerce AI
* PostgreSQL
* pipeline de coleta
* camada de Machine Learning
* XGBoost

### APIs

* Amazon SP-API
* Mercado Livre
* investigação sobre Google Trends
* análise de autenticação e autorização
* análise de endpoints permitidos

### Segurança

* API Guardian
* whitelist
* bloqueio de endpoints não autorizados
* verificação de chamadas HTTP
* proteção contra credenciais hardcoded
* Policy Engine
* Checker

### Testes

* testes automatizados
* teste de detecção de chamadas protegidas
* suíte com 56 testes registrados

### Machine Learning

* escolha do XGBoost
* discussão sobre features
* necessidade de histórico
* utilização de vendas
* utilização de tendências
* utilização de dados de pesquisa

---

## 30. Estado atual do projeto

O TrendCommerce AI pode ser considerado dividido em três grandes áreas:

```text
┌────────────────────────────────────────┐
│             TREND COMMERCE AI          │
├────────────────────────────────────────┤
│                                        │
│  1. DATA ENGINEERING                   │
│     APIs → PostgreSQL                  │
│                                        │
│  2. API SECURITY                       │
│     API Guardian → Policy Engine       │
│                                        │
│  3. MACHINE LEARNING                   │
│     PostgreSQL → Features → XGBoost    │
│                                        │
└────────────────────────────────────────┘
```

O trabalho realizado até agora concentrou-se bastante na **infraestrutura de coleta, segurança das APIs e preparação da base para Machine Learning**.

---

## 31. Próxima etapa lógica

A evolução do projeto pode seguir este fluxo:

```text
1. Finalizar integrações autorizadas
             ↓
2. Criar coletores
             ↓
3. Armazenar dados brutos
             ↓
4. Normalizar dados
             ↓
5. Criar histórico
             ↓
6. Criar features
             ↓
7. Separar treino/teste
             ↓
8. Treinar XGBoost
             ↓
9. Avaliar métricas
             ↓
10. Gerar previsões
```

O ponto mais importante é **não alimentar o XGBoost diretamente com dados inconsistentes de diferentes APIs**. Amazon, Mercado Livre e Google possuem estruturas e métricas diferentes; portanto, os dados precisam ser normalizados antes do treinamento.

---

## 32. Conclusão

O **TrendCommerce AI** foi projetado como uma plataforma de previsão de demanda para e-commerce baseada em dados de múltiplas fontes.

A arquitetura combina:

```text
APIs
+
API Guardian
+
PostgreSQL
+
Feature Engineering
+
XGBoost
```

A parte de APIs foi além de simplesmente encontrar endpoints. Durante o desenvolvimento foram investigados:

* quais APIs existem;
* quais endpoints podem ser utilizados;
* quais exigem autenticação;
* como obter autorização;
* como armazenar os dados;
* limitações das APIs;
* utilização de dados de pesquisa;
* segurança das credenciais;
* controle das requisições;
* criação de uma whitelist;
* bloqueio de endpoints não autorizados.

O **API Guardian** representa a camada de governança do sistema, enquanto o PostgreSQL funciona como a base histórica e o XGBoost como o mecanismo de previsão.

A grande proposta do TrendCommerce AI é transformar diferentes sinais do mercado — como vendas, preços, tendências, popularidade e pesquisas — em dados estruturados capazes de alimentar um modelo de Machine Learning para **previsão de demanda**.

> **Observação:** esta documentação consolida o que foi definido, estudado e implementado nos chats anteriores. Alguns pontos, especialmente disponibilidade de endpoints e permissões das APIs de terceiros, podem mudar com o tempo e devem ser confirmados na documentação oficial da respectiva plataforma antes de serem colocados em produção.

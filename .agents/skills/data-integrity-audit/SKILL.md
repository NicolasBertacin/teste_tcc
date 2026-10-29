---
name: data-integrity-audit
description: >-
  Audita a origem, integridade, veracidade e consistência dos dados do sistema.
  Rastreia coletores de APIs, pipelines de normalização e esquemas de banco de dados,
  identificando mocks, dados simulados e valores estáticos. Use quando for necessário
  validar se os dados apresentados ou processados são verdadeiros e confiáveis.
---

# Skill: Data Integrity Audit (Auditoria de Integridade e Veracidade de Dados)

Esta Skill define o protocolo forense para inspecionar todo o pipeline de dados de uma aplicação, garantindo que o sistema não esteja sendo alimentado por dados artificiais não documentados, mocks silenciosos ou esquemas inconsistentes.

## Critérios de Utilização
- Quando houver suspeita de dados simulados ou mocks atuando em ambiente de produção.
- Para verificar a confiabilidade de integrações com APIs externas (ex.: Mercado Livre, Amazon, Google Trends).
- Para auditar a camada de persistência e normalização de dados antes do treinamento de modelos ou geração de relatórios de negócio.

## Ferramentas Necessárias
- Ferramentas de inspeção de código: `read_file`, `run_command` (para busca de padrões estáticos via scripts não destrutivos).

## Procedimento Passo a Passo

### 1. Rastreamento dos Coletores de Dados (Ingestão)
1. Localizar o módulo de coletores (`src/collectors/` ou equivalente).
2. Para cada coletor:
   - Identificar a URL base da API externa e métodos HTTP utilizados.
   - Inspecionar a lógica de autenticação (tokens, chaves, headers).
   - Verificar se há condicionais de fallback que retornam dados fictícios quando a API falha.

### 2. Caça a Mocks e Valores Hardcoded
1. Buscar no código palavras-chave de simulação: `mock`, `dummy`, `fake`, `fixture`, `sample_data`, `synthetic`, `random.uniform`, `np.random`.
2. Verificar se valores numéricos essenciais (preços, demandas, métricas de vendas) estão fixados no código em vez de serem extraídos da resposta da API ou do banco de dados.
3. Registrar o arquivo exato e a linha onde o mock ou valor estático foi detectado.

### 3. Auditoria da Camada de Normalização e Schemas
1. Inspecionar as classes de validação e schemas (`src/schemas/`, `src/normalization/`, `Pydantic models`, `SQLAlchemy`).
2. Verificar se há regras de coerência de tipos (ex.: floats positivos para preços, inteiros não negativos para estoque, validação de formato de data ISO 8601).
3. Avaliar como valores nulos, ausentes (`NaN`) ou erros de parsing são tratados: são logados, descartados ou mascarados silenciosamente por valores default?

### 4. Avaliação de Persistência e Integridade Referencial
1. Inspecionar o módulo de banco de dados (`src/database/`).
2. Checar a existência de chaves primárias, índices de unicidade e constraints de chave estrangeira que evitem registros órfãos ou duplicados.
3. Verificar a presença de timestamps de auditoria (`created_at`, `updated_at`, `source_timestamp`) para garantir rastreabilidade histórica.

### 5. Classificação da Confiança dos Dados
Classificar cada fonte auditada na taxonomia obrigatória:
- `[VERIFICADO]`
- `[PARCIALMENTE VERIFICADO]`
- `[INCONSISTENTE]`
- `[NÃO VERIFICADO / MOCK]`

## Evidências Obrigatórias a Coletar
- Trechos de código com mocks ou valores fixos identificados (arquivo e linhas).
- Mapeamento das chamadas reais de API e seus parâmetros.
- Definição dos Schemas de validação e tratamento de exceções.
- Tabela resumo de classificação de veracidade de cada entidade de dados.

## Critérios de Sucesso e Falha
- **Sucesso**: Identificação cabal de todas as fontes de dados com provas documentadas de onde os dados vêm, se são reais ou simulados, e quais riscos apresentam.
- **Falha**: Afirmar que dados são reais sem inspecionar a chamada de rede ou a persistência, ou ignorar fallbacks simulados.

## Limitações e Restrições de Segurança
- Não disparar requisições em massa a APIs externas que possam gerar cobranças ou bloqueios de IP.
- Nunca registrar credenciais de acesso em texto claro nos relatórios.

## Formato da Entrega
```markdown
# Relatório de Auditoria de Integridade de Dados
- **Inventário de Fontes**: [APIs, Bancos, Arquivos Locais]
- **Auditoria de Coletores**: [Status de cada coletor com referências de código]
- **Ocorrências de Dados Simulados / Mocks**: [Lista com links e trechos de código]
- **Qualidade de Schemas e Normalização**: [Avaliação de validações]
- **Matriz de Confiança de Dados**: [Tabela com fonte, tipo, classificação e evidência]
- **Recomendações de Integridade**: [Ações corretivas necessárias]
```

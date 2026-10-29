# GUIA DEFINITIVO DO ECOSSISTEMA DE AGENTES NO ANTIGRAVITY 2.0

> **Manual de Operação, Orquestração Multiagente e Auditoria de Software**  
> *Ambiente de Execução: Antigravity 2.0 (v44.4.3 | Language Server hub-2.26.0)*

---

## SUMÁRIO
1. [Parte 1 — Conceitos Fundamentais](#parte-1--conceitos-fundamentais)
2. [Parte 2 — Como Acessar e Invocar Cada Agente](#parte-2--como-acessar-e-invocar-cada-agente)
3. [Parte 3 — Como Utilizar Cada Agent Skill](#parte-3--como-utilizar-cada-agent-skill)
4. [Parte 4 — Tutorial Passo a Passo: Auditoria Completa](#parte-4--tutorial-passo-a-passo-auditoria-completa)
5. [Parte 5 — Protocolo de Correção de Problemas](#parte-5--protocolo-de-correção-de-problemas)
6. [Parte 6 — Diagnóstico e Solução de Problemas (Troubleshooting)](#parte-6--diagnóstico-e-solução-de-problemas-troubleshooting)
7. [Parte 7 — Cenários Práticos de Uso](#parte-7--cenários-práticos-de-uso)
8. [Parte 8 — Tabela de Referência Rápida](#parte-8--tabela-de-referência-rápida)

---

## PARTE 1 — CONCEITOS FUNDAMENTAIS

Para operar o Antigravity 2.0 com máxima eficiência, é imprescindível compreender a distinção entre os blocos construtivos da plataforma:

```
┌────────────────────────────────────────────────────────────────────────┐
│                          ANTIGRAVITY 2.0                               │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                      CHIEF AUDITOR (Orquestrador)             │   │
│   └──────┬───────────────────┬───────────────────┬─────────────────┘   │
│          │                   │                   │                     │
│          ▼                   ▼                   ▼                     │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐             │
│   │  Software    │    │    Data      │    │    ML        │   ...       │
│   │  Architect   │    │   Auditor    │    │  Auditor     │             │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘             │
│          │                   │                   │                     │
│          └───────────────────┴───────────────────┘                     │
│                              │                                         │
│                              ▼                                         │
│               AGENT SKILLS (.agents/skills/*)                          │
│               RULES (AGENTS.md & .agents/rules/*)                      │
│               FERRAMENTAS (read_file, run_command, etc.)               │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. O que é um Agente?
Um **Agente** no Antigravity é uma entidade cognitiva autônoma configurada com uma persona específica, diretrizes comportamentais, ferramentas associadas e um propósito determinado de engenharia. Ele processa entradas em linguagem natural, planeja ações, inspeciona o código e utiliza ferramentas para cumprir metas.

### 2. Diferença entre Agente Principal e Subagente
- **Agente Principal (Main Agent)**: É o interlocutor direto do usuário no Chat Canvas (ex.: o `chief-auditor` ou o assistente nativo). Ele recebe a solicitação geral, decompõe o problema, orquestra tarefas complexas e consolida as respostas finais.
- **Subagente (Worker / Specialist)**: É um agente derivado, especializado em um domínio técnico delimitado (ex.: `software-architect`, `data-auditor`, `ml-auditor`, `qa-security-auditor`). Ele opera em um contexto isolado e focado, executando investigações detalhadas sem sobrecarregar a janela de contexto do agente principal, reportando suas conclusões via mensagens estruturadas.

### 3. O que são Agent Skills?
As **Agent Skills** são manuais operacionais modulares ("runbooks" ou procedimentos padronizados) armazenados em pastas contendo um arquivo `SKILL.md`. Elas ensinam aos agentes o passo a passo exato de procedimentos complexos (ex.: como auditar data leakage, como rastrear dados simulados).
- **Progressive Disclosure (Divulgação Progressiva)**: Para economizar tokens, o Antigravity carrega inicialmente apenas o `name` e a `description` da Skill. O conteúdo detalhado do `SKILL.md` só é injetado no contexto quando o agente decide ativá-la para responder à demanda do usuário.

### 4. O que são Rules?
As **Rules** (definidas no arquivo raiz `AGENTS.md` e em `.agents/rules/*.md`) são restrições globais ou contextuais invariantes que o modelo é obrigado a obedecer em todas as etapas (ex.: "Proibido testes destrutivos", "Toda conclusão exige evidência com link de arquivo e linhas"). Enquanto as Skills dizem *como fazer*, as Rules dizem *o que é proibido ou obrigatório respeitar*.

### 5. Para que servem Workflows?
Os **Workflows** são fluxos encadeados de trabalho. Eles estruturam a cooperação entre múltiplos agentes e Skills, definindo a ordem lógica de execução (ex.: Descoberta ➔ Arquitetura ➔ Dados ➔ ML ➔ Segurança ➔ Consolidação).

### 6. Instruções vs. Ferramentas vs. Permissões
- **Instruções (Prompts/Personas)**: Definem o comportamento, a linguagem e o raciocínio do modelo.
- **Ferramentas (Tools)**: Funções operacionais que o agente pode invocar (`read_file`, `write_file`, `run_command`, `invoke_subagent`).
- **Permissões (Sandbox / Policy)**: O limite de segurança do sistema operacional. Por padrão, comandos rodam em Sandbox isolado (sem acesso à rede externa e sem permissão para executar comandos destrutivos no sistema host).

---

## PARTE 2 — COMO ACESSAR E INVOCAR CADA AGENTE

O ecossistema implementado conta com 5 agentes especializados, disponíveis tanto via arquivos de configuração em `.agents/agents/` quanto registrados ativamente no ambiente:

### 1. Chief Auditor (`chief-auditor`)
- **Papel**: Coordenador geral e líder da auditoria técnica.
- **Quando utilizar**: Para planejar e executar auditorias completas, consolidar relatórios divergentes ou priorizar o plano de remediação.
- **Como invocar**:
  - No chat, digite: `"Atue como o Chief Auditor e coordene a auditoria completa..."`
  - Ou selecione o arquivo do prompt: `@docs/prompts/07-auditoria-completa.md`
- **Ferramentas que utiliza**: `read_file`, `write_file`, `invoke_subagent`, `manage_subagents`, `send_message`.
- **Arquivos consultados**: Todos os arquivos de documentação, relatórios parciais dos especialistas e manifestos raiz.
- **Resultado produzido**: Relatório consolidado de auditoria com pontuação geral e matriz de severidade P0 a P3.
- **Como verificar a execução**: O Chief Auditor apresentará a divisão de fases, despachará subagentes e citará os relatórios consolidados em disco.

### 2. Software Architect (`software-architect`)
- **Papel**: Auditor de arquitetura, camadas, acoplamento e escalabilidade.
- **Quando utilizar**: Para entender a organização do código, mapear dependências, encontrar gargalos de manutenibilidade e desenhar o mapa arquitetural.
- **Como invocar**:
  - No chat, digite: `"Atue como o Software Architect e audite a arquitetura deste projeto..."`
  - Ou selecione o prompt: `@docs/prompts/03-auditar-arquitetura.md`
- **Ferramentas que utiliza**: `read_file`, `run_command` (listagens não destrutivas).
- **Arquivos consultados**: `requirements.txt`, `setup.py`, `render.yaml`, pastas `src/`, `frontend/`, `models/`.
- **Resultado produzido**: Mapa topológico de camadas, grafo de dependências e diagnóstico de dívida técnica com links de arquivos.
- **Como verificar a execução**: O agente listará arquivos específicos com caminhos clicáveis e analisará imports entre módulos.

### 3. Data Auditor (`data-auditor`)
- **Papel**: Auditor forense de integridade e veracidade de dados.
- **Quando utilizar**: Para checar se os dados da aplicação vêm de APIs reais ou de mocks, inspecionar schemas e normalização.
- **Como invocar**:
  - No chat, digite: `"Atue como o Data Auditor e verifique a integridade dos dados..."`
  - Ou selecione o prompt: `@docs/prompts/02-auditar-dados.md`
- **Ferramentas que utiliza**: `read_file`, `run_command` (buscas estáticas de padrões).
- **Arquivos consultados**: `src/collectors/*`, `src/normalization/*`, `src/schemas/*`, `src/database/*`.
- **Resultado produzido**: Matriz de Confiança de Dados (`[VERIFICADO]`, `[PARCIALMENTE VERIFICADO]`, `[INCONSISTENTE]`, `[MOCK]`) com localização exata de fixtures e dados sintéticos.
- **Como verificar a execução**: O agente apontará se encontrou termos como `mock`, `fake`, `dummy` ou valores numéricos hardcoded.

### 4. ML Auditor (`ml-auditor`)
- **Papel**: Auditor de inteligência artificial, validação cruzada temporal e data leakage.
- **Quando utilizar**: Para validar se os modelos preditivos (XGBoost, etc.) são confiáveis, se métricas são reais e se não há vazamento do futuro.
- **Como invocar**:
  - No chat, digite: `"Atue como o ML Auditor e avalie os modelos preditivos..."`
  - Ou selecione o prompt: `@docs/prompts/04-validar-modelos.md`
- **Ferramentas que utiliza**: `read_file`, `run_command` (execução segura de scripts de validação de métricas).
- **Arquivos consultados**: `src/ml/*`, `src/features/*`, `run_prediction.py`, `run_validation.py`.
- **Resultado produzido**: Parecer sobre validação temporal (TimeSeriesSplit vs. shuffle), diagnóstico de data leakage em features, métricas reais calculadas e confronto com baselines ingênuos.
- **Como verificar a execução**: O agente examinará o método de divisão de dados (`train_test_split`) e a normalização de features.

### 5. QA Security Auditor (`qa-security-auditor`)
- **Papel**: Auditor de segurança cibernética (OWASP, segredos) e qualidade de testes.
- **Quando utilizar**: Para varrer segredos expostos (`.env`), auditar autenticação JWT/senhas, avaliar endpoints e executar testes automatizados.
- **Como invocar**:
  - No chat, digite: `"Atue como o QA Security Auditor e execute a auditoria de segurança e testes..."`
  - Ou selecione os prompts: `@docs/prompts/05-auditar-seguranca.md` ou `@docs/prompts/06-executar-testes.md`
- **Ferramentas que utiliza**: `read_file`, `run_command` (execução controlada de testes não destrutivos).
- **Arquivos consultados**: `.env*`, `.gitignore`, `tests/*`, `conftest.py`, `src/api/*`.
- **Resultado produzido**: Relatório de segredos expostos, conformidade OWASP, diagnóstico da suíte de testes (aprovados, falhos, bloqueados por dependências).
- **Como verificar a execução**: O agente mostrará a saída real do terminal e a inspeção do `.gitignore`.

---

## PARTE 3 — COMO UTILIZAR CADA AGENT SKILL

As Skills estão localizadas em `.agents/skills/<nome>/SKILL.md`.

### Como as Skills são ativadas?
1. **Seleção Automática pelo Modelo**: Quando o seu prompt menciona termos compatíveis com a descrição da Skill (ex.: "mapear projeto", "verificar vazamento de dados", "auditar segurança"), o Antigravity carrega a Skill automaticamente via Progressive Disclosure.
2. **Invocação Explícita**: Para garantir 100% de precisão metodológica, você pode instruir o agente a usar a Skill explicitamente pelo nome:
   > *"Por favor, execute a Skill 'data-integrity-audit' para inspecionar este repositório."*

### Catálogo de Skills

| Skill | Objetivo | Invocação Recomendada | Resultado Esperado |
| :--- | :--- | :--- | :--- |
| **`project-discovery`** | Mapear pastas, tecnologias, dependências e entrypoints. | `"Execute a Skill project-discovery"` | Inventário tecnológico completo e fluxos de entrada. |
| **`data-integrity-audit`** | Rastrear dados de APIs, achar mocks e avaliar schemas. | `"Execute a Skill data-integrity-audit"` | Matriz de classificação de veracidade e lista de mocks. |
| **`ml-validation`** | Detectar data leakage, split temporal e métricas de ML. | `"Execute a Skill ml-validation"` | Diagnóstico de vazamento de dados e avaliação de baselines. |
| **`security-audit`** | Varrer credenciais, avaliar JWT, injeções e logs. | `"Execute a Skill security-audit"` | Matriz de vulnerabilidades de segurança (P0 a P3). |
| **`quality-testing`** | Rodar e registrar testes unitários/integrados reais. | `"Execute a Skill quality-testing"` | Tabela de execução com testes passados, falhos e bloqueados. |
| **`full-project-audit`** | Orquestrar auditoria completa com todos os especialistas. | `"Execute a Skill full-project-audit"` | Parecer Técnico Consolidado com plano de ação. |

---

## PARTE 4 — TUTORIAL PASSO A PASSO: AUDITORIA COMPLETA

Siga este roteiro numerado para executar uma auditoria de ponta a ponta no seu projeto:

### Passo 1: Abrir o Workspace do Projeto no Antigravity
Certifique-se de que o diretório aberto é o repositório do projeto (ex.: `C:\Users\Aluno\.gemini\antigravity\scratch\teste_tcc`).

### Passo 2: Disparar a Descoberta Inicial
No campo de chat, envie o prompt de descoberta:
```text
Atue como o Chief Auditor e execute a Skill 'project-discovery' para mapear a estrutura geral do projeto antes de iniciar a auditoria completa.
```
*O agente identificará a stack (Python, FastAPI, XGBoost, PostgreSQL), os módulos de `src/` e as dependências.*

### Passo 3: Iniciar a Auditoria Completa
Envie o comando de orquestração geral:
```text
Atue como o Chief Auditor e execute a Skill 'full-project-audit'. Despache os especialistas (Software Architect, Data Auditor, ML Auditor e QA Security Auditor) para inspecionar seus respectivos eixos e consolide o relatório final com matriz de riscos de P0 a P3.
```

### Passo 4: Acompanhar a Execução dos Especialistas
Durante a execução, o Chief Auditor irá:
1. Inspecionar a arquitetura de camadas e acoplamento.
2. Auditar os coletores e detectar mocks ou dados sintéticos.
3. Analisar a separação temporal do XGBoost e riscos de data leakage.
4. Varrer arquivos em busca de segredos expostos e avaliar a suíte de testes.

### Passo 5: Analisar o Relatório Consolidado
O Chief Auditor apresentará a matriz de prioridades:
- **P0**: Vulnerabilidades críticas e dados simulados não declarados.
- **P1**: Riscos de vazamento de dados em ML ou falhas funcionais.
- **P2**: Acoplamento excessivo ou documentação defasada.
- **P3**: Melhorias cosméticas.

---

## PARTE 5 — PROTOCOLO DE CORREÇÃO DE PROBLEMAS

Quando a auditoria apontar um problema que você deseja corrigir, **NUNCA** solicite alterações genéricas. Siga o protocolo de 8 etapas:

1. **Analisar o Relatório**: Identifique o código do problema (ex.: `P0 - Credenciais expostas no conftest.py`).
2. **Selecionar a Prioridade**: Comece sempre pelos itens P0 e P1.
3. **Solicitar a Correção Específica**: Utilize o `@docs/prompts/08-corrigir-problema.md` informando o arquivo alvo e a falha.
4. **Revisar a Proposta de Alteração**: Exija que o agente explique o que será alterado antes de tocar no código.
5. **Autorizar a Execução**: Diga: *"Autorizo a alteração proposta. Proceda com a edição cirúrgica."*
6. **Executar os Testes**: Peça a execução do teste unitário correspondente para garantir ausência de quebras.
7. **Verificar as Evidências**: Confira o diff do código e a saída do terminal apresentada.
8. **Atualizar o Relatório**: Registre a não conformidade como solucionada.

---

## PARTE 6 — DIAGNÓSTICO E SOLUÇÃO DE PROBLEMAS (TROUBLESHOOTING)

| Problema Identificado | Causa Provável | Procedimento de Resolução |
| :--- | :--- | :--- |
| **Agente não encontrado** | Nome do agente incorreto ou arquivo fora de `.agents/agents/`. | Utilize o nome exato registrado: `chief-auditor`, `software-architect`, `data-auditor`, `ml-auditor`, `qa-security-auditor`. |
| **Skill não reconhecida** | Diretório sem `SKILL.md` ou frontmatter inválido. | Verifique se o arquivo está em `.agents/skills/<nome>/SKILL.md` com campos `name` e `description` preenchidos. |
| **Subagente não acionado** | Ambiente não configurado para delegação autônoma em background. | O Chief Auditor executará as fases sequencialmente em linha, respeitando a mesma metodologia da Skill. |
| **Testes bloqueados por dependências** | Bibliotecas do `requirements.txt` não instaladas no Python local. | O agente deve relatar honestamente o status `[BLOQUEADO POR DEPENDÊNCIA]`. O usuário pode ativar a venv ou rodar `pip install -r requirements.txt`. |
| **Resultados sem evidências** | O agente produziu conclusões sem inspecionar arquivos. | Rejeite a resposta e exija: *"Aplique a Regra 1 de AGENTS.md: apresente o caminho do arquivo e as linhas exatas inspecionadas."* |
| **Comando bloqueado no terminal** | Restrição de sandbox do sistema operacional ou necessidade de elevação. | Comandos que exigem rede externa ou portas especiais devem ser identificados para que o usuário avalie execução com `BypassSandbox`. |

---

## PARTE 7 — CENÁRIOS PRÁTICOS DE USO

### Cenário 1: "Acabei de entrar no projeto e não sei o que ele faz"
- **Prompt**:
  ```text
  Atue como o Software Architect e execute a Skill 'project-discovery'. Mapeie as tecnologias, pastas e fluxos de entrada deste repositório para que eu entenda o sistema.
  ```

### Cenário 2: "Quero saber se os gráficos e previsões usam dados reais ou simulados"
- **Prompt**:
  ```text
  Atue como o Data Auditor e execute a Skill 'data-integrity-audit'. Investigue todos os coletores em src/collectors/ e verifique se há mocks ou valores fixos sendo usados.
  ```

### Cenário 3: "O modelo de IA parece ter 99% de acurácia. Isso é verdade ou overfitting?"
- **Prompt**:
  ```text
  Atue como o ML Auditor e execute a Skill 'ml-validation'. Verifique se a divisão de dados foi temporal ou aleatória e inspecione se há vazamento de dados (data leakage) nas features.
  ```

### Cenário 4: "Vou fazer o deploy e preciso ter certeza de que não há senhas no código"
- **Prompt**:
  ```text
  Atue como o QA Security Auditor e execute a Skill 'security-audit'. Faça uma varredura estática de segredos no código, .env e conftest.py, e avalie as rotas da API.
  ```

### Cenário 5: "Preciso de um parecer técnico completo para a banca avaliadora / cliente"
- **Prompt**:
  ```text
  Atue como o Chief Auditor e execute a Skill 'full-project-audit'. Conduza a auditoria completa de arquitetura, dados, ML e segurança, e apresente o veredito técnico consolidado.
  ```

---

## PARTE 8 — TABELA DE REFERÊNCIA RÁPIDA

| Agente | Especialidade | Skill Principal | Prompt Pré-configurado | Resultado Esperado |
| :--- | :--- | :--- | :--- | :--- |
| **Chief Auditor** | Coordenação & Veredito | `full-project-audit` | `docs/prompts/07-auditoria-completa.md` | Parecer consolidado com matriz P0 a P3. |
| **Software Architect** | Arquitetura & Qualidade | `project-discovery` | `docs/prompts/01-descobrir-projeto.md` | Mapa estrutural de camadas e dependências. |
| **Data Auditor** | Veracidade & Mocks | `data-integrity-audit` | `docs/prompts/02-auditar-dados.md` | Matriz de confiança e caça a dados simulados. |
| **ML Auditor** | IA & Validação Temporal | `ml-validation` | `docs/prompts/04-validar-modelos.md` | Diagnóstico de data leakage e métricas reais. |
| **QA Security Auditor** | Cibersegurança & Testes | `security-audit` / `quality-testing` | `docs/prompts/05-auditar-seguranca.md` | Relatório de segredos e execução de testes. |

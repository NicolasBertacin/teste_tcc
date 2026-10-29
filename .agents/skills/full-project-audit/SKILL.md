---
name: full-project-audit
description: >-
  Coordena uma auditoria completa e holística de software, acionando sequencialmente
  os especialistas (Software Architect, Data Auditor, ML Auditor e QA Security Auditor).
  Consolida os relatórios, cruza evidências, prioriza problemas de P0 a P3 e entrega
  um parecer técnico com plano de ação.
---

# Skill: Full Project Audit (Auditoria Holística e Integrada de Software)

Esta Skill implementa o fluxo de trabalho master do **Chief Auditor**, coordenando uma inspeção ponta a ponta do sistema através de múltiplos agentes especialistas ou fases metodológicas estruturadas.

## Critérios de Utilização
- Quando o usuário solicitar uma avaliação completa da saúde, qualidade e segurança do projeto.
- Antes de marcos de entrega importantes (lançamento de produto, entrega de TCC, deploy em produção, auditoria externa).
- Para obter um diagnóstico consolidado e um plano de remediação priorizado por severidade.

## Ferramentas Necessárias
- Orquestração de subagentes: `invoke_subagent`, `send_message`, `manage_subagents`.
- Leitura e execução: `read_file`, `write_file`, `run_command`.

## Procedimento Passo a Passo

### Fase 1: Mapeamento Inicial de Escopo
1. Executar a Skill `project-discovery` para identificar a estrutura do repositório, dependências declaradas e pontos de entrada.
2. Definir o plano de auditoria e os módulos críticos a inspecionar.

### Fase 2: Inspeção Arquitetural (Software Architect)
1. Despachar o agente `software-architect` para:
   - Mapear a arquitetura física e lógica.
   - Avaliar a separação de camadas e acoplamento.
   - Identificar dependências desatualizadas e código morto.
2. Coletar o relatório arquitetural preliminar.

### Fase 3: Auditoria Forense de Dados (Data Auditor)
1. Despachar a Skill `data-integrity-audit` com o agente `data-auditor` para:
   - Rastrear a procedência dos dados nos coletores.
   - Identificar mocks, dados estáticos e fallbacks sintéticos.
   - Avaliar a consistência dos schemas e normalização.
2. Coletar a matriz de confiança dos dados.

### Fase 4: Validação de Modelos Preditivos (ML Auditor)
1. Se o projeto contiver módulos preditivos ou analíticos, despachar a Skill `ml-validation` com o agente `ml-auditor` para:
   - Auditar a integridade da divisão temporal e verificar data leakage.
   - Verificar cálculo real de métricas de acurácia contra baselines ingênuos.
   - Avaliar reprodutibilidade e gestão de artefatos.
2. Coletar o parecer técnico de Machine Learning.

### Fase 5: Auditoria de Segurança e Testes (QA Security Auditor)
1. Despachar as Skills `security-audit` e `quality-testing` com o agente `qa-security-auditor` para:
   - Fazer varredura de credenciais e segredos em arquivos do projeto.
   - Auditar conformidade com OWASP, autenticação e sanitização de payloads.
   - Executar os testes automatizados possíveis no ambiente e registrar os bloqueados.
2. Coletar os relatórios de segurança e testes.

### Fase 6: Consolidação e Resolução de Conflitos
1. O `chief-auditor` cruza os quatro relatórios:
   - Identificar contradições (ex.: o arquiteto afirma que a camada de dados é robusta, mas o auditor de dados encontrou mocks silenciosos; ou o QA afirma que os testes passaram mas o auditor de ML detectou data leakage).
   - Sanar divergências aprofundando a inspeção dos arquivos em conflito.

### Fase 7: Matriz de Priorização (Severidade P0 a P3)
Organizar todos os apontamentos na matriz padronizada:
- **P0 (Crítico - Ação Imediata)**: Quebra de integridade de dados, segredos expostos, falhas graves de segurança.
- **P1 (Alto - Corrigir antes do deploy)**: Erros funcionais, data leakage em ML, testes críticos ausentes.
- **P2 (Médio - Próximo ciclo)**: Dívida técnica arquitetural, acoplamento excessivo, inconsistências de documentação.
- **P3 (Baixo - Melhoria contínua)**: Formatação, padronização cosmética e refatorações secundárias.

### Fase 8: Entrega do Parecer Técnico Final
1. Gerar o Parecer Técnico Executivo e gravar em `docs/relatorios/AUDITORIA_CONSOLIDADA.md`.
2. Apresentar o resumo ao usuário com o plano de ação detalhado e solicitar autorização antes de qualquer alteração de código.

## Evidências Obrigatórias a Coletar
- Relatórios parciais de cada frente especializada com links diretos para o código.
- Registro das saídas dos comandos e testes executados no terminal.
- Matriz consolidada de vulnerabilidades e riscos.

## Critérios de Sucesso e Falha
- **Sucesso**: Entrega de um relatório abrangente, fundamentado em evidências concretas de todos os quatro eixos, com riscos priorizados e plano de ação claro.
- **Falha**: Entrega de relatório parcial, conclusões sem evidências de código, ou tentativa de alterar a aplicação antes de apresentar a auditoria.

## Limitações e Restrições de Segurança
- Modo estritamente somente de leitura durante todas as fases de auditoria.
- Não executar comandos destrutivos nem vazar credenciais nos relatórios.

## Formato da Entrega
O relatório deve seguir o modelo consolidado do Chief Auditor, com sumário executivo, pontuação de saúde do sistema, detalhamento por especialidade, matriz de riscos e roadmap de correções sugerido.

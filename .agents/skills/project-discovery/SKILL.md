---
name: project-discovery
description: >-
  Mapeia a estrutura completa do projeto, inventaria tecnologias, frameworks,
  módulos, dependências e fluxos de execução da aplicação. Use sempre que
  iniciar o contato com um novo repositório ou antes de conduzir auditorias aprofundadas.
---

# Skill: Project Discovery (Descoberta e Mapeamento de Projeto)

Esta Skill orienta o agente na exploração estruturada e metodológica de uma base de código desconhecida, levantando sua stack, organização arquitetural e pontos de entrada de execução.

## Critérios de Utilização
- Quando o usuário solicitar entendimento geral do projeto ("O que faz este projeto?", "Como este sistema está estruturado?").
- Como primeira etapa obrigatória de qualquer processo de auditoria de software.
- Para verificar a integridade dos arquivos de configuração e dependências do projeto.

## Ferramentas Necessárias
- Ferramentas de sistema de arquivos: `read_file`, `run_command` (para listagem de diretórios e inspeção não destrutiva).

## Procedimento Passo a Passo

### 1. Inventário de Metadados e Raiz
1. Listar os arquivos na raiz do repositório identificando manifestos de dependências (`requirements.txt`, `package.json`, `setup.py`, `pyproject.toml`, `render.yaml`, `Dockerfile`).
2. Ler os arquivos de documentação principal existentes (`README.md`, `docs/`, `CONTRIBUTING.md`).
3. Registrar o sistema operacional alvo e requisitos de execução.

### 2. Mapeamento da Árvore de Diretórios
1. Percorrer a pasta de código-fonte (ex.: `src/`, `lib/`, `app/`) até o segundo nível de profundidade.
2. Identificar a separação das responsabilidades:
   - Interfaces e APIs (`src/api`, `controllers`, `routes`)
   - Lógica de negócio e serviços (`src/services`, `domain`)
   - Integrações e coletores (`src/collectors`, `clients`)
   - Camada de persistência (`src/database`, `models`, `schemas`)
   - Módulos especializados (`src/ml`, `src/guardian`, `src/features`)

### 3. Análise de Dependências e Versões
1. Inspecionar as versões declaradas de bibliotecas críticas no manifesto de dependências.
2. Checar a existência de dependências de desenvolvimento vs. dependências de produção.
3. Identificar potenciais conflitos de versão entre pacotes essenciais.

### 4. Mapeamento dos Fluxos de Entrada
1. Localizar os arquivos de inicialização do sistema (ex.: `main.py`, `app.py`, `run_*.py`).
2. Rastrear o ciclo de vida da inicialização: carregamento de variáveis de ambiente (`.env`), conexão a banco de dados e registro de rotas.

## Evidências Obrigatórias a Coletar
- Caminhos completos dos arquivos centrais do projeto.
- Lista de tecnologias e versões encontradas.
- Estrutura de pastas documentada em formato ASCII ou lista hierárquica.
- Identificação dos pontos de entrada com números de linhas inspecionados.

## Critérios de Sucesso e Falha
- **Sucesso**: Entrega de um relatório estruturado com stack tecnológica comprovada, diagrama textual de diretórios e identificação precisa do propósito do sistema.
- **Falha**: Afirmações genéricas sem citar arquivos concretos ou presunção de tecnologias não presentes no repositório.

## Limitações e Restrições de Segurança
- A Skill opera em modo estritamente **somente leitura**. Nenhuma alteração em arquivos ou comandos de build pesados devem ser executados nesta fase.
- Não expor chaves de API ou dados confidenciais eventualmente encontrados em arquivos `.env` ou configurações inspecionadas.

## Formato da Entrega
O relatório deve seguir a seguinte estrutura Markdown:
```markdown
# Relatório de Descoberta do Projeto: [Nome do Projeto]
- **Objetivo do Sistema**: [Resumo executivo do propósito]
- **Stack Tecnológica**: [Linguagens, Frameworks, Versões]
- **Estrutura de Pastas e Módulos**: [Tabela ou árvore descritiva]
- **Pontos de Entrada e Fluxos**: [Entrypoints identificados com links]
- **Dependências Centrais**: [Resumo dos principais pacotes]
- **Diagnóstico Inicial e Próximos Passos**: [Direcionamentos de auditoria]
```

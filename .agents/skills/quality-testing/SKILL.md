---
name: quality-testing
description: >-
  Organiza, executa e valida suítes de testes automatizados (unitários, integração,
  funcionais e de regressão). Registra formalmente testes aprovados, falhos e bloqueados
  por dependências, garantindo qualidade contínua.
---

# Skill: Quality Testing (Engenharia de Testes e Garantia da Qualidade)

Esta Skill padroniza o ciclo de vida de testes de software, a execução não destrutiva de suítes de teste e o registro transparente de cobertura e limitações operacionais.

## Critérios de Utilização
- Quando o usuário solicitar a execução ou validação de testes do sistema.
- Antes e depois de qualquer refatoração ou correção de bugs (prevenção de regressão).
- Para auditar a confiabilidade dos testes existentes (se testam cenários reais ou se possuem assertions vazias).

## Ferramentas Necessárias
- Terminal e executores de teste: `run_command` (para chamar `pytest`, `unittest` ou runners específicos).
- Ferramentas de leitura de código: `read_file` (para inspecionar `conftest.py` e arquivos de teste).

## Procedimento Passo a Passo

### 1. Inventário da Suíte de Testes Existente
1. Varrer a pasta de testes (`tests/`).
2. Mapear os tipos de testes presentes:
   - Testes unitários (componentes isolados com mocks legítimos).
   - Testes de integração (fluxos entre coletores, normalizadores e modelos).
   - Testes de API (rotas HTTP e status codes esperados).
3. Inspecionar `conftest.py` para entender as fixtures globais e o banco de dados de teste utilizado (ex.: SQLite em memória vs. PostgreSQL mockado).

### 2. Verificação de Pré-requisitos de Ambiente
1. Verificar a presença do interpretador Python e runner (`pytest`).
2. Identificar se as dependências do `requirements.txt` estão instaladas no ambiente ativo.
3. Se o runner (`pytest`) ou dependências essenciais não estiverem disponíveis no ambiente:
   - Não inventar que os testes passaram.
   - Registrar expressamente o status: `[BLOQUEADO POR DEPENDÊNCIA]`.
   - Executar, se possível, validações estáticas ou testes autônomos sem dependências externas via módulo padrão `unittest`.

### 3. Execução Controlada e Não Destrutiva
1. Executar a suíte de testes de forma segura e não destrutiva:
   ```powershell
   # Exemplo de comando seguro com isolamento e timeout
   pytest tests/ -v --tb=short
   ```
2. Registrar o tempo de execução, número de testes coletados, aprovados (`passed`), falhos (`failed`), pulados (`skipped`) e erros de execução (`errors`).

### 4. Auditoria da Efetividade dos Testes (Assertiveness)
1. Inspecionar se os testes realmente validam regras de negócio ou se usam assertions triviais:
   - Testes que apenas checam `assert result is not None` sem validar valores.
   - Testes com `except Exception: pass` que calam erros silenciosamente.
   - Testes que mockam o próprio objeto sob teste, gerando falsos positivos.

### 5. Testes de Regressão após Correções
1. Após a implementação de qualquer correção:
   - Executar o teste específico da funcionalidade corrigida.
   - Executar a suíte completa para assegurar que funcionalidades adjacentes não foram impactadas.

## Evidências Obrigatórias a Coletar
- Saída completa do comando do runner no terminal (stdout, stderr e exit code).
- Lista de arquivos de teste auditados.
- Registro detalhado de qualquer teste que falhou com a stack trace correspondente.
- Declaração explícita de testes não executados por restrição de ambiente.

## Critérios de Sucesso e Falha
- **Sucesso**: Relatório transparente com tabela de status de testes, diagnósticos precisos de eventuais falhas e identificação de lacunas de cobertura.
- **Falha**: Declarar que a suíte passou sem ter executado o runner, ou ocultar falhas e bloqueios de dependência.

## Limitações e Restrições de Segurança
- Nunca apontar a suíte de testes para bancos de dados de produção.
- Garantir que fixtures de teste utilizem dados transitórios ou em memória (`sqlite:///:memory:`).

## Formato da Entrega
```markdown
# Relatório de Execução e Qualidade de Testes
- **Inventário da Suíte**: [Total de arquivos e distribuição de testes]
- **Ambiente de Teste**: [Versão do Python, Runner e Dependências]
- **Resultado da Execução**:
  - Testes Executados: [X]
  - Aprovados: [Y]
  - Falhos: [Z]
  - Bloqueados/Pendentes: [W]
- **Detalhamento de Falhas e Alertas**: [Stack traces e explicações]
- **Auditoria de Confiabilidade dos Testes**: [Qualidade dos asserts e fixtures]
- **Recomendações para Quality Gate**: [Melhorias de cobertura e automação]
```

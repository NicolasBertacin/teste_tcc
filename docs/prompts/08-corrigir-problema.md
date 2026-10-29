# Prompt 08: Correção Guiada e Validação de Problemas

## Objetivo
Orientar o agente na correção segura, cirúrgica e validada de um problema identificado durante a auditoria, exigindo planejamento prévio, inspeção antes da edição, execução de testes pós-alteração e comprovação de ausência de regressões.

## Quando Utilizar
- Após a apresentação do relatório de auditoria e a escolha de uma prioridade (P0 ou P1) pelo usuário.
- Para corrigir um bug específico, remover um mock ou sanar uma vulnerabilidade de segurança de forma controlada.

---

## Prompt para Copiar e Executar

```text
Atue como o Engenheiro Especialista responsável pela correção do seguinte problema apontado na auditoria:

PROBLEMA SELECIONADO:
- Identificador / Severidade: [Ex.: P0 - Vazamento de credenciais em conftest.py / P1 - Data Leakage no pré-processamento de ML]
- Arquivo Alvo: [Ex.: src/features/feature_engineering.py]
- Descrição da Falha: [Descrever o problema com base no relatório]

Por favor, siga rigorosamente o seguinte protocolo de correção:
1. Inspeção Prévia: Leia o arquivo alvo e exiba o bloco de código antes da alteração.
2. Proposta de Alteração: Explique o que será alterado, por que a alteração resolve o problema e por que ela preserva a arquitetura atual sem quebrar contratos.
3. Edição Cirúrgica: Aplique a alteração utilizando a ferramenta apropriada, modificando apenas as linhas necessárias.
4. Validação Pós-Correção: Execute o teste unitário/de integração correspondente ou execute uma verificação sintática para comprovar que a falha foi sanada e que nenhuma regressão foi introduzida.
5. Evidência de Sucesso: Apresente o diff limpo da alteração e o resultado do teste no terminal.

Restrições:
- Não altere arquivos fora do escopo do problema selecionado.
- Não altere bancos de dados ou remova dependências sem aprovação.
- Preserve todos os comentários e docstrings existentes.
```

---

## Critérios de Aceitação
- [ ] O arquivo alvo é lido e inspecionado antes de ser editado.
- [ ] A alteração é cirúrgica e preserva a lógica do sistema.
- [ ] Uma validação (teste ou checagem de sintaxe) é executada após a edição.
- [ ] O relatório comprova a resolução do problema com evidência concreta.

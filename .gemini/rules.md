# Regras de Automação do Repositório (AI Workflow)

## Política de Commit e Pull Request Obrigatório:
- Ao finalizar qualquer alteração de código ou nova funcionalidade solicitada pelo usuário, a IA **NUNCA** deve commitar diretamente na branch principal (`main` ou `teste-sarima`).
- A IA deve executar o script de automação de PR:
  ```bash
  python scripts/ai_pr.py "<descricao-da-tarefa>"
  ```
- O script criará uma branch dedicada (`ia/<task>-<timestamp>`), fará o commit com mensagem padronizada, fará o push para o GitHub e fornecerá o link direto para o usuário revisar e aceitar o Pull Request.

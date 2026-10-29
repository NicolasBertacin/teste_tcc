---
name: security-audit
description: >-
  Audita a segurança da aplicação, exposição de credenciais, vulnerabilidades OWASP,
  autenticação, autorização e políticas de log. Procedimento estritamente não destrutivo
  e compatível com permissões de sandbox. Use para avaliação de postura de cibersegurança.
---

# Skill: Security Audit (Auditoria de Segurança da Informação)

Esta Skill define o protocolo para auditar vulnerabilidades de software, vazamento de segredos, falhas de controle de acesso e tratamento inadequado de dados confidenciais, com estrita observância das normas não destrutivas.

## Critérios de Utilização
- Quando for necessário validar a segurança do repositório antes de commits, merges ou deploys.
- Para inspecionar se chaves de API, senhas ou tokens privados estão expostos no código.
- Para verificar a conformidade dos endpoints de API com as melhores práticas de autenticação e validação de entrada (OWASP Top 10).

## Ferramentas Necessárias
- Ferramentas de leitura de código e busca estática: `read_file`, `run_command` (para buscas regex de segredos sem executar payloads ofensivos).

## Procedimento Passo a Passo

### 1. Varredura Estática de Segredos e Credenciais (Secret Scanning)
1. Inspecionar arquivos sensíveis:
   - Arquivos `.env`, `.env.example`, `.env.local`
   - Configurações de CI/CD (`render.yaml`, `vercel.json`, `.github/workflows`)
   - Arquivos de teste e fixtures (`conftest.py`, `test_*.py`)
2. Buscar padrões de chaves e segredos em texto claro:
   - Chaves privadas: `BEGIN PRIVATE KEY`, `BEGIN RSA PRIVATE KEY`
   - Tokens de API: `sk-`, `ghp_`, `xoxb-`, `bearer`, `access_token`
   - Senhas de banco: `postgresql://user:password@`, `mysql://`, `mongodb://`
   - Segredos JWT: `SECRET_KEY = "segredo123"`
3. Verificar se `.gitignore` protege adequadamente os arquivos de ambiente local (`.env`, `.venv`, `*.pem`, `*.key`).

### 2. Auditoria de Autenticação e Autorização
1. Localizar módulos de segurança (`src/api/auth.py`, `dependencies.py`, `security.py`).
2. Inspecionar o algoritmo de hashing de senhas:
   - Uso de funções seguras (`bcrypt`, `argon2`, `pbkdf2`).
   - Rejeição de algoritmos obsoletos (`md5`, `sha1`, texto claro).
3. Inspecionar tokens de autenticação (JWT):
   - Tempo de expiração (`exp` claim configurado).
   - Uso de algoritmo forte (`HS256`, `RS256`), rejeitando `alg: none`.
   - Validação de escopos e papéis de usuário (RBAC).

### 3. Validação e Sanitização de Entradas (OWASP Top 10)
1. Inspecionar rotas de API (`src/api/routes/`):
   - Injeção de SQL: Uso de ORM parametrizado (SQLAlchemy / Alembic) vs. queries concatenadas por string (`f"SELECT * FROM users WHERE id = {user_id}"`).
   - Validação de Schemas: Uso de Pydantic com tipagem rigorosa para descartar campos não esperados.
   - Limites de tamanho de payload para prevenir Denial of Service (DoS).
2. Inspecionar cabeçalhos de segurança CORS:
   - Origens permitidas (`allow_origins=["*"]` em produção é risco de segurança).

### 4. Políticas de Log e Tratamento de Exceções
1. Verificar como erros são capturados e devolvidos ao cliente:
   - Stack traces completos ou caminhos do servidor interno expostos nas respostas HTTP (Information Disclosure)?
   - Dados sensíveis (senhas, CPFs, números de cartão) sendo gravados em logs de depuração?

## Evidências Obrigatórias a Coletar
- Referências de linhas e arquivos onde segredos ou vulnerabilidades foram detectados.
- Configuração do `.gitignore` e verificação de arquivos versionados no Git.
- Implementação de hashing de senhas e assinatura de tokens.
- Mecanismo de tratamento global de exceções.

## Critérios de Sucesso e Falha
- **Sucesso**: Identificação de riscos de segurança reais com evidências e recomendações de correção imediata sem expor os segredos em texto legível.
- **Falha**: Execução de ataques destrutivos ou afirmação de invulnerabilidade sem inspecionar os manipuladores de rotas.

## Limitações e Restrições de Segurança
- Ações estritamente **não destrutivas**: Proibido tentar ataques de negação de serviço, injeções que alterem tabelas ou envio de pacotes anômalos a serviços externos.
- Mascarar sempre credenciais encontradas ao documentá-las no relatório.

## Formato da Entrega
```markdown
# Relatório de Auditoria de Segurança da Informação
- **Varredura de Segredos**: [Status de exposição de credenciais e .gitignore]
- **Autenticação e Sessões**: [Avaliação de JWT, senhas e expirações]
- **Validação de Entradas e Riscos OWASP**: [Injeções, schemas e CORS]
- **Vazamento de Informações em Logs/Erros**: [Diagnóstico de handlers de exceção]
- **Matriz de Vulnerabilidades Encontradas**: [Tabela com risco, severidade e arquivo]
- **Plano de Remediação de Segurança**: [Ações prioritárias de mitigação]
```

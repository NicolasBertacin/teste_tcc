# Prompt 05: Auditoria de Segurança da Informação

## Objetivo
Inspecionar a segurança do repositório em busca de exposição de segredos, falhas de autenticação, vulnerabilidades do OWASP Top 10, sanitização inadequada de entradas e vazamento de informações em logs.

## Quando Utilizar
- Antes de publicar código em repositórios públicos ou fazer deploy em homologação/produção.
- Ao configurar integrações com serviços externos que exigem chaves privadas e credenciais.
- Para assegurar que as APIs estejam protegidas contra injeção de dados e abusos.

---

## Prompt para Copiar e Executar

```text
Atue como o QA Security Auditor e execute a Skill 'security-audit' para verificar a segurança deste repositório.

Por favor, forneça:
1. A varredura de credenciais e segredos (Secret Scanning):
   - Inspecione arquivos .env, .env.example, scripts de teste (conftest.py) e configurações de deploy (.yaml, .json).
   - Verifique se o .gitignore impede o envio de dados sensíveis ao Git.
2. A análise de autenticação e controle de acesso:
   - Como os usuários/clientes se autenticam (JWT, API keys, basic auth)?
   - Os tokens possuem expiração configurada? As senhas são hasheadas com algoritmos robustos (bcrypt)?
3. A validação e sanitização de entradas:
   - Os endpoints HTTP validam schemas estritamente (Pydantic)?
   - Há proteção contra SQL Injection nas queries de banco?
   - Os cabeçalhos de CORS e rate limiting estão configurados de forma segura?
4. A auditoria de logs e tratamento de erros:
   - Erros internos da aplicação vazam stack traces completos para os clientes externos?
   - Informações sensíveis são gravadas em logs de depuração?
5. A Matriz de Riscos de Segurança identificando cada vulnerabilidade com severidade (P0 a P3).

Restrições:
- Procedimento estritamente não destrutivo. Não execute exploits, injeções reais ou ataques de sobrecarga.
- Nunca exiba senhas, tokens ou chaves encontradas em texto legível no relatório (utilize mascaramento).
- Modo somente de leitura.
```

---

## Critérios de Aceitação
- [ ] O status do `.gitignore` em relação a arquivos sensíveis é formalmente verificado.
- [ ] Qualquer segredo detectado em código ou fixtures é mascarado no relatório.
- [ ] A análise de endpoints avalia injeções e validações com base no código real inspecionado.
- [ ] Cada risco de segurança possui classificação de severidade e ação de mitigação recomendada.

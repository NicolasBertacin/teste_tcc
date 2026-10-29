# Prompt 06: Execução e Auditoria da Suíte de Testes

## Objetivo
Mapear a suíte de testes existente, verificar a prontidão do ambiente de execução, rodar os testes de forma segura e não destrutiva, registrar formalmente o status (aprovados, falhos, bloqueados por dependências) e avaliar a assertividade das verificações.

## Quando Utilizar
- Para verificar se o código atual está funcional e estável.
- Antes de iniciar refatorações ou após a aplicação de correções de bugs.
- Para diagnosticar dependências ausentes que bloqueiam a execução dos testes automatizados.

---

## Prompt para Copiar e Executar

```text
Atue como o QA Security Auditor e execute a Skill 'quality-testing' para auditar e rodar a suíte de testes deste projeto.

Por favor, forneça:
1. O inventário de arquivos de teste na pasta tests/, classificando os testes entre unitários, integração e funcionais de API.
2. A verificação do ambiente: verifique se o runner de testes (pytest) e os pacotes necessários estão disponíveis no ambiente ativo.
3. A execução controlada dos testes:
   - Execute a suíte de testes via comando de terminal seguro.
   - Caso o runner ou dependências não estejam instaladas, registre com clareza o status [BLOQUEADO POR DEPENDÊNCIA] e aponte os pacotes faltantes.
4. O diagnóstico de qualidade dos testes:
   - As assertions validam regras de negócio ou são vazias/triviais?
   - Os testes utilizam mocks coerentes ou mascaram falhas com blocos de exceção genéricos?
5. O Relatório de Execução com a contagem formal de testes aprovados, falhos, pulados e pendentes.

Restrições:
- Não afirme que testes passaram se o comando falhou ou não pôde ser executado por ausência de dependências.
- Execução não destrutiva: não utilize bancos de dados de produção para testes.
```

---

## Critérios de Aceitação
- [ ] O status dos testes reflete com exatidão a execução real do terminal (com exit code e log).
- [ ] Se houver bloqueio por falta de pacotes no ambiente, os pacotes ausentes são listados com honestidade técnica.
- [ ] As fixtures e assertions dos testes existentes são avaliadas quanto à sua assertividade.

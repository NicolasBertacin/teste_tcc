# Prompt 07: Auditoria Completa e Orquestrada do Sistema

## Objetivo
Acionar o Chief Auditor para coordenar uma auditoria ponta a ponta em todos os 4 eixos (Arquitetura, Integridade de Dados, Machine Learning e Segurança/Qualidade), cruzando evidências, eliminando contradições, priorizando problemas e apresentando o Parecer Técnico Final com plano de ação.

## Quando Utilizar
- Como auditoria inicial completa ao assumir a manutenção ou avaliação de um sistema.
- Antes de submissões de projetos, bancas de avaliação (TCC) ou lançamentos em produção.
- Para obter a matriz geral de riscos e o roadmap priorizado de confiabilidade.

---

## Prompt para Copiar e Executar

```text
Atue como o Chief Auditor e execute a Skill 'full-project-audit' para realizar uma auditoria completa e estruturada neste projeto.

Por favor, orquestre as quatro frentes especializadas:
1. Mapeamento Arquitetural (Software Architect):
   - Mapear stack, camadas, acoplamento e gargalos de manutenibilidade.
2. Auditoria Forense de Dados (Data Auditor):
   - Rastrear coletores, identificar mocks/valores estáticos e classificar a veracidade dos dados.
3. Validação de Inteligência Artificial (ML Auditor):
   - Inspecionar data leakage, validação temporal, cálculo real de métricas e baselines.
4. Segurança e Testes (QA Security Auditor):
   - Verificar exposição de segredos, OWASP, cobertura e execução real da suíte de testes.

Em seguida, consolide o relatório final contendo:
- Sumário Executivo e Pontuação Geral de Confiabilidade do Sistema.
- Síntese de Evidências por Especialidade (com links markdown para arquivos e linhas).
- Resolução de Contradições entre frentes técnicas.
- Matriz Consolidada de Riscos e Problemas (classificados de P0 a P3).
- Parecer Técnico Final e Plano de Ação Sequenciado.

Restrições Obrigatórias:
- Fase estritamente somente de leitura. Não modifique código da aplicação antes da autorização.
- Toda conclusão deve estar ancorada em arquivos reais inspecionados ou comandos executados.
- Registre expressamente limitações de ambiente e dependências não instaladas.
```

---

## Critérios de Aceitação
- [ ] O relatório final cobre os 4 eixos com evidências verificáveis.
- [ ] A matriz de severidade classifica todos os problemas em P0, P1, P2 ou P3.
- [ ] O Chief Auditor apresenta o veredito técnico e aguarda a autorização do usuário antes de qualquer alteração no código.

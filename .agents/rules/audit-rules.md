---
description: Diretrizes obrigatórias de auditoria de software, rigor de evidências e segurança no Antigravity.
trigger: always_on
---

# Regras de Auditoria e Qualidade de Software

1. **Protocolo de Evidências**: Toda afirmação técnica sobre o código deve referenciar o arquivo e as linhas exatas inspecionadas.
2. **Proibição de Alucinação de Métricas**: Não infira acurácia, MAE, tempo de resposta ou cobertura de código sem execução real no terminal.
3. **Detecção de Mocks**: Sinalize proativamente dados sintéticos e fixtures nas camadas de dados e machine learning.
4. **Aprovação Humana Obrigatória (Recomendar -> Aceitar/Rejeitar -> Executar)**: A cada prompt, o agente deve diagnosticar, recomendar e apresentar a proposta visual (diff antes/depois). É expressamente proibido alterar qualquer arquivo sem que o usuário confirme explicitamente que aceita a alteração.
5. **Classificação Padronizada de Severidade**:
   - `P0 - Crítico`: Falhas que comprometem dados reais, vazamento de chaves ou quebra total de integridade.
   - `P1 - Alto`: Bugs funcionais, data leakage em pipelines de ML ou dependências inseguras.
   - `P2 - Médio`: Violações de boas práticas de arquitetura, falta de testes ou código duplicado.
   - `P3 - Baixo`: Otimizações de formatação, documentação e refatorações cosméticas.

# Prompt 03: Auditoria de Arquitetura e Qualidade de Código

## Objetivo
Analisar a arquitetura técnica da aplicação, separação de camadas, aderência a padrões de design (SOLID), acoplamento entre módulos, duplicidade de código, dívida técnica e gargalos de escalabilidade.

## Quando Utilizar
- Antes de iniciar grandes refatorações ou expansões do sistema.
- Para identificar causas raízes de bugs recorrentes ou lentidão.
- Para gerar o mapa da arquitetura atual do sistema para documentação técnica.

---

## Prompt para Copiar e Executar

```text
Atue como o Software Architect para conduzir uma auditoria aprofundada de arquitetura e qualidade de código neste repositório.

Por favor, forneça:
1. O mapeamento da topologia da arquitetura: fronteiras entre interfaces externas (rotas/APIs), camada de domínio/serviços, camada de persistência e módulos auxiliares.
2. A análise de separação de responsabilidades (princípios SOLID): aponte se há violações de responsabilidade única (classes ou funções sobrecarregadas) ou dependências circulares.
3. A identificação de código duplicado, arquivos com excesso de linhas (code smells) ou métodos monolíticos difíceis de testar.
4. A avaliação de escalabilidade: como o sistema lida com conexões de banco de dados, requisições concorrentes e tarefas pesadas (assíncrono vs. síncrono).
5. O mapa da arquitetura em formato textual/mermaid e uma lista priorizada de recomendações arquiteturais justificadas.

Restrições:
- Modo estritamente somente de leitura. Não refatore código nesta etapa.
- Preserve as tecnologias existentes: não sugira reescrever o sistema em outra linguagem a menos que haja inviabilidade técnica comprovada com dados.
- Cite evidências com links para os arquivos inspecionados.
```

---

## Critérios de Aceitação
- [ ] O relatório detalha a separação entre camadas de frontend, backend, banco e serviços.
- [ ] Pontos de acoplamento indevido ou arquivos monolíticos são comprovados com links de arquivo e linhas.
- [ ] O diagrama ou mapa da arquitetura reflete fielmente o código real do repositório.
- [ ] As recomendações priorizam estabilidade e manutenibilidade sem propor trocas arbitrárias de stack.

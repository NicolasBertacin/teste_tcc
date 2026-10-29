# Prompt 04: Validação de Modelos Preditivos e Machine Learning

## Objetivo
Auditar pipelines de Machine Learning e Inteligência Artificial, investigando vazamento de dados (data leakage), integridade da separação temporal, métricas reais de performance (MAE, RMSE, MAPE) e comparação contra baselines ingênuos.

## Quando Utilizar
- Sempre que houver algoritmos preditivos gerando estimativas ou recomendações para o usuário.
- Para verificar se a acurácia reportada é fidedigna ou se foi inflada por dados futuros no treino.
- Para assegurar a reprodutibilidade dos modelos e estabilidade de predições.

---

## Prompt para Copiar e Executar

```text
Atue como o ML Auditor e execute a Skill 'ml-validation' para auditar rigorosamente os módulos de inteligência artificial deste repositório.

Por favor, forneça:
1. O inventário completo de modelos implementados (ex.: XGBoost, Scikit-learn, heurísticas), localizando os arquivos de treino, inferência e artefatos salvos (.json, .pkl).
2. A investigação minuciosa de Data Leakage (Vazamento de Dados):
   - O pré-processamento (normalização, imputação de médias) foi ajustado apenas sobre o conjunto de treino ou sobre o dataset inteiro antes do split?
   - As variáveis de entrada (features) contêm informações que só estariam disponíveis no futuro?
3. A auditoria da separação de dados:
   - Foi utilizado split temporal cronológico (TimeSeriesSplit / corte por data) ou split aleatório com embaralhamento (shuffle=True)?
4. A verificação das métricas de desempenho:
   - As métricas (MAE, RMSE, MAPE) foram calculadas a partir de dados reais ou são estimativas?
   - O modelo complexo foi confrontado com baselines ingênuos (ex.: repetir o último valor ou média histórica)? Ele supera o baseline?
5. A avaliação de reprodutibilidade (sementes/random_state fixados) e riscos de overfitting.

Restrições:
- Jamais invente métricas de desempenho ou afirme resultados sem execução comprovada ou leitura do script de avaliação.
- Diferencie explicitamente: Valores Observados, Estimativas Estatísticas e Previsões Preditivas.
- Modo estritamente somente de leitura.
```

---

## Critérios de Aceitação
- [ ] O split de treino/teste é classificado como temporal correto ou incorreto (com evidência em código).
- [ ] O pipeline de engenharia de atributos é analisado quanto a riscos de data leakage.
- [ ] Nenhuma métrica é gerada sem embasamento em código ou log existente.
- [ ] O relatório aponta se há ou não comparação contra baselines ingênuos.

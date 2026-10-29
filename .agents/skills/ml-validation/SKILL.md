---
name: ml-validation
description: >-
  Valida modelos preditivos e pipelines de Machine Learning. Examina arquiteturas de modelos,
  estratégias de validação temporal, riscos de vazamento de dados (data leakage),
  reprodutibilidade e cálculo real de métricas contra baselines. Use para auditar módulos de IA.
---

# Skill: ML Validation (Validação de Modelos Preditivos e Machine Learning)

Esta Skill estabelece a metodologia técnica para auditar rigorosamente sistemas de aprendizado de máquina, prevenindo premissas falsas sobre a acurácia de modelos preditivos e garantindo que métricas não sejam fruto de vazamento de dados ou overfitting.

## Critérios de Utilização
- Sempre que o repositório contiver pipelines de IA, modelos de previsão (`XGBoost`, `Scikit-Learn`, `LightGBM`, `PyTorch`, `TensorFlow`) ou scripts preditivos (`run_prediction.py`, `src/ml/`).
- Para validar se as previsões entregues aos usuários possuem sustentação estatística confiável.
- Para verificar a separação correta de dados temporais e prevenção de data leakage.

## Ferramentas Necessárias
- Ferramentas de inspeção de código: `read_file`, `run_command` (para inspeção de scripts de treino e cálculo seguro de métricas quando disponível).

## Procedimento Passo a Passo

### 1. Inventário de Modelos e Algoritmos
1. Localizar os módulos de Machine Learning (`src/ml/`, `models/`, `src/features/`).
2. Identificar os algoritmos instanciados (ex.: `XGBRegressor`, `XGBClassifier`, `RandomForest`, `LinearRegression`).
3. Verificar como o modelo é persistido e carregado (arquivos `.json`, `.pkl`, `.joblib`, `.onnx`).

### 2. Investigação Crítica de Data Leakage (Vazamento de Dados)
1. Inspecionar o pipeline de pré-processamento de features (`src/features/feature_engineering.py`):
   - Escalonamento (`StandardScaler`, `MinMaxScaler`): Foi aplicado antes da divisão treino/teste? (Violação grave se aplicado globalmente).
   - Imputação de nulos: Usa estatísticas calculadas sobre todo o dataset ou apenas sobre a janela de treino?
   - Target Leakage: Há variáveis de entrada que contêm correlação espúria ou informação derivada do próprio target futuro?

### 3. Auditoria da Estratégia de Validação Temporal
1. Verificar como é feita a divisão entre dados de treino e teste:
   - Em problemas de demanda e séries temporais, o split DEVE ser estritamente cronológico (`TimeSeriesSplit` ou corte temporal explícito).
   - O uso de `train_test_split(..., shuffle=True)` em séries temporais invalida o modelo, pois permite que dados futuros vazem para o treino de pontos passados.
2. Identificar se existe validação out-of-time (OOT) ou backtesting com múltiplas janelas deslizantes.

### 4. Auditoria de Métricas Reais vs. Baselines
1. Inspecionar as funções de cálculo de métricas (`src/ml/metrics.py`, `evaluator.py`):
   - Verificar as fórmulas utilizadas: MAE (Mean Absolute Error), RMSE (Root Mean Squared Error), MAPE (Mean Absolute Percentage Error), R².
   - Verificar o tratamento de divisão por zero no cálculo do MAPE ($y_i = 0$).
2. Confrontar os resultados do modelo com **Baselines Ingênuos**:
   - Baseline Ingênuo (Persistência): Repete o último valor observado.
   - Baseline Média: Usa a média histórica simples.
   - O modelo complexo é comprovadamente superior a esses baselines?

### 5. Reprodutibilidade e Sementes Aleatórias
1. Verificar se `random_state` ou `seed` está fixado nas instanciações do modelo e nos splits.
2. Checar se a lista de features usadas no treino é explicitamente salva junto ao modelo, evitando divergência de colunas em tempo de inferência (`feature drift` / `column mismatch`).

## Evidências Obrigatórias a Coletar
- Código da divisão de dados (split temporal vs. aleatório).
- Código do pipeline de features demonstrando se há ou não data leakage.
- Hiperparâmetros e sementes configuradas nos estimadores.
- Comprovação da presença ou ausência de comparação com baselines.

## Critérios de Sucesso e Falha
- **Sucesso**: Parecer técnico detalhado sobre a solidez matemática e metodológica do modelo com indicação de riscos de overfitting e data leakage.
- **Falha**: Afirmar métricas de acurácia que não foram calculadas em execução real ou atestar confiabilidade de modelo sem validar o split temporal.

## Limitações e Restrições de Segurança
- Não re-treinar modelos massivos em hardware sem suporte durante a auditoria.
- A auditoria deve ser orientada à inspeção estática e testes analíticos pontuais.

## Formato da Entrega
```markdown
# Relatório de Validação de Machine Learning
- **Inventário de Modelos**: [Algoritmos e bibliotecas identificadas]
- **Análise de Engenharia de Features e Data Leakage**: [Diagnóstico com evidências]
- **Estratégia de Validação Temporal**: [Avaliação do split e janelas]
- **Métricas e Comparação com Baselines**: [Resultados auditados]
- **Reprodutibilidade e Riscos de Produção**: [Sementes, artefatos, estabilidade]
- **Recomendações Técnicas de MLOps**: [Ações para garantir robustez preditiva]
```

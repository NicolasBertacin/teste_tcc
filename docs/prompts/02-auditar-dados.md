# Prompt 02: Auditoria de Integridade e Veracidade de Dados

## Objetivo
Rastrear a proveniência dos dados, verificar coletores e integrações de APIs, auditar pipelines de normalização e persistência, identificar a presença de mocks ou valores estáticos e classificar o nível de confiabilidade dos dados.

## Quando Utilizar
- Para verificar se os dados exibidos nos relatórios e previsões são reais ou simulados.
- Ao auditar integrações com APIs externas (ex.: Mercado Livre, Amazon, Google Trends).
- Para assegurar que o banco de dados não está sendo corrompido com registros nulos ou anômalos.

---

## Prompt para Copiar e Executar

```text
Atue como o Data Auditor e execute a Skill 'data-integrity-audit' para inspecionar os fluxos de dados deste repositório.

Por favor, forneça:
1. O inventário de todas as fontes de dados e coletores existentes (src/collectors/ ou equivalente), indicando quais APIs externas são chamadas e como as credenciais são tratadas.
2. A caça minuciosa a mocks e valores hardcoded: verifique se existem fixtures, dados sintéticos, geradores aleatórios ou valores estáticos atuando em código de produção ou mascarados como dados reais. Aponte o arquivo e a linha de cada ocorrência.
3. A inspeção dos esquemas de validação e normalização (Pydantic, SQLAlchemy, normalizers), avaliando o tratamento de nulos, tipos e outliers.
4. A integridade da persistência no banco de dados (chaves primárias, relacionamentos, timestamps de auditoria).
5. A Matriz de Confiança de Dados categorizando cada entidade estritamente em: [VERIFICADO], [PARCIALMENTE VERIFICADO], [INCONSISTENTE] ou [NÃO VERIFICADO / MOCK].

Restrições:
- Operação em modo somente de leitura. Proibido executar inserts, updates ou chamadas destrutivas a APIs.
- Nunca afirme que todos os dados são verídicos sem evidência direta de chamada de rede ou persistência conferida.
- Mascare qualquer chave de API ou credencial encontrada ao citar trechos de código.
```

---

## Critérios de Aceitação
- [ ] Todo mock ou valor fixo detectado contém o caminho do arquivo e intervalo de linhas.
- [ ] Os coletores de dados são identificados com suas respectivas fontes de origem.
- [ ] A matriz de classificação utiliza exclusivamente as 4 categorias oficiais.
- [ ] Nenhuma credencial confidencial é exposta no relatório.

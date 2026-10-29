# Prompt 01: Descoberta e Mapeamento do Projeto

## Objetivo
Mapear a estrutura física e lógica do projeto atual, identificando sua finalidade central, tecnologias, frameworks, dependências, organização modular e principais fluxos de execução.

## Quando Utilizar
- Ao abrir o projeto pela primeira vez.
- Para entender o panorama geral antes de iniciar qualquer ciclo de desenvolvimento ou auditoria.
- Para verificar a integridade da organização de pastas e arquivos de configuração.

---

## Prompt para Copiar e Executar

```text
Atue como o Software Architect e execute a Skill 'project-discovery' para mapear detalhadamente este repositório.

Por favor, forneça:
1. Um resumo executivo do propósito deste sistema (o problema de negócio que ele resolve).
2. O inventário de tecnologias, linguagens e versões declaradas nos arquivos de manifesto (requirements.txt, package.json, setup.py, render.yaml, etc.).
3. A estrutura hierárquica das pastas principais (ex.: src/, tests/, docs/, data/) explicando a responsabilidade de cada diretório.
4. Os pontos de entrada (entrypoints) da aplicação (arquivos de inicialização de servidor ou scripts principais de execução).
5. As dependências centrais e potenciais gargalos ou tecnologias legadas identificadas.

Restrições:
- Operação estritamente somente de leitura. Não modifique nenhum arquivo.
- Cada observação deve citar o caminho exato do arquivo inspecionado com links markdown.
- Não invente tecnologias que não constem nos arquivos do repositório.
```

---

## Critérios de Aceitação
- [ ] O relatório cita nominalmente os arquivos do repositório (`README.md`, `requirements.txt`, etc.).
- [ ] O propósito do sistema está claramente explicado sem generalismos.
- [ ] Os pontos de entrada de código estão apontados com links e números de linha.
- [ ] Nenhum arquivo foi modificado durante a execução.

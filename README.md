# Plano de Ação

Painel de acompanhamento de um plano de ação: fases, kanban, lista de atividades,
pendências e registro. Página estática, sem backend e sem banco de dados.

## O aplicativo é público. Os dados não são.

O site sobe **vazio**. O plano entra pela aba **Projeto → Importar dados**, com o
arquivo JSON, e fica no `localStorage` do navegador de quem importou. Nada é enviado
para lugar nenhum.

- Cada navegador tem o seu painel. Outro computador ou aba anônima começa do zero.
- Para o outro ver suas mudanças: **Projeto → Exportar dados** e mande o arquivo.
- Limpar os dados de navegação apaga o painel. Exporte antes.

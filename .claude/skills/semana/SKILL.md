---
name: semana
description: Sessão semanal em lote (modo poupança). Numa só passagem, faz o balanço da semana, encontra os leads da semana seguinte, escreve todas as mensagens e seguimentos e atualiza tarefas e plano. Usar uma vez por semana (domingo ou segunda).
---
# /semana: tudo de uma vez, para poupar créditos

Numa só sessão, por esta ordem:
1. `bash negocio/scripts/resumo.sh`: números da semana.
2. **gestor-crm**: aplica no CRM tudo o que o Yax reportou e marca os seguimentos devidos.
3. **cacador-leads**: 40 leads novos, divididos pelas linhas que mais responderam (por defeito 25 artistas e 15 marcas).
4. **copywriter**: todas as mensagens novas **e** todos os seguimentos, organizados por dia em `negocio/envios/semana-AAAA-MM-DD.md` (seg a sex, 10 por dia).
5. Atualiza `TAREFAS.md` e o plano da semana.
6. Commit + push (uma única vez, no fim).
7. Resposta ao Yax com no máximo 8 linhas: números, onde estão as mensagens e as 3 prioridades.

Durante a semana o Yax só abre o ficheiro de envios do dia, copia, cola e envia. Não precisa de gastar créditos.

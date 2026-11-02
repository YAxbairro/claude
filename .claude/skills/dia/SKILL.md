---
name: dia
description: Briefing diário do Yax. Diz exatamente o que fazer hoje na sua 1 hora, com base no plano, no CRM e nas tarefas. Usar quando o Yax pergunta "o que faço hoje?" ou abre a sessão à noite.
---
# /dia: o briefing de hoje

1. Corre `bash negocio/scripts/resumo.sh` para ver o estado do CRM e do dinheiro.
2. Lê `negocio/02-plano-14-dias.md` (a linha de hoje) e `negocio/TAREFAS.md`.
3. Vê no CRM os leads com `data_proximo` igual ou anterior a hoje.
4. Faz já o trabalho do Claude para hoje (usa os sub-agentes: `cacador-leads`, `copywriter`, `gestor-crm`...).
5. Responde ao Yax em português, curto, com este formato:

```
📅 [dia] · Meta: [x] € de [y] € ([z]%)

✅ Já fiz por ti: [lista curta]

👤 A tua hora de hoje:
1. [ação concreta + ficheiro/link]  (~__ min)
2. ...
3. ...

🎯 Feito quando: [critério claro]
```
No máximo 3 ações para o Yax, que caibam em 60 min. Commit + push no fim.

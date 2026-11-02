---
name: novo-cliente
description: Abre um projeto para um cliente que fechou. Cria a pasta a partir do modelo, preenche o brief, atualiza o CRM e as tarefas, e diz ao Yax o que pedir ao cliente. Uso - /novo-cliente [nome] [produto] [valor]
---
# /novo-cliente [nome] [produto] [valor]

1. `slug` = nome em minúsculas, com hífens.
2. Copia `negocio/clientes/_modelo/` para `negocio/clientes/<slug>/`.
3. Preenche `brief.md` com o que já se sabe (do CRM e da conversa).
4. CRM: estado `pago-50` (ou `proposta`, se ainda não pagou). Regista o pagamento em `crm/pagamentos.csv`.
5. Em `TAREFAS.md`, adiciona as tarefas do processo correspondente (`negocio/processos/`).
6. Responde ao Yax com a **lista exata de materiais a pedir ao cliente**, pronta a copiar e colar.
7. Commit + push.

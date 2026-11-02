---
name: entrega
description: Produz e entrega o trabalho de um cliente (motion, visualizer, site, menu) através do sub-agente certo e prepara a mensagem de entrega e cobrança. Uso - /entrega [cliente]
---
# /entrega [cliente]

1. Lê `negocio/clientes/<slug>/brief.md` e `estado.md`.
2. Escolhe o sub-agente: vídeo → **produtor-motion** · site → **construtor-web** · Menu Real → segue `processos/menu-real.md`.
3. Gera a prévia (com marca de água).
4. Atualiza o CRM para `entregue`, o `estado.md` do cliente e `TAREFAS.md`.
5. Dá ao Yax a **mensagem de entrega + cobrança** do `03-mensagens.md`, já preenchida.
6. Commit + push.

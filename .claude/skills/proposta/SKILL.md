---
name: proposta
description: Gera uma proposta de 1 página para um lead, através do sub-agente propostas. Uso - /proposta [nome do lead]
---
# /proposta [lead]

1. Lança o sub-agente **propostas** com o lead e o contexto do CRM e da conversa.
2. Atualiza o CRM: estado `proposta` e `data_proximo` = daqui a 3 dias.
3. Dá ao Yax o texto curto da mensagem para enviar com a proposta.
4. Commit + push.

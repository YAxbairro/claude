# 05 · O Funil: do lead ao dinheiro

```
1 ENCONTRAR → 2 CONTACTAR → 3 CONVERSAR → 4 PROPOSTA → 5 50% PAGO → 6 PRODUZIR → 7 ENTREGAR → 8 50% FINAL → 9 REFERÊNCIAS
    🤖           👤 (🤖 escreve)    👤            🤖              👤             🤖            👤 (🤖 prepara)      👤               👤
```

## Quem faz o quê, e o que está automatizado

| Etapa | Quem | Como | Automatizado? |
|---|---|---|---|
| 1. Encontrar leads | 🤖 | Firecrawl: artistas com lançamentos recentes, negócios sem site, imobiliárias | ✅ Claude faz em lote, 30 por dia |
| 2. Contactar | 👤 | Mensagem personalizada escrita pelo Claude, enviada pelo Yax (Instagram e WhatsApp não deixam automatizar com segurança) | 🟡 Meio: o Claude escreve, o Yax só copia e cola |
| 3. Conversar | 👤 | O Yax responde; se ficar preso, cola a conversa ao Claude | 🟡 |
| 4. Proposta | 🤖 | Gamma ou PDF, a partir de [01-ofertas.md](01-ofertas.md) | ✅ |
| 5. Pagamento inicial | 👤 | Link de pagamento | 🔜 Fase 2 |
| 6. Produzir | 🤖 | Remotion, HyperFrames ou Vercel, seguindo os [processos/](processos/) | ✅ Claude produz, o Yax aprova |
| 7. Entregar | 👤 | Prévia com marca de água → aprovação | 🟡 |
| 8. Pagamento final | 👤 | Mensagem de cobrança do [03](03-mensagens.md) | 🟡 |
| 9. Referências | 👤 | Mensagem de referências do [03](03-mensagens.md) | 🟡 |

## CRM: [crm/leads.csv](crm/leads.csv)

**Estados:** `novo` → `pronto-a-enviar` → `contactado` → `respondeu` → `proposta` → `pago-50` → `producao` → `entregue` → `pago-100` → `referencias` · ou `perdido`

**Rotina:** o Claude atualiza o CRM sempre que o Yax diz o que aconteceu ("o João respondeu", "a Maria pagou").

## Próximos passos de automação (por ordem)
1. ✅ CRM em CSV no repositório (já está)
2. 🔜 CRM numa página para o telemóvel, para ver e atualizar o pipeline em qualquer lado
3. 🔜 Gerador de visualizers: o cliente envia a música e a capa → render automático
4. 🔜 n8n para leads automáticos todas as manhãs

# BRAVA · Residências · Praia

12 apartamentos T3 · lojas · garagem com elevador · Palmarejo, Rua Ilha Brava, Praia, Cabo Verde.

**Página de apresentação (publicada):** https://claude.ai/artifact/W6JEBwtPP1Hc2HDqLZTbbr

## Documentos (ler por esta ordem)
| # | Documento | Conteúdo |
|---|---|---|
| 01 | [Diagnóstico](01-diagnostico.md) | Análise dos 39 renders e 12 referências: pontos fortes e problemas corrigidos |
| 02 | [Estratégia](02-estrategia.md) | Posicionamento, personas, escada de preços de fundador, plano de pagamento, metas |
| 03 | [Marca](03-marca.md) | Nome, símbolo, paleta, tipografia, voz, regras de imagem |
| 04 | [Campanha](04-campanha.md) | Calendário de 20 nov. a ago. 2027, canais, segmentação, banco de mensagens |
| 05 | [Vendas](05-vendas.md) | Caminho do comprador, guiões de WhatsApp, objeções, documentos, indicadores |
| 06 | [Pendentes](06-pendentes.md) | **O que falta saber**: plantas, prazos, custos, WhatsApp |
| 07 | [Pesquisa](07-pesquisa-mercado.md) | Preços, crédito, fiscalidade, concorrência, redes sociais, fontes |

## Material produzido
- `marca/`: símbolo (SVG) e aplicações do logótipo
- `campanha/post-01…09.jpg`: 9 peças 1080×1350 prontas para Instagram/Facebook (fonte: `campanha/posts.html`)
- `assets/gerado/`: 11 imagens geradas e validadas (fachadas em contexto de Praia, lifestyle, lojas, garagem limpa, conceitos de teaser)
- `assets/video/brava-fachada-golden.mp4`: vídeo de 5 s gerado a partir do render
- `landing/`: página com seletor das 12 casas, 3 personalidades, simulador de prestação e lista VIP via WhatsApp

## Ferramentas para continuar
- Regras do projeto: [CLAUDE.md](CLAUDE.md)
- Agentes: `.claude/agents/brava-diretor-arte.md`, `brava-copywriter.md`, `brava-comercial.md`
- Skill: `.claude/skills/brava-imagens`, que gera e valida imagens com `ferramentas/fal_imagem.py`

## Para pôr a página a funcionar com clientes
1. Em `landing/index.html` (fim do ficheiro): `WHATSAPP = "238XXXXXXX"` e, quando houver reservas, `RESERVADAS = ["2B", …]`.
2. Para um domínio próprio (ex.: brava.cv), a pasta `landing/` é estática e pode ser alojada em qualquer serviço (Vercel, Netlify, etc.).

# Projeto BRAVA: regras

Edifício BRAVA: 12 T3 (4 pisos × 3 casas), lojas no rés-do-chão e garagem com elevador. Fica no Palmarejo, Rua Ilha Brava, Praia, Cabo Verde. Este projeto contém a marca, a estratégia, a campanha e o material de venda.

## Leitura obrigatória antes de qualquer trabalho
`03-marca.md` (identidade e voz) · `02-estrategia.md` (posicionamento, preços, personas) · `06-pendentes.md` (o que ainda não é facto).

## Regras não negociáveis
1. **Verdade primeiro.**
   - Nunca mostrar ou dizer "vista mar" nem usar "luxo", "garantido" ou "rentabilidade garantida".
   - Nunca inventar reservas, áreas, preços ou prazos.
   - Tudo o que dependa de `06-pendentes.md` leva ⚠️ ou "a confirmar".
2. **Imagens geradas:**
   - Manter a arquitetura igual ao render original.
   - Contexto de Praia (acácias, palmeiras, casas coloridas, montes secos); pessoas cabo-verdianas.
   - Sem matrículas nem logótipos de carros, sem torres, sem relva europeia.
   - Usar sempre "Imagem ilustrativa".
3. **Validar antes de entregar:**
   - Cada imagem gerada é vista e comparada com o original antes de ser usada; rejeitar e gerar de novo se a arquitetura mudar ou aparecer mar.
   - Cada peça gráfica é renderizada e revista: legibilidade, texto sobre caras, emendas.
4. **Marca:**
   - Paleta: Basalto `#1F1E1C`, Cal `#F3EFE8`, Madeira `#8C6446`, Oliva `#5F6B45`, Areia `#D9CBB6`; **Luz `#C8A46A` é o único acento**.
   - Tipografia: Cormorant Garamond (títulos, itálico na palavra emocional) + Manrope (texto).
5. **Kriolu:** só em vídeo, TikTok e conversa. Todo o texto em Kriolu é validado por um falante nativo antes de publicar.
6. **Língua de trabalho:** português (PT/CV).

## Estrutura
- `assets/renders-originais/`: renders recebidos, renomeados (A-oliva, B-grafite, C-terra, fachadas, garagem, lojas, wc)
- `assets/referencias-estilo/`: referências do cliente
- `assets/gerado/`: imagens geradas e aprovadas · `assets/video/`
- `marca/`: símbolo SVG e aplicações
- `campanha/posts.html`: fonte das 9 peças → `campanha/post-XX.jpg` (render com Playwright, 1080×1350)
- `landing/index.html`: página publicada (seletor, simulador, lista VIP). Configurar `WHATSAPP` e `RESERVADAS` no fim do ficheiro
- `ferramentas/fal_imagem.py`: gerar ou editar imagens (fal.ai)

## Agentes disponíveis (`.claude/agents/`)
`brava-diretor-arte` (imagens e peças) · `brava-copywriter` (textos) · `brava-comercial` (preços, funil, guiões, objeções).

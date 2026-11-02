---
name: cenario
description: Escreve prompts de "plates" (imagens de cenário e imagens iniciais de cena) fotorrealistas para Nano Banana Pro (Gemini) ou Seedream, com voz de diretor de fotografia. Usar para lugares, coberturas de ângulos, primeiras imagens de cena e edições de imagem.
---
# /cenario: plates de cenário

Ler a `biblia.md`. Planear a composição em silêncio, depois escrever a prompt em **5 parágrafos curtos**:
1. **Lugar e geometria**: o que está onde (esquerda/direita/fundo), materiais, cores reais
2. **Luz**: direção, qualidade (dura/suave), temperatura (quente/fria), fontes práticas
3. **Atmosfera**: humidade, poeira, neblina leve no frame inteiro (não "nevoeiro" a esconder tudo)
4. **Câmara**: altura, lente (mm), ângulo, profundidade de campo
5. **Acabamento**: fotorrealista, grão subtil, 16:9, "no text, no watermark"

## Tipos
- **A · Ambiente** (vazio, por defeito)
- **B · Pessoas na cena** = imagem inicial para vídeo (anexar a ficha da personagem + o plate do lugar)
- **C · Cobertura**: vários ângulos do mesmo lugar que concordam em geometria e luz
- **D · Edição**: muda só o pedido, protege o resto

## Regras aprendidas
- **Lugares reais: anexar sempre fotos reais** (o Mindelo genérico falhou; com fotos funcionou).
- Para cidades/aéreos: **Nano Banana Pro (Gemini)** > Seedream 4. Contraluz + neblina leve escondem falhas.
- Rejeitar saídas com ar "HDR/ilustração" (céu liso, cores saturadas).
- Dizer para que serve cada referência ("esta é só para a paleta").
- Saída: lista numerada de referências + prompt num bloco de código.

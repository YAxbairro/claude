---
name: planos
description: Escreve prompts de vídeo de produção para Kling ou Seedance (image-to-video), com estrutura fixa por blocos, e divide cenas em planos. Usar quando uma imagem inicial está aprovada e é preciso animá-la, ou para partir uma cena em planos.
---
# /planos: prompts de vídeo
## Como usar
Seguir a skill **`shotcaller-v1`** (Joey): espinha de 16 slots, pré-check, header com política de cortes e velocidade, FOV em graus, atmosfera como densidade, LOCKS em cadeia, **negações dentro do texto (sem bloco negativo)**.
Camada Eagle:
- O Yax usa sobretudo **Kling** (image-to-video): a espinha do Shotcaller funciona igual; usar `@image1` = a imagem inicial aprovada. Se houver campo "negative prompt" no Kling, pode levar uma linha curta extra, mas o essencial fica inline.
- **Clipes de 5 s**, um só movimento lento; **start + end frame** sempre que a câmara se mexe (o Claude gera o end frame com zoom/crop).
- Rascunho em modo barato/720p → final 1080p só depois de aprovado.
- Para continuar um plano: secção VIDEO EXTENSION do Shotcaller, com o último frame.
- Videoclipe sem o artista a cantar: AUDIO = sem diálogo e com o *music suppression tail* (a música entra na montagem).

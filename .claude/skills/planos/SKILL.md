---
name: planos
description: Escreve prompts de vídeo de produção para Kling ou Seedance (image-to-video), com estrutura fixa por blocos, e divide cenas em planos. Usar quando uma imagem inicial está aprovada e é preciso animá-la, ou para partir uma cena em planos.
---
# /planos: prompts de vídeo

Perguntar primeiro (se não estiver na bíblia): **modelo e versão** (Kling x.x / Seedance 2.0 = 9 refs, 15 s / 2.5 = 50 refs, 30 s) e se há **imagem final** (end frame).

## Pré-check (mostrar ao Yax antes de escrever)
Referências · cena · câmara · duração · áudio (normalmente nenhum: a música entra na montagem).

## Estrutura da prompt (por esta ordem)
1. **Cabeçalho**: "One continuous shot, no cuts." + duração
2. **Estilo**: fotorrealista, cinematográfico, grão subtil
3. **Sem texto no ecrã**
4. **Referências**: o que é cada imagem anexada
5. **Geometria**: onde estão as coisas e as personagens no espaço
6. **Primeiro frame**: = a imagem anexada, sem mudanças
7. **Lente**: mm / campo de visão fixo (sem zoom a não ser pedido)
8. **Câmara**: um só movimento, lento (push-in curto, pan lento, estática...)
9. **Luz**: igual à imagem, sem mudanças bruscas
10. **Atmosfera**: o que se mexe no ambiente (neblina, água, poeira)
11. **Ação com tempo**: 0–2 s ..., 2–5 s ...
12. **Física**: peso, gravidade, tecido, água realistas
13. **Atuação**: expressões subtis, olhos, respiração
14. **Bloqueios**: "same face, same clothes, same location, no new objects"
15. **Negative**: scene cut, transition, morphing, warping, extra limbs, flicker, text, watermark

## Regras aprendidas
- **Clipes de 5 s.** Movimentos curtos. Kling inventa cortes em movimentos longos (cena 01).
- Usar **start + end frame** sempre que houver movimento de câmara.
- **Rascunho barato primeiro** (modo standard / 480–720p), final em 1080p só depois de acertar.
- **Um take falhado não é lixo**: aproveitar os 2–3 segundos bons na montagem.
- **Continuar um plano**: usar o último frame do clipe como primeiro frame do seguinte.
- Personagem "salta" entre planos? Gerar primeiro um **plate C (cobertura)** do lugar e partir daí.
- Saída: lista numerada de referências (ordem de anexo) + título com duração + prompt e negative em blocos de código.

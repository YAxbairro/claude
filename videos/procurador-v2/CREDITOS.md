# Créditos — "E agora?" v2

Para colar na descrição do vídeo:

> Fotos: "Praia aerial" (domínio público, David Trainer); "Praia Harbor" (domínio público); "Cape Verde National Assembly plenary session" (domínio público, Eugénio Teixeira/VOA); "Praia - Stadt vom Plateau" de Franzfoto, CC BY-SA 3.0 — via Wikimedia Commons. Música, efeitos sonoros e voz gerados por computador. Fontes: Expresso das Ilhas e Inforpress (26–27 nov 2026), A Nação (6 nov 2026), Boletim Oficial — Lei n.º 2/VIII/2011, art. 41.º.

## Como foi feito (100% código)
- `script.json`: texto da narração. Voz: Piper TTS, voz pt_PT "tugão" (gerada localmente).
- `audio_synth.py`: música de tensão e efeitos (whoosh, boom, riser, glitch, carimbo, obturador, tique), sintetizados.
- `build_timeline.py`: tempos de cada frase, legendas palavra a palavra e momentos dos efeitos.
- `index.html`: motor de animação (fotos com zoom e panorâmica, grão, flashes, tremor, glitch, legendas, carimbos, contador, medidor de risco, ecrã dividido).
- `render.js`: grava os frames (Playwright) e `mix.py` mistura voz, música e efeitos.

Para refazer: `python3 build_timeline.py && python3 audio_synth.py music_spec.json && node render.js video_noaudio.mp4 && python3 mix.py`, depois juntar com ffmpeg.

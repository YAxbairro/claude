# Cabo Verde — 9 ilhas, 1 aventura

Vídeo vertical (1080×1920, 31s) estilo campanha de agência de viagens: o percurso por todas as ilhas habitadas de Cabo Verde, com as novas ligações inter-ilhas.

**Percurso (12 viagens):** Praia ✈ São Vicente ⛴ Santo Antão ⛴ São Vicente ⛴ São Nicolau ✈ Sal ⛴ Boa Vista ✈ Fogo ⛴ Brava ⛴ Fogo ⛴ Praia ⛴ Maio ⛴ Praia

## Peças
- `src/timeline.json` — tempos de tudo (cenas, viagens, palavras sincronizadas com a narração)
- `src/scenes/*` — Intro (nascer do sol na Praia), MapJourney (mapa animado), Plan (passe de aventura + carimbo), EndCard (bandeira)
- `public/narracao.mp3` — narração ElevenLabs (voz "Adilson", PT europeu)
- `audio/make_batuku.py` — sintetiza a batida de batuku (6/8, tchabeta 3 contra 2, rapica) + efeitos sonoros → `public/trilha.wav`

## Comandos
```bash
npm install
python3 audio/make_batuku.py   # precisa de audio/vo.wav (ffmpeg -i public/narracao.mp3 -ac 1 -ar 44100 audio/vo.wav)
npm run studio                 # pré-visualizar/editar
npx remotion render src/index.ts CaboVerde out/cabo-verde-aventura.mp4 --timeout=120000
```
Para trocar a música por um batuku gravado de verdade, substitui `public/trilha.wav` (mantém ~31s).

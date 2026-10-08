# Cabo Verde — 9 ilhas, 1 aventura

Vídeo vertical (1080×1920, 31s) estilo campanha de agência de viagens: o percurso por todas as ilhas habitadas de Cabo Verde, com as novas ligações inter-ilhas.

**Percurso (12 viagens):** Praia ✈ São Vicente ⛴ Santo Antão ⛴ São Vicente ⛴ São Nicolau ✈ Sal ⛴ Boa Vista ✈ Fogo ⛴ Brava ⛴ Fogo ⛴ Praia ⛴ Maio ⛴ Praia

## Peças
- `src/timeline.json` — tempos de tudo (cenas, viagens, palavras sincronizadas com a narração)
- `src/scenes/*` — Intro (nascer do sol na Praia), MapJourney (mapa animado), Plan (passe de aventura + carimbo), EndCard (bandeira)
- `public/narracao.mp3` — narração ElevenLabs (voz "Adilson", PT europeu)
- `audio/batuku.mp3` — batuku gerado na ElevenLabs (Sound Effects, 30s em loop)
- `audio/make_batuku.py` — gera os efeitos sonoros (`audio/sfx.wav`: aviões, barcos, impactos)
- `audio/mix.py` — mistura final: narração à frente (-14 LUFS), batuku com ducking, efeitos → `public/trilha.wav`

## Comandos
```bash
npm install
python3 audio/make_batuku.py && python3 audio/mix.py
npm run studio                 # pré-visualizar/editar
npx remotion render src/index.ts CaboVerde out/cabo-verde-aventura.mp4 --timeout=120000
```
Para trocar a música por um batuku gravado de verdade, substitui `public/trilha.wav` (mantém ~31s).

# Yuna & Gata Tanha · Ilhas de Descobertas (v2)

Jogo educativo em português para crianças dos 4 aos 6 anos. Vinte ilhas, três fases por ilha (Descobrir, Praticar, Aventurar), dez exercícios por fase escolhidos ao acaso entre 27 minijogos.

## Correr

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # conteúdo completo + variedade das sessões
npm run build    # gera dist/ (site estático)
```

`?test=mecanica:ilha:nivel` abre um minijogo diretamente (ex.: `?test=puzzle:7:2`).

## Estrutura

- `src/data/` — itens (148 ilustrados + cores, formas, letras, números), 20 ilhas, mecânicas e catálogo de falas.
- `src/games/` — 27 minijogos: encontrar, adivinhas, inglês, sombras, intruso, que cor, primeira letra, sons, o que falta, contar, mais/menos, ligar pontos, cesto, arrumar, dar de comer, memória, repetir, padrões, tamanhos, bolhas, apanhar, escondidas, traçar, pintar, misturar cores, puzzle, labirinto.
- `src/games/session.ts` — gera 10 exercícios por fase: nunca repete seguido, mínimo 7 tipos diferentes, puzzle no fim da Aventura.
- `src/screens/` — título, mapa, ilha, jogo, álbum de autocolantes, área dos adultos.
- `src/core/audio.ts` — música, voz e efeitos em Web Audio; a música baixa quando a narradora fala.
- `public/assets/` — arte, voz, música e efeitos gerados.

## Regenerar arte e áudio (fal.ai)

Chave em `.env` (`FAL_KEY=...`, nunca no git). Os scripts saltam o que já existe.

```bash
npm run assets:islands   # ilhas em alta resolução (nano-banana)
npm run assets:chars     # poses da Yuna e da Gata Tanha
npm run assets:items     # ilustrações dos objetos (FLUX dev)
npm run assets:voice     # narração (ElevenLabs, voz "Claudia")
npm run assets:audio     # música (Lyria 2) e efeitos (ElevenLabs SFX)
python3 scripts/cutout.py isnet-general-use 360 public/assets/items art-cache/items/*.png
```

Custo total da geração desta versão: cerca de US$ 5.

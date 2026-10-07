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

## Mundo 3D

Depois de "Jogar" a Yuna entra num mundo 3D (`src/world/`): anda, salta e sobe pequenos degraus sozinha, com a Gata Tanha atrás. Navega de barco entre as ilhas, apanha conchas douradas e entra nos círculos de luz para abrir os mini-jogos.

- Controlo: toca no chão (ou na luz de um círculo) para ir lá; também há comando virtual, botão de salto e o teclado (WASD/setas, Espaço, E).
- Cada ilha é analisada ao carregar: a área onde se pode andar é calculada e os círculos e as conchas ficam sempre em sítios alcançáveis. O caminho até ao toque é calculado (BFS) e contorna casas e árvores.
- Modelos em `public/assets/3d/` (Yuna com animações, Tanha, ilhas 0–16). As ilhas 17–19 usam uma ilha simples até haver crédito no fal: `node scripts/gen-islands-3d.mjs` e depois `node scripts/optimize-glb.mjs`.
- `node scripts/artifact-page.mjs` (depois de `npm run build`) prepara a versão Artifact: os modelos vão como glTF JSON, porque o claude.ai não serve `.glb`.

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

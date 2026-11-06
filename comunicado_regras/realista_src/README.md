# Apelo e Proibições – versão REALISTA ALPHA (código-fonte)

Gera `../Apelo_Proibicoes_REALISTA_ALPHA_drone_16x9.mov`: ProRes 4444 com alpha, 1920x1080, 25 fps, 1:31, com a voz.
Os planos de drone ficam **transparentes**, só com os grafismos e o painel azul, para meter o drone por baixo no Premiere.

## Como renderizar
```bash
pip install numpy pillow opencv-python-headless
./build.sh
```
O vídeo base `../Apelo_Proibicoes_FINAL_16x9.mp4` tem de existir. Dele vêm a voz, o mapa, a CNE/DGAPE, a Linha Verde, o relógio e o fim.

## Ficheiros
| Ficheiro | Função |
|---|---|
| `eng.py` | Motor: leitura de clips e do FINAL, câmara, degradê azul, logos, caixas de texto (Montserrat), elementos AR (raio, colchetes, etiquetas) |
| `segs.py` | Segmentos v1 (com drone por baixo) e utilitários: `fit`, `dot`, ícones, `S4` portátil, `S10` escola |
| `segs2.py` | **Versão final em alpha**: S1 abertura, S2 mapa acelerado, S3 apelo, S4 portátil, S678 recorda/bar/500 m, S10 escola, S1112 cabine/telemóvel, S13 tranquilidade |
| `build.sh` | Renderiza tudo, junta com os trechos do FINAL, aplica o X do logo e faz a prévia em 720p |
| `xblack.png` | X preto no boletim do logo Eleição Presidencial 2026 (aplicado a todo o vídeo) |
| `bp3.py`, `opts.py` | Scripts dos blueprints (sequência C e 4 opções de conceito) |
| `fonts/` | Montserrat Bold (M700) e ExtraBold (M800), licença OFL |
| `fr/F67.png` | Frame do FINAL usado para recortar os logos |
| `dl/` | Assets: `drone.mp4` (DJI), clips do Kling (`k379` portátil, `k420` bar, `k446` telemóvel, `k517` escola), imagens do GPT, foto da Presidência |
| `audio/` | Voz (`voice.m4a`, `voice16.wav`) e transcrição palavra a palavra (`words.json`, faster-whisper) |

## Linha de tempo (frames a 25 fps)
| Segmento | Frames | Tempo | Conteúdo |
|---|---|---|---|
| S1 | 0–140 | 0:00–5.6 | drone (alpha) + NO DIA 15 DE NOVEMBRO |
| S2 | 140–322 | 5.6–12.9 | mapa do FINAL acelerado 1.8x (ilhas + diáspora) |
| S3 | 322–478 | 12.9–19.1 | íris do círculo → drone (alpha) + apelo/valores |
| S4 | 478–585 | 19.1–23.4 | portátil (Kling) com o site da CNE → zoom para o ecrã |
| F5 | 585–814 | 23.4–32.56 | FINAL: CNE/DGAPE + Linha Verde |
| S678 | 814–1140 | 32.56–45.6 | drone (alpha) → bar (Kling) → raio 500 m (alpha) → relógio |
| F9 | 1140–1180 | 45.6–47.2 | FINAL: relógio 8h–18h |
| S10 | 1180–1355 | 47.2–54.2 | escola (Kling) + proibido estacionar |
| S1112 | 1355–1633 | 54.2–65.3 | drone (alpha) → telemóvel (Kling) + segredo do voto |
| S13 | 1633–1775 | 65.3–71.0 | drone (alpha) + tranquilidade/ordem/respeito |
| F14 | 1775–2275 | 71.0–91.0 | FINAL: participe + fim |

## Versão SÓ ALPHA (`segs3.py` + `build3.sh`)
Gera `../Apelo_Proibicoes_REALISTA_SO_ALPHA_16x9.mov` (+ prévia 720p). Diferenças para a versão acima:
- **Sem vídeo nem degradê azul** nos trechos que levam vídeo por baixo (drone e Kling): ficam só textos, logos e grafismos em alpha. Saem também os colchetes/etiquetas AR que apontavam para objetos dos clips. Não precisa da pasta `dl/`.
- **Abertura 0–19 s re-sincronizada** com `audio/words.json`: cada linha entra na palavra dita; o bloco "No dia 15 de novembro" sai uma só vez (sem o salto aos 5 s); o mapa é limpo do texto antigo do FINAL (`detext`) e leva os textos novos ("para que participem / neste importante momento / da democracia", "exercendo o seu direito de voto", liberdade/responsabilidade/consciência cívica no tempo certo).
- F5, F9 e F14 continuam a vir do FINAL (grafismo opaco).
- Render: `./build3.sh` (os 8 segmentos demoram ~10 min em 4 núcleos).

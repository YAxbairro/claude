# Videoclipe "São Vicente": plano de produção com IA

> Feito a 19/11/2026 a partir da pasta do Drive **Video Contra Droga**.
> Ferramentas disponíveis: **fal.ai** (acesso total) + **créditos Kling**.
> Os preços vêm de pesquisa feita hoje. Muitos são de sites de terceiros, por isso confirma na página do modelo antes de gastar.

---

## 1. O que está no Drive (analisado ficheiro a ficheiro)

| Ficheiro | O que é | Estado |
|---|---|---|
| `storyboard (1).pdf` | 12 páginas, 20 cenas com tempo, plano, luz/cor, ritmo e frase da letra. Conceito, regras e paleta. | ✅ Muito bom como guião |
| `WhatsApp Image 2026-11-02…jpeg` | Folha de referência: 4 personagens (rapaz, mãe, julha, conselheiro) + 5 locais (rua-mindelo, cozinha, quarto, beco, porta-casa) | ✅ É a "bíblia" de consistência, mas com resolução baixa |
| `AUD-20261029-WA0009.mp3` | A música. 3:45, 320 kbps, exportada do FL Studio, tag de artista "Ng Jonathan" | ✅ Master final |
| `WhatsApp Video 2026-11-03…mp4` | 2:51, 640×352. **Testemunho real** de um homem de 44 anos em recuperação | ⚠️ Material mais forte do projeto (ver 1.3) |

### 1.1 Storyboard: pontos fortes
- A regra "nunca glamorizar" está bem definida: traficantes sempre na sombra e nada de consumo explícito, só o efeito (fumo, cinza, olhar vazio).
- A cor conta a história: azul frio na dor, dourado na memória e na esperança. Fácil de aplicar no color grading.
- Bons pares de "antes/depois" com o mesmo enquadramento (cenas 10→11, 03→16, 07).

### 1.2 Storyboard: problemas encontrados
1. **Os tempos da letra no storyboard não batem com a música.** Transcrevi a música: o verso 1 inteiro (alma consumida → mãe a chorar → traficantes com mota nova → Julha → polícia/doutor) está entre **0:40 e 1:32**. O storyboard espalha estas frases até 2:55. Exemplos:
   - "Julha tinha medo da madrugada": storyboard **1:50**, música **≈1:15**
   - "polícia, doutor…": storyboard **2:20**, música **≈1:22**
   - "traficante na tua porta… finanças": storyboard **2:55**, música **≈2:05**
   - "autoestima": storyboard **2:45**, música **≈2:16 e ≈2:35**
   → **É preciso voltar a cronometrar as cenas** (ver a secção 4, com os tempos reais).
2. **A música usa o testemunho real em 3 sítios:** **0:19–0:40** ("comecei a consumir droga desde os 14 anos… droga leve… depois mais pesada… cocaína"), **1:31–2:00** ("15 anos de droga injetável… diagnosticado com VIH… desde 2003") e **3:03–3:34** ("ser infetado pelo vírus do VIH…"). O storyboard trata estes momentos como intro calma ou pausa.
3. **Os rostos mudam de cena para cena nas imagens do storyboard.** O rapaz da 05 não é o da 13 nem o da 16, a mãe da 06 não é a da 19 e o conselheiro aparece com camisa aos quadrados (17) e com camisa azul (folha de referência). Estas imagens servem para **composição e luz**, não como frames finais.
4. Faltam referências para: Julha "depois", traficantes (silhuetas), porto + Monte Cara, praça do Mindelo, festa, corredor/porta, muro com graffiti e espelho/casa de banho.
5. A cena 20 pede "um contacto real de apoio". **Não encontrei online nenhum número verificado** de apoio à toxicodependência em São Vicente. Pedir à Delegacia de Saúde de São Vicente / Hospital Baptista de Sousa ou à CCAD (Comissão de Coordenação do Álcool e outras Drogas).

### 1.3 O vídeo do testemunho: a decisão mais importante
O homem do vídeo conta que tem 44 anos, que começou aos 14–15 anos, que usou drogas injetáveis durante cerca de 15 anos, que é **seropositivo desde 2003**, que fez tratamento num centro na Praia durante cerca de 1 ano e 3 meses e que voltou a São Vicente, onde amigos de consumo morreram. **É exatamente o "Conselheiro" do storyboard, mas real.**

**Recomendação:** usar a cara e a voz reais dele nos momentos de testemunho (intro e 2:50–3:20) em vez de um conselheiro feito por IA. O real a falar num vídeo feito todo por IA cria um contraste muito forte e dá credibilidade à mensagem.
- ⚠️ **Consentimento escrito obrigatório.** O estado de VIH é um dado de saúde sensível e ele fica identificável num vídeo público. Se não houver consentimento, usar só a voz (que já está na música) com um conselheiro feito por IA ou em silhueta.
- O vídeo tem resolução baixa (640×352) e foi filmado em contrapicado contra uma fachada rosa com janelas verdes. Precisa de **upscale** (Topaz Video AI ou um upscaler de vídeo no fal) e de grading quente, e pode ficar com cara de "documentário" de propósito (grão, 4:3 ou letterbox).

### 1.4 A música (análise técnica)
- **≈129 BPM**. 1 compasso ≈ 1,86 s, 4 compassos ≈ 7,4 s, 8 compassos ≈ 14,9 s. Os clipes de 5 s dos modelos encaixam bem; corta sempre no compasso.
- A curva de energia confirma a estrutura: intro baixa até 0:40 → entra forte em **0:40** → **queda em 1:40–1:50** → parte 2 → **queda em 3:00–3:10** → final → acaba em 3:40.
- Já separei a **voz** do instrumental (Demucs). A faixa só de voz é essencial para o lip-sync funcionar bem.

---

## 2. Ferramentas: o que usar para cada coisa

| Tarefa | Ferramenta recomendada | Onde | Preço aprox. |
|---|---|---|---|
| Fichas de personagem (frente, 3/4, perfil, corpo inteiro) e keyframes | **Nano Banana Pro Edit** (até 14 imagens de referência) | fal: `fal-ai/nano-banana-pro/edit` | ~$0.15/imagem ($0.30 em 4K) |
| Variante mais barata para testes | Nano Banana 2 Edit | fal | desde ~$0.06/imagem |
| Planos narrativos com personagens (o grosso do vídeo) | **Kling 3.0 Omni / O3** com **Elements** ("Bind subject") | **App Kling (os teus créditos)** | 1080p sem som: 8 créditos/s → **40 créditos por clipe de 5 s** |
| O mesmo, via API | Kling O3 Standard i2v / Kling v4 Flash i2v | fal | $0.084/s / $0.094/s |
| Transições "antes/depois" e objetos a desaparecer | Kling com **frame inicial + frame final** | Kling ou fal | igual ao anterior |
| Planos de ambiente (drone sobre o Mindelo, nevoeiro, baía) | Veo 3.1 Fast ou Seedance 2.0 | fal | Veo Fast ~$0.10/s sem áudio* / Seedance ~$0.24–0.30/s |
| **Lip-sync do rapaz a cantar** | **Kling AI Avatar v2 Pro** (imagem + voz isolada) | fal: `fal-ai/kling-video/ai-avatar/v2/pro` | $0.115/s |
| Lip-sync em planos longos | OmniHuman v2 | fal: `bytedance/omnihuman/v2` | ~$0.105/s |
| Performance com movimento real | **Kling Motion Control V3**: filma alguém a cantar com o telemóvel e transfere o movimento para o "rapaz" | fal | $0.126–0.168/s |
| Upscale do testemunho e do final | Topaz Video AI / upscaler de vídeo no fal | — | — |
| Montagem, cor, legendas, 9:16 | **DaVinci Resolve** (grátis) ou CapCut | PC | grátis |

\* O fal anunciou a descontinuação do endpoint Veo 3.1 para 17/11/2026. Confirma se ainda está ativo; se não estiver, usa Seedance 2.0 ou Kling.

**Divisão sugerida:** os créditos Kling vão para os planos com personagens, onde a consistência pesa mais. O fal fica com imagens, lip-sync, motion control e ambientes.

---

## 3. Pipeline em 6 fases

### Fase 0: Preparação (feita ✅ / por fazer ⬜)
- ✅ Voz isolada + instrumental (`stems/`)
- ✅ BPM e curva de energia
- ✅ Letra transcrita com tempos aproximados (a transcrição automática do crioulo é imperfeita; **revê com o artista**)
- ⬜ Confirmar o consentimento do homem do testemunho
- ⬜ Arranjar o contacto real de apoio para o cartão final

### Fase 1: Fixar as personagens (o passo mais importante)
A identidade vive nas imagens fixas e o modelo de vídeo só lhes dá movimento. Para cada personagem, gera no Nano Banana Pro Edit, usando o recorte da folha de referência:
- frente, 3/4, perfil e corpo inteiro com a roupa fixa (4 imagens);
- **Rapaz:** hoodie cinzento + fio de prata (fixo em todo o vídeo);
- **Mãe:** lenço laranja estampado + vestido azul-escuro (o storyboard 19 tem lenço bege; escolhe um);
- **Julha antes:** vestido vermelho florido, argolas, cabelo apanhado; **Julha depois:** mesma cara, mais magra, olheiras, roupa gasta;
- **Conselheiro:** o homem real (se houver consentimento) ou o da folha, com camisa azul clara.

Depois cria um **Element** no Kling por personagem (imagens múltiplas ou, melhor ainda, um clipe de 3–8 s da personagem) e escreve um **bloco de descrição fixo** para colar igual em todos os prompts.

Locais em falta: porto + Monte Cara, praça, festa, corredor/porta, muro com graffiti, casa de banho/espelho.

**≈ 30 imagens → ~$5**

### Fase 2: Keyframes (1 imagem por plano)
Pega em cada imagem do storyboard e regenera-a no Nano Banana Pro Edit com as referências fixas da personagem e do local. Mantém a composição e corrige a cara. São cerca de 50 planos (cada cena de 10–15 s dá 2–3 planos de 5 s).
**≈ 60–80 imagens com repetições → ~$10–12**

### Fase 3: Animar
- **Kling (créditos):** planos narrativos, 5 s, 1080p, sem som (o som é a música). Usa Elements + o keyframe como primeiro frame.
- **Kling com frame inicial e final:** cena 05 (reflexo a desfazer-se em fumo), cena 07 (quarto cheio → quarto vazio), cenas 10→11 (Julha antes → depois), cena 14 (festa com luz → festa às escuras).
- **Lip-sync:** cenas 05 e 13 com Kling Avatar v2 Pro e o **segmento exato da voz isolada**. Gera 2–3 tomas e escolhe a melhor.
- **Ambiente:** cenas 01 e 02 com Veo/Seedance.
- **Cerca de 1,5–2 tomas por plano.** Uma toma falhada custa o mesmo que uma boa.

### Fase 4: Montagem
1. Coloca a música e marca os compassos (129 BPM) na timeline.
2. Monta pela tabela da secção 4 e corta nos compassos.
3. Color grading por blocos: azul dessaturado / preto e branco / néon frio / dourado.
4. Junta grão e textura comuns a todos os clipes para os unir visualmente (esconde as diferenças entre modelos).
5. Insere o testemunho real com tratamento documental.
6. Cartão final.

### Fase 5: Entrega
- 16:9 a 1080p ou 4K (com upscale);
- cortes 9:16 para Reels/TikTok: 3–4 excertos de 15–30 s (o refrão da clínica, o testemunho, o antes/depois da Julha).

---

## 4. Cronometragem nova (pela música real)

> Tempos da transcrição automática (Whisper). Margem de erro de cerca de 1–2 s. **Confirma ouvindo a música.**

### Estrutura real da música
| Tempo | Secção | Conteúdo áudio |
|---|---|---|
| 0:00–0:05 | Abertura | Grito "El Chapo!" |
| 0:05–0:19 | Intro falada | Ad-libs / conversa |
| **0:19–0:40** | **Testemunho 1** | Voz real: "comecei a consumir droga desde os 14 anos… droga leve… depois mais pesada… cocaína" |
| 0:40–1:31 | **Verso 1** (rap) | alma consumida → perder tudo → mãe a chorar / vizinhos sabem → traficantes a festejar a mota nova → casa / brigar → Julha → polícia, doutor → toda a malta |
| **1:31–2:00** | **Testemunho 2** (inclui a queda de energia de 1:40–1:50) | "15 anos de droga injetável… diagnosticado com VIH… desde 2003…" |
| 2:00–2:48 | **Verso 2** | confiança da família queimada → vender a aliança → traficante à porta a cobrar mais que as Finanças → festas → juventude / autoestima → falsos amigos → madrugada → "nunca sabia onde parar" |
| 2:48–3:03 | Instrumental / queda | — |
| **3:03–3:19** | **Testemunho 3** | "a maior consequência… ser infetado pelo vírus do VIH" |
| 3:19–3:26 | Dedicatória | "**Rest in peace, my brother Pinga**… o testemunho serve-nos como reflexão" |
| 3:26–3:34 | Testemunho 4 | "seja usuário de droga injetável, seja de outras drogas…" |
| 3:34–3:45 | Fim | — |

⚠️ **Não encontrei na transcrição a frase "São Vicente também merece uma clínica de reabilitação"** (cena 13). O crioulo transcrito à máquina tem falhas. Pergunta ao artista **em que segundo está** essa frase, porque é a mais importante do vídeo.
⚠️ Há uma **dedicatória a "Pinga"** (3:19). Sugiro um cartão "Em memória de Pinga" ou incluí-la no cartão final. Confirma com o artista.

### As 20 cenas com os tempos novos
| Tempo | Cena | Ferramenta | Nota |
|---|---|---|---|
| 0:00–0:08 | **01** Drone sobre o Mindelo com nevoeiro | Veo/Seedance (fal) | entra com o "El Chapo!" |
| 0:08–0:14 | **02** Beco, poste a piscar, cão | Kling | o poste pisca na batida |
| 0:14–0:19 | **03** Rapaz de costas à janela | Kling (push-in) | |
| 0:19–0:40 | **04** Moldura partida ↔ **testemunho real** (rosto/voz) | Kling + vídeo real | a voz real ouve-se aqui: intercala-o com a moldura |
| 0:40–0:47 | **05** Espelho / reflexo em fumo | Kling (frame inicial e final) + **lip-sync** | entra o rap |
| 0:47–0:53 | **06** Mãe a chorar, vizinhos à janela | Kling | P&B |
| 0:53–1:01 | **08** Traficantes, carro e mota | Kling | caras na sombra, néon |
| 1:01–1:08 | **07** Quarto a esvaziar | Kling (frame inicial e final) | 1 objeto por batida |
| 1:08–1:15 | Performance do rapaz (casa / discussão) | Avatar v2 Pro (lip-sync) | |
| 1:15–1:19 | **10** Julha antes | Kling (travelling) | |
| 1:19–1:22 | **11** Julha depois | Kling (frame inicial e final a partir da 10) | transição em espelho |
| 1:22–1:26 | **12** Silhuetas de polícia e bata branca | Kling | câmara lenta |
| 1:26–1:31 | Toda a malta, montagem rápida | Kling (3 planos curtos) | |
| 1:31–2:00 | **09** Mãe à porta à espera ↔ **testemunho real** | Kling + vídeo real | silêncio visual durante a queda de 1:40–1:50 |
| 2:00–2:05 | NOVA: a mãe procura a aliança na caixa de joias vazia | Kling | letra: "vender a aliança" |
| 2:05–2:09 | **15** Sombra por baixo da porta, batidas | Kling | as batidas seguem o bombo |
| 2:09–2:20 | **14** Festa → a luz apaga-se | Kling (frame inicial e final) | apaga na palavra "autoestima" |
| 2:20–2:30 | Performance / falsos amigos | Avatar v2 Pro + Kling | |
| 2:30–2:39 | Rapaz sozinho de madrugada, respiração/batimento | Kling | |
| 2:39–2:48 | **13** Protesto no porto com o Monte Cara | Avatar v2 Pro (lip-sync) | ⚠️ ajustar para onde estiver a frase "clínica" |
| 2:48–3:03 | **16** No chão do beco, a mão estendida | Kling (picado) | queda de energia; a música volta quando agarra a mão |
| 3:03–3:19 | **17** Conselheiro (homem real?) com os jovens na praça | Kling ou vídeo real | é a voz dele que se ouve |
| 3:19–3:26 | Dedicatória "Pinga" | cartão / plano parado | |
| 3:26–3:34 | **18** Jovem caminha para a luz | Kling | contraluz dourado |
| 3:34–3:40 | **19** Mãe sorri à janela | Kling | |
| 3:40–3:45 | **20** Cartão final + contacto real | montagem | |

Ficheiros de apoio nesta pasta:
- `audio/voz_isolada.mp3`: para o lip-sync. Corta o segmento exato de cada plano.
- `audio/instrumental.mp3`
- `transcricao_musica.txt` e `transcricao_testemunho.txt`

---

## 5. Prompts: modelo e regras

### Bloco de personagem (colar sempre igual)
```
RAPAZ: 25-year-old Cape Verdean man, short black hair with clean fade, light stubble,
thin silver chain, faded grey hoodie, slim build.
MÃE: 55-year-old Cape Verdean woman, orange-and-brown patterned headwrap,
navy blue dress, small gold earrings, tired kind eyes.
JULHA (before): 22-year-old Cape Verdean woman, curly hair in high bun, gold hoops,
red floral dress, small mole on left cheek.
JULHA (after): same woman, gaunt, dark circles, messy hair, worn oversized t-shirt.
CONSELHEIRO: 50-year-old Cape Verdean man, short grey hair, grey goatee,
light blue button-down shirt.
```

### Exemplo de prompt de vídeo (cena 02)
```
Static ground-level shot of an empty cobblestone alley in Mindelo, Cape Verde, at night.
Wet stones reflect a single flickering yellow street lamp. A stray dog walks slowly away
from camera into the distance. Cold blue and green tones, desaturated, cinematic,
35mm film grain, shallow haze. No people.
```

### Regras para não seres bloqueado pela moderação
- **Não escrevas** "drugs, cocaine, crack, heroin, syringe, smoking, dealer" nos prompts.
- Descreve **o efeito**: "smoke and ash drift around him", "hollow empty stare", "men in shadow celebrate around a luxury car".
- Polícia/médico: "silhouettes of a uniformed officer and a person in a white coat walking past a graffiti wall, faces not visible".
- Cena 14 (festa): "young people dancing, red party light" (não sexualizar, como já diz o storyboard).
- Usa sempre **negativos**: "no text, no logos, no extra fingers, no face distortion".

---

## 6. Orçamento estimado

| Item | Quantidade | Custo |
|---|---|---|
| Imagens (fichas + keyframes + repetições) | ~100 | **~$15** (fal) |
| Planos narrativos | ~300–400 s gerados | **2400–3200 créditos Kling** *ou* ~$25–35 no fal |
| Lip-sync (Avatar v2 Pro) | ~60–80 s gerados | **~$7–9** (fal) |
| Ambientes (Veo Fast / Seedance) | ~30 s | **~$3–8** (fal) |
| Motion control (opcional) | ~30 s | ~$4–5 (fal) |
| **Total** | | **~$30–40 no fal + os créditos Kling**, ou **~$60–75 só no fal** |

---

## 7. Decisões que tens de tomar
1. **O homem do testemunho aparece com a cara?** (exige consentimento escrito)
2. **Quem "canta" no vídeo:** o rapaz da IA (lip-sync) ou o próprio artista filmado e transformado com Motion Control?
3. **Contacto real** para o cartão final.
4. Lenço da mãe: laranja (folha) ou bege (storyboard 19)?

---

## Fontes
- [Kling AI Avatar v2 Pro (fal)](https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/pro) · [Avatar v2 Standard](https://fal.ai/models/fal-ai/kling-video/ai-avatar/v2/standard)
- [OmniHuman (fal)](https://fal.ai/models/fal-ai/bytedance/omnihuman) · [OmniHuman 2.0 (MindStudio)](https://www.mindstudio.ai/blog/bytedance-omnihuman-2-0/)
- [Kling Motion Control (fal)](https://fal.ai/kling-motion-control) · [Modelos Kling no fal](https://fal.ai/explore/kling)
- [Kling 3.0](https://kling.ai/feature/kling-video-3) · [Kling V3 vs O3](https://kling.ai/blog/kling-v3-vs-o3-comparison-guide) · [Kling 4.0 first look](https://www.mindstudio.ai/blog/kling-4-0-first-look)
- [Guia de consistência Kling 3.0 Omni (Flick)](https://flick.art/blog/kling-character-consistency) · [Kling 3.0 Elements/Multi-Shot (Magic Hour)](https://magichour.ai/blog/kling-30-reference-guide)
- [Preços Kling 3.0 (vdobloom)](https://vdobloom.com/blog/kling-3-0-video-pricing/) · [Preços Kling após outubro de 2026 (Voyager)](https://voyager.so/blog/kling-ai-pricing)
- [Nano Banana Pro Edit (fal)](https://www.fal.ai/models/fal-ai/nano-banana-pro/edit) · [Nano Banana API (fal)](https://fal.ai/learn/tools/nano-banana-api)
- [Seedance 2.0 vs Veo 3.1 (fal)](https://fal.ai/learn/tools/seedance-2-0-vs-veo-3-1) · [Descontinuação do Veo 3.1 no fal](https://www.usagepricing.com/blueprint/activity/fal-ai-2026-10-15-veo-31-deprecation-date)
- [Workflow de videoclipe com IA (Cliprise)](https://www.cliprise.app/learn/workflows/marketing/ai-music-video-production-complete-workflow-independent-artists) · [Making-of de um videoclipe 100% IA](https://alici.ai/formulas/media/sferro-ai/98cdcfc8-77ef-53e9-bc83-510b423b4ce9-artlist-kling-lyria-ai-music-video-tutorial-ai-video)
- [Melhores modelos de avatar/lip-sync (nov 2026)](https://www.teamday.ai/blog/best-ai-avatar-models-2026)
- [CCAD (documento da OMS sobre Cabo Verde)](https://www.afro.who.int/sites/default/files/2026-05/Estrategia%20de%20Prevencao%20do%20Suicidio%20-%20English%20version.pdf)

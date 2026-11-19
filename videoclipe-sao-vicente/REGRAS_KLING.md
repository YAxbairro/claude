# Regras para o Kling V3 Pro (para acertar à primeira)

Endpoint: `fal-ai/kling-video/v3/pro/image-to-video`. Custa $0.112/s sem áudio: 6 s = $0.67, 8 s = $0.90.

1. **O prompt descreve só o movimento.** A imagem já define o visual, por isso não a descrevas outra vez.
2. **2 a 4 frases curtas, por esta ordem:** ação do sujeito → 1 movimento secundário (cortina, fumo, respiração) → câmara → o que fica parado.
3. **Câmara com nome:** "slow push-in", "static camera", "tracking shot", "slow dolly back". Sem indicação, o Kling deixa a câmara quase parada.
4. **No máximo 1 ou 2 movimentos por plano.** Cada movimento extra é uma oportunidade para a imagem se deformar.
5. **Diz o que NÃO se mexe:** "the room and the photos stay unchanged".
6. **Nada de listas de palavras soltas** ("cinematic, 4K, trending…"): não ajudam.
7. **Duração:** a mais curta que cobre a cena. 5–6 s é o mais estável, 8 s só para movimentos lentos.
8. **Parâmetros:**
   - `generate_audio: false` (a música é nossa, e fica mais barato);
   - `cfg_scale: 0.5` (subir para 0.7 só quando o espaço tem de ficar exato);
   - `negative_prompt` = o padrão "blur, distort, and low quality" + os defeitos específicos a evitar (warped face, morphing, jitter, flicker, extra limbs…).
9. **Personagens recorrentes:** usar `elements` (frente + referências), chamados no prompt como @Element1. Custa o dobro ($0.224/s), por isso só nas cenas em que a cara aparece.
10. **Imagem de partida limpa:** gerada no GPT Image 2.6 Flare, sem partículas ou brilhos que o vídeo depois exagere.

Fontes: [fal: How to use Kling 3.0 Pro](https://fal.ai/learn/tools/how-to-use-kling-3-0-pro) · [schema do fal](https://fal.ai/models/fal-ai/kling-video/v3/pro/image-to-video/llms.txt) · [Atlabs: guia de prompts Kling 3.0](https://www.atlabs.ai/blog/kling-3-0-prompting-guide-master-ai-video-generation) · [Atlas Cloud: guia de prompts Kling](https://www.atlascloud.ai/blog/tips/kling-ai-video-prompt-guide)

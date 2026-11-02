# Processo · Videoclipe com IA (aprendizagens vivas)

> Atualizar a cada projeto. Cada erro vira regra.

## Pipeline (ordem de produção real, adaptada para IA)
1. **Ideia e roteiro**: a única parte grátis; é aqui que se ganha.
2. **Bíblia** (`/biblia`): lugares, personagens, regras → `biblia.md`
3. **Beat sheet**: o que cada personagem **está a fazer** em cada momento (senão fica parada à janela).
4. **Elenco** (`/elenco`): face lock → roupa → ficha, fundo cinzento 18%.
5. **Cenários** (`/cenario`): plates dos lugares, com fotos reais quando o sítio existe.
6. **Imagem inicial de cada plano** (`/cenario` tipo B) → aprovação do Yax.
7. **Vídeo** (`/planos`): rascunho barato → final 1080p; start+end frame.
8. **Montagem**: aproveitar os 3 s bons de cada take, cor única, grão por cima.

Referência: o fluxo do Joey (Higgsfield/YouTube, out 2026): Story Bible → Castkit → Scenecraft → Shotcaller. Uma curta dele custou ~450 $ incluindo falhas. **Não tratar cada geração como uma slot machine: se não funciona, parar e reescrever.**

## Preços (fal, nov 2026)
FLUX schnell ~0,003 $/img · Seedream v4 0,03 $/img · Kling 2.5 Turbo Pro 0,07 $/s · Kling 3 Pro 0,14 $/s · Seedance 2.5 ~0,46 $/s (720p)

## Regras aprendidas
1. **Nunca escrever "droga", "addiction" ou similares nos prompts**: o Seedream bloqueia (aconteceu no projeto São Vicente). Descrever só o aspeto: "thinner, tired eyes, after a hard year".
2. A ficha "antes/depois" da mesma personagem perde consistência nas vistas laterais: usar **só a vista de frente** como referência.
3. As imagens do Canva via conector chegam em miniatura (199 px): não servem para produção.
4. Gerar clipes de **5 s** e esticar com câmara lenta na montagem.
5. Os traficantes aparecem sempre em silhueta: evita bloqueios e não glamoriza.
6. **Figurantes:** escrever sempre "Black Cape Verdean, dark brown skin". Sem isso o modelo põe vizinhos europeus (cena 06, v1).
7. **Personagem secundária com 2+ referências:** repetir na prompt os traços fixos (cabelo, barba, cicatriz, camisa), porque com 3 imagens o modelo mistura caras (cena 16, v1).
8. **"Depois" de uma personagem:** usar a **ficha original** como referência e descrever a mudança. A ficha "depois" deriva o tom de pele (cena 11, v1).
9. Rever **cada** imagem antes de mostrar ao Yax: 3 em 19 precisaram de correção (~0,09 $).
10. **Lugares reais** (Mindelo): usar **fotos reais do sítio como referência** no Seedream edit. Sem elas o modelo inventa uma cidade genérica (cena 01, v1). E a abertura não deve ser "assustadora": a ilha é bonita; o drama vem depois.
11. **Planos de cidade: gerar no Gemini (Nano Banana Pro) do Yax** com fotos reais anexadas e o prompt "DJI Inspire, 24mm, golden backlight, haze". Resultado aprovado na cena 01 (v3): nítido com zoom, luz real. Evitar saídas com aspeto HDR/ilustração (cores saturadas, céu liso).
12. **Kling inventa cortes** em movimentos longos ("push-in toward the city" saltou de plano aos 2,5 s na cena 01). Solução: **Start frame + End frame** (o fim = a mesma imagem com zoom de 10%) e no prompt: "one continuous shot, no cuts". Movimentos curtos e lentos.

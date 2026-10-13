# Eagle Marketing — Ferramentas do Departamento

## Google (conta AI Pro do Yanick)
- A subscrição AI Pro NÃO é uma chave de API, mas inclui ~10 USD/mês em créditos Google Cloud
  (Google Developer Program) que pagam o uso da Gemini API. Ultra: 40–100 USD/mês.
- Uso: Nano Banana (imagens, ~0,04 USD/imagem) e TTS via API, pagos com os créditos.
- Veo (vídeo) é caro na API: usar à mão no Flow/Gemini app (incluído na subscrição) quando fizer falta.
- Chave guardada como variável de ambiente `GOOGLE_API_KEY` (nunca no chat, nunca no repo).

## Conectores já ligados
| Conector | Departamento | Uso |
|---|---|---|
| Gmail | Relações Públicas | enviar propostas, follow-ups, negociar |
| Google Drive | Todos | logo, assets dos clientes, entregas |
| Google Calendar | RP / Financeiro | prazos, follow-ups, reuniões |
| Higgsfield | Motion | vídeo IA, upscale, remover fundo, reframe |
| ElevenLabs | Motion | locução em português |
| Epidemic Sound | Motion | só pesquisa: a conta não tem licença de download |
| HyperFrames (HeyGen) | Motion | leitura de projetos HTML-vídeo |
| Figma | Motion | layouts, frames de storyboard |
| Gamma | RP | propostas/apresentações bonitas |
| Supabase | Financeiro | base de dados de clientes, propostas e pagamentos |
| Vercel | RP | portfólio / site da Eagle Marketing |

## Conectores por autorizar (claude.ai → Settings → Connectors)
- Canva: adaptar assets de campanhas e criar peças estáticas.

## Skills
- Motor próprio: `engine/render.mjs` (HTML → Chromium frame a frame → ffmpeg) + `engine/music.py` (música própria, sem licenças). Sem Remotion/HyperFrames, por decisão do Yanick.

## Já no repositório
- Playwright MCP: navegar páginas públicas (Facebook/Instagram) à procura de campanhas.

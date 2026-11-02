# 04 · Ferramentas, conectores, skills e repositórios

Pesquisa feita a 2 nov 2026. ✅ = já ligado e pronto a usar.

## ✅ O que já temos ligado (usar já)

| Ferramenta | Para que serve no negócio |
|---|---|
| **Remotion + skill `remotion-best-practices`** | Motion promos, visualizers e lyric videos feitos em código, rápidos de repetir |
| **HyperFrames (HeyGen)** | Vídeos de motion alojados com render na nuvem, como alternativa ao Remotion |
| **Epidemic Sound** | Música e efeitos sonoros licenciados para os motion promos |
| **ElevenLabs** | Locução (voice-over) em PT, EN e FR para promos e anúncios |
| **Canva / Figma** | Thumbnails, capas, posts, carrosséis e mockups |
| **Vercel** | Alojar os sites dos clientes e a página Eagle |
| **Supabase** | Base de dados do Menu Real, do imoauto e, se for preciso, do CRM |
| **Gmail / Google Calendar / Drive** | Rascunhos de emails, blocos de tempo, entregas aos clientes |
| **Gamma** | Propostas bonitas em minutos |
| **fal.ai (FLUX schnell)** | Imagens para storyboards e demos, ~0,003 $ por imagem. O Yax dá a chave quando for preciso; **nunca guardar a chave no repositório** |
| **Firecrawl** | Encontrar leads: artistas, negócios sem site, imobiliárias |
| **Agente de vídeo imobiliário** (este repo) | Reels imobiliários a partir de fotos (imoauto + Lutuima) |

## 🧩 Skills e repositórios para instalar

| Repo | O que dá | Prioridade |
|---|---|---|
| [remotion-dev/skills](https://github.com/remotion-dev/skills) | Skills oficiais da Remotion; nos testes renderizou mais rápido do que as alternativas | 🔥 Alta |
| [remotion-dev/template-music-visualization](https://github.com/remotion-dev/remotion/tree/main/packages/template-music-visualization) | Template oficial de visualizer de música: troca o áudio e renderiza | 🔥 Alta |
| [iart-ai/motion-skills](https://github.com/iart-ai/motion-skills) | 50 skills de motion: tipografia cinética, explainers, TikTok/Reels | 🔥 Alta |
| [digitalsamba/claude-code-video-toolkit](https://github.com/digitalsamba/claude-code-video-toolkit) | Estúdio de vídeo para Claude Code: Remotion + ElevenLabs + FFmpeg | Média |
| [satelllte/remotion-audio-visualizer](https://github.com/satelllte/remotion-audio-visualizer) | Visualizer minimalista para estudar e adaptar | Média |
| [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills) | Catálogo de 362 repos de vídeo, testados e classificados | Referência |
| [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) | Skills locais de HyperFrames, vídeo a partir de HTML | Média |

## 🛒 Onde vender (Europa)

| Plataforma | Notas | Ação |
|---|---|---|
| **Fiverr** | Maior volume de pedidos; comissão de 20%; o dinheiro pode demorar até 14 dias a ficar disponível | Criar 3 gigs: Visualizer, Lyric Video, Motion Promo |
| **Contra** | Portfólio e propostas diretas, bom para motion | Criar perfil com as demos |
| **Upwork** | Muitos clientes; comissão de 0–15% por contrato | Fase 2 (precisa de propostas e "connects") |
| **Behance / Instagram** | Montra do portfólio | Publicar cada entrega |
| **Malt** | Forte em FR, ES, DE e NL | Verificar se aceita residentes em CV |
| **Venda direta** (Instagram, email) | Sem comissão, o melhor preço | A principal, com as mensagens do 03 |

## 🔁 Automação (fase 2, depois de haver vendas)
- **n8n** (gratuito se for self-hosted): fluxos de leads (Google Maps → Sheets → rascunho de mensagem). Há templates prontos no n8n.io.
- **Stripe Payment Links / Wise / PayPal**: links de pagamento em EUR. O Yax resolve qual usar.

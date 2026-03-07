# PROMPT PARA COLAR NO CLAUDE CODE LOCAL

Cola tudo abaixo no teu Claude Code local:

---

Preciso que faças o seguinte, passo a passo:

## FASE 1: Analisar os vídeos do Instagram

Usa o browser (Playwright MCP) para navegar e analisar estes 2 vídeos de exemplo de real estate:

1. https://www.instagram.com/reel/DUmMnVsiNmT/?igsh=bmRpbGNrd2xtdmho
2. https://www.instagram.com/reel/DVMkGXOkV9b/?igsh=MXRoMHF1dmVjcnBtZA==

Para cada vídeo:
- Navega até ao link com `browser_navigate`
- Se pedir login, diz-me para eu fazer login manualmente e depois continua
- Tira screenshots em vários momentos com `browser_screenshot`
- Analisa e documenta:
  - Duração do vídeo
  - Tipo de transições usadas (slide, fade, zoom, etc.)
  - Efeitos visuais (neon, glow, blur, parallax, etc.)
  - Cores dominantes e paleta
  - Texto/overlays (fontes, posição, animação)
  - Layout e composição de cada frame
  - Música/áudio (se visível no player)
  - Tipo de imóvel mostrado
  - Sequência dos frames (ordem das cenas)

## FASE 2: Criar projeto Remotion

Depois de analisar os 2 vídeos, cria um projeto Remotion completo que replica o estilo:

```bash
npx create-video@latest real-estate-video --template blank
cd real-estate-video
npm install
```

### Estrutura do projeto:
```
src/
├── Root.tsx                    # Composições registadas
├── compositions/
│   ├── RealEstateVideo.tsx     # Composição principal
│   ├── scenes/
│   │   ├── IntroScene.tsx      # Cena de abertura com logo/título
│   │   ├── PropertyShowcase.tsx # Showcase do imóvel com fotos
│   │   ├── DetailsScene.tsx    # Detalhes (preço, área, quartos)
│   │   ├── FloorPlanScene.tsx  # Planta do imóvel
│   │   ├── LocationScene.tsx   # Localização/mapa
│   │   └── OutroScene.tsx      # Cena final com contacto
│   ├── components/
│   │   ├── NeonText.tsx        # Texto com efeito neon
│   │   ├── GlowEffect.tsx     # Efeito glow
│   │   ├── SlideTransition.tsx # Transição slide
│   │   ├── ZoomReveal.tsx      # Reveal com zoom
│   │   ├── PriceTag.tsx        # Tag de preço animada
│   │   └── ContactInfo.tsx     # Info de contacto
│   └── styles/
│       └── theme.ts            # Cores, fontes, constantes
├── public/
│   └── images/                 # Pasta para fotos do imóvel
└── package.json
```

### Requisitos do vídeo:
- **Formato**: 1080x1920 (vertical, formato Reels/Stories)
- **FPS**: 30
- **Duração**: 15-30 segundos
- **Estilo**: Baseado nos 2 vídeos analisados
- **Props/Parameters**: O vídeo deve aceitar props para:
  - `propertyName` - Nome do imóvel
  - `price` - Preço
  - `location` - Localização
  - `bedrooms` - Quartos
  - `bathrooms` - Casas de banho
  - `area` - Área em m²
  - `images` - Array de paths das imagens
  - `agentName` - Nome do agente
  - `agentPhone` - Telefone
  - `agentLogo` - Logo da agência

### Efeitos a implementar (baseado na análise dos vídeos):
- Transições suaves entre cenas
- Texto animado com efeitos (neon, glow, slide-in)
- Zoom lento nas imagens (Ken Burns effect)
- Overlay de informações com animação
- Cores e estilo que correspondam aos vídeos analisados

## FASE 3: Testar

```bash
npx remotion studio
```

Confirma que o preview funciona e que o vídeo parece profissional.

## FASE 4: Documentar

Cria um ficheiro USAGE.md com instruções de como:
1. Substituir as imagens placeholder
2. Alterar as informações do imóvel
3. Renderizar o vídeo final com `npx remotion render`
4. Exportar em diferentes formatos/resoluções

---

IMPORTANTE: Usa a skill `remotion-best-practices` para seguir as melhores práticas do Remotion em todo o código. Segue as regras de animações, transições, timing, e composições.

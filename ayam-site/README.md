# AYAM Viagens & Turismo — site

Site estático, sem passo de build e sem dependências externas em tempo de execução
(as bibliotecas de animação estão em `vendor/`). Abre em qualquer alojamento que sirva
ficheiros: Vercel, Netlify, Cloudflare Pages, GitHub Pages ou um servidor próprio.

## Estrutura

```
index.html        página final, gerada — é esta que se publica
_content.html     markup (fonte editável)
styles.css        todo o sistema visual
app.js            dados dos destinos + comportamento
build.py          junta o <head> ao _content.html e gera o index.html
assets/           fotografia tratada + logótipo + favicon
vendor/           GSAP 3.12.5, ScrollTrigger, Lenis 1.1.13
```

### Como está construído

**Tema creme**, a partir da campanha "Só precisa escolher o destino.": fundo
creme, tipografia bordô, ouro em fios finos e detalhes.

Cada secção tem **fotografia de fundo** (`.bg` + `.bg__img` + `.bg__scrim`) e o
conteúdo vive em **painéis de vidro claro** (`.glass`) por cima. Não há blocos de
texto sobre fundo liso.

Dois cuidados que o tema claro obriga e que é fácil esquecer ao mexer nas cores:

- **Os véus (`.bg__scrim`) clareiam, não escurecem.** As fotografias de fundo são
  geradas já claras e desfocadas, para o texto bordô assentar por cima.
- **`--gold` (#A9750F) é mais escuro que o ouro do logótipo.** Sobre creme, o
  #D8900C do logótipo não tem contraste suficiente para texto. O ouro da marca
  vive em `--gold-lit`, e usa-se só em preenchimentos (botões, barras, realces).

Nomes de ficheiros de imagem:

| Prefixo | Para quê | Tamanho | Nota |
|---|---|---|---|
| `bg-*.webp` | fundo de secção e de destino | 1440×810 | qualidade baixa e ligeiramente desfocados de propósito — ficam atrás de véus escuros |
| `d-*.webp` | cartão vertical do carrossel | 680×850 | mostrado a 318 px, chega para ecrãs retina |
| `w-*.webp` | imagem de topo da gaveta | 1040×693 | |
| `og.jpg` | pré-visualização ao partilhar o link | 1200×630 | fica em JPEG: o WebP nem sempre é lido pelas pré-visualizações do WhatsApp |

Os caminhos das imagens de destino são construídos em `app.js` por concatenação
(`'assets/d-' + d.id + '.webp'`). Ao mudar de formato, é preciso alterar aí também —
uma substituição só no HTML não chega.

Ao acrescentar um destino em `DESTINOS` (`app.js`), são precisas as três imagens
com o mesmo `id`. O carrossel, a gaveta, a pesquisa e os chips do formulário são
todos gerados a partir desse array — não há nada a duplicar à mão.

**Editar `_content.html`, `styles.css` ou `app.js`** e depois correr:

```bash
python3 build.py
```

Editar o `index.html` directamente faz com que as alterações se percam na geração seguinte.

### Onde mexer em cada coisa

| Quero mudar | Ficheiro | Onde |
|---|---|---|
| Destinos (nomes, voos, épocas, descrições) | `app.js` | array `DESTINOS`, no topo — alimenta carrossel, gaveta, pesquisa e formulário |
| Fundos das secções | `_content.html` | `<img class="bg__img" src="assets/bg-…">` em cada secção |
| Força do escurecimento sobre as fotos | `styles.css` | `.bg__scrim`, `.bg__scrim--even`, `.bg__scrim--deep` |
| O que está incluído nos pacotes | `app.js` | array `INCLUI` |
| Cores e tipos de letra | `styles.css` | bloco `:root`, no topo |
| Textos das secções | `_content.html` | por secção, comentadas |
| Número de WhatsApp / email | `app.js` (`WA`, `MAIL`) **e** `_content.html` | os links aparecem em ambos |

## Publicar

```bash
# Vercel
npx vercel deploy --prod

# Netlify
npx netlify deploy --prod --dir=.

# ou simplesmente enviar a pasta por FTP
```

Não há servidor, base de dados nem variáveis de ambiente.

## Testar localmente

```bash
python3 -m http.server 8788
# abrir http://localhost:8788
```

Convém usar um servidor em vez de abrir o ficheiro directamente — com `file://`
alguns browsers bloqueiam o carregamento dos scripts em `vendor/`.

## Como funciona o pedido de proposta

O formulário tem quatro passos e **não precisa de backend**. No fim, monta uma
mensagem formatada e abre o WhatsApp da agência já com tudo escrito:

```
*Pedido de proposta — AYAM*

Tipo: Lua-de-mel
Destinos: Maldivas · Atol de Baa
Partida: Outubro de 2026
Duração: 7 a 10 noites
Viajantes: 2 adultos · 1 criança

Nome: ...
Contacto: ...
```

Se o WhatsApp não abrir (bloqueador de janelas), o último passo mostra um botão
para abrir manualmente e outro para enviar por email.

**Limitação a conhecer:** como não há backend, os pedidos não ficam guardados em
lado nenhum — existem apenas na conversa de WhatsApp. Para ter um registo
(folha de cálculo ou CRM), é preciso acrescentar um serviço de formulários.

## Conteúdo que convém substituir

| O quê | Onde | Porquê |
|---|---|---|
| Logótipo | `assets/ayam-logo.png` | Foi extraído da apresentação em PDF, a 416×160 px. Um SVG ou PNG original fica nítido em qualquer tamanho. |
| Fotografia | `assets/*.webp` | São imagens Creative Commons de recurso. Fotografias próprias — clientes, equipa, escritório, viagens realizadas — valem muito mais e retiram a necessidade dos créditos no rodapé. |
| Créditos | rodapé de `_content.html` | As licenças CC BY / CC BY-SA **obrigam** a manter a atribuição enquanto estas imagens forem usadas. Ao trocar por fotografia própria, apagar o bloco `.credits`. |
| Preços dos pacotes | `_content.html`, secção Pacotes | Estão como "Sob consulta" de propósito — não inventámos valores. |
| Tempos de voo | `app.js`, array `DESTINOS` | Estão marcados como indicativos. Vale a pena confirmar com os horários praticados. |
| Textos do processo | `_content.html`, secção Como trabalhamos | Descrevem um fluxo genérico de agência. Confirmar que corresponde ao vosso. |

## Notas técnicas

- **Sem JavaScript**, a página continua legível: as animações partem sempre de um
  estado visível, nunca de `opacity: 0` em CSS. O carrossel passa a deslize nativo.
- **`prefers-reduced-motion`** desliga scroll suave, fixações, cursor e o pré-carregamento.
- **Acessibilidade**: link para saltar o cabeçalho, foco preso dentro do menu e da
  gaveta, fecho com `Escape`, `aria-pressed` nos chips, `aria-current` na navegação,
  e todos os botões com nome acessível.
- **Carrossel 3D**: `perspective` no contentor e `rotateY`/`translateZ` por cartão,
  com deslocamento circular — o cartão activo fica sempre ao centro, com cartões
  dos dois lados, e a navegação dá a volta nos extremos. Funciona com setas,
  pontos, arrasto, teclado e clique. O fundo da secção troca com o destino activo.
- **Rota viva** (`.routeline`, na secção Destinos): um avião percorre o arco de
  Praia até ao destino activo, desenhando o rasto atrás de si, e a rota refaz-se
  sempre que o carrossel muda. Vive no fluxo normal do documento, de propósito —
  ao contrário do pré-carregamento, que é `position:fixed`, aparece em qualquer
  contexto, incluindo dentro de molduras altas. Os pinos dos extremos são
  posicionados em percentagens tiradas do `viewBox` (`600×110`, extremos em
  `x=2` e `x=598`, `y=96`): ao mudar o `d` dos caminhos é preciso acertar
  `.routeline__pin` em `styles.css`.
- **Pesquisa**: abre pelo ícone da barra ou pela tecla `/`; filtra por nome, país,
  código IATA ou etiqueta; navega com as setas e escolhe com `Enter`.
- **Telemóvel**: menu em ecrã inteiro abaixo de 1040 px; a gaveta transforma-se em
  painel inferior abaixo de 640 px.
- **Relógios**: a hora local de cada destino é calculada no browser com
  `Intl.DateTimeFormat` a partir do fuso horário — não é texto fixo.
- Fontes carregadas do Google Fonts (Fraunces, Archivo, IBM Plex Mono). Para
  funcionamento totalmente offline, descarregar os ficheiros e servi-los de `assets/fonts/`.

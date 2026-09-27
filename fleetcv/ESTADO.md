# Onde isto está, em 26 de Setembro de 2026

Escrito para quem pegar nisto a seguir — inclusive eu, noutra sessão.

## A funcionar, agora

| | |
|---|---|
| **Página principal** | https://fleetcv.vercel.app — com Criar conta, Entrar, Experimentar, preços e WhatsApp |
| **A aplicação** | https://fleetcv.vercel.app/app (o mesmo em `fleetcv-up1b.vercel.app`) |
| **Base de dados** | Supabase, projecto `fleetcv`, `jhjtjjyplihabowxkfhs`, eu-west-1 |
| **Código** | `YAxbairro/claude`, ramo `claude/eager-turing-11lp6h` — é daqui que se publica |
| **Frota fundadora** | `f1`, de `yanickdrs@gmail.com`, sem prazo. O código foi dado em privado |

- **Várias frotas.** Qualquer proprietário cria conta pela página
  principal e fica com a sua frota, fechada pela própria base de dados.
  30 dias de experiência; cobra-se à mão e marca-se o plano no SQL
  Editor (ver `site/INSTALAR.md`).
- **O condutor** recebe o acesso pelo WhatsApp (a aplicação escreve a
  mensagem) e entra com e-mail e código. Não vê a conta do patrão nem
  os códigos dos colegas — antes via, e entrava como qualquer um deles.
- **O proprietário** muda o e-mail e o código na aplicação, e pode
  apagar a conta. O código dele guarda-se baralhado (bcrypt) a partir
  da primeira vez que o mudar.
- **Provado ao vivo**, no site e na base verdadeiros
  (`paineis/prova_ao_vivo.mjs`): criar conta → carro → condutor → o
  condutor fotografa o quadrante e entra e anda → o patrão vê os
  quilómetros subirem, o carro no mapa, a fotografia do quadrante e a do
  talão (com os litros) durante o turno → turno fecha → apagar a conta
  sem deixar lixo. 28 de 28, a 26 de Setembro.

- **O canal ao vivo (WebSocket), provado de fora** — numa máquina do
  GitHub (`paineis/prova_tempo_real.mjs`, corre sozinho em
  `.github/workflows/fleetcv-tempo-real.yml`): 10 de 10 posições
  chegaram ao patrão da frota, **atraso típico 0,6 s**, com a
  velocidade dentro; o patrão de outra frota recebeu **zero**.
  Atenção: no plano gratuito do Supabase houve pedidos presos 3–20 s
  na camada de entrada (a base em si nunca passou de 0,3 s). Com
  clientes pagantes, passar ao plano Pro (25 USD/mês): máquina própria
  e o projecto deixa de adormecer.

- **O mapa do patrão é um mapa a sério** (Leaflet + OpenStreetMap):
  ruas com nome, zoom com os dedos, o carro a deslizar. Tocar num carro
  segue-o, com uma faixa curta (velocidade, km, há quanto tempo mandou
  a posição); os detalhes só quando se pedem. Arrastar o mapa larga o
  carro; "Voltar a seguir" apanha-o. Sem rede para o mapa, volta sozinho
  ao desenho da Praia de sempre. `paineis/teste_mapa_vivo.mjs` (24).
  Os quadradinhos vêm dos servidores do OpenStreetMap, que aceitam uso
  leve com atribuição. Quando houver dezenas de frotas, passar para um
  fornecedor (MapTiler, Stadia) — é mudar uma linha em
  `paineis/mapa/mapa_vivo.js`.

- **As fotografias (quadrante e talão) entram.** No teste do Yanick
  nenhuma entrava. Três causas: (1) o telemóvel saía para a câmara, a
  aplicação repintava-se entretanto e a fotografia voltava para um botão
  que já não existia — e em Androids com pouca memória a página era
  fechada; (2) as fotografias só subiam no fim do turno; (3) a fila de
  envio deitava fora à primeira um envio que apanhasse uma sessão
  caducada ou um 503 do servidor. Agora: a câmara abre DENTRO da
  aplicação (com a câmara do telemóvel como recurso), a fotografia sobe
  logo e o patrão vê-a durante o turno, o passo a meio sobrevive a um
  recarregar, e a fila só desiste do que a base recusa de vez (8 vezes),
  tentando de novo quando a rede volta. `paineis/teste_camara.mjs` (31).
- **Os litros do abastecimento** apareciam "0,00 litros" no turno ao
  vivo (faltava o preço do litro no turno ao vivo). O turno leva agora o
  preço e o depósito, e o painel do patrão completa os antigos com os
  da frota.

- **Carro sem km: preenchido pelo primeiro turno.** Ao criar a viatura,
  o patrão pode escolher "Preencher automaticamente no primeiro turno"
  (vive fora, não sabe os km). O primeiro condutor fotografa o quadrante,
  escreve os km e toca no nível do ponteiro (vazio, ¼, ½, ¾, cheio); a
  base (gatilho `docs_km_do_carro`) grava-os no carro com quem, quando e
  o turno — a ficha do carro tem "Ver a fotografia do quadrante". Os km
  são lidos da fotografia (ver abaixo) e o condutor confere.
- **Os km do carro não seguiam os turnos** (erro encontrado a 27/09): o
  condutor não pode escrever na frota, e cada turno novo começava nos km
  do dia em que o carro foi criado (o ST-28-ED estava nos 120.000 com o
  último turno a acabar nos 120.828). Agora o mesmo gatilho deixa o
  carro nos km do fim de cada turno fechado — só para a frente e só com
  turnos plausíveis (até 1.500 km). Provas SQL 62–68;
  `paineis/teste_primeiro_turno.mjs` (28).
- **O telemóvel lê os km na fotografia do quadrante** (27/09). PaddleOCR
  (PP-OCRv4, livre) a correr no próprio telemóvel, num Worker, com o ONNX
  Runtime; sem OpenCV (`paineis/mapa/leitor_quadrante.js`). Escolhido
  numa corrida com 58 quadrantes verdadeiros (`paineis/ocr/`): o
  Tesseract acertou 8; este, sabendo onde o carro ficou, acerta 40 e
  errou 1 — quando não tem a certeza, não propõe. O campo dos km fica
  preenchido e o condutor confere; o que ele escreve manda sempre. O que
  se leu fica no turno (`kmLidoInicio`/`kmLidoFim`) e o patrão vê um
  aviso (A31) quando o escrito não bate com a fotografia. O telemóvel
  descarrega ~19 MB do jsDelivr uma vez só (guardado um ano); com a
  poupança de dados ligada, não lê. `paineis/teste_leitor.mjs` (17).

## Crescer: quanto aguenta e quando pagar (medido a 27 de Setembro)

Contas com os números da base verdadeira (cada ponto do caminho pesa
47 bytes; a posição ao vivo vai de 1,5 em 1,5 s a andar e de 12 em 12 s
parado). Supõe-se um turno de 12 h por carro por dia e o patrão com o
ecrã aberto um terço do tempo.

**Desperdício corrigido hoje** (`paineis/teste_dados.mjs`, 13; a versão
antiga falha 6):
- O telemóvel de cada condutor recebia as posições de todos os colegas
  (8 kB cada): com 10 carros, ~1,1 GB de dados móveis por turno. Agora
  o condutor só ouve a frota (carros, colegas, preço).
- Cada posição levava os últimos 160 pontos; agora leva só os novos e
  a cauda inteira de 30 em 30 s — média 1,0 kB em vez de 7–8 kB. O
  painel do patrão cose os pedaços (pela posição do ponto no caminho).
- A rede de segurança voltava a descarregar os 600 turnos de minuto a
  minuto; agora só os que mudaram (inteiros ao abrir e de 30 em 30 min).

**Mensagens do tempo real por mês** (o Supabase cobra 2,50 USD por
milhão acima de 5 milhões no Pro; o grátis pára aos 2 milhões):

| carros | antes | agora |
|---:|---:|---:|
| 10 | 50 M | 1,6 M |
| 100 | 502 M | 16 M (≈ +28 USD) |
| 1000 | 5 000 M | 162 M (≈ +390 USD) |

**A base cresce ~36 MB por carro por mês** (percurso ~21, fotos ~15):
o grátis (500 MB) enche com 10 carros em mês e meio; o Pro traz 8 GB e
cobra 0,125 USD por GB a mais.

**Degraus:**
1. **Já, com o primeiro cliente a pagar:** Supabase Pro (25 USD/mês):
   sem adormecer, cópias de segurança diárias, 8 GB, 250 GB de tráfego.
   E o site: o Vercel grátis é só para uso NÃO comercial — Vercel Pro
   (20 USD/mês) ou mudar o site (é estático) para o Cloudflare Pages,
   grátis e com uso comercial.
2. **Aos ~100 carros:** fotos para o armazenamento do Supabase (100 GB
   incluídos) em vez da tabela; guardar menos pontos parado; prazo de
   guarda (ex.: percursos 12 meses).
3. **Aos ~300 carros / muitas frotas:** as posições numa tabela própria
   filtrada por frota (o Supabase verifica cada mudança contra cada
   patrão ligado — com muitas frotas isso engasga), ou por Broadcast;
   o mapa geral a 5 s e 1,5 s só no carro seguido; máquina Small ou
   Medium (15–60 USD/mês); fornecedor pago de mapas em vez dos
   servidores do OpenStreetMap.

Com 1000 carros a ~1 000 CVE por carro, a infra-estrutura fica abaixo
de 5% do que entra.

## Como se publica (o nó de antes está desatado)

O Vercel aceita publicar a partir de um repositório público do GitHub
mesmo sem estar ligado a ele: `create_deployment` com `gitSource` a
apontar para `YAxbairro/claude` e `rootDirectory: fleetcv/site`. Não
precisa do `Afroberd/fleetcv`, nem de trocar de conta, nem de enviar
ficheiros. Os passos estão em `site/INSTALAR.md`.

## Provas

| | |
|---|---|
| `supabase/provar.sh` | 68 regras + 9 da passagem de uma base antiga, num Postgres a sério. As provas foram postas à prova estragando as regras de propósito |
| `paineis/teste_contas.mjs` | 40 — o caminho de um cliente novo, do criar conta ao apagar |
| `paineis/teste_supabase.mjs` | 25 — as regras vistas pela aplicação, a trava, sem rede |
| o resto dos `teste_*.mjs` | leitor 17, primeiro turno 28, dados 13, câmara 31, condutor 35, dono 44, junto 16, clicável 25, formulários 18, fotografias 10, embrulho 9, tempo real 15 + 6, Claude 24, servidor 15, ensaio 9, voltar 33, mapa vivo 24 |

Os testes que usam o servidor próprio (`teste_clicavel`,
`teste_formularios`, `teste_servidor`) esperam correr numa pasta com
`servidor/` ao lado e `servidor/fleetcv.html`.

## O que falta fazer

1. **Entrar com o Google.** Ainda não está feito. Primeiro o Yanick
   tem de criar um cliente OAuth na Google Cloud e colá-lo no Supabase
   (Authentication → Providers → Google), uns dez minutos do lado dele.
   Só depois se liga na aplicação, porque sem isso não há como o
   provar. Até lá, entra-se com e-mail e código.
2. **Pagamentos automáticos.** A Stripe não trabalha com Cabo Verde;
   Vinti4 por API pede contrato com o banco (SISP). Até lá, à mão.
3. **Vigiar no piloto:** o ecrã que apaga (o navegador pára de gravar o
   caminho), e o projecto gratuito do Supabase que adormece ao fim de
   uns sete dias sem uso.
4. **Quando crescer:** as fotografias saem da tabela para o armazenamento
   do Supabase, e o tempo real tem tecto no plano gratuito (200 ligações
   ao mesmo tempo, que dá umas dezenas de frotas).

## Uma regra aprendida à força

Códigos e palavras-passe não entram em ficheiro nenhum que vá para o
GitHub. Aconteceu duas vezes no mesmo dia — no guia de instalação e nos
ficheiros de prova. O que resolve é trocar a senha, não apagar o
histórico. O condutor de teste "PROVA (apagar)", cujo código ficou num
ficheiro antigo, foi desactivado na frota `f1`.

A cópia da base antes da passagem para várias frotas ficou só na
máquina da sessão (tem códigos), não no repositório.

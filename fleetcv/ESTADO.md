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

- **Uma página não corre em segundo plano** (teste de 30/09). O
  telemóvel do condutor (Samsung Internet) mandou posições 10 segundos
  e calou-se: os registos do Supabase mostram o último pedido às 09:15
  e nada depois. Com o ecrã apagado ou outra aplicação à frente, o
  Android pára a página e o GPS com ela — é assim com qualquer site. O
  mapa do patrão mostrava o carro parado com a última velocidade.
  Agora: no instante em que a página sai do ecrã avisa a base
  (`fora`/`foraDesde` no documento ao vivo) e o patrão lê "O condutor
  saiu da aplicação há X min"; calado há mais de 45 s, o carro fica
  cinzento, sem velocidade, com "Sem sinal há X min"; o condutor, ao
  voltar, vê quanto tempo o GPS parou; as saídas ficam no turno
  (`pausas`, aviso A32 com 5 min ou mais). Antes de começar, o condutor
  é avisado de que tem de deixar a página no ecrã, e de abrir no Chrome
  se estiver dentro do Instagram/Facebook. `paineis/teste_fora.mjs` (18).
  **A solução de fundo é a aplicação Android** (a seguir).

- **Aplicação Android do condutor** (30/09): https://fleetcv.vercel.app/android
  (APK em `/FleetCV.apk`, 3,6 MB, `cv.fleetcv.condutor` 1.0.0). Abre a
  mesma aplicação do site, mas o GPS vem de um serviço do Android com
  notificação fixa ("FleetCV · GPS ligado"), que continua com o ecrã
  apagado e com outras aplicações à frente — como a Uber/Yango. Liga-se
  ao ir para o ecrã do GPS e desliga-se ao fechar o turno (ou ao recuar
  sem o abrir). Pede para sair da poupança de bateria (Samsung/Xiaomi
  matam aplicações em segundo plano) e, sem licença de localização,
  leva às definições. Os pedidos à base vão pelo lado nativo, que o
  Android não trava em segundo plano. No navegador de um Android, o
  ecrã do GPS sugere instalar a aplicação. Como carrega o site, as
  mudanças no site chegam sem reinstalar. Instala-se à mão (fora da
  Play Store: "Permitir desta origem"). A chave de assinatura está na
  tabela fechada `_cofre` do Supabase, nunca no GitHub — ver
  `android/LEIA-ME.md`. `paineis/teste_app_android.mjs` (21) prova a
  página com a aplicação imitada; o serviço nativo só se prova num
  telemóvel verdadeiro (aqui não há emulador).

- **Dados e bateria do telemóvel do condutor** (medido a 30/09, a meio
  de um turno de 6 h, com o ecrã apagado; `paineis/teste_consumo.mjs`,
  12). Com o GPS a correr o turno inteiro apareceram quatro gastos que a
  página no navegador escondia (parava antes): o percurso TODO subia
  outra vez de 45 em 45 s (103 MB por hora às 6 h de turno — mais de
  1 GB num dia); guardava-se um ponto por segundo mesmo parado (e os
  saltinhos do GPS parado somavam km falsos: 127 km em vez de 97);
  recontavam-se os km do turno inteiro a cada ponto (107 ms de
  telemóvel por ponto); e o volante desenhava-se com o ecrã apagado.
  Agora: sobe só o pedaço novo do percurso; fica um ponto a cada 20 m a
  andar e um de 30 em 30 s parado; os km contam-se aos bocados (0,5 ms
  por ponto); com o ecrã apagado não se desenha; os turnos fechados
  guardam-se no telemóvel com o percurso resumido (antes enchiam a
  memória da página em poucos dias). Fica **~4,5 MB por hora** (metade
  a andar, metade parado) — ~50 MB num turno de 12 h, quase tudo a
  posição ao vivo de 1,5 em 1,5 s e os ~2 kB de cabeçalhos de cada
  envio. A bateria só se mede num telemóvel verdadeiro (Definições →
  Bateria → utilização por aplicação).

- **O primeiro teste na estrada** (sexta, 02/10, ST-CM24, 19:30–21:31,
  condutor num Samsung A24 com Android 16, patrão num Xiaomi, os dois
  na aplicação). Os registos do Supabase mostraram que o telemóvel
  estava na aplicação (pedidos "Dalvik"), mas o GPS nativo **não
  arrancou bem**: com o ecrã apagado parava 4 a 9 minutos de cada vez
  (às vezes voltava sozinho), e o patrão lia "o condutor saiu da
  aplicação". Três causas, todas corrigidas:
  1. dentro da aplicação a página vem do site (sem o @capacitor/core) e
     o `addWatcher` devolve o número da vigia, não uma promessa — o
     `.then` rebentava, a página não sabia que estava no GPS nativo, e
     nunca pedia a poupança de bateria;
  2. as licenças eram pedidas ao mesmo tempo (localização e
     notificações) e o serviço tentava pôr-se em primeiro plano antes de
     haver licença — no Android 14+ isso falha calado (sem notificação
     fixa, o Android corta o GPS). Agora: localização primeiro, depois o
     GPS, depois as notificações;
  3. a poupança de bateria (Samsung) adormecia a aplicação. Agora, sem
     ela livre, o passo principal antes de "Começar turno" é tirá-la da
     poupança; e a aplicação **1.0.1** segura o telemóvel acordado
     durante o turno (trava de 16 h no máximo) e diz a sua versão — quem
     tiver a 1.0.0 vê "Há uma versão nova da aplicação".
  `paineis/teste_app_android.mjs` (30) imita agora a aplicação como ela
  é (a imitação de antes devolvia uma promessa e escondeu o erro; contra
  a versão antiga, o teste novo falha 6).
- **Registo de erros**: o que corre mal nos telemóveis (o GPS que pára
  mais de um minuto, licenças, erros da página) vai para a tabela
  `erros` (os telemóveis só escrevem, até 120 por hora; provas 70–73).
  **A tabela ainda não está na base verdadeira** (a migração ficou à
  espera de autorização): até lá, a aplicação cala-se sem erro.
- **O mapa do patrão cortado** (só o canto de cima com ruas): o mapa da
  frota esperava fora da página enquanto o patrão via outro ecrã; se a
  janela mudasse de tamanho nesse tempo, ficava medido zero por zero.
  Agora mede-se sempre contra a caixa verdadeira
  (`paineis/teste_mapa_tamanho.mjs`, 4; antes: 8% do mapa com ruas).
- **Um ecrã só para o carro em turno**: o mapa, a velocidade e, em "Mais
  detalhes", as fotografias, os abastecimentos (tocar mostra no mapa
  onde foi) e os alertas. O "turno todo" de um carro em turno traz para
  aqui; quando o turno fecha aparece "acabou · ver as contas".
- **Mapa escuro com nomes**: no tema escuro, os mapas do patrão e o do
  volante do condutor são escuros e limpos (os do OpenStreetMap com um
  filtro), com ruas e sítios; no claro, cores suaves. O volante usa o
  desenho de sempre quando não há rede para o mapa.
- **Leitura do quadrante, ODO e Trip**: no painel do teste ("ODO
  6140km", por baixo "Trip 137.0km") o leitor propôs 13.701 (o parcial
  mal lido como "137.01"). Agora sabe onde está cada palavra: o número
  do "ODO" ganha, o do "Trip" sai se houver outro, "137.01" é 137, e o
  conta-rotações não conta. Nas 58 fotografias verdadeiras: os mesmos
  acertos (38 e 40) e menos um engano (`paineis/teste_leitor_rotulos.mjs`, 11).

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
| `supabase/provar.sh` | 73 regras + 9 da passagem de uma base antiga, num Postgres a sério. As provas foram postas à prova estragando as regras de propósito |
| `paineis/teste_contas.mjs` | 40 — o caminho de um cliente novo, do criar conta ao apagar |
| `paineis/teste_supabase.mjs` | 25 — as regras vistas pela aplicação, a trava, sem rede |
| o resto dos `teste_*.mjs` | aplicação Android 30, leitor ODO/Trip 11, mapa cortado 4, consumo 12, fora da aplicação 18, leitor 18, primeiro turno 28, dados 13, câmara 31, condutor 35, dono 44, junto 16, clicável 25, formulários 18, fotografias 10, embrulho 9, tempo real 15 + 6, Claude 24, servidor 15, ensaio 9, voltar 33, mapa vivo 26 |

Os testes que usam o servidor próprio (`teste_clicavel`,
`teste_formularios`, `teste_servidor`) esperam correr numa pasta com
`servidor/` ao lado e `servidor/fleetcv.html`.

## O que falta fazer

0. **Provar a aplicação Android num telemóvel verdadeiro** (um turno
   com o ecrã apagado) e, depois, pô-la na Google Play (conta de
   programador: 25 USD, uma vez; `android/LEIA-ME.md`). iPhone depois
   (Apple: 99 USD/ano).

1. **Entrar com o Google.** Ainda não está feito. Primeiro o Yanick
   tem de criar um cliente OAuth na Google Cloud e colá-lo no Supabase
   (Authentication → Providers → Google), uns dez minutos do lado dele.
   Só depois se liga na aplicação, porque sem isso não há como o
   provar. Até lá, entra-se com e-mail e código.
2. **Pagamentos automáticos.** A Stripe não trabalha com Cabo Verde;
   Vinti4 por API pede contrato com o banco (SISP). Até lá, à mão.
3. **Vigiar no piloto:** o ecrã que apaga no iPhone e no navegador (só
   a aplicação Android grava com o ecrã apagado), e o projecto gratuito do Supabase que adormece ao fim de
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

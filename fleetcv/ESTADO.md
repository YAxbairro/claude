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

## Como se publica (o nó de antes está desatado)

O Vercel aceita publicar a partir de um repositório público do GitHub
mesmo sem estar ligado a ele: `create_deployment` com `gitSource` a
apontar para `YAxbairro/claude` e `rootDirectory: fleetcv/site`. Não
precisa do `Afroberd/fleetcv`, nem de trocar de conta, nem de enviar
ficheiros. Os passos estão em `site/INSTALAR.md`.

## Provas

| | |
|---|---|
| `supabase/provar.sh` | 61 regras + 9 da passagem de uma base antiga, num Postgres a sério. As provas foram postas à prova estragando as regras de propósito |
| `paineis/teste_contas.mjs` | 40 — o caminho de um cliente novo, do criar conta ao apagar |
| `paineis/teste_supabase.mjs` | 25 — as regras vistas pela aplicação, a trava, sem rede |
| o resto dos `teste_*.mjs` | câmara 31, condutor 35, dono 44, junto 16, clicável 25, formulários 18, fotografias 10, embrulho 9, tempo real 15 + 6, Claude 24, servidor 15, ensaio 9, voltar 33, mapa vivo 24 |

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

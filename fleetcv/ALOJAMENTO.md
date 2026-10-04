# Mudar o site para uma casa comercial, com domínio próprio

## Porquê

O site está hoje na **Vercel, no plano grátis (Hobby)**, que só serve para uso
pessoal, não comercial. Para cobrar a clientes há duas saídas:

| | Preço | O que muda |
|---|---|---|
| **Cloudflare Pages** (recomendado) | grátis, uso comercial permitido, tráfego sem limite | uma conta nova e um projecto ligado ao GitHub; os ficheiros `site/_headers` e `site/_redirects` já estão prontos |
| Vercel Pro | 20 USD por mês | nada de técnico: só passar a conta a Pro |

A base de dados (Supabase) não muda em nenhum dos casos. Quando houver
clientes a pagar, o Supabase passa a **Pro (25 USD por mês)**: o grátis
pára o projecto ao fim de uma semana sem uso e só leva 500 MB (enche com 10
carros em mês e meio — ver `ESTADO.md`).

## O domínio  **[Yanick]**

Verificado a 04/10/2026: **fleetcv.com**, fleetcv.app, fleetcv.net e
fleetcv.co estão livres. Um `.com` custa à volta de 10–15 USD por ano (no
Cloudflare compra-se a preço de custo). Um `.cv` dá mais confiança cá dentro;
compra-se num registador de Cabo Verde (ver dns.cv). Dá para ter os dois e
apontar um para o outro.

**Decidir o domínio antes de enviar para a Google Play**: a aplicação Android
tem o endereço do site lá dentro (`android/capacitor.config.json`). Com o
domínio escolhido, faço uma versão 1.1.1 que já abre o domínio novo.

## Passo a passo (Cloudflare Pages)

1. **[Yanick]** Criar conta em https://dash.cloudflare.com (grátis).
2. **[Yanick]** *Workers & Pages → Create → Pages → Connect to Git*, autorizar
   o GitHub e escolher o repositório `YAxbairro/claude`.
   - Production branch: o ramo onde está a versão final (hoje
     `claude/eager-turing-11lp6h`; depois de juntar, `main`).
   - Framework preset: *None*. Build command: (vazio).
   - Root directory: `fleetcv/site`. Build output directory: `.`
3. Abrir o endereço `….pages.dev` que o Cloudflare dá e verificar (faço eu,
   com a prova ao vivo `paineis/prova_ao_vivo.mjs`):
   - `/app` abre, o patrão e o condutor entram;
   - `/FleetCV.apk` descarrega como aplicação;
   - o mapa de Cabo Verde aparece (o ficheiro `.pmtiles` responde aos
     pedaços, `206`; se não responder, o mapa passa sozinho ao
     OpenStreetMap — não fica em branco, mas gasta mais dados).
4. **[Yanick]** Comprar o domínio e, em *Custom domains*, juntá-lo ao projecto.
   Se o domínio for comprado no Cloudflare, o DNS fica feito sozinho.
5. Faço a aplicação Android 1.1.1 com o domínio novo (sem tirar o antigo da
   lista, para a mudança não partir nada) e publico-a.
6. **A mudança em si, num dia sem turnos abertos.** Cada endereço guarda as
   suas coisas no telemóvel à parte: no domínio novo, patrões e condutores
   entram outra vez com o e-mail e o código, e o que estiver por enviar no
   endereço antigo fica lá. Por isso: todos os turnos fechados e enviados
   antes de mudar.
7. As mensagens de acesso que o patrão manda pelo WhatsApp passam a levar o
   domínio novo sozinhas (usam o endereço onde o painel está aberto).
8. Deixar a Vercel a funcionar até todos os condutores terem a 1.1.1; depois
   apagar o projecto `fleetcv-up1b` e pôr o `fleetcv.vercel.app` a mandar
   para o domínio novo.

`paineis/teste_alojamento.mjs` confere que o `_headers` do Cloudflare e o
`vercel.json` dizem o mesmo, e que nenhum ficheiro passa dos 25 MiB (o
limite do Cloudflare Pages; o maior é o mapa, 16 MiB).

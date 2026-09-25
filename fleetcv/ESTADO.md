# Onde isto está, em 25 de Setembro de 2026 (fim do dia)

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
  condutor entra e anda → o patrão vê os quilómetros subirem → turno
  fecha → apagar a conta sem deixar lixo. 19 de 19.

- **O canal ao vivo (WebSocket), provado de fora** — numa máquina do
  GitHub (`paineis/prova_tempo_real.mjs`, corre sozinho em
  `.github/workflows/fleetcv-tempo-real.yml`): 10 de 10 posições
  chegaram ao patrão da frota, **atraso típico 0,6 s**, com a
  velocidade dentro; o patrão de outra frota recebeu **zero**.
  Atenção: no plano gratuito do Supabase houve pedidos presos 3–20 s
  na camada de entrada (a base em si nunca passou de 0,3 s). Com
  clientes pagantes, passar ao plano Pro (25 USD/mês): máquina própria
  e o projecto deixa de adormecer.

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
| o resto dos `teste_*.mjs` | condutor 35, dono 44, junto 16, clicável 23, formulários 18, fotografias 10, embrulho 9, tempo real 15 + 6, Claude 24, servidor 15, ensaio 9 |

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

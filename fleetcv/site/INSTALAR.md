# O FleetCV no ar — Supabase + Vercel

**Já está no ar.** Este guia diz como está montado, como se publica uma
mudança, e o que fazer quando alguma coisa não corre bem.

| | |
|---|---|
| **Página principal** | https://fleetcv.vercel.app (também em https://fleetcv-up1b.vercel.app) |
| **A aplicação** | https://fleetcv.vercel.app/app |
| **Base de dados** | Supabase, projecto `fleetcv` (`jhjtjjyplihabowxkfhs`), região eu-west-1 |
| **De onde se publica** | `YAxbairro/claude`, ramo `claude/eager-turing-11lp6h`, pasta `fleetcv/site` |

**Códigos e senhas nunca se escrevem aqui**, nem em ficheiro nenhum que
vá para o GitHub. Este repositório é público. Já aconteceu duas vezes;
o remédio foi trocar o código, porque apagar o histórico não chega.

---

## Os endereços que interessam

Cada botão da página principal abre a aplicação já na porta certa:

| Endereço | Abre |
|---|---|
| `/app#criar` | o ecrã de criar conta de proprietário |
| `/app#dono` | o ecrã de entrar do proprietário |
| `/app#condutor` | o ecrã de entrar do condutor — é este que vai na mensagem do WhatsApp |
| `/app#experimentar` | uma frota de mentira, só naquele telemóvel, sem conta |
| `/#inicio` | a página principal, mesmo num telemóvel que já usa a aplicação (sem isto, esse telemóvel vai direito à aplicação) |

## Como um proprietário novo começa

1. Abre a página principal e carrega em **Criar conta**: nome, nome da
   frota, e-mail e um código de pelo menos 6 algarismos ou letras.
   Tem 30 dias grátis.
2. Os **primeiros passos** levam-no a juntar um carro e um condutor. O
   código do condutor é a aplicação que o inventa.
3. Na ficha do condutor, **Mandar pelo WhatsApp** escreve a mensagem
   com o endereço, o e-mail e o código. O condutor abre, entra, e está a
   trabalhar.
4. Quando o condutor abrir o turno, o telemóvel pergunta **«Permitir
   localização?»** — tem de dizer **Permitir sempre**. Se disser só
   «enquanto a app estiver aberta», o percurso pára quando ele apaga o
   ecrã.

O proprietário muda o e-mail ou o código em **Mais → Mudar o e-mail ou
o código** (pede o código de hoje). Pode também **apagar a conta**, que
leva tudo. A frota fundadora (a primeira, a do Yanick) não se apaga pela
aplicação.

## Cobrar

Não há pagamentos automáticos: a Stripe não trabalha com Cabo Verde, e
Vinti4 por API pede contrato com o banco. Por agora cobra-se à mão
(Vinti4 ou transferência) e marca-se o plano na base, no SQL Editor:

```sql
-- ver as frotas, quem são e até quando vai a experiência
select f.id, f.nome, f.plano, f.ate, d.corpo->>'email' as email
  from frotas f join docs d on d.frota = f.id
 where d.coleccao = 'frota' and d.id = 'dono'
 order by f.criada desc;

-- pagou: plano pago, sem prazo
update frotas set plano = 'pago', ate = null where id = 'f…';

-- não pagou: suspender (ninguém dessa frota entra; nada se apaga)
update frotas set plano = 'suspensa' where id = 'f…';
```

Faltando 7 dias para o fim da experiência, o proprietário vê um aviso
no mapa com o WhatsApp +238 955 78 82.

## Publicar uma mudança

1. Mexe-se nos painéis em `fleetcv/paineis/` e corre-se
   `python3 juntar.py` lá dentro. Ele escreve o `fleetcv.html` (para os
   testes) e as peças do site em `fleetcv/site/` (`app.html`,
   `estilo.css`, `mapa.js`, `condutor.js`, `dono.js`, `porteiro.js`).
2. Commit e push para `claude/eager-turing-11lp6h`.
3. Publica-se pelo Vercel a partir do GitHub, sem ficheiros pelo meio:
   um `create_deployment` com `gitSource` =
   `{type: github, org: YAxbairro, repo: claude, ref: claude/eager-turing-11lp6h}`,
   `rootDirectory: fleetcv/site`, `target: production` — nos dois
   projectos, `fleetcv` e `fleetcv-up1b`. Fica pronto em segundos.
4. Prova-se no site verdadeiro: `node prova_ao_vivo.mjs` em
   `fleetcv/paineis/` cria uma conta de teste, faz o caminho todo e
   apaga-a no fim.

**Mudar a base de dados:** mexe-se em `fleetcv/supabase/esquema.sql`,
prova-se com `./provar.sh` (tem de dar tudo certo), e cola-se o esquema
inteiro no SQL Editor — pode correr por cima do que lá está.

---

## Quando alguma coisa não corre bem

**Diz «sem GPS» no telemóvel do condutor**
Se ele recusou a permissão à primeira, tem de a repor nas definições do
telemóvel: Android → Definições → Aplicações → Chrome → Permissões →
Localização.

**«E-mail ou código errados», e tem a certeza que não estão**
O código do condutor é o que está na ficha dele, não o do patrão.
Entre como proprietário, abra a ficha e confirme.

**«Este e-mail já está a ser usado noutra frota»**
Entra-se só com e-mail e código, sem dizer de que frota se é — por isso
um e-mail só pode estar numa frota. Use outro e-mail para esse condutor.

**«Demasiadas tentativas»**
Cinco enganos seguidos no mesmo e-mail e a porta fecha-se durante um
quarto de hora. É de propósito. Espere e tente outra vez.

**O projecto do Supabase adormeceu**
No plano gratuito, o Supabase pausa o projecto ao fim de uma semana sem
uso. Acorda-se no painel do Supabase (Restore). Com clientes a usar
todos os dias não acontece.

---

## O que cada peça faz

| | |
|---|---|
| **Supabase** | guarda tudo e faz cumprir as regras: cada frota fechada sobre si, o condutor só escreve o turno dele, um turno fechado não se volta a mexer — ver [`../supabase/README.md`](../supabase/README.md) |
| **Vercel** | serve a página num endereço próprio, com `https://`, que é o que destranca o GPS |
| **fleetcv-config.js** | diz à página onde fica a base de dados (a chave é a pública, a que pode estar à vista) |

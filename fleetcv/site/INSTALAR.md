# Pôr o FleetCV no ar — Supabase + Vercel

Meia hora, do princípio ao fim. Não precisa de instalar nada no
computador e não precisa de escrever uma linha de programação. Precisa
de duas contas gratuitas e de copiar dois valores de um lado para o
outro.

No fim fica com **um endereço** — algo como
`fleetcv-praia.vercel.app` — que manda ao condutor pelo WhatsApp. Ele
abre, escreve o e-mail e o código que o senhor lhe deu, e está a
trabalhar. Não cria conta nenhuma, não instala nada.

**E o GPS passa a funcionar.** É esta a razão principal de fazermos
isto. Dentro do Claude a página vive numa moldura e o telemóvel recusa
dar a localização a páginas em moldura — daí o «sem GPS». Num endereço
próprio não há moldura, e o telemóvel pergunta ao condutor se autoriza,
como faz ao Google Maps.

---

## Antes de começar, escolha duas coisas

Escreva-as num papel, vai precisar delas já a seguir:

- **O seu e-mail** — é com ele que o senhor entra como proprietário.
- **O seu código** — 4 a 6 algarismos. É a sua palavra-passe. Não use
  1234 nem o ano de nascimento.

---

## Parte 1 · A base de dados (Supabase) — **JÁ ESTÁ FEITA**

Não precisa de fazer nada aqui, tirando **um botão** (ponto 3).

| | |
|---|---|
| Projecto | `fleetcv`, região **eu-west-1** (Irlanda, a mais perto de Cabo Verde) |
| Endereço | `https://jhjtjjyplihabowxkfhs.supabase.co` |
| Esquema | aplicado — tabelas, funções e as 4 regras em `docs` |
| Tempo real | ligado na tabela `docs` |
| A sua conta | `yanickdrs@gmail.com` · código **761662** |

**O código 761662 foi gerado ao acaso.** Troque-o quando quiser — é uma
linha no SQL Editor:

```sql
update docs
   set corpo = jsonb_set(corpo, '{codigo}', '"o-seu-codigo-novo"')
 where coleccao='frota' and id='dono';
```

### 3 · O botão que falta ligar

No Supabase: **Authentication** → **Sign In / Providers** → procure
**Anonymous Sign-Ins** → ligue → **Save**.

É isto que deixa o condutor abrir a aplicação sem criar conta nenhuma,
que é a ideia toda. Enquanto estiver desligado, ninguém entra — nem o
senhor.

## Parte 2 · A página (Vercel)

As chaves já estão postas no `fleetcv/site/fleetcv-config.js` e enviadas
para o GitHub. Falta só criar o projecto.

1. Em **vercel.com** → **Add New** → **Project**.

2. Escolha o repositório **`YAxbairro/claude`**.

3. **Root Directory** → *Edit* → **`fleetcv/site`**.
   É o passo que toda a gente se esquece. Sem ele o Vercel publica a
   pasta errada.

4. *Framework Preset*: **Other**. Não mexa em mais nada.

5. **Deploy.**

6. **Atenção ao ramo.** O ramo principal deste repositório é outro
   (`claude/ai-real-estate-videos-Djiji`), e o FleetCV vive em
   **`claude/eager-turing-11lp6h`**. Depois de publicar, vá a
   **Settings** → **Git** → **Production Branch**, ponha
   `claude/eager-turing-11lp6h`, guarde, e em **Deployments** carregue
   em **Redeploy**.

   Sem isto o Vercel publica o ramo errado e a página não aparece.

Daqui para a frente, sempre que alguma coisa mudar nesse ramo o Vercel
volta a publicar sozinho.

## Parte 3 · Experimentar

1. Abra o endereço no **seu** telemóvel. Escolha **Sou proprietário** e
   entre com o e-mail e o código do papel.

2. Crie uma viatura e crie um condutor — ao condutor dá-lhe um e-mail e
   um código só dele.

3. Mande o endereço ao condutor. Ele abre, escolhe **Sou condutor**,
   escreve o e-mail e o código dele.

4. Quando ele abrir o turno, o telemóvel pergunta **«Permitir
   localização?»** — tem de dizer **Permitir sempre**. Se disser só
   «enquanto a app estiver aberta», o percurso pára quando ele apaga o
   ecrã.

5. Fique no mapa do seu painel. O carro dele mexe-se no seu ecrã sem o
   senhor tocar em nada. Toque no carro e vê o turno todo: há quanto
   tempo anda, quantos quilómetros, se já abasteceu e quanto.

---

## Quando alguma coisa não corre bem

**Diz «sem GPS» no telemóvel do condutor**
O endereço tem de começar por `https://`. Se for o do Vercel, já é. Se
ele recusou a permissão à primeira, tem de a repor nas definições do
telemóvel: Android → Definições → Aplicações → Chrome → Permissões →
Localização.

**O condutor entra mas não vê viaturas**
Ainda não criou nenhuma, ou criou-as antes de ligar o Supabase. Entre
como proprietário e confirme que as viaturas lá estão.

**«E-mail ou código errados» e o senhor tem a certeza que não estão**
O código é o que está gravado na ficha do condutor, não o seu. Entre
como proprietário, abra a ficha dele e confirme.

**«Demasiadas tentativas»**
Cinco enganos seguidos no mesmo e-mail e a porta fecha-se durante um
quarto de hora. É de propósito: um código de quatro algarismos
adivinha-se depressa se ninguém travar quem tenta. Espere e tente
outra vez.

**Mudou alguma coisa no código e quer publicar de novo**
Corra `python3 juntar.py` dentro de `fleetcv/paineis/` — ele volta a
escrever o `site/index.html` — e faça commit. O Vercel publica
sozinho a cada push.

---

## O que cada peça faz

| | |
|---|---|
| **Supabase** | guarda tudo e faz cumprir as regras — o condutor só escreve o turno dele, e um turno fechado não se volta a mexer |
| **Vercel** | serve a página num endereço próprio, com `https://`, que é o que destranca o GPS |
| **as regras** | vivem dentro do Supabase, não no telemóvel — ver [`../supabase/README.md`](../supabase/README.md) |
| **fleetcv-config.js** | diz à página onde fica a sua base de dados |

A página é uma só e serve os dois: à entrada pergunta se é o
proprietário ou o condutor.

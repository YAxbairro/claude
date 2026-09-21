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

## Parte 1 · A base de dados (Supabase)

É onde ficam guardados os turnos, os quilómetros e os abastecimentos.
Gratuito, e o que o senhor vai usar cabe folgadamente no plano livre.

1. Vá a **supabase.com** e carregue em *Start your project*. Entre com
   a conta Google, é mais rápido.

2. **New project.** Dê-lhe um nome (`fleetcv`), invente uma palavra-passe
   para a base de dados — guarde-a, mas não vai precisar dela no dia a
   dia — e em *Region* escolha **West EU (Ireland)** ou **eu-west-1**.
   É a mais perto de Cabo Verde das que há; a diferença sente-se.

3. Espere um ou dois minutos enquanto ele monta o projecto.

4. No menu da esquerda, **SQL Editor** → *New query*.

5. Abra o ficheiro `supabase/esquema.sql` deste repositório, copie-o
   **todo**, cole na caixa e carregue em **Run**.

   Deve aparecer *Success. No rows returned*. É isso mesmo — este passo
   não devolve nada, só monta as tabelas e as regras. As linhas a
   amarelo que dizem *does not exist, skipping* são normais: é o
   ficheiro a arrumar o que ainda não existia.

   Se voltar a correr este mesmo ficheiro um dia, não estraga nada —
   está feito para isso, e é assim que se actualizam as regras.

6. Ainda no SQL Editor, apague o que lá está e corra esta única linha,
   **com o seu e-mail e o seu código**:

   ```sql
   select semear('o-seu-email@exemplo.com', '4729');
   ```

   Responde `Pronto. Entre com ...`. Se disser *Já estava semeada*, é
   porque já tinha corrido — não faz mal nenhum, nada se estragou.

7. **Project Settings** (a roda dentada) → **API**. Deixe esta página
   aberta, é daqui que saem os dois valores da parte seguinte:

   - **Project URL** — parecido com `https://abcdefgh.supabase.co`
   - **anon public** — uma chave comprida que começa por `eyJ...`

> **Sobre as chaves:** a chave `anon` é para andar à vista — é com ela
> que o telemóvel do condutor fala com a base. Quem manda são as regras
> que ficaram gravadas dentro da base no passo 5. A outra chave, a
> `service_role`, **nunca** a ponha em lado nenhum que vá para a
> internet: essa abre tudo.

---

## Parte 2 · A página (Vercel)

1. Ponha as suas duas chaves no ficheiro `fleetcv/site/fleetcv-config.js`.

   **Pelo GitHub, sem instalar nada:** abra o ficheiro no site do
   GitHub, carregue no lápis (*Edit this file*), troque os dois valores,
   e em baixo carregue em *Commit changes*.

   ```js
   window.FLEETCV_CONFIG = {
     supabaseUrl:   'https://abcdefgh.supabase.co',
     supabaseChave: 'eyJ...'
   };
   ```

   É a única coisa que se edita à mão em todo o FleetCV. Daqui para a
   frente, sempre que mudar este ficheiro o Vercel volta a publicar
   sozinho.

2. Vá a **vercel.com**, entre com a conta do GitHub e carregue em
   **Add New → Project**.

3. Escolha este repositório. Em **Root Directory** carregue em *Edit* e
   aponte para **`fleetcv/site`**. É o passo que as pessoas se esquecem
   — sem ele o Vercel publica a pasta errada.

4. *Framework Preset*: **Other**. Não mexa em mais nada.

5. **Deploy.** Um minuto depois tem o endereço.

---

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

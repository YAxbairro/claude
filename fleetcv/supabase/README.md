# A base de dados, no Supabase

Uma tabela só — `docs` — com uma colecção, um nome e o conteúdo. O que
muda no telemóvel do condutor é exactamente o que fica gravado aqui.

Para pôr isto no ar: **[../site/INSTALAR.md](../site/INSTALAR.md)**.

| Ficheiro | O que é |
|---|---|
| `esquema.sql` | **o que se cola no SQL Editor do Supabase.** Tabelas, funções e regras. Pode voltar a correr sem estragar nada |
| `provas.sql` | as regras postas à prova, uma a uma |
| `provar.sh` | levanta um Postgres de uma vez só e corre as provas |
| `_auth_falso.sql` | o mínimo do Supabase (o `auth`) para as provas correrem cá fora. Não vai para o Supabase |

## As regras são o produto

Tudo o resto — os ecrãs, o mapa, as contas — é conforto. Isto é o que
impede um condutor de escrever no telemóvel dele que andou 40 km quando
andou 200:

| | |
|---|---|
| a frota é do proprietário | e mais ninguém lhe toca |
| cada condutor escreve o turno dele | o turno de outro é recusado pela base, não pelo telemóvel |
| **um turno fechado não se volta a escrever** | senão corrigiam-se os quilómetros depois de o patrão ter visto o alerta |
| o percurso e as fotos seguem o turno | quem não é dono do turno não lhes toca |
| quem não entrou não lê nada | |
| cinco enganos no código e a porta fecha-se | quinze minutos. Um código de quatro algarismos adivinha-se em dez mil tentativas |

Antes disto, estas regras viviam dentro do telemóvel — o que é o mesmo
que dizer que não existiam: quem soubesse mexer escrevia o que
quisesse. É esta mudança que faz o FleetCV passar de uma aplicação de
apontamentos a uma coisa em que se pode confiar.

## Provar

    cd fleetcv/supabase && ./provar.sh

Levanta um Postgres de uma vez só, carrega o `esquema.sql` **duas**
vezes (tem de aguentar), corre as 19 provas e arruma tudo. Dá erro se
alguma regra deixar passar o que não devia.

**Porquê um Postgres a sério e não um imitador.** Há um imitador em
`../paineis/_supa_falso.js`, e serve — prova que a aplicação fala
direito com a base. Mas um imitador só prova que eu percebi as regras;
não prova que elas funcionam. Foi este `provar.sh` que apanhou o erro
que fazia com que **nenhuma escrita passasse**: as regras do percurso e
das fotos precisavam de ir ver a tabela `docs` a partir de uma regra que
estava em cima da própria tabela `docs`, e o Postgres recusa-se —
*infinite recursion detected in policy*. Nem o proprietário conseguia
guardar uma viatura. O imitador nunca daria por isso, porque em
JavaScript aquilo é uma chamada como outra qualquer.

# A base de dados, no Supabase

Uma tabela só — `docs` — com a frota, uma colecção, um nome e o
conteúdo. O que muda no telemóvel do condutor é exactamente o que fica
gravado aqui.

Para pôr isto no ar: **[../site/INSTALAR.md](../site/INSTALAR.md)**.

| Ficheiro | O que é |
|---|---|
| `esquema.sql` | **o que se cola no SQL Editor do Supabase.** Tabelas, funções e regras. Pode voltar a correr sem estragar nada — e é assim que se actualiza uma base antiga |
| `provas.sql` | as regras postas à prova, uma a uma |
| `provas_passagem.sql` | uma base da versão de uma frota só, com dados, a receber a versão nova por cima |
| `_esquema_antigo.sql` | essa versão antiga, só para a prova da passagem. Não é para colar |
| `provar.sh` | levanta um Postgres de uma vez só e corre as provas todas |
| `_auth_falso.sql` | o mínimo do Supabase (o `auth`) para as provas correrem cá fora. Não vai para o Supabase |

## Várias frotas

Cada proprietário que cria conta fica com a sua frota, e as regras
fecham cada uma sobre si. Não é a aplicação a filtrar — é a base a
recusar, linha a linha:

| | |
|---|---|
| um patrão só vê a sua frota | os carros, os condutores, os turnos e as fotografias de outro nem chegam ao telemóvel dele |
| ninguém escreve fora da sua | nem dizendo à mão de que frota é; a base põe a de quem escreve |
| um e-mail, uma frota | entra-se só com e-mail e código, por isso um e-mail não pode estar em duas — a base recusa |
| o condutor não lê segredos | nem a conta do patrão, nem a lista com os códigos dos colegas. Lê a `equipa`, que a base refaz sozinha só com os nomes |
| o código do patrão guarda-se baralhado | com a mesma receita das palavras-passe (bcrypt) |
| ir-se embora | o patrão apaga a conta com o código dele, e vai tudo. A frota fundadora não se apaga pela aplicação |

As portas, todas funções da base: `entrar`, `criar_frota`,
`mudar_acesso`, `apagar_frota`, `email_livre`, `sair`.

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

## Provar

    cd fleetcv/supabase && ./provar.sh

Levanta um Postgres de uma vez só, carrega o `esquema.sql` **duas**
vezes (tem de aguentar), corre as 61 provas das regras e as 9 da
passagem de uma base antiga, e arruma tudo. Dá erro se alguma regra
deixar passar o que não devia.

As provas foram, elas próprias, postas à prova: estragando as regras de
propósito (tirar a frota da regra de ler, tirar a frota da regra de
escrever, desligar a conferência dos e-mails), cada estrago faz falhar
pelo menos uma prova. Foi assim que se deu pela que faltava — uma linha
NOVA na frota de outro, que só a regra de escrever trava.

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

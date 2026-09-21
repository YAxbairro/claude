# O servidor

O terceiro motor, e o único que serve para o trabalho a sério.

Os outros dois — a base de dados do Claude e o próprio navegador —
obrigam quem abre a aplicação a ter conta nalgum sítio, ou só ligam
separadores do mesmo aparelho. Com este, o condutor abre um endereço no
telemóvel dele, escreve o e-mail e o código que o patrão lhe deu, e
trabalha. Mais nada.

    servidor.mjs    o servidor inteiro, num ficheiro
    fleetcv.html    a aplicação, servida por ele
    arrancar.sh     pôr a trabalhar
    Dockerfile      para quem prefere assim
    dados.db        onde tudo fica guardado (criado sozinho)

Não usa biblioteca nenhuma. Só o que já vem dentro do Node.

**Para o piloto a sério, veja [INSTALAR.md](INSTALAR.md)** — passo a
passo, escrito para quem não é do ramo, com o Render.

## Pôr a trabalhar

Precisa do Node 22 ou mais recente (https://nodejs.org).

    ./arrancar.sh

Abre em http://localhost:8080. Na primeira vez cria a base de dados,
uma frota de estreia e a conta do proprietário, e escreve no ecrã o
e-mail e o código dela.

Para pôr a sua conta em vez da de exemplo, **antes da primeira vez**:

    FLEETCV_DONO_EMAIL=eu@aminhaempresa.cv \
    FLEETCV_DONO_CODIGO=4721 ./arrancar.sh

Com Docker, a partir da raiz do repositório:

    docker build -f fleetcv/servidor/Dockerfile -t fleetcv .
    docker run -p 8080:8080 -v fleetcv-dados:/dados fleetcv

| O que se pode mudar | Por omissão |
|---|---|
| `PORT` | 8080 |
| `FLEETCV_DADOS` | `dados.db` ao lado do servidor |
| `FLEETCV_APP` | `fleetcv.html` ao lado do servidor |
| `FLEETCV_DONO_EMAIL` | `patrao@exemplo.cv` |
| `FLEETCV_DONO_CODIGO` | `9999` |

## Porque é que isto não pode viver dentro do Claude

Há uma parede, e não se contorna:

| | GPS | Dados partilhados |
|---|---|---|
| A aplicação dentro da janela do Claude | ✗ | ✓ |
| O Claude a servir a página sozinha | ✓ | ✗ |

Dentro da janela, o telemóvel não deixa a página pedir a localização —
é regra do telemóvel, não definição que se mude. Servida sozinha, o
Claude não lhe dá a base de dados partilhada (está escrito no contrato
dela: `use()` devolve nulo).

Nunca as duas ao mesmo tempo. Por isso a versão do Claude serve para
mostrar e experimentar, e o piloto a sério corre aqui.

## O que só um servidor consegue fazer

**Mandar a novidade a quem está a ver.** O telemóvel do patrão fica com
uma linha aberta para o servidor e recebe cada mudança no momento em que
ela acontece. Não anda a perguntar de dois em dois segundos se mudou
alguma coisa — o que gastaria a bateria e os dados de toda a gente.

**Impedir o que não deve acontecer.** Num telemóvel, "o condutor só
escreve o turno dele" era boa vontade: quem soubesse mexer escrevia o
que quisesse. Aqui é verificado, e recusado:

| Quem | Pode | Não pode |
|---|---|---|
| condutor | escrever o turno dele, a posição dele, o percurso dele | mexer na frota, escrever o turno de outro, reabrir um turno já fechado, apagar turnos |
| proprietário | tudo | — |

## O que ainda não está bem, e convém saber

**O código é um número de quatro dígitos.** É o que se pode pedir a um
condutor que escreve isto ao volante, e o patrão precisa de o poder ver
para lho dizer ao telefone — por isso fica gravado tal como é. Há um
travão: seis enganos seguidos no mesmo e-mail e aquele e-mail fica
quinze minutos à espera. Mas um código de quatro dígitos é um código de
quatro dígitos.

**Tem de ficar atrás de https.** Sem isso, o código e a sessão viajam à
vista de quem estiver na mesma rede. Qualquer sítio que aloje isto
(Render, Railway, Fly, um servidor com Caddy à frente) trata disso
sozinho. O servidor já marca a sessão como segura quando percebe que
está atrás de https.

**A base de dados é um ficheiro.** `dados.db` é tudo o que há: os
turnos, os percursos, a frota. Se esse ficheiro se perder, perde-se
tudo. Copiá-lo para outro lado, todos os dias, é o mínimo — e é uma
cópia simples, do ficheiro inteiro.

**Não há recuperação de código esquecido.** O patrão vê os códigos dos
condutores no painel dele e dá-lhes outro. O código do proprietário só
se muda mexendo na base de dados.

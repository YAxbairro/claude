# Instalar o FleetCV num endereço seu

Isto é para quem não é do ramo. São dez minutos.

## Porque é preciso

No Claude, a aplicação é mostrada dentro de uma janela dele, e o
telemóvel **não deixa pedir a localização a uma página assim**. Não é
uma definição que se mude: é uma regra do telemóvel. Enquanto a
aplicação viver lá dentro, o caminho do carro nunca fica gravado.

E há a outra metade: para os condutores entrarem com o email e o
código que o senhor lhes dá — sem conta em lado nenhum — é preciso um
servidor a conferir esses códigos.

Instalando num endereço seu, as duas coisas passam a funcionar.

## O que vai ter no fim

    fleetcv.oseuendereco.cv        ← o condutor e o senhor abrem isto
      · o GPS funciona
      · os condutores entram com email e código
      · os dados ficam todos num ficheiro seu

## Passo a passo, no Render

O Render é um sítio que aloja aplicações. Escolhi este porque tudo se
faz por botões.

**1.** Vá a https://render.com e crie conta (dá para entrar com o
GitHub, que é onde está o código).

**2.** Carregue em **New** → **Blueprint**.

**3.** Escolha o repositório onde está este código. O Render encontra
sozinho o ficheiro `render.yaml` e já sabe o que fazer.

**4.** Ele vai pedir dois valores. **Escreva os seus:**

| | |
|---|---|
| `FLEETCV_DONO_EMAIL` | o seu email |
| `FLEETCV_DONO_CODIGO` | um código só seu, 4 a 6 algarismos — **não deixe 9999** |

> Estes dois só contam na primeira vez. Depois de a aplicação arrancar,
> a conta fica gravada e mudar aqui já não muda nada.

**5.** Carregue em **Apply**. Espera-se dois ou três minutos.

**6.** O Render dá-lhe um endereço parecido com
`fleetcv-xxxx.onrender.com`. **É esse o link que dá aos condutores.**
Já vem com https, que é obrigatório para o GPS funcionar.

Se quiser um endereço seu (`fleetcv.aminhaempresa.cv`), é em
**Settings → Custom Domain**, e o Render diz o que pôr no registador.

## Quanto custa

O plano `starter` do Render são cerca de 7 dólares por mês, mais cerca
de 25 cêntimos pelo disco de 1 GB. Para uma frota de táxis é menos do
que um depósito.

**O plano gratuito não serve**: não guarda disco, e cada vez que o
servidor reiniciasse perdia os turnos todos. Não vale a pena poupar aí.

## Depois de instalado

**Mude o preço do litro** em *Mais → Preço do litro*. É o número que
manda em todas as contas e muda todos os meses.

**Crie os condutores** em *Condutores → Novo*. A cada um dá o email e o
código que escolher. É com isso que ele entra — não precisa de conta em
lado nenhum, nem de instalar nada: abre o link no telemóvel.

**Guarde uma cópia** de vez em quando, em *Mais → Descarregar cópia*.
Os dados vivem todos num ficheiro dentro do disco do Render; se esse
disco se perder, perde-se tudo. Uma cópia por semana chega.

## Noutro sítio qualquer

O servidor é um ficheiro só e não usa biblioteca nenhuma. Em qualquer
máquina com Node 22:

    cd fleetcv/servidor
    ./arrancar.sh

Com Docker:

    docker build -t fleetcv .
    docker run -p 8080:8080 -v fleetcv-dados:/dados fleetcv

**Tem de ficar atrás de https.** Sem isso o telemóvel não dá a
localização, e o código do condutor viaja à vista de quem estiver na
mesma rede. O Render trata disso sozinho; num servidor seu, ponha o
Caddy à frente e ele trata.

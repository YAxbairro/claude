# Os painéis

Abrem no telemóvel ou no computador, sem instalar nada e sem servidor.

**`fleetcv.html` é o que se dá às pessoas.** Pergunta à entrada se quem
abriu é condutor ou proprietário, guarda a resposta e leva-o direito ao
painel certo. O botão `⇄` no cabeçalho volta a perguntar.

| Ficheiro | Para quem | O que faz |
|---|---|---|
| **`fleetcv.html`** | **toda a gente** | **os dois painéis num link só, com o ecrã de escolha** |
| `painel_condutor.html` | o condutor | entra, escolhe o carro, marca os km, liga o GPS, vê o mapa a andar, abastece, fecha o turno |
| `painel_dono.html` | o proprietário | frota ao vivo, viaturas, condutores, alertas, turnos com o percurso, contas |

Os dois painéis separados continuam a funcionar sozinhos e é neles que
se trabalha. O `fleetcv.html` é construído a partir deles:

    cd fleetcv/paineis && python3 juntar.py

O `juntar.py` resolve as três coisas que impediam dois programas de
viver no mesmo ficheiro: as folhas de estilo passam a valer só dentro de
`body.condutor` ou `body.dono` (os dois usam os mesmos nomes de classe
com medidas diferentes), cada painel passa de "corre já" a "uma função
que se chama" — por isso só um é que apanha os cliques — e o mapa da
Praia vai uma vez só. Se algo que devia ser igual nos dois deixar de o
ser, o script recusa-se a juntar e diz o quê.

Entradas de exemplo: condutor `antonio@exemplo.cv` / `1234`;
proprietário `patrao@exemplo.cv` / `9999`.

## Como é que os dois painéis falam um com o outro

Antes, cada painel guardava as coisas no seu próprio telemóvel e nunca
se viam. Agora há um sítio comum — `mapa/nuvem.js` — e tudo o que
acontece de um lado aparece do outro em segundos, sem ninguém carregar
em "actualizar":

    o condutor abre turno   ──►  aparece no mapa do patrão
    o carro anda            ──►  o patrão vê a seta a mexer e os km a subir
    o condutor abastece     ──►  aparece na hora, com o posto e o valor
    o condutor fecha        ──►  entra no histórico, já com as contas feitas
    o patrão mexe na frota  ──►  o telemóvel do condutor recebe a mudança

A nuvem tem **três motores, com a mesma porta**, e o resto do código não
sabe qual está a ser usado. Escolhe-se o primeiro que estiver
disponível:

| Motor | Liga o quê | Quando é usado |
|---|---|---|
| **servidor** | telemóveis quaisquer, sem conta em lado nenhum | quando a página vem de um servidor FleetCV (ver `../servidor/`) — **é este o que serve para trabalhar** |
| base partilhada | telemóveis com sessão iniciada na mesma organização | quando não há servidor e a página está publicada no Claude |
| navegador | separadores e janelas do mesmo aparelho | quando não há nem uma coisa nem outra — e é o que torna isto testável sem publicar nada |

Três cuidados mandam no desenho todo:

1. **Escrever custa.** Um turno de oito horas dá milhares de pontos de
   GPS. A posição sobe de 4 em 4 segundos e só se o carro mexeu; o
   rasto inteiro é gravado de 45 em 45 segundos, aos pedaços. Se a
   nuvem se queixar do ritmo, a aplicação abranda em vez de insistir.
2. **Cada papel escreve o seu.** O condutor escreve o turno dele e onde
   está; o patrão escreve os carros, os condutores e as respostas aos
   alertas. Dois telemóveis nunca escrevem a mesma linha.
3. **As provas viajam feitas.** Quando o condutor fecha o turno, é o
   telemóvel dele que calcula a que distância chegou do posto e quanto
   tempo lá esteve parado. O patrão recebe dois números em vez de
   milhares de pontos de GPS.

Sem nuvem e sem rede continua tudo a trabalhar com o que está guardado
no próprio telemóvel, e sobe quando voltar — o condutor não pode ficar
parado à porta de um cliente à espera de rede.

**Quando se quer isto a trabalhar a sério**, é o servidor: `../servidor/`.
É o único dos três em que o condutor entra com o e-mail e o código que o
patrão lhe deu, sem precisar de conta em mais lado nenhum — e o único
onde as regras de quem pode escrever o quê são mesmo verificadas, em
vez de dependerem da boa vontade do telemóvel.

## O mapa

Não há mapa de internet nenhum: os telemóveis dos condutores gastam
dados e muitas vezes não têm rede. Por isso o mapa da Praia vai dentro
do próprio ficheiro.

    mapa/nuvem.js          o sítio comum: quem escreve o quê, com que
                           ritmo, e o que fazer quando não há rede
    mapa/mapa_praia.js     a Praia a sério, tirada do OpenStreetMap:
                           31 linhas de costa, 455 ruas, 11 postos de
                           combustível e 40 bairros, todos com o nome
    mapa/mapa_render.js    o desenho — enquadramento, percurso, carro,
                           postos, escala — e o andarilho que faz o
                           carro dos ensaios andar por ruas verdadeiras
    mapa/montar.py         mete os dois dentro dos painéis
    mapa/baixar_locais.py  vai buscar os nomes dos bairros ao OSM

Depois de mexer em qualquer um dos dois ficheiros do mapa:

    cd fleetcv/paineis && python3 mapa/montar.py painel_condutor.html painel_dono.html

Os painéis ficam com uma cópia do mapa lá dentro entre as marcas
`/*<<<MAPA*/` e `/*MAPA>>>*/`. Nunca se edita essa cópia à mão.

## Testar

    cd fleetcv/paineis
    node teste_condutor.mjs     # 31 verificações
    node teste_dono.mjs         # 44 verificações
    node teste_junto.mjs        # 16 verificações ao ficheiro junto
    node teste_tempo_real.mjs   # 15 verificações com os dois painéis
                                #  abertos ao mesmo tempo
    node teste_servidor.mjs     # 15 verificações contra o servidor a
                                #  correr, com dois navegadores separados
                                #  (arrancar o servidor primeiro)

Precisa do Playwright (`npm i playwright`) e do Chromium.
`_moldura.html` só serve a um dos testes: imita a janela em que o
Claude mostra a aplicação, para se confirmar que o aviso do GPS
aparece.

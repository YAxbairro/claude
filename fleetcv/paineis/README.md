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

## O mapa

Não há mapa de internet nenhum: os telemóveis dos condutores gastam
dados e muitas vezes não têm rede. Por isso o mapa da Praia vai dentro
do próprio ficheiro.

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

Precisa do Playwright (`npm i playwright`) e do Chromium.
`_moldura.html` só serve a um dos testes: imita a janela em que o
Claude mostra a aplicação, para se confirmar que o aviso do GPS
aparece.

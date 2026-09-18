# Os dois painéis

Dois ficheiros, dois links. Abrem no telemóvel ou no computador, sem
instalar nada e sem servidor.

| Ficheiro | Para quem | O que faz |
|---|---|---|
| `painel_condutor.html` | o condutor | entra, escolhe o carro, marca os km, liga o GPS, vê o mapa a andar, abastece, fecha o turno |
| `painel_dono.html` | o proprietário | frota ao vivo, viaturas, condutores, alertas, turnos com o percurso, contas |

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

Precisa do Playwright (`npm i playwright`) e do Chromium.
`_moldura.html` só serve a um dos testes: imita a janela em que o
Claude mostra a aplicação, para se confirmar que o aviso do GPS
aparece.

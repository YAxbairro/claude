# O mapa de Cabo Verde

`cabo-verde-AAAA-MM.pmtiles` — todas as ilhas, com as ruas, os nomes e os
sítios, num ficheiro só (~17 MB). Vem do OpenStreetMap, recortado do mapa do
mundo que o [Protomaps](https://protomaps.com) publica todos os dias. A
aplicação lê-o aos pedaços (o Vercel serve pedaços: resposta 206) e guarda o
que leu; desenha-o a biblioteca `protomaps-leaflet`, com tema escuro e claro.

Não depende de nenhum servidor de mapas de fora e é para uso comercial: o
OpenStreetMap só pede a atribuição (`© OpenStreetMap`), que está no canto do
mapa. Sem este ficheiro, a aplicação usa os quadradinhos do OpenStreetMap.

## Actualizar (umas vezes por ano)

Com a ferramenta `pmtiles` (https://github.com/protomaps/go-pmtiles/releases):

```sh
pmtiles extract https://build.protomaps.com/AAAAMMDD.pmtiles cabo-verde-AAAA-MM.pmtiles \
  --bbox=-25.45,14.75,-22.6,17.25
```

(o retângulo vai de Santo Antão à Boa Vista e da Brava ao Sal). Depois:
pôr o ficheiro novo aqui, apagar o antigo, e mudar o nome em
`site/fleetcv-config.js` (`mapa:`). O nome muda a cada versão porque os
telemóveis guardam o ficheiro um ano (ver `vercel.json`).

/* Levy Travel — conteúdo do programa "Santiago Tours".
   Para alterar preços, horários ou textos, edite apenas este ficheiro. */

/* Contactos da empresa. Preencha para ativar o envio direto do pedido de reserva.
   whatsapp: número com indicativo, só dígitos (ex.: "2389XXXXXX"). */
window.LEVY_CONTACT = { email: "", whatsapp: "" };

const BRING = ["Água", "Óculos de sol", "Protetor solar", "Sapatos confortáveis"];

window.LEVY_TOURS = [
  {
    id: "tarrafal", cat: "cultura", tag: "Costa e cultura",
    title: "Visita ao Tarrafal", short: "Tarrafal",
    hours: "9h00 – 17h00", length: "Dia inteiro", meet: "8h50", price: 80, min: 2,
    img: "tarrafal-baia", gallery: ["tarrafal-praia", "tarrafal-botes"],
    lead: "A vila de pescadores com uma das praias mais bonitas da ilha.",
    text: [
      "Partida do seu hotel para uma excursão de dia inteiro à vila do Tarrafal, uma vila de pescadores com uma bela praia de areia dourada e coqueiros, considerada uma das mais bonitas da ilha.",
      "O Tarrafal foi também um centro de detenção português, onde eram mantidos presos civis e políticos. O campo fica 2 km a sul da vila e só foi fechado em 1974.",
      "Paramos na vila de Assomada para visitar o mercado municipal e almoçamos num restaurante com vista para a baía. Traga fato de banho se quiser nadar na praia do Tarrafal.",
      "O regresso faz-se pela estrada costeira, com paragens na comunidade dos \"rabelados\" e nas zonas agrícolas. Passamos pelas vilas de pescadores de Porto Formoso, Calheta de São Miguel e Pedra Badejo, com as suas praias de areia preta."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço (não inclui bebidas)"]
  },
  {
    id: "cidade-velha", cat: "cultura", tag: "História · UNESCO",
    title: "Visita à Cidade Velha", short: "Cidade Velha",
    hours: "9h00 – 16h00", length: "Dia inteiro", meet: "8h50", price: 70, min: 2,
    img: "cv-pelourinho", gallery: ["cv-vista", "cv-mar"],
    lead: "Património Mundial da UNESCO e a cidade mais antiga do país.",
    text: [
      "Excursão de dia inteiro à Cidade Velha, Património Mundial da UNESCO e a cidade mais antiga do país.",
      "No passado, a cidade foi um importante centro do tráfico transatlântico de escravos, porto de escala dos navios que transportavam pessoas escravizadas da costa africana para o resto do mundo. Hoje é um monumento histórico que preserva os vestígios deixados pelos primeiros colonizadores portugueses.",
      "A antiga Igreja de Nossa Senhora do Rosário, a Fortaleza de São Filipe e a Praça do Pelourinho são os melhores exemplos desse património.",
      "O vale que leva à cidade é rico em vegetação, com muitos coqueiros e imponentes árvores tropicais. Traga fato de banho se quiser nadar na pequena praia de areia preta."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço (não inclui bebidas)"]
  },
  {
    id: "city-tour-praia", cat: "cultura", tag: "Cidade",
    title: "City Tour da Praia", short: "City Tour da Praia",
    hours: "9h00 – 12h00 ou 15h00 – 18h00", length: "Meio dia", meet: "8h50 ou 14h50", price: 35, min: 2,
    img: "praia-rua", gallery: ["praia-canhoes", "praia-rua2"],
    lead: "Meio dia pela capital de Cabo Verde, do Plateau ao mercado de Sucupira.",
    text: [
      "City tour de meio dia por Praia, capital de Cabo Verde.",
      "O centro histórico foi construído sobre um planalto de basalto com vista para a baía e para o resto da cidade. A arquitetura das casas do planalto, os paralelepípedos e os jardins são legados do período colonial português.",
      "A cidade oferece ainda o mercado de Sucupira, tipicamente africano, e a Avenida Amílcar Cabral, a rua principal, repleta de lojas, jardins e esplanadas."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos"]
  },
  {
    id: "city-tour-cidade-velha", cat: "cultura", tag: "Cidade e história",
    title: "City Tour e Cidade Velha", short: "City Tour + Cidade Velha",
    hours: "9h00 – 15h00", length: "Dia inteiro", meet: "8h50", price: 90, min: 2,
    img: "praia-canhoes", gallery: ["cv-pelourinho", "cv-vista"],
    lead: "A capital de hoje e a primeira capital, no mesmo dia.",
    text: [
      "Começamos pelo centro histórico de Praia, construído sobre um planalto basáltico com vista para a baía. Visitamos o mercado de Sucupira, tipicamente africano, e a Avenida Amílcar Cabral, a rua principal, repleta de lojas, jardins e esplanadas.",
      "Em seguida partimos para a Cidade Velha, Património Mundial da UNESCO e a cidade mais antiga do país. No passado foi um importante centro do comércio transatlântico de escravos, porto de escala para os navios que transportavam pessoas escravizadas da costa africana para o resto do mundo.",
      "A antiga Igreja de Nossa Senhora do Rosário, a Fortaleza de São Filipe e a Praça do Pelourinho são os melhores exemplos deste património."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço opcional (não inclui bebidas)"]
  },
  {
    id: "vale-half-day", cat: "caminhada", tag: "Caminhada", level: 1, walk: "3 h",
    title: "Caminhada no Vale da Cidade Velha", short: "Vale da Cidade Velha · meio dia",
    hours: "9h00 – 12h00 ou 15h00 – 18h00", length: "Meio dia", meet: "8h50 ou 14h50", price: 60, min: 2,
    img: "vale-2", gallery: ["vale-1", "vale-grogue"],
    lead: "Dez quilómetros de vale verdejante, entre canaviais e destilarias de grogue.",
    text: [
      "O vale desta região tem cerca de 10 km de extensão e é exuberante e verdejante graças às nascentes e às chuvas. Vai encontrar plantações de cana-de-açúcar, coqueiros, mangueiras e bananeiras.",
      "Há muitas espécies de pássaros, como o tchota coco e o martim-pescador, e animais selvagens como macacos e galinhas-d'angola, embora seja mais provável avistar animais domésticos e de quinta.",
      "É também uma oportunidade para visitar as destilarias de grogue e saborear frutas tropicais, como mangas, conforme a estação."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço em piquenique (não inclui bebidas)"]
  },
  {
    id: "vale-full-day", cat: "caminhada", tag: "Caminhada e história", level: 1, walk: "3 h",
    title: "Vale da Cidade Velha e Cidade Velha", short: "Vale + Cidade Velha · dia inteiro",
    hours: "9h00 – 16h00", length: "Dia inteiro", meet: "8h50", price: 75, min: 2,
    img: "vale-palmeiras", gallery: ["vale-grogue", "cv-mar"],
    lead: "A caminhada no vale de manhã, almoço à beira-mar e a Cidade Velha à tarde.",
    text: [
      "O vale tem cerca de 10 km de extensão e é exuberante e verdejante graças às nascentes e às chuvas. Caminhamos entre plantações de cana-de-açúcar, coqueiros, mangueiras e bananeiras, com paragem nas destilarias de grogue e fruta tropical da estação.",
      "Há muitas espécies de pássaros, como o tchota coco e o martim-pescador, e animais selvagens como macacos e galinhas-d'angola.",
      "O almoço é à beira-mar. Depois visitamos a Cidade Velha, Património Mundial da UNESCO e a cidade mais antiga do país, que preserva os vestígios deixados pelos primeiros portugueses que desembarcaram nestas terras."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço (não inclui bebidas)"]
  },
  {
    id: "sao-domingos", cat: "caminhada", tag: "Caminhada", level: 2, walk: "3 h",
    title: "Caminhada em São Domingos", short: "São Domingos",
    hours: "9h00 – 12h00", length: "Meio dia", meet: "8h50", price: 65, min: 2,
    img: "pdf-saodomingos", gallery: ["interior"],
    lead: "Floresta de acácias, canaviais e duas destilarias de grogue a 18 km de Praia.",
    text: [
      "Uma pequena vila a 18 km de Praia, com uma bela caminhada por uma floresta de acácias no fundo de um vale cultivado. São 4 km em plena natureza, entre canaviais, bambuzais, bananeiras, barbacenses, baobás e outras árvores de fruto.",
      "Visitamos duas destilarias de grogue na vila de Djon Mendonsa, onde pode ver a prensagem da cana-de-açúcar feita pelo simpático proprietário.",
      "Durante a caminhada pode parar no Eco-Centro (entrada: 2 euros), um centro botânico com plantas endémicas e vista panorâmica sobre o vale e as montanhas.",
      "Conforme a sua condição física, pode continuar até Rui Vaz (3 km), uma bela vila a 800 metros de altitude com um panorama deslumbrante da ilha."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço (não inclui bebidas)"]
  },
  {
    id: "pico-antonia", cat: "caminhada", tag: "Trekking", level: 3, walk: "≈ 4 h",
    title: "Caminhada ao Pico da Antónia", short: "Pico da Antónia",
    hours: "8h00 – 14h00", length: "Dia inteiro", meet: "7h50", price: 90, min: 2,
    img: "pico-1", gallery: ["pico-2"],
    lead: "Um dia de trekking até ao ponto mais alto da ilha.",
    text: [
      "Um dia inteiro de trekking no Pico da Antónia, na região de São Domingos, conhecida pelo seu clima ameno. Terá a oportunidade de chegar ao topo do ponto mais alto da ilha.",
      "O percurso atravessa uma floresta de eucaliptos e paisagens montanhosas até ao Monte Txota, com vistas deslumbrantes."
    ],
    warn: "Recomendado apenas a pessoas sem problemas nos joelhos ou cirurgias nas pernas. O terreno pode ser escorregadio e rochoso, sobretudo na última parte da subida, e pode haver ventos fortes. É preciso estar em boa condição física.",
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço (não inclui bebidas)"]
  },
  {
    id: "serra-malagueta", cat: "caminhada", tag: "Parque natural", level: 3, walk: "≈ 4 h",
    title: "Vale de Serra Malagueta", short: "Serra Malagueta",
    hours: "Saída às 9h00", length: "Dia inteiro", meet: "8h50", price: 80, min: 2,
    img: "malagueta", gallery: ["pdf-malagueta"],
    lead: "Um parque natural exuberante, com vistas até à Ilha do Fogo.",
    text: [
      "Viagem de cerca de 60 minutos até à Serra Malagueta, um parque natural exuberante com vistas deslumbrantes sobre a Ilha do Fogo. A primeira caminhada leva-o até ao rio principal, por belas paisagens.",
      "Segue-se uma caminhada até à vila costeira de Espinho Branco, lar da comunidade dos \"Rabelados\". Chamam-se assim porque se rebelaram contra os missionários da Congregação do Espírito Santo, que baniram a sua cultura animista a partir de 1942.",
      "A rebelião foi pacífica, mas, ao rejeitarem a espiritualidade cristã, isolaram-se. Hoje, depois de 50 anos de isolamento, ainda preservam as suas tradições. O regresso a Praia faz-se de carro."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço em piquenique (não inclui bebidas)"]
  },
  {
    id: "picos-pedra-badejo", cat: "caminhada", tag: "Caminhada", level: 3, walk: "≈ 4 h",
    title: "Caminhada Picos – Pedra Badejo", short: "Picos – Pedra Badejo",
    hours: "9h00 – 14h00", length: "Dia inteiro", meet: "8h50", price: 80, min: 2,
    img: "pdf-picos", gallery: [],
    lead: "Do alto de Picos até ao mar, por vilas típicas e vales cultivados.",
    text: [
      "Saída de Praia de veículo para Picos, uma vila no topo de uma montanha que dá a sensação de estar no fim do mundo. A vista do vale é deslumbrante.",
      "O caminho leva à igreja, passando por belas casas coloridas, e daí começa a caminhada até à vila de Pedra Badejo. É um trilho muito tranquilo, que passa por várias vilas típicas, onde vai conhecer moradores simpáticos e acolhedores.",
      "Ao fim de algumas horas chega a um vale cultivado repleto de bananeiras, coqueiros, cana-de-açúcar, mangueiras e outras árvores de fruto, que leva a Pedra Badejo, vila de pescadores e agricultores."
    ],
    bring: BRING,
    included: ["Guia turístico em português", "Entrada nos pontos históricos", "Almoço (não inclui bebidas)"]
  },
  {
    id: "aguas-belas", cat: "mar", tag: "Mar e gruta",
    title: "Gruta das Águas Belas, Ribeira da Barca", short: "Gruta das Águas Belas",
    hours: "9h00 – 17h00", length: "Dia inteiro", meet: "8h50", price: 95, min: 2,
    img: "pdf-aguasbelas", gallery: ["barca-1"],
    lead: "De bote de pesca até uma gruta com clarabóia natural e uma praia deserta.",
    text: [
      "Saída de Praia para Ribeira da Barca, uma vila na costa. A aventura começa no pequeno porto, em botes de pesca tradicionais coloridos, guiados por pescadores locais que conhecem cada corrente e cada rocha.",
      "O trajeto de barco dura 20 a 30 minutos, entre falésias vulcânicas escuras que contrastam com o azul intenso do Atlântico. É comum avistar aves marinhas e, com sorte, golfinhos ou tartarugas.",
      "A Gruta das Águas Belas é uma cavidade aberta na rocha pela erosão marinha. Pela \"clarabóia\", uma abertura no topo, entra a luz do sol, que realça a transparência da água. Lá dentro há uma pequena faixa de areia escura onde, conforme a maré, é possível desembarcar.",
      "Inclui paragem na Praia de Angra, isolada e deserta, acessível apenas por mar. O local perfeito para um piquenique no silêncio da natureza."
    ],
    bring: ["Água", "Óculos de sol", "Protetor solar"],
    included: ["Guia turístico em português", "Piquenique na Praia de Angra (não inclui bebidas)"]
  }
];

window.LEVY_TRANSFERS = [
  { id: "tr-praia", label: "Aeroporto ⇄ Hotel em Praia", day: 10, night: 20 },
  { id: "tr-cidade-velha", label: "Aeroporto ⇄ Hotel em Cidade Velha", day: 20, night: 30 },
  { id: "tr-tarrafal", label: "Aeroporto ⇄ Hotel em Tarrafal", day: 40, night: 50 }
];



/* Lugares (latitude, longitude) usados no mapa 3D */
window.LEVY_PLACES = {
  praia: { name: "Praia", lat: 14.918, lon: -23.509 },
  aeroporto: { name: "Aeroporto", lat: 14.946, lon: -23.486 },
  "cidade-velha": { name: "Cidade Velha", lat: 14.915, lon: -23.605 },
  vale: { name: "Vale da Ribeira Grande", lat: 14.945, lon: -23.596 },
  "sao-domingos": { name: "São Domingos", lat: 15.024, lon: -23.563 },
  "rui-vaz": { name: "Rui Vaz", lat: 15.025, lon: -23.597 },
  pico: { name: "Pico da Antónia", lat: 15.045, lon: -23.637 },
  picos: { name: "Picos", lat: 15.08, lon: -23.628 },
  assomada: { name: "Assomada", lat: 15.1, lon: -23.684 },
  malagueta: { name: "Serra Malagueta", lat: 15.18, lon: -23.68 },
  "espinho-branco": { name: "Espinho Branco", lat: 15.215, lon: -23.62 },
  tarrafal: { name: "Tarrafal", lat: 15.279, lon: -23.752 },
  calheta: { name: "Calheta de São Miguel", lat: 15.188, lon: -23.592 },
  "pedra-badejo": { name: "Pedra Badejo", lat: 15.137, lon: -23.533 },
  "ribeira-barca": { name: "Ribeira da Barca", lat: 15.137, lon: -23.765 },
  "aguas-belas": { name: "Gruta das Águas Belas", lat: 15.112, lon: -23.776 }
};

/* Percurso indicativo de cada excursão */
window.LEVY_ROUTES = {
  "tarrafal": ["praia", "assomada", "tarrafal", "calheta", "pedra-badejo", "praia"],
  "cidade-velha": ["praia", "cidade-velha"],
  "city-tour-praia": ["praia"],
  "city-tour-cidade-velha": ["praia", "cidade-velha"],
  "vale-half-day": ["praia", "vale"],
  "vale-full-day": ["praia", "vale", "cidade-velha"],
  "sao-domingos": ["praia", "sao-domingos", "rui-vaz"],
  "pico-antonia": ["praia", "sao-domingos", "pico"],
  "serra-malagueta": ["praia", "malagueta", "espinho-branco"],
  "picos-pedra-badejo": ["praia", "picos", "pedra-badejo"],
  "aguas-belas": ["praia", "ribeira-barca", "aguas-belas"]
};

/* Contornos reais das ilhas (Natural Earth, domínio público) */
window.LEVY_GEO = {"islands":[{"name":"Brava","ring":[[-24.7043,14.9008],[-24.6931,14.8907],[-24.6868,14.8762],[-24.6839,14.8594],[-24.6833,14.8425],[-24.6869,14.8266],[-24.6953,14.8194],[-24.7044,14.814],[-24.7106,14.8039],[-24.718,14.8039],[-24.7255,14.8141],[-24.7446,14.8266],[-24.7515,14.8388],[-24.7589,14.8319],[-24.7547,14.8408],[-24.7532,14.8494],[-24.7547,14.8579],[-24.7589,14.8666],[-24.7454,14.8666],[-24.7494,14.8855],[-24.7376,14.892],[-24.7193,14.8944],[-24.7043,14.9008]]},{"name":"Fogo","ring":[[-24.2965,14.9175],[-24.3015,14.9065],[-24.2982,14.8955],[-24.2933,14.8843],[-24.2928,14.8729],[-24.2995,14.863],[-24.3345,14.8319],[-24.3765,14.816],[-24.415,14.8209],[-24.4491,14.8381],[-24.5066,14.885],[-24.5204,14.904],[-24.5262,14.9247],[-24.5206,14.9453],[-24.5067,14.9692],[-24.4889,14.9905],[-24.4646,15.0077],[-24.4034,15.038],[-24.3856,15.0435],[-24.3649,15.0454],[-24.3433,15.0407],[-24.3292,15.0287],[-24.3201,15.013],[-24.3072,14.9794],[-24.2958,14.9305],[-24.2965,14.9175]]},{"name":"Santiago","ring":[[-23.4568,15.0237],[-23.4546,15.0189],[-23.4519,15.0151],[-23.4484,15.0124],[-23.4431,15.0107],[-23.4478,14.9958],[-23.4547,14.9859],[-23.4779,14.9691],[-23.4704,14.9622],[-23.4802,14.9466],[-23.4863,14.9309],[-23.494,14.9187],[-23.5083,14.9138],[-23.5162,14.9128],[-23.5318,14.9086],[-23.5393,14.9076],[-23.5474,14.9085],[-23.5558,14.9128],[-23.5632,14.9138],[-23.5964,14.9145],[-23.6241,14.9181],[-23.6497,14.9265],[-23.6765,14.9355],[-23.7151,14.9685],[-23.7305,14.9858],[-23.7307,15.0185],[-23.7421,15.0264],[-23.7583,15.0313],[-23.7721,15.038],[-23.7727,15.0417],[-23.7795,15.0646],[-23.7823,15.0685],[-23.7863,15.0724],[-23.7901,15.0777],[-23.7926,15.0858],[-23.7899,15.0938],[-23.7756,15.1182],[-23.7721,15.1273],[-23.7729,15.1404],[-23.7858,15.1745],[-23.7762,15.1772],[-23.7701,15.184],[-23.7668,15.1938],[-23.7659,15.2055],[-23.7637,15.2163],[-23.7587,15.2231],[-23.7538,15.2281],[-23.7516,15.2335],[-23.755,15.2503],[-23.7633,15.2698],[-23.7744,15.2856],[-23.7858,15.2918],[-23.7791,15.2941],[-23.7584,15.3049],[-23.7731,15.3106],[-23.7795,15.3117],[-23.7516,15.3328],[-23.7441,15.3328],[-23.7436,15.3251],[-23.742,15.3209],[-23.7399,15.3173],[-23.7379,15.3117],[-23.7192,15.3229],[-23.7032,15.3135],[-23.6978,15.2963],[-23.7107,15.2844],[-23.6973,15.266],[-23.6818,15.2548],[-23.6485,15.2372],[-23.6561,15.2297],[-23.6388,15.2263],[-23.6303,15.2192],[-23.6151,15.195],[-23.5842,15.1624],[-23.5674,15.1521],[-23.5524,15.154],[-23.5491,15.1494],[-23.5475,15.1459],[-23.545,15.1431],[-23.5393,15.1404],[-23.5408,15.1391],[-23.5344,15.133],[-23.5273,15.1274],[-23.5257,15.1273],[-23.5229,15.1267],[-23.5141,15.128],[-23.5114,15.1273],[-23.5108,15.1242],[-23.512,15.1161],[-23.5114,15.113],[-23.4704,15.038],[-23.4665,15.0342],[-23.4636,15.0331],[-23.4607,15.031],[-23.4568,15.0237]]},{"name":"Maio","ring":[[-23.1278,15.3117],[-23.1219,15.2991],[-23.1205,15.2834],[-23.1216,15.2564],[-23.1105,15.1994],[-23.1119,15.1719],[-23.1278,15.1466],[-23.1328,15.1447],[-23.1487,15.1428],[-23.1551,15.1404],[-23.1588,15.1356],[-23.1636,15.1237],[-23.1688,15.1199],[-23.1827,15.1186],[-23.196,15.1221],[-23.2172,15.1335],[-23.2406,15.1501],[-23.2521,15.1618],[-23.2582,15.1745],[-23.2551,15.1868],[-23.2473,15.1992],[-23.2433,15.2113],[-23.2513,15.2229],[-23.2372,15.231],[-23.2309,15.244],[-23.2349,15.2548],[-23.2513,15.2564],[-23.2457,15.2711],[-23.2241,15.2867],[-23.2098,15.3117],[-23.2145,15.3135],[-23.2152,15.3144],[-23.215,15.3158],[-23.2172,15.3192],[-23.2033,15.3249],[-23.1898,15.3328],[-23.1896,15.3295],[-23.1898,15.3192],[-23.1813,15.3258],[-23.1789,15.3279],[-23.1763,15.3328],[-23.1688,15.3253],[-23.1763,15.3192],[-23.1619,15.3126],[-23.1395,15.3178],[-23.1278,15.3117]]},{"name":"Boa Vista","ring":[[-22.6821,16.1136],[-22.6784,16.1119],[-22.6708,16.1022],[-22.6666,16.0915],[-22.6725,16.0863],[-22.6756,16.082],[-22.6771,16.0727],[-22.6798,16.0632],[-22.6964,16.0529],[-22.7511,16.0106],[-22.7876,15.9916],[-22.8061,15.9859],[-22.8637,15.9824],[-22.8739,15.9839],[-22.8837,15.9887],[-22.8978,16.0005],[-22.9093,16.0037],[-22.9455,16.0197],[-22.9578,16.0308],[-22.964,16.0522],[-22.9632,16.0712],[-22.9578,16.089],[-22.9474,16.1022],[-22.9326,16.1074],[-22.9136,16.1256],[-22.9244,16.213],[-22.9156,16.244],[-22.9116,16.2367],[-22.9072,16.2314],[-22.8951,16.2228],[-22.8779,16.2149],[-22.8525,16.2066],[-22.8294,16.204],[-22.8193,16.213],[-22.8117,16.2284],[-22.7938,16.2313],[-22.7347,16.2169],[-22.7239,16.2126],[-22.7139,16.2058],[-22.7098,16.1986],[-22.7038,16.1796],[-22.6996,16.1757],[-22.6825,16.1686],[-22.6787,16.1518],[-22.6821,16.1136]]},{"name":"São Nicolau","ring":[[-24.0675,16.6139],[-24.048,16.5988],[-24.0374,16.593],[-24.0328,16.5968],[-24.0328,16.5624],[-24.0441,16.5599],[-24.1147,16.5593],[-24.192,16.5925],[-24.2333,16.6021],[-24.2723,16.5872],[-24.2864,16.5707],[-24.3153,16.5204],[-24.3247,16.4827],[-24.3334,16.4949],[-24.3475,16.532],[-24.3534,16.5404],[-24.3602,16.5472],[-24.3656,16.5556],[-24.3679,16.5692],[-24.3686,16.5795],[-24.3709,16.5871],[-24.3761,16.5918],[-24.3851,16.5934],[-24.4083,16.6002],[-24.4247,16.6171],[-24.4307,16.6395],[-24.4226,16.6623],[-24.3615,16.6816],[-24.3542,16.6806],[-24.3406,16.6754],[-24.3287,16.6678],[-24.3052,16.6479],[-24.2928,16.6418],[-24.2824,16.6413],[-24.2268,16.6496],[-24.2171,16.6477],[-24.1806,16.6308],[-24.1725,16.6291],[-24.09,16.6225],[-24.0675,16.6139]]},{"name":"Sal","ring":[[-22.9292,16.5934],[-22.9414,16.6694],[-22.9565,16.6994],[-22.9776,16.689],[-22.9818,16.7035],[-22.9831,16.723],[-22.9801,16.7411],[-22.9708,16.751],[-22.9708,16.7579],[-22.9827,16.7614],[-22.9892,16.7709],[-22.9916,16.7843],[-22.9908,16.8157],[-22.9701,16.8314],[-22.9224,16.8603],[-22.917,16.8532],[-22.8989,16.8368],[-22.8951,16.8293],[-22.8963,16.825],[-22.9027,16.8132],[-22.9098,16.8034],[-22.9079,16.8006],[-22.904,16.7986],[-22.9018,16.7951],[-22.9047,16.7358],[-22.9018,16.7169],[-22.8974,16.7103],[-22.8842,16.6984],[-22.8813,16.6927],[-22.8824,16.6815],[-22.8866,16.6617],[-22.8876,16.6514],[-22.8896,16.6459],[-22.8988,16.6395],[-22.9018,16.6344],[-22.9015,16.6291],[-22.8994,16.6216],[-22.8968,16.6155],[-22.8951,16.6139],[-22.9017,16.6059],[-22.9088,16.6022],[-22.9176,16.5992],[-22.9292,16.5934]]},{"name":"São Vicente","ring":[[-24.9197,16.8951],[-24.9229,16.8908],[-24.9145,16.8814],[-24.9001,16.872],[-24.8859,16.8677],[-24.8811,16.8623],[-24.8763,16.8498],[-24.8736,16.8359],[-24.8751,16.8262],[-24.8911,16.814],[-24.9155,16.8055],[-24.9429,16.8005],[-24.9681,16.7989],[-24.9745,16.7967],[-24.9842,16.7873],[-24.988,16.7851],[-24.9952,16.7861],[-25.0582,16.8096],[-25.0682,16.8151],[-25.0762,16.8225],[-25.0811,16.8323],[-25.0941,16.8262],[-25.0898,16.8475],[-25.0782,16.8651],[-25.0636,16.877],[-25.0501,16.8814],[-25.0188,16.882],[-25.006,16.8877],[-25.0122,16.9013],[-24.984,16.916],[-24.9781,16.923],[-24.9713,16.923],[-24.9652,16.9089],[-24.9552,16.9108],[-24.9377,16.923],[-24.9277,16.9178],[-24.9188,16.9083],[-24.9147,16.8992],[-24.9197,16.8951]]},{"name":"Santo Antão","ring":[[-25.047,17.0351],[-25.0556,17.0248],[-25.1159,16.9975],[-25.1434,16.97],[-25.163,16.9453],[-25.1879,16.9282],[-25.2313,16.923],[-25.2692,16.923],[-25.2808,16.9207],[-25.2897,16.9172],[-25.2987,16.9174],[-25.3108,16.9261],[-25.3134,16.9385],[-25.3139,17.005],[-25.3275,17.0282],[-25.331,17.031],[-25.3483,17.0341],[-25.3548,17.0385],[-25.3604,17.0552],[-25.3556,17.0696],[-25.3309,17.0968],[-25.3168,17.1061],[-25.3022,17.1081],[-25.2891,17.107],[-25.2798,17.1073],[-25.2696,17.1143],[-25.2454,17.1367],[-25.2263,17.1447],[-25.2027,17.1588],[-25.1796,17.1644],[-25.1186,17.1929],[-25.1026,17.1966],[-25.0911,17.193],[-25.0795,17.1854],[-25.0539,17.1862],[-25.0395,17.1824],[-25.0302,17.1755],[-25.0263,17.1677],[-25.0259,17.1449],[-25.0206,17.1404],[-24.9971,17.1342],[-24.9918,17.1309],[-24.9887,17.1257],[-24.975,17.1145],[-24.9713,17.1073],[-24.973,17.0966],[-24.979,17.0869],[-25.0151,17.0491],[-25.0197,17.049],[-25.0239,17.0454],[-25.0427,17.0385],[-25.047,17.0351]]},{"name":"","ring":[[-24.5927,16.6243],[-24.5695,16.62],[-24.5753,16.6055],[-24.5898,16.607],[-24.6013,16.6098],[-24.6042,16.6214],[-24.5927,16.6243]]},{"name":"Santa Luzia","ring":[[-24.7735,16.8023],[-24.7489,16.7936],[-24.7359,16.7791],[-24.7258,16.7574],[-24.707,16.7531],[-24.6954,16.7603],[-24.6838,16.756],[-24.6852,16.7429],[-24.7026,16.7357],[-24.7229,16.7343],[-24.7402,16.7343],[-24.7489,16.7429],[-24.7547,16.7545],[-24.7735,16.7618],[-24.788,16.7748],[-24.788,16.7892],[-24.7735,16.8023]]}]};

window.LEVY_CREDITS = [
  {
    "img": "cv-forte",
    "label": "Fortaleza de São Filipe, Cidade Velha",
    "url": "https://commons.wikimedia.org/wiki/File:Fort_Real_de_Sao_Felipe%2C_Cape_Verde.jpg"
  },
  {
    "img": "hero",
    "label": "Baía do Tarrafal (capa)",
    "url": "https://commons.wikimedia.org/wiki/File:%D7%97%D7%95%D7%A3_%D7%94%D7%99%D7%9D_%D7%A9%D7%9C_%D7%94%D7%A2%D7%99%D7%A8_%D7%98%D7%90%D7%A8%D7%90%D7%A4%D7%9C_%D7%91%D7%90%D7%99_%D7%A1%D7%A0%D7%98%D7%99%D7%90%D7%92%D7%95_%D7%9B%D7%A3_%D7%95%D7%A8%D7%93%D7%94_16.jpg"
  },
  {
    "img": "tarrafal-praia",
    "label": "Praia do Tarrafal",
    "url": "https://commons.wikimedia.org/wiki/File:Tarrafal_Beach_CV.jpg"
  },
  {
    "img": "tarrafal-botes",
    "label": "Botes de pesca, Tarrafal",
    "url": "https://commons.wikimedia.org/wiki/File:Tarrafal-Bateaux_de_p%C3%AAche_%282%29.jpg"
  },
  {
    "img": "tarrafal-baia",
    "label": "Baía do Tarrafal",
    "url": "https://commons.wikimedia.org/wiki/File:%D7%97%D7%95%D7%A3_%D7%94%D7%99%D7%9D_%D7%A9%D7%9C_%D7%94%D7%A2%D7%99%D7%A8_%D7%98%D7%90%D7%A8%D7%90%D7%A4%D7%9C_%D7%91%D7%90%D7%99_%D7%A1%D7%A0%D7%98%D7%99%D7%90%D7%92%D7%95_%D7%9B%D7%A3_%D7%95%D7%A8%D7%93%D7%94_15.jpg"
  },
  {
    "img": "cv-pelourinho",
    "label": "Praça do Pelourinho, Cidade Velha",
    "url": "https://commons.wikimedia.org/wiki/File:Cidade_Velha_Pelourinho_square_b_2011.jpg"
  },
  {
    "img": "cv-vista",
    "label": "Cidade Velha vista de cima",
    "url": "https://commons.wikimedia.org/wiki/File:Cidade_Velha_%283895493407%29.jpg"
  },
  {
    "img": "cv-mar",
    "label": "Beira-mar, Cidade Velha",
    "url": "https://commons.wikimedia.org/wiki/File:Cidade_Velha-Bord_de_mer_%282%29.jpg"
  },
  {
    "img": "praia-rua",
    "label": "Rua do Plateau, Praia",
    "url": "https://commons.wikimedia.org/wiki/File:Praia_on_a_quite_Sunday_morning.jpg"
  },
  {
    "img": "praia-canhoes",
    "label": "Canhões do Plateau, Praia",
    "url": "https://commons.wikimedia.org/wiki/File:Praia_Canons%2C_Cape_Verde_Islands.jpg"
  },
  {
    "img": "praia-rua2",
    "label": "Rua de Praia",
    "url": "https://commons.wikimedia.org/wiki/File:Praia-Rue_%282%29.jpg"
  },
  {
    "img": "vale-1",
    "label": "Vale da Ribeira Grande",
    "url": "https://commons.wikimedia.org/wiki/File:CV-cid-velh-schlucht-02.jpg"
  },
  {
    "img": "vale-2",
    "label": "Vale da Ribeira Grande",
    "url": "https://commons.wikimedia.org/wiki/File:Ribeira_Grande_de_Santiago-Vall%C3%A9e_%286%29.jpg"
  },
  {
    "img": "vale-palmeiras",
    "label": "Interior de Santiago",
    "url": "https://commons.wikimedia.org/wiki/File:Cape_Verde_Santiago_landscape_2011.jpg"
  },
  {
    "img": "vale-grogue",
    "label": "Destilaria artesanal de grogue",
    "url": "https://commons.wikimedia.org/wiki/File:Ribeira_Grande_de_Santiago-Distillerie_artisanale_%282%29.jpg"
  },
  {
    "img": "pico-1",
    "label": "Pico da Antónia",
    "url": "https://commons.wikimedia.org/wiki/File:Pico_da_Antonia-Sommet_%283%29.jpg"
  },
  {
    "img": "pico-2",
    "label": "Pico da Antónia",
    "url": "https://commons.wikimedia.org/wiki/File:Pico_da_Antonia-Sommet_%282%29.jpg"
  },
  {
    "img": "malagueta",
    "label": "Serra Malagueta",
    "url": "https://commons.wikimedia.org/wiki/File:Serra_Malagueta_CV.jpg"
  },
  {
    "img": "barca-1",
    "label": "Ribeira da Barca",
    "url": "https://commons.wikimedia.org/wiki/File:Murdudjador.jpg"
  },
  {
    "img": "interior",
    "label": "Interior de Santiago",
    "url": "https://commons.wikimedia.org/wiki/File:Inner_Santiago_Cape_Verde.jpg"
  }
];

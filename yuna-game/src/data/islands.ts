import type { Mech } from './mechanics.ts';

export type Group = { id: string; label: string; items: string[] };
export type Island = {
  id: number;
  slug: string;
  name: string;
  topic: string;
  place: string;
  color: string;
  items: string[];
  groups: Group[];
  mechs: Mech[];
  story: string;
  reward: string;
  rewardItem: string;
};

const mk = (o: Island) => o;

export const ISLANDS: Island[] = [
  mk({ id: 0, slug: 'cores', name: 'Ilha das Cores', topic: 'Cores e criatividade', place: 'o atelier colorido', color: '#ef7a63',
    items: ['vermelho', 'azul', 'amarelo', 'verde', 'laranja', 'roxo', 'rosa', 'castanho'],
    groups: [
      { id: 'quentes', label: 'cores quentes', items: ['vermelho', 'amarelo', 'laranja', 'rosa'] },
      { id: 'frias', label: 'cores frias', items: ['azul', 'verde', 'roxo'] },
    ],
    mechs: ['find', 'paint', 'mix', 'colorof', 'memory', 'pattern', 'bubbles', 'riddle', 'simon', 'catch', 'puzzle', 'odd'],
    story: 'A Yuna e a Gata Tanha encontraram um atelier mágico! Vamos descobrir as cores e dar vida a esta ilha.',
    reward: 'a Paleta Mágica', rewardItem: 'paleta' }),
  mk({ id: 1, slug: 'formas', name: 'Ilha das Formas', topic: 'Formas e encaixes', place: 'o parque dos blocos', color: '#9b85e6',
    items: ['circulo', 'quadrado', 'triangulo', 'retangulo', 'coracao', 'estrela-forma', 'losango', 'oval'],
    groups: [
      { id: 'redondas', label: 'formas redondas', items: ['circulo', 'oval', 'coracao'] },
      { id: 'cantos', label: 'formas com cantos', items: ['quadrado', 'triangulo', 'retangulo', 'losango'] },
    ],
    mechs: ['find', 'shadow', 'sort', 'pattern', 'memory', 'size', 'connect', 'bubbles', 'riddle', 'puzzle', 'odd', 'trace'],
    story: 'No parque dos blocos, cada forma tem o seu lugar. Vamos ajudar a Gata Tanha a encontrar os encaixes!',
    reward: 'o Bloco de Cristal', rewardItem: 'estrela' }),
  mk({ id: 2, slug: 'numeros', name: 'Ilha dos Números', topic: 'Contar de 1 a 10', place: 'o mercado alegre', color: '#f2b84b',
    items: ['n1', 'n2', 'n3', 'n4', 'n5', 'n6', 'n7', 'n8', 'n9', 'n10', 'maca', 'banana', 'laranja-fruta', 'manga', 'coco', 'ananas'],
    groups: [
      { id: 'fruta', label: 'fruta', items: ['maca', 'banana', 'laranja-fruta', 'manga', 'coco', 'ananas'] },
      { id: 'numeros', label: 'números', items: ['n1', 'n2', 'n3', 'n4', 'n5'] },
    ],
    mechs: ['count', 'more', 'basket', 'connect', 'trace', 'find', 'feed', 'catch', 'memory', 'simon', 'bubbles', 'puzzle'],
    story: 'Chegámos ao mercado! A Yuna precisa de contar as compras. Vamos contar juntos, devagarinho.',
    reward: 'a Lupa dos Números', rewardItem: 'globo' }),
  mk({ id: 3, slug: 'letras', name: 'Ilha das Letras', topic: 'Letras e sons', place: 'a biblioteca encantada', color: '#5aa7dd',
    items: ['lA', 'lE', 'lI', 'lO', 'lU', 'lL', 'lM', 'lP', 'lS', 'lT', 'lB', 'lC'],
    groups: [
      { id: 'vogais', label: 'vogais', items: ['lA', 'lE', 'lI', 'lO', 'lU'] },
      { id: 'consoantes', label: 'consoantes', items: ['lL', 'lM', 'lP', 'lS', 'lT', 'lB', 'lC'] },
    ],
    mechs: ['find', 'letterstart', 'trace', 'memory', 'bubbles', 'sort', 'simon', 'riddle', 'catch', 'puzzle', 'odd', 'missing'],
    story: 'Na biblioteca encantada, as letras estão à nossa espera. A Gata Tanha quer ouvir os seus nomes!',
    reward: 'o Livro de Aventuras', rewardItem: 'livro' }),
  mk({ id: 4, slug: 'quinta', name: 'Ilha da Quinta', topic: 'Animais da quinta', place: 'a quinta da Gata Tanha', color: '#78b86f',
    items: ['gato', 'cao', 'vaca', 'porco', 'galinha', 'ovelha', 'cavalo', 'pato', 'cabra', 'coelho', 'burro', 'pintainho'],
    groups: [
      { id: 'penas', label: 'animais com penas', items: ['galinha', 'pato', 'pintainho'] },
      { id: 'pelo', label: 'animais com pelo', items: ['gato', 'cao', 'vaca', 'porco', 'ovelha', 'cavalo', 'cabra', 'coelho', 'burro'] },
    ],
    mechs: ['find', 'riddle', 'shadow', 'memory', 'count', 'maze', 'odd', 'peek', 'feed', 'sort', 'missing', 'bubbles', 'puzzle'],
    story: 'O trator levou-nos à quinta! Vamos conhecer os animais e ajudar a Gata Tanha a encontrar o caminho.',
    reward: 'o Laço da Quinta', rewardItem: 'cavalo' }),
  mk({ id: 5, slug: 'pomar', name: 'Ilha do Pomar', topic: 'Fruta e legumes', place: 'o pomar tropical', color: '#e98e6f',
    items: ['maca', 'banana', 'uvas', 'laranja-fruta', 'melancia', 'ananas', 'manga', 'papaia', 'morango', 'pera', 'cenoura', 'brocolos', 'tomate', 'milho', 'abobora'],
    groups: [
      { id: 'fruta', label: 'fruta', items: ['maca', 'banana', 'uvas', 'laranja-fruta', 'melancia', 'ananas', 'manga', 'papaia', 'morango', 'pera'] },
      { id: 'legumes', label: 'legumes', items: ['cenoura', 'brocolos', 'tomate', 'milho', 'abobora'] },
    ],
    mechs: ['find', 'basket', 'sort', 'count', 'colorof', 'riddle', 'catch', 'size', 'memory', 'odd', 'feed', 'puzzle'],
    story: 'Há fruta fresquinha no pomar! Vamos descobrir os nomes e encher os cestos da colheita.',
    reward: 'o Cesto Colorido', rewardItem: 'ananas' }),
  mk({ id: 6, slug: 'corpo', name: 'Ilha do Corpo', topic: 'O nosso corpo', place: 'o parque dos sentidos', color: '#e29cbb',
    items: ['mao', 'pe', 'olho', 'orelha', 'nariz', 'boca', 'dente', 'bola', 'baloico', 'escorrega'],
    groups: [
      { id: 'corpo', label: 'partes do corpo', items: ['mao', 'pe', 'olho', 'orelha', 'nariz', 'boca', 'dente'] },
      { id: 'parque', label: 'coisas do parque', items: ['bola', 'baloico', 'escorrega'] },
    ],
    mechs: ['find', 'riddle', 'memory', 'sort', 'simon', 'odd', 'shadow', 'peek', 'missing', 'bubbles', 'puzzle', 'count'],
    story: 'A Yuna está no parque. Vamos descobrir as partes do corpo e tudo o que conseguimos fazer com elas!',
    reward: 'a Medalha dos Sentidos', rewardItem: 'bola' }),
  mk({ id: 7, slug: 'casinha', name: 'Ilha da Casinha', topic: 'A nossa casa', place: 'a casa acolhedora', color: '#c19c79',
    items: ['cama', 'candeeiro', 'peluche', 'colher', 'panela', 'prato', 'escova', 'sabao', 'cadeira', 'sofa', 'toalha', 'chavena'],
    groups: [
      { id: 'quarto', label: 'quarto e sala', items: ['cama', 'candeeiro', 'peluche', 'cadeira', 'sofa'] },
      { id: 'cozinha', label: 'cozinha', items: ['colher', 'panela', 'prato', 'chavena'] },
      { id: 'banho', label: 'casa de banho', items: ['escova', 'sabao', 'toalha'] },
    ],
    mechs: ['find', 'sort', 'riddle', 'memory', 'peek', 'shadow', 'maze', 'missing', 'odd', 'count', 'puzzle', 'simon'],
    story: 'A Gata Tanha escondeu-se na casinha. Vamos conhecer os objetos e arrumar cada coisa no seu lugar.',
    reward: 'a Chave da Casinha', rewardItem: 'peluche' }),
  mk({ id: 8, slug: 'praia', name: 'Ilha da Praia', topic: 'Praia e oceano', place: 'a baía das conchas', color: '#e3b768',
    items: ['concha', 'estrela-mar', 'guarda-sol', 'balde', 'caranguejo', 'gaivota', 'castelo-areia', 'oculos', 'bola', 'peixe'],
    groups: [
      { id: 'animais', label: 'animais', items: ['estrela-mar', 'caranguejo', 'gaivota', 'peixe'] },
      { id: 'coisas', label: 'coisas da praia', items: ['concha', 'guarda-sol', 'balde', 'castelo-areia', 'oculos', 'bola'] },
    ],
    mechs: ['find', 'count', 'basket', 'riddle', 'memory', 'more', 'shadow', 'catch', 'maze', 'peek', 'sort', 'puzzle'],
    story: 'O barquinho chegou à praia! Vamos contar conchas e conhecer os amigos do mar.',
    reward: 'a Concha Dourada', rewardItem: 'concha' }),
  mk({ id: 9, slug: 'coral', name: 'Ilha do Coral', topic: 'Debaixo de água', place: 'o jardim de coral', color: '#5fc0c3',
    items: ['peixe', 'polvo', 'golfinho', 'baleia', 'tartaruga', 'cavalo-marinho', 'alforreca', 'tubarao', 'coral', 'perola', 'caranguejo', 'estrela-mar'],
    groups: [
      { id: 'nadam', label: 'animais que nadam', items: ['peixe', 'golfinho', 'baleia', 'tartaruga', 'tubarao', 'cavalo-marinho'] },
      { id: 'fundo', label: 'tesouros do fundo', items: ['coral', 'perola', 'estrela-mar'] },
    ],
    mechs: ['shadow', 'find', 'memory', 'riddle', 'bubbles', 'count', 'size', 'odd', 'maze', 'peek', 'catch', 'puzzle'],
    story: 'Vamos espreitar o fundo do mar! Entre os corais, cada animal tem uma forma especial.',
    reward: 'a Pérola do Oceano', rewardItem: 'perola' }),
  mk({ id: 10, slug: 'viagens', name: 'Ilha das Viagens', topic: 'Meios de transporte', place: 'a estação de partidas', color: '#76a6d6',
    items: ['carro', 'autocarro', 'comboio', 'bicicleta', 'barco', 'navio', 'aviao', 'helicoptero', 'mota', 'trator', 'balao-ar', 'foguetao'],
    groups: [
      { id: 'terra', label: 'andam na terra', items: ['carro', 'autocarro', 'comboio', 'bicicleta', 'mota', 'trator'] },
      { id: 'agua', label: 'andam na água', items: ['barco', 'navio'] },
      { id: 'ar', label: 'voam no ar', items: ['aviao', 'helicoptero', 'balao-ar', 'foguetao'] },
    ],
    mechs: ['find', 'sort', 'riddle', 'memory', 'size', 'count', 'shadow', 'maze', 'catch', 'odd', 'puzzle', 'missing'],
    story: 'Tantas maneiras de viajar! Vamos descobrir quem anda na terra, quem navega e quem voa.',
    reward: 'o Bilhete de Exploradora', rewardItem: 'aviao' }),
  mk({ id: 11, slug: 'sabores', name: 'Ilha dos Sabores', topic: 'Comida e bebida', place: 'o restaurante da Yuna', color: '#ec9b72',
    items: ['pao', 'ovo', 'arroz', 'agua', 'leite', 'queijo', 'sopa', 'cachupa', 'bolo', 'pizza', 'sumo', 'maca', 'banana'],
    groups: [
      { id: 'comer', label: 'para comer', items: ['pao', 'ovo', 'arroz', 'queijo', 'sopa', 'cachupa', 'bolo', 'pizza', 'maca', 'banana'] },
      { id: 'beber', label: 'para beber', items: ['agua', 'leite', 'sumo'] },
    ],
    mechs: ['find', 'sort', 'feed', 'count', 'riddle', 'memory', 'basket', 'odd', 'more', 'catch', 'puzzle', 'missing'],
    story: 'O restaurante vai abrir! Vamos conhecer os alimentos e ajudar a Yuna a preparar as mesas.',
    reward: 'o Chapéu de Cozinheira', rewardItem: 'cachupa' }),
  mk({ id: 12, slug: 'musica', name: 'Ilha da Música', topic: 'Sons e ritmo', place: 'o palco dos sons', color: '#b398dc',
    items: ['piano', 'guitarra', 'violino', 'tambor', 'sino', 'trompete', 'cavaquinho', 'maracas', 'flauta', 'xilofone'],
    groups: [
      { id: 'cordas', label: 'instrumentos de cordas', items: ['guitarra', 'violino', 'cavaquinho'] },
      { id: 'bater', label: 'instrumentos de bater', items: ['tambor', 'sino', 'maracas', 'xilofone'] },
      { id: 'soprar', label: 'instrumentos de soprar', items: ['trompete', 'flauta'] },
    ],
    mechs: ['sound', 'find', 'simon', 'memory', 'riddle', 'sort', 'shadow', 'count', 'odd', 'bubbles', 'puzzle', 'sound'],
    story: 'A Gata Tanha encontrou um palco. Vamos ouvir com atenção, conhecer instrumentos e repetir ritmos!',
    reward: 'o Tambor da Alegria', rewardItem: 'cavaquinho' }),
  mk({ id: 13, slug: 'jardim', name: 'Ilha do Jardim', topic: 'Natureza', place: 'o jardim florido', color: '#86ba7d',
    items: ['flor', 'arvore', 'borboleta', 'abelha', 'rebento', 'joaninha', 'caracol', 'girassol', 'regador', 'sol', 'nuvem', 'gota'],
    groups: [
      { id: 'bichinhos', label: 'bichinhos', items: ['borboleta', 'abelha', 'joaninha', 'caracol'] },
      { id: 'plantas', label: 'plantas', items: ['flor', 'arvore', 'rebento', 'girassol'] },
    ],
    mechs: ['find', 'sort', 'riddle', 'count', 'memory', 'size', 'peek', 'bubbles', 'maze', 'catch', 'odd', 'puzzle'],
    story: 'No jardim há tanto para descobrir! Vamos conhecer as plantas, os bichinhos e as cores do céu.',
    reward: 'a Semente da Amizade', rewardItem: 'girassol' }),
  mk({ id: 14, slug: 'cuidado', name: 'Ilha do Cuidado', topic: 'Segurança e bons hábitos', place: 'a vila segura', color: '#79b8c4',
    items: ['capacete', 'cinto', 'semaforo', 'passadeira', 'protetor', 'colete', 'chapeu', 'escova', 'sabao', 'toalha', 'agua', 'maca'],
    groups: [
      { id: 'rua', label: 'segurança na rua', items: ['capacete', 'cinto', 'semaforo', 'passadeira'] },
      { id: 'higiene', label: 'higiene', items: ['escova', 'sabao', 'toalha'] },
      { id: 'sol', label: 'proteção do sol e da água', items: ['protetor', 'colete', 'chapeu'] },
    ],
    mechs: ['riddle', 'find', 'sort', 'memory', 'maze', 'odd', 'shadow', 'count', 'peek', 'missing', 'puzzle', 'simon'],
    story: 'Vamos passear com cuidado. A Yuna e a Gata Tanha ajudam-nos a descobrir hábitos que nos protegem.',
    reward: 'o Escudo do Cuidado', rewardItem: 'capacete' }),
  mk({ id: 15, slug: 'nuvens', name: 'Ilha das Nuvens', topic: 'O céu', place: 'o miradouro do céu', color: '#8fbedf',
    items: ['sol', 'nuvem', 'arco-iris', 'gota', 'lua', 'estrela', 'balao-ar', 'aviao', 'helicoptero', 'passaro', 'papagaio', 'borboleta'],
    groups: [
      { id: 'dia', label: 'céu de dia', items: ['sol', 'nuvem', 'arco-iris', 'papagaio'] },
      { id: 'noite', label: 'céu de noite', items: ['lua', 'estrela'] },
    ],
    mechs: ['find', 'riddle', 'count', 'memory', 'more', 'shadow', 'simon', 'bubbles', 'catch', 'size', 'sort', 'puzzle'],
    story: 'O balão está a subir! Vamos observar as nuvens, descobrir o céu e olhar o mundo lá de cima.',
    reward: 'o Balão dos Sonhos', rewardItem: 'balao-ar' }),
  mk({ id: 16, slug: 'hello', name: 'Ilha do Hello', topic: 'Primeiras palavras em inglês', place: 'a escola dos amigos', color: '#ae9bdf',
    items: ['gato', 'cao', 'maca', 'banana', 'sol', 'peixe', 'bola', 'carro', 'vermelho', 'azul', 'amarelo', 'verde'],
    groups: [
      { id: 'animals', label: 'animals', items: ['gato', 'cao', 'peixe'] },
      { id: 'colors', label: 'colors', items: ['vermelho', 'azul', 'amarelo', 'verde'] },
    ],
    mechs: ['english', 'english', 'memory', 'bubbles', 'english', 'catch', 'simon', 'english', 'count', 'puzzle', 'odd', 'english', 'shadow', 'peek', 'colorof'],
    story: 'Hello! Nesta ilha, a Yuna e a Gata Tanha vão descobrir palavras em inglês. Escuta e experimenta!',
    reward: 'o Passaporte Hello', rewardItem: 'mochila' }),
  mk({ id: 17, slug: 'tracos', name: 'Ilha dos Traços', topic: 'Traçar e escrever', place: 'a oficina do lápis', color: '#e3998a',
    items: ['lapis', 'borracha', 'caderno', 'tesoura', 'mochila', 'livro', 'pincel', 'paleta', 'globo'],
    groups: [
      { id: 'escrever', label: 'para escrever', items: ['lapis', 'borracha', 'caderno'] },
      { id: 'pintar', label: 'para pintar', items: ['pincel', 'paleta'] },
    ],
    mechs: ['trace', 'trace', 'connect', 'find', 'trace', 'maze', 'memory', 'trace', 'riddle', 'connect', 'puzzle', 'trace', 'paint', 'shadow', 'odd', 'peek'],
    story: 'Os lápis estão prontos! Segue os caminhos com o dedo e desenha letras e números com a Yuna.',
    reward: 'o Lápis de Ouro', rewardItem: 'lapis' }),
  mk({ id: 18, slug: 'estrelas', name: 'Ilha das Estrelas', topic: 'O espaço', place: 'o observatório', color: '#8d90d4',
    items: ['foguetao', 'lua', 'terra', 'saturno', 'estrela', 'astronauta', 'sol', 'telescopio', 'extraterrestre', 'satelite'],
    groups: [
      { id: 'ceu', label: 'no céu', items: ['lua', 'terra', 'saturno', 'estrela', 'sol'] },
      { id: 'maquinas', label: 'para explorar', items: ['foguetao', 'telescopio', 'satelite', 'astronauta'] },
    ],
    mechs: ['find', 'riddle', 'count', 'memory', 'size', 'more', 'shadow', 'connect', 'catch', 'maze', 'bubbles', 'puzzle'],
    story: 'Três, dois, um... partida! Vamos explorar o espaço e descobrir a Lua, os planetas e as estrelas.',
    reward: 'a Estrela de Exploradora', rewardItem: 'foguetao' }),
  mk({ id: 19, slug: 'amizade', name: 'Ilha da Amizade', topic: 'A grande festa', place: 'a festa das descobertas', color: '#e8a86e',
    items: ['baloes', 'bolo', 'presente', 'coroa', 'castelo', 'chapeu-festa', 'gato', 'maca', 'barco', 'flor', 'estrela', 'cavaquinho'],
    groups: [
      { id: 'festa', label: 'coisas da festa', items: ['baloes', 'bolo', 'presente', 'chapeu-festa', 'coroa'] },
      { id: 'amigos', label: 'descobertas das ilhas', items: ['gato', 'maca', 'barco', 'flor', 'cavaquinho'] },
    ],
    mechs: ['memory', 'riddle', 'sort', 'count', 'simon', 'find', 'shadow', 'maze', 'catch', 'bubbles', 'puzzle', 'missing'],
    story: 'Chegámos à festa da amizade! Vamos usar tudo o que descobrimos. A nossa maior conquista é aprender juntos.',
    reward: 'a Coroa das Descobertas', rewardItem: 'coroa' }),
];

export const REGIONS = [
  { name: 'Primeiras descobertas', islands: [0, 1, 2, 3] },
  { name: 'À nossa volta', islands: [4, 5, 6, 7] },
  { name: 'Pequenas grandes viagens', islands: [8, 9, 10, 11] },
  { name: 'Um mundo para cuidar', islands: [12, 13, 14, 15] },
  { name: 'Até às estrelas', islands: [16, 17, 18, 19] },
];

export const PHASES = [
  { id: 0, name: 'Descobrir', icon: '🔍' },
  { id: 1, name: 'Praticar', icon: '✏️' },
  { id: 2, name: 'Aventurar', icon: '⛵' },
];

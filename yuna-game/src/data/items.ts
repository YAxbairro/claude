// Every "thing" the game can show. `art` decides how it is drawn:
//  img   → generated illustration in /assets/items/<id>.webp
//  color → paint blob drawn in code (hex in `hex`)
//  shape → SVG shape drawn in code
//  glyph → big letter / number drawn in code
// `name` carries the article so the narrator can say it naturally ("a maçã").
export type Art = 'img' | 'color' | 'shape' | 'glyph';
export type Item = {
  id: string;
  name: string;
  word: string;
  clue: string;
  art: Art;
  prompt?: string;
  en?: string;
  hex?: string;
};

const img = (id: string, name: string, clue: string, prompt: string, en?: string): Item => ({
  id, name, word: name.replace(/^(o|a|os|as|um|uma) /, ''), clue, art: 'img', prompt, en,
});

export const ITEMS: Record<string, Item> = {};
const add = (...list: Item[]) => list.forEach((it) => { ITEMS[it.id] = it; });

// ── Cores (desenhadas em código)
const color = (id: string, name: string, hex: string, clue: string, en: string): Item =>
  ({ id, name, word: name.replace(/^o /, ''), clue, art: 'color', hex, en });
add(
  color('vermelho', 'o vermelho', '#ef3b4b', 'Sou a cor do morango e do tomate.', 'red'),
  color('azul', 'o azul', '#2f8ff0', 'Sou a cor do céu num dia de sol.', 'blue'),
  color('amarelo', 'o amarelo', '#ffc928', 'Sou a cor da banana madura e do sol.', 'yellow'),
  color('verde', 'o verde', '#3dbb5b', 'Sou a cor das folhas e da relva.', 'green'),
  color('laranja', 'o laranja', '#ff8a1f', 'Tenho o mesmo nome de uma fruta redonda.', 'orange'),
  color('roxo', 'o roxo', '#8d4fe0', 'Sou a cor das uvas e da jardineira da Yuna.', 'purple'),
  color('rosa', 'o cor-de-rosa', '#ff7eb8', 'Sou a cor do algodão-doce.', 'pink'),
  color('castanho', 'o castanho', '#9a6234', 'Sou a cor do tronco das árvores e do chocolate.', 'brown'),
  color('branco', 'o branco', '#ffffff', 'Sou a cor das nuvens e do leite.', 'white'),
);

// ── Formas (SVG)
const shape = (id: string, name: string, clue: string, en: string): Item =>
  ({ id, name, word: name.replace(/^o /, ''), clue, art: 'shape', en });
add(
  shape('circulo', 'o círculo', 'Sou redondo e não tenho cantos.', 'circle'),
  shape('quadrado', 'o quadrado', 'Tenho quatro lados todos iguais.', 'square'),
  shape('triangulo', 'o triângulo', 'Tenho três lados e três bicos.', 'triangle'),
  shape('retangulo', 'o retângulo', 'Tenho quatro lados, dois compridos e dois curtos.', 'rectangle'),
  shape('coracao', 'o coração', 'Sou a forma do carinho.', 'heart'),
  shape('estrela-forma', 'a estrela', 'Tenho cinco pontas e brilho no céu.', 'star'),
  shape('losango', 'o losango', 'Pareço um quadrado de pé, como um papagaio de papel.', 'diamond'),
  shape('oval', 'o oval', 'Sou redondo e esticado, como um ovo.', 'oval'),
);

// ── Números e letras (glifos)
export const NUMBER_WORDS = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez'];
for (let n = 1; n <= 10; n++) {
  add({ id: 'n' + n, name: 'o ' + NUMBER_WORDS[n], word: NUMBER_WORDS[n], clue: n === 1 ? 'Sou o primeiro número quando começamos a contar.' : `Venho logo depois do ${NUMBER_WORDS[n - 1]}.`, art: 'glyph' });
}
export const LETTER_WORDS: Record<string, string> = { A: 'abelha', E: 'elefante', I: 'ilha', O: 'ovo', U: 'uvas', L: 'lua', M: 'mão', P: 'pato', S: 'sol', T: 'tartaruga', B: 'banana', C: 'coelho' };
for (const L of Object.keys(LETTER_WORDS)) {
  add({ id: 'l' + L, name: 'a letra ' + L, word: L, clue: `A palavra ${LETTER_WORDS[L]} começa comigo.`, art: 'glyph' });
}

// ── Ilustrações geradas
add(
  // fruta e legumes
  img('maca', 'a maçã', 'Sou vermelha, redondinha e cresço numa árvore.', 'a shiny red apple with a green leaf', 'apple'),
  img('banana', 'a banana', 'Sou amarela, comprida e tenho casca.', 'a ripe yellow banana', 'banana'),
  img('uvas', 'as uvas', 'Crescemos juntinhas num cacho.', 'a bunch of purple grapes', 'grapes'),
  img('laranja-fruta', 'a laranja', 'Sou redonda e fazem sumo comigo.', 'a juicy orange fruit with a leaf', 'orange'),
  img('melancia', 'a melancia', 'Sou verde por fora e vermelha por dentro.', 'a slice of watermelon with black seeds', 'watermelon'),
  img('ananas', 'o ananás', 'Tenho uma coroa de folhas na cabeça.', 'a pineapple with a green leafy crown', 'pineapple'),
  img('manga', 'a manga', 'Sou doce, amarela e laranja, e adoro o calor das ilhas.', 'a ripe mango, red and yellow', 'mango'),
  img('papaia', 'a papaia', 'Sou laranja por dentro e tenho muitas sementes pretas.', 'a papaya cut in half showing orange flesh and black seeds', 'papaya'),
  img('morango', 'o morango', 'Sou pequenino, vermelho e tenho pintinhas.', 'a red strawberry with green leaves', 'strawberry'),
  img('pera', 'a pera', 'Sou verde e tenho a forma de uma gota.', 'a green pear', 'pear'),
  img('coco', 'o coco', 'Sou duro por fora e tenho água fresquinha dentro.', 'a brown coconut', 'coconut'),
  img('cenoura', 'a cenoura', 'Sou laranja e cresço debaixo da terra.', 'an orange carrot with green leaves', 'carrot'),
  img('brocolos', 'os brócolos', 'Parecemos pequenas árvores verdes.', 'a head of green broccoli', 'broccoli'),
  img('tomate', 'o tomate', 'Sou vermelho e vou para a salada.', 'a red tomato', 'tomato'),
  img('milho', 'o milho', 'Tenho muitos grãos amarelos numa maçaroca.', 'a corn cob with yellow kernels and husk', 'corn'),
  img('abobora', 'a abóbora', 'Sou grande, redonda e cor de laranja.', 'an orange pumpkin', 'pumpkin'),
  // quinta
  img('gato', 'o gato', 'Faço miau e tenho bigodes, como a Gata Tanha.', 'a ginger kitten sitting', 'cat'),
  img('cao', 'o cão', 'Faço ão-ão e abano a cauda quando estou contente.', 'a friendly brown puppy dog sitting', 'dog'),
  img('vaca', 'a vaca', 'Faço muuu e dou leite.', 'a black and white cow', 'cow'),
  img('porco', 'o porco', 'Sou cor-de-rosa e faço oinc oinc.', 'a pink pig', 'pig'),
  img('galinha', 'a galinha', 'Ponho ovos e faço có-có-ró.', 'a plump white farm hen bird with a red comb, standing', 'chicken'),
  img('ovelha', 'a ovelha', 'Tenho lã fofinha e faço méé.', 'a fluffy white sheep', 'sheep'),
  img('cavalo', 'o cavalo', 'Corro muito depressa e tenho crina.', 'a brown horse with a dark mane', 'horse'),
  img('pato', 'o pato', 'Nado no lago e faço quá-quá.', 'a yellow duck', 'duck'),
  img('cabra', 'a cabra', 'Tenho barbicha e subo às rochas.', 'a white goat with small horns', 'goat'),
  img('coelho', 'o coelho', 'Tenho orelhas compridas e adoro cenouras.', 'a fluffy white bunny rabbit', 'rabbit'),
  img('burro', 'o burro', 'Tenho orelhas grandes e ajudo a carregar coisas.', 'a grey donkey', 'donkey'),
  img('pintainho', 'o pintainho', 'Sou um bebé amarelo que saiu de um ovo.', 'a fluffy yellow baby chick', 'chick'),
  img('elefante', 'o elefante', 'Sou enorme e tenho uma tromba comprida.', 'a grey baby elephant', 'elephant'),
  // corpo e parque
  img('mao', 'a mão', 'Tenho cinco dedos.', 'a cartoon child hand waving, palm open, warm brown skin', 'hand'),
  img('pe', 'o pé', 'Ajudo-te a andar e uso um sapato.', 'a cartoon child foot, warm brown skin, cute', 'foot'),
  img('olho', 'o olho', 'Ajudo-te a ver as cores.', 'a single cute cartoon eye with long eyelashes', 'eye'),
  img('orelha', 'a orelha', 'É por mim que os sons entram.', 'a cartoon ear, warm brown skin', 'ear'),
  img('nariz', 'o nariz', 'Ajudo-te a cheirar as flores.', 'a cute cartoon nose, warm brown skin', 'nose'),
  img('boca', 'a boca', 'Ajudo-te a falar, a sorrir e a comer.', 'a smiling cartoon mouth with lips and white teeth', 'mouth'),
  img('dente', 'o dente', 'Sou branquinho e ajudo a mastigar.', 'a happy white tooth character', 'tooth'),
  img('bola', 'a bola', 'Sou redonda e salto quando me chutas.', 'a colorful beach ball', 'ball'),
  img('baloico', 'o baloiço', 'Vais para a frente e para trás, bem alto.', 'a playground swing set', 'swing'),
  img('escorrega', 'o escorrega', 'Sobes a escada e desces a deslizar.', 'a yellow playground slide', 'slide'),
  // casinha
  img('cama', 'a cama', 'É aqui que dormes à noite.', 'a cozy bed with blue blanket and pillow', 'bed'),
  img('candeeiro', 'o candeeiro', 'Dou luz quando está escuro.', 'a small bedside lamp turned on', 'lamp'),
  img('peluche', 'o ursinho de peluche', 'Sou fofinho e gosto de abraços.', 'a cuddly brown teddy bear', 'teddy bear'),
  img('colher', 'a colher', 'Ajudo-te a comer a sopa.', 'a silver spoon', 'spoon'),
  img('panela', 'a panela', 'Sirvo para cozinhar no fogão.', 'a red cooking pot with lid', 'pot'),
  img('prato', 'o prato', 'A comida é servida em cima de mim.', 'a white dinner plate', 'plate'),
  img('escova', 'a escova de dentes', 'Ajudo-te a lavar os dentes.', 'a blue toothbrush with white toothpaste on the bristles', 'toothbrush'),
  img('sabao', 'o sabão', 'Faço espuma e lavo as mãos.', 'a bar of soap with bubbles', 'soap'),
  img('cadeira', 'a cadeira', 'Tenho quatro pernas e sentas-te em mim.', 'a wooden chair', 'chair'),
  img('sofa', 'o sofá', 'Sou fofo e a família senta-se em mim.', 'a cozy yellow sofa', 'sofa'),
  img('toalha', 'a toalha', 'Seco-te depois do banho.', 'a folded fluffy blue towel', 'towel'),
  img('chavena', 'a chávena', 'Bebe-se chá ou leite quentinho em mim.', 'a teacup on a saucer', 'cup'),
  // praia
  img('concha', 'a concha', 'Podes encontrar-me na areia da praia.', 'a pink spiral seashell', 'shell'),
  img('estrela-mar', 'a estrela-do-mar', 'Vivo no mar e tenho cinco braços.', 'an orange starfish', 'starfish'),
  img('guarda-sol', 'o guarda-sol', 'Faço sombra na praia.', 'a striped beach umbrella', 'umbrella'),
  img('balde', 'o balde', 'Levo areia e água para fazer castelos.', 'a red toy beach bucket', 'bucket'),
  img('caranguejo', 'o caranguejo', 'Tenho pinças e ando de lado.', 'a red crab', 'crab'),
  img('gaivota', 'a gaivota', 'Sou uma ave branca que voa sobre o mar.', 'a white seagull', 'seagull'),
  img('castelo-areia', 'o castelo de areia', 'Sou feito de areia molhada na praia.', 'a sandcastle with a little flag', 'sandcastle'),
  img('oculos', 'os óculos de sol', 'Protegemos os teus olhos do sol forte.', 'a pair of pink sunglasses', 'sunglasses'),
  // fundo do mar
  img('peixe', 'o peixe', 'Tenho barbatanas e vivo na água.', 'an orange and white clownfish', 'fish'),
  img('polvo', 'o polvo', 'Tenho oito braços.', 'a purple octopus', 'octopus'),
  img('golfinho', 'o golfinho', 'Salto fora de água e sou muito brincalhão.', 'a blue dolphin jumping', 'dolphin'),
  img('baleia', 'a baleia', 'Sou o maior animal do oceano.', 'a big blue whale', 'whale'),
  img('tartaruga', 'a tartaruga', 'Levo a minha casa às costas.', 'a green sea turtle', 'turtle'),
  img('cavalo-marinho', 'o cavalo-marinho', 'Tenho cabeça de cavalo e vivo no mar.', 'a yellow seahorse', 'seahorse'),
  img('alforreca', 'a alforreca', 'Sou transparente e flutuo no mar.', 'a pink jellyfish', 'jellyfish'),
  img('tubarao', 'o tubarão', 'Tenho uma barbatana em cima e muitos dentes.', 'a friendly grey shark smiling', 'shark'),
  img('coral', 'o coral', 'Pareço uma planta colorida no fundo do mar.', 'a branch of pink coral', 'coral'),
  img('perola', 'a pérola', 'Sou branca e brilhante e vivo dentro de uma ostra.', 'an open oyster with a white pearl', 'pearl'),
  // viagens
  img('carro', 'o carro', 'Tenho quatro rodas e ando na estrada.', 'a red toy car', 'car'),
  img('autocarro', 'o autocarro', 'Levo muitas pessoas pela estrada.', 'a yellow bus', 'bus'),
  img('comboio', 'o comboio', 'Ando em cima de carris.', 'a colorful steam train', 'train'),
  img('bicicleta', 'a bicicleta', 'Tenho duas rodas e pedais.', 'a blue children\'s bicycle with two round wheels, pedals and handlebars, side view', 'bicycle'),
  img('barco', 'o barco à vela', 'Navego com a força do vento.', 'a small sailboat with white sail', 'boat'),
  img('navio', 'o navio', 'Sou grande e atravesso o oceano.', 'a big ocean ship', 'ship'),
  img('aviao', 'o avião', 'Tenho asas e levo pessoas pelo céu.', 'an airplane', 'plane'),
  img('helicoptero', 'o helicóptero', 'Voo com uma hélice por cima.', 'a red helicopter', 'helicopter'),
  img('mota', 'a mota', 'Tenho duas rodas e um motor barulhento.', 'a green motorcycle', 'motorbike'),
  img('trator', 'o trator', 'Trabalho no campo com rodas grandes.', 'a green farm tractor', 'tractor'),
  img('balao-ar', 'o balão de ar quente', 'Subo ao céu com ar quentinho.', 'a rainbow striped hot air balloon', 'hot air balloon'),
  img('foguetao', 'o foguetão', 'Viajo até ao espaço.', 'a red and white rocket', 'rocket'),
  // sabores
  img('pao', 'o pão', 'Sou feito com farinha e como-me ao pequeno-almoço.', 'a loaf of bread', 'bread'),
  img('ovo', 'o ovo', 'A galinha põe-me.', 'a white egg', 'egg'),
  img('arroz', 'o arroz', 'Tenho grãozinhos brancos.', 'a bowl of white rice', 'rice'),
  img('agua', 'a água', 'Mato a sede e não tenho cor.', 'a glass of water', 'water'),
  img('leite', 'o leite', 'Sou branco e a vaca dá-me.', 'a glass of milk', 'milk'),
  img('queijo', 'o queijo', 'Sou amarelo e tenho buracos.', 'a wedge of yellow cheese with holes', 'cheese'),
  img('sopa', 'a sopa', 'Como-se quentinha com uma colher.', 'a bowl of vegetable soup', 'soup'),
  img('cachupa', 'a cachupa', 'Sou o prato mais famoso de Cabo Verde, com milho e feijão.', 'a bowl of cape verdean cachupa stew with corn and beans', 'stew'),
  img('bolo', 'o bolo', 'Tenho velas no dia de anos.', 'a birthday cake with candles', 'cake'),
  img('pizza', 'a piza', 'Sou redonda e corto-me em fatias.', 'a pizza', 'pizza'),
  img('sumo', 'o sumo', 'Sou feito de fruta espremida.', 'a glass of orange juice with a straw', 'juice'),
  // música
  img('piano', 'o piano', 'Tenho teclas brancas e pretas.', 'a black grand piano', 'piano'),
  img('guitarra', 'a guitarra', 'Tenho seis cordas.', 'an acoustic guitar', 'guitar'),
  img('violino', 'o violino', 'Tocam-me com um arco.', 'a violin with bow', 'violin'),
  img('tambor', 'o tambor', 'Bates em mim e faço bum bum.', 'a red drum with drumsticks', 'drum'),
  img('sino', 'o sino', 'Faço dlim dlão.', 'a golden bell', 'bell'),
  img('trompete', 'o trompete', 'Tocam-me a soprar.', 'a golden trumpet', 'trumpet'),
  img('cavaquinho', 'o cavaquinho', 'Sou pequenino, tenho quatro cordas e toco morna.', 'a small cavaquinho ukulele', 'ukulele'),
  img('maracas', 'as maracas', 'Abanam-nos e fazemos chique-chique.', 'a pair of colorful maracas', 'maracas'),
  img('flauta', 'a flauta', 'Tenho buraquinhos e tocam-me a soprar.', 'a wooden recorder flute', 'flute'),
  img('xilofone', 'o xilofone', 'Tenho barrinhas coloridas e toco com baquetas.', 'a rainbow xylophone with mallets', 'xylophone'),
  // jardim e céu
  img('sol', 'o sol', 'Ilumino os teus dias.', 'a smiling yellow sun', 'sun'),
  img('nuvem', 'a nuvem', 'Pareço algodão no céu.', 'a fluffy white cloud', 'cloud'),
  img('arco-iris', 'o arco-íris', 'Mostro muitas cores depois da chuva.', 'a rainbow with small clouds', 'rainbow'),
  img('flor', 'a flor', 'Tenho pétalas e cheiro bem.', 'a pink flower', 'flower'),
  img('arvore', 'a árvore', 'Tenho tronco, ramos e folhas.', 'a round green tree', 'tree'),
  img('borboleta', 'a borboleta', 'Tenho asas coloridas e visito as flores.', 'a colorful butterfly', 'butterfly'),
  img('abelha', 'a abelha', 'Faço mel e visito as flores.', 'a cute bee', 'bee'),
  img('rebento', 'o rebento', 'Sou uma plantinha a nascer.', 'a small green sprout in soil', 'sprout'),
  img('joaninha', 'a joaninha', 'Sou vermelha com pintas pretas.', 'a red ladybug with black spots', 'ladybug'),
  img('caracol', 'o caracol', 'Ando devagarinho com a casa às costas.', 'a snail with a spiral shell', 'snail'),
  img('girassol', 'o girassol', 'Sou uma flor amarela que olha para o sol.', 'a sunflower', 'sunflower'),
  img('regador', 'o regador', 'Dou água às plantas.', 'a red watering can', 'watering can'),
  img('gota', 'a gota de chuva', 'Caio das nuvens quando chove.', 'a blue raindrop', 'raindrop'),
  img('lua', 'a lua', 'Brilho no céu à noite.', 'a smiling crescent moon', 'moon'),
  img('passaro', 'o pássaro', 'Tenho penas e duas asas.', 'a little blue bird', 'bird'),
  img('papagaio', 'o papagaio de papel', 'Voo no céu preso a um fio.', 'a colorful kite', 'kite'),
  // cuidado
  img('capacete', 'o capacete', 'Protejo a tua cabeça na bicicleta.', 'a blue bicycle helmet', 'helmet'),
  img('cinto', 'o cinto de segurança', 'Deves apertar-me quando viajas de carro.', 'a child car safety seat with seat belt straps', 'seat belt'),
  img('semaforo', 'o semáforo', 'Tenho luzes vermelha, amarela e verde.', 'a traffic light', 'traffic light'),
  img('passadeira', 'a passadeira', 'É aqui que atravessas a rua, com um adulto.', 'a short piece of grey asphalt road with white zebra crossing stripes painted on it, top view', 'crosswalk'),
  img('protetor', 'o protetor solar', 'Protejo a tua pele do sol.', 'a bottle of sunscreen lotion', 'sunscreen'),
  img('colete', 'o colete salva-vidas', 'Ajudo-te a flutuar na água.', 'an orange life vest', 'life jacket'),
  img('chapeu', 'o chapéu', 'Protejo a tua cabeça do sol.', 'a straw sun hat', 'hat'),
  // escola e traços
  img('lapis', 'o lápis', 'Escreves e desenhas comigo.', 'a yellow pencil', 'pencil'),
  img('borracha', 'a borracha', 'Apago o que está errado.', 'a pink eraser', 'eraser'),
  img('caderno', 'o caderno', 'Tenho folhas para escrever.', 'a spiral notebook', 'notebook'),
  img('tesoura', 'a tesoura', 'Corto papel, com cuidado.', 'a pair of child safety scissors', 'scissors'),
  img('mochila', 'a mochila', 'Levo os teus livros para a escola.', 'a yellow school backpack', 'backpack'),
  img('livro', 'o livro', 'Tenho páginas e histórias.', 'an open storybook', 'book'),
  img('pincel', 'o pincel', 'Pinto com tinta.', 'a paintbrush with paint on the tip', 'paintbrush'),
  img('paleta', 'a paleta', 'Guardo as tintas dos pintores.', 'a painter palette with paint blobs', 'palette'),
  img('ilha', 'a ilha', 'Sou terra rodeada de mar por todos os lados.', 'a tiny tropical island with one palm tree and sandy beach', 'island'),
  img('globo', 'o globo', 'Sou uma bola com o mapa do mundo.', 'a world globe', 'globe'),
  // espaço
  img('terra', 'a Terra', 'Sou o planeta onde vivemos.', 'planet earth', 'Earth'),
  img('saturno', 'Saturno', 'Sou um planeta com anéis.', 'planet saturn with rings', 'Saturn'),
  img('estrela', 'a estrela', 'Brilho no céu à noite.', 'a shiny golden star', 'star'),
  img('astronauta', 'o astronauta', 'Uso um fato especial para ir ao espaço.', 'a cute child astronaut in a white spacesuit', 'astronaut'),
  img('cometa', 'o cometa', 'Tenho uma cauda de luz.', 'a cute smiling yellow star with a long curved orange and yellow sparkly tail, a cartoon comet', 'comet'),
  img('telescopio', 'o telescópio', 'Ajudo-te a ver as estrelas de perto.', 'a white and blue telescope tube on a wooden tripod pointing up at the sky', 'telescope'),
  img('extraterrestre', 'o extraterrestre', 'Sou um amigo verde de outro planeta.', 'a friendly little green alien', 'alien'),
  img('satelite', 'o satélite', 'Ando à volta da Terra e envio sinais.', 'a space satellite with two blue solar panel wings and a dish antenna', 'satellite'),
  // festa
  img('baloes', 'os balões', 'Somos coloridos e cheios de ar.', 'a bunch of colorful balloons', 'balloons'),
  img('presente', 'o presente', 'Tenho um laço e uma surpresa dentro.', 'a wrapped gift box with a bow', 'present'),
  img('coroa', 'a coroa', 'Uso-me na cabeça das princesas e dos reis.', 'a golden crown with gems', 'crown'),
  img('castelo', 'o castelo', 'Tenho torres e bandeiras.', 'a fairytale castle', 'castle'),
  img('chapeu-festa', 'o chapéu de festa', 'Sou bicudo e uso-me nos aniversários.', 'a party hat with dots', 'party hat'),
);

export const item = (id: string): Item => {
  const it = ITEMS[id];
  if (!it) throw new Error('unknown item ' + id);
  return it;
};

// Every mini-game type. `say` holds the narrated instruction variants
// (each becomes a voice clip "i.<mech>.<n>").
export type Mech =
  | 'find' | 'riddle' | 'count' | 'memory' | 'odd' | 'shadow' | 'basket' | 'sort' | 'pattern' | 'simon'
  | 'size' | 'more' | 'trace' | 'paint' | 'mix' | 'colorof' | 'puzzle' | 'maze' | 'bubbles' | 'catch'
  | 'missing' | 'peek' | 'sound' | 'english' | 'feed' | 'connect' | 'letterstart';

export const MECH_SAY: Record<Mech, string[]> = {
  find: ['Toca em...', 'Onde está...', 'Encontra...'],
  riddle: ['Ouve a adivinha e descobre quem é!', 'Uma pista! Quem será?'],
  count: ['Vamos contar! Toca em cada um.', 'Conta comigo, um de cada vez.'],
  memory: ['Vira as cartas e encontra os pares iguais.', 'Jogo da memória! Encontra os pares.'],
  odd: ['Qual destes não pertence ao grupo?', 'Há um intruso! Qual é?'],
  shadow: ['De quem é esta sombra?', 'Quem se esconde atrás da sombra?'],
  basket: ['Enche o cesto! Arrasta as imagens iguais à do cesto.', 'Vamos às compras! Põe no cesto as imagens iguais.'],
  sort: ['Arruma cada imagem no seu grupo.', 'Cada coisa no seu lugar! Arrasta para o grupo certo.'],
  pattern: ['Descobre o que vem a seguir.', 'Olha o padrão. O que falta?'],
  simon: ['Vê e ouve com atenção. Depois, repete!', 'Memoriza a sequência e toca pela mesma ordem.'],
  size: ['Ordena do mais pequeno para o maior.', 'Ordena do maior para o mais pequeno.'],
  more: ['Onde há mais?', 'Onde há menos?'],
  trace: ['Segue o caminho com o dedo.', 'Desenha por cima, devagarinho.'],
  paint: ['Escolhe uma cor e pinta como no modelo.', 'Vamos pintar! Copia as cores do modelo.'],
  mix: ['Mistura duas cores para fazer...', 'Que duas cores fazem...'],
  colorof: ['De que cor é...', 'Qual é a cor de...'],
  puzzle: ['Monta o puzzle da ilha!', 'Junta as peças no sítio certo.'],
  maze: ['Ajuda a Gata Tanha a chegar ao fim do caminho.', 'Leva a Gata Tanha pelo labirinto.'],
  bubbles: ['Rebenta só as bolhas com...', 'Pop! Rebenta as bolhas com...'],
  catch: ['Apanha só...', 'Mexe o cesto e apanha...'],
  missing: ['Olha bem para estas imagens. Vou esconder uma!', 'Memoriza todas as imagens.'],
  peek: ['Alguém se escondeu! Procura...', 'Espreita atrás dos arbustos e encontra...'],
  sound: ['Ouve o som. Que instrumento é?', 'Escuta com atenção. Quem está a tocar?'],
  english: ['Ouve a palavra em inglês e toca na imagem certa.', 'Listen! Toca na imagem certa.'],
  feed: ['A Gata Tanha tem fome! Dá-lhe...', 'Arrasta para a Gata Tanha...'],
  connect: ['Liga os pontos pela ordem dos números.', 'Um, dois, três... liga os pontos!'],
  letterstart: ['Qual destas palavras começa com...', 'Encontra a imagem que começa com...'],
};

export const MECH_TITLE: Record<Mech, string> = {
  find: 'Encontrar', riddle: 'Adivinhas', count: 'Contar', memory: 'Memória', odd: 'O intruso', shadow: 'Sombras',
  basket: 'Cesto', sort: 'Arrumar', pattern: 'Padrões', simon: 'Repetir', size: 'Tamanhos', more: 'Mais e menos',
  trace: 'Traçar', paint: 'Pintar', mix: 'Misturar cores', colorof: 'Que cor?', puzzle: 'Puzzle', maze: 'Labirinto',
  bubbles: 'Bolhas', catch: 'Apanhar', missing: 'O que falta?', peek: 'Escondidas', sound: 'Sons', english: 'English',
  feed: 'Dar de comer', connect: 'Ligar pontos', letterstart: 'Primeira letra',
};

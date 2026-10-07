// Catalogue of every narrated clip. Keys map to /assets/voice/<key>.mp3.
// The generator script records exactly this list; the game plays it and falls
// back to the browser's speech synthesis if a clip is missing.
import { ITEMS, NUMBER_WORDS } from './items.ts';
import { ISLANDS } from './islands.ts';
import { MECH_SAY } from './mechanics.ts';

export const PRAISE = ['Muito bem!', 'Boa, Yuna!', 'Fantástico!', 'Isso mesmo!', 'És uma campeã!', 'Uau, que esperta!',
  'Excelente!', 'Conseguiste!', 'Incrível!', 'Que orgulho!', 'Perfeito!', 'Bravo!'];
export const ENCOURAGE = ['Quase! Tenta outra vez.', 'Hum, essa não é. Vamos tentar de novo?', 'Não faz mal, tu consegues!',
  'Olha com atenção e tenta outra vez.', 'Ups! Experimenta outra.', 'Estás quase lá!'];

export const UI_LINES: Record<string, string> = {
  welcome: 'Olá! Eu sou a Yuna, e esta é a minha gata, a Gata Tanha. Vamos explorar as ilhas?',
  welcomeBack: 'Olá outra vez! Que bom ver-te. Para onde vamos hoje?',
  chooseIsland: 'Escolhe uma ilha para visitar!',
  locked: 'Esta ilha ainda está a dormir. Primeiro, joga na ilha anterior!',
  choosePhase: 'Escolhe uma aventura: descobrir, praticar ou aventurar!',
  sail: 'Vamos navegar!',
  phaseDone: 'Fase completa! Ganhaste estrelas!',
  newIsland: 'Uma nova ilha acordou! Vamos lá?',
  howMany: 'Quantos são?',
  closeEyes: 'Fecha os olhos...',
  whatMissing: 'O que desapareceu?',
  watch: 'Olha com atenção!',
  yourTurn: 'Agora é a tua vez!',
  help: 'Vou ajudar-te um bocadinho.',
  sticker: 'Ganhaste um autocolante novo para o teu álbum!',
  album: 'Este é o teu álbum de descobertas.',
  meow: 'Miau!',
  lastOne: 'Só falta um!',
  great5: 'Já vamos a meio! Continua assim!',
};

export function allLines(): Record<string, string> {
  const L: Record<string, string> = {};
  for (const [k, v] of Object.entries(UI_LINES)) L['ui.' + k] = v;
  PRAISE.forEach((t, i) => (L['p.' + i] = t));
  ENCOURAGE.forEach((t, i) => (L['e.' + i] = t));
  for (const [m, list] of Object.entries(MECH_SAY)) list.forEach((t, i) => (L[`i.${m}.${i}`] = t));
  for (let n = 1; n <= 10; n++) L['num.' + n] = NUMBER_WORDS[n].replace(/^./, (c) => c.toUpperCase()) + '!';
  for (const it of Object.values(ITEMS)) {
    L['n.' + it.id] = it.name;
    L['c.' + it.id] = it.clue;
    if (it.en) L['en.' + it.id] = it.en.replace(/^./, (c) => c.toUpperCase()) + '!';
  }
  for (const isl of ISLANDS) {
    L['isl.' + isl.id] = isl.name;
    L['s.' + isl.id] = isl.story;
    L['r.' + isl.id] = `Parabéns! Completaste a ${isl.name} e ganhaste ${isl.reward}!`;
    for (const g of isl.groups) L[`g.${isl.id}.${g.id}`] = g.label.replace(/^./, (c) => c.toUpperCase());
  }
  return L;
}

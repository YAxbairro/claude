// "Pick the right one" family: find, riddle, english, shadow, odd one out,
// colour of, first letter, instrument sounds and "what's missing?".
import gsap from 'gsap';
import { h, onTap, wait } from '../core/dom.ts';
import { art } from '../core/art.ts';
import { sfx, say } from '../core/audio.ts';
import { pop, hint, popIn } from '../core/fx.ts';
import { ITEMS, LETTER_WORDS } from '../data/items.ts';
import { ISLANDS } from '../data/islands.ts';
import { pick, sample, shuffle, fresh, between } from '../core/rng.ts';
import { type Ctx, type Game, itemSound, INSTRUMENTS, sizeFor, testHook } from './types.ts';

const nOpts = (ctx: Ctx) => [3, 4, 6][ctx.level];
const v = (n: number) => between(0, n - 1);

type ChooseOpts = {
  ids: string[];
  correct: string;
  keys: string[];
  text: string;
  hero?: HTMLElement;          // big element shown above the options
  render?: (id: string) => HTMLElement;
  sayWrong?: boolean;          // say the name of a wrongly chosen item (teaches vocabulary)
  replayHero?: () => void;
};

export async function choose(ctx: Ctx, o: ChooseOpts) {
  const size = sizeFor(o.ids.length);
  const wrap = h('div.choice');
  if (o.hero) wrap.append(h('div.hero', o.hero));
  const grid = h(`div.cards.n${o.ids.length}.${size}`);
  wrap.append(grid);
  ctx.stage.append(wrap);
  const cards = o.ids.map((id) => {
    const c = h('button.card', { 'data-id': id, 'aria-label': ITEMS[id]?.word ?? id }, (o.render || ((x: string) => art(x)))(id));
    grid.append(c);
    return c;
  });
  if (o.hero) popIn(wrap.querySelector('.hero')!);
  popIn(cards, 0.07, 0.15);
  ctx.mood('think');
  const instructed = ctx.instruct(o.keys, o.text);
  testHook(o.correct);
  let wrongs = 0;
  await new Promise<void>((resolve) => {
    let done = false;
    for (const c of cards) {
      onTap(c, async () => {
        if (done || c.classList.contains('dim')) return;
        const id = c.dataset.id!;
        const snd = itemSound(id);
        if (id === o.correct) {
          done = true;
          c.classList.add('right');
          if (snd) sfx(snd, { vol: 0.8 });
          cards.filter((x) => x !== c).forEach((x) => gsap.to(x, { opacity: 0.25, scale: 0.9, duration: 0.3 }));
          await ctx.good(c, true);
          resolve();
        } else {
          wrongs++;
          ctx.bad(c);
          c.classList.add('dim');
          if (o.sayWrong !== false && ITEMS[id]) {
            if (snd) sfx(snd, { vol: 0.6 });
            await wait(250);
            await say(['n.' + id]);
          }
          if (wrongs >= 2) hint(cards.find((x) => x.dataset.id === o.correct)!);
        }
      });
    }
  });
  await instructed;
  await wait(200);
}

const islandPool = (ctx: Ctx, f: (id: string) => boolean = () => true) => ctx.island.items.filter(f);
const isImg = (id: string) => ITEMS[id]?.art === 'img';

export const find: Game = async (ctx) => {
  const pool = islandPool(ctx);
  const [target] = fresh(pool, 1);
  const ids = shuffle([target, ...sample(pool.filter((x) => x !== target), nOpts(ctx) - 1)]);
  const k = v(3);
  await choose(ctx, { ids, correct: target, keys: [`i.find.${k}`, 'n.' + target], text: `${['Toca em', 'Onde está', 'Encontra'][k]} ${ITEMS[target].name}?` });
};

export const riddle: Game = async (ctx) => {
  const pool = islandPool(ctx);
  const [target] = fresh(pool, 1);
  const ids = shuffle([target, ...sample(pool.filter((x) => x !== target), [3, 4, 4][ctx.level] - 1)]);
  const bubble = h('div.riddle-bubble', h('span.q', '?'), h('p', ITEMS[target].clue));
  await choose(ctx, { ids, correct: target, hero: bubble, keys: [`i.riddle.${v(2)}`, 'c.' + target], text: ITEMS[target].clue });
};

export const english: Game = async (ctx) => {
  const pool = islandPool(ctx, (id) => !!ITEMS[id].en);
  const [target] = fresh(pool, 1);
  const ids = shuffle([target, ...sample(pool.filter((x) => x !== target), [3, 4, 4][ctx.level] - 1)]);
  const word = ITEMS[target].en!;
  const hero = h('button.word-chip', '🔊 ' + word);
  onTap(hero, () => say('en.' + target));
  await choose(ctx, { ids, correct: target, hero, keys: [`i.english.${v(2)}`, 'en.' + target], text: `Listen! “${word}”`, sayWrong: false });
  await say(['en.' + target, 'n.' + target]);
};

export const shadow: Game = async (ctx) => {
  const pool = islandPool(ctx, (id) => ITEMS[id].art === 'img' || ITEMS[id].art === 'shape');
  const [target] = fresh(pool, 1);
  const ids = shuffle([target, ...sample(pool.filter((x) => x !== target), [3, 3, 4][ctx.level] - 1)]);
  const hero = h('div.shadow-hero', art(target, { silhouette: true }));
  if (ctx.level === 2) hero.style.transform = `rotate(${pick([-14, 12, -8])}deg)`;
  await choose(ctx, { ids, correct: target, hero, keys: [`i.shadow.${v(2)}`], text: 'De quem é esta sombra?' });
};

export const odd: Game = async (ctx) => {
  const groups = ctx.island.groups.filter((g) => g.items.length >= 3);
  let base: string[], intruder: string;
  if (groups.length >= 2) {
    const [g1, g2] = sample(groups, 2);
    base = sample(g1.items, Math.min(g1.items.length, [2, 3, 3][ctx.level]));
    intruder = pick(g2.items);
  } else {
    base = sample(ctx.island.items, [2, 3, 3][ctx.level]);
    const other = ISLANDS.filter((i) => i.id !== ctx.island.id).flatMap((i) => i.items).filter((id) => isImg(id) && !ctx.island.items.includes(id));
    intruder = pick(other);
  }
  const ids = shuffle([...base, intruder]);
  await choose(ctx, { ids, correct: intruder, keys: [`i.odd.${v(2)}`], text: 'Qual destes não pertence ao grupo?' });
  await say('n.' + intruder);
};

const COLOR_OF: Record<string, string> = {
  maca: 'vermelho', morango: 'vermelho', tomate: 'vermelho', joaninha: 'vermelho', caranguejo: 'vermelho', carro: 'vermelho',
  banana: 'amarelo', sol: 'amarelo', girassol: 'amarelo', pintainho: 'amarelo', pato: 'amarelo', queijo: 'amarelo', milho: 'amarelo', autocarro: 'amarelo', lapis: 'amarelo', mochila: 'amarelo',
  uvas: 'roxo', polvo: 'roxo',
  'laranja-fruta': 'laranja', cenoura: 'laranja', abobora: 'laranja', sumo: 'laranja', colete: 'laranja', 'estrela-mar': 'laranja',
  pera: 'verde', brocolos: 'verde', arvore: 'verde', tartaruga: 'verde', trator: 'verde', rebento: 'verde', extraterrestre: 'verde',
  baleia: 'azul', golfinho: 'azul', gota: 'azul', toalha: 'azul', capacete: 'azul', passaro: 'azul', bicicleta: 'azul',
  porco: 'rosa', flor: 'rosa', alforreca: 'rosa', borracha: 'rosa', oculos: 'rosa', concha: 'rosa',
  coco: 'castanho', peluche: 'castanho', cadeira: 'castanho', cavalo: 'castanho', pao: 'castanho',
  nuvem: 'branco', leite: 'branco', ovo: 'branco', ovelha: 'branco', dente: 'branco', gaivota: 'branco', coelho: 'branco',
};
const PALETTE = ['vermelho', 'azul', 'amarelo', 'verde', 'laranja', 'roxo', 'rosa', 'castanho', 'branco'];

export const colorof: Game = async (ctx) => {
  const local = islandPool(ctx, (id) => !!COLOR_OF[id]);
  const pool = local.length >= 3 ? local : Object.keys(COLOR_OF);
  const [target] = fresh(pool, 1);
  const col = COLOR_OF[target];
  const ids = shuffle([col, ...sample(PALETTE.filter((c) => c !== col), [2, 3, 4][ctx.level])]);
  const hero = h('div.big-item', art(target));
  const k = v(2);
  await choose(ctx, { ids, correct: col, hero, keys: [`i.colorof.${k}`, 'n.' + target], text: `${k ? 'Qual é a cor de' : 'De que cor é'} ${ITEMS[target].name}?` });
  await say('n.' + col);
};

export const letterstart: Game = async (ctx) => {
  const letters = Object.keys(LETTER_WORDS).filter((L) => {
    const w = LETTER_WORDS[L];
    return Object.values(ITEMS).some((it) => it.art === 'img' && it.word === w);
  });
  const [L] = fresh(letters, 1);
  const wordItem = (letter: string) => Object.values(ITEMS).find((it) => it.art === 'img' && it.word === LETTER_WORDS[letter])!.id;
  const target = wordItem(L);
  const others = sample(letters.filter((x) => x !== L), [2, 3, 3][ctx.level]).map(wordItem);
  const ids = shuffle([target, ...others]);
  const hero = h('div.letter-hero', art('l' + L));
  const k = v(2);
  await choose(ctx, { ids, correct: target, hero, keys: [`i.letterstart.${k}`, 'n.l' + L], text: `Que palavra começa com ${L}?` });
  await say(['n.' + target]);
};

export const sound: Game = async (ctx) => {
  const pool = ctx.island.items.filter((id) => INSTRUMENTS.includes(id));
  const [target] = fresh(pool, 1);
  const ids = shuffle([target, ...sample(pool.filter((x) => x !== target), [2, 3, 4][ctx.level])]);
  const btn = h('button.sound-btn', h('span', '🔊'), h('small', 'Ouvir outra vez'));
  const play = () => { sfx('inst-' + target); pop(btn); btn.classList.add('playing'); setTimeout(() => btn.classList.remove('playing'), 2400); };
  onTap(btn, play);
  const holder = h('div.choice', h('div.hero', btn));
  ctx.stage.append(holder);
  popIn(btn);
  ctx.mood('think');
  await ctx.instruct([`i.sound.${v(2)}`], 'Ouve o som. Que instrumento é?');
  play();
  await wait(2600);
  holder.remove();
  await choose(ctx, { ids, correct: target, hero: btn, keys: [], text: 'Que instrumento está a tocar?' });
  await say('n.' + target);
};

export const missing: Game = async (ctx) => {
  const n = [3, 4, 5][ctx.level];
  const pool = islandPool(ctx);
  const shown = sample(pool, n);
  const gone = pick(shown);
  const row = h(`div.cards.row.n${n}.${sizeFor(n)}`);
  const cards = shown.map((id) => h('div.card.static', { 'data-id': id }, art(id)));
  row.append(...cards);
  const wrap = h('div.choice', row);
  ctx.stage.append(wrap);
  popIn(cards);
  await ctx.instruct([`i.missing.${v(2)}`], 'Olha bem e memoriza as imagens!');
  await wait(1800 + 500 * n);
  const curtain = h('div.curtain', h('img', { src: import.meta.env.BASE_URL + 'assets/chars/tanha-sleep.webp', alt: '' }));
  wrap.append(curtain);
  gsap.fromTo(curtain, { yPercent: -100 }, { yPercent: 0, duration: 0.5, ease: 'bounce.out' });
  await say('ui.closeEyes');
  await wait(600);
  const goneCard = cards.find((c) => c.dataset.id === gone)!;
  goneCard.style.visibility = 'hidden';
  await gsap.to(curtain, { yPercent: -110, duration: 0.5, ease: 'power2.in' });
  curtain.remove();
  const optionIds = shuffle([gone, ...sample(pool.filter((x) => !shown.includes(x)), Math.min(2, pool.length - n))]);
  wrap.remove();
  const ghost = h(`div.cards.row.n${n}.${sizeFor(n)}`, ...cards);
  ctx.stage.append(h('div.missing-row', ghost));
  await choose(ctx, { ids: optionIds.length >= 2 ? optionIds : shuffle([gone, pick(pool.filter((x) => x !== gone))]), correct: gone, keys: ['ui.whatMissing'], text: 'O que desapareceu?' });
  goneCard.style.visibility = 'visible';
  popIn(goneCard);
};

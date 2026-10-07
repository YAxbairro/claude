// Memory family: matching pairs, Simon-style sequences, patterns, size order.
import gsap from 'gsap';
import { h, onTap, wait } from '../core/dom.ts';
import { art } from '../core/art.ts';
import { say, sfx, blip } from '../core/audio.ts';
import { popIn, sparkle, pop } from '../core/fx.ts';
import { ITEMS } from '../data/items.ts';
import { between, pick, sample, shuffle } from '../core/rng.ts';
import { type Game, itemSound, testHook } from './types.ts';
import { choose } from './choice.ts';

export const memory: Game = async (ctx) => {
  const pairs = [3, 4, 6][ctx.level];
  const ids = sample(ctx.island.items, Math.min(pairs, ctx.island.items.length));
  const deck = shuffle([...ids, ...ids]);
  const grid = h(`div.memory.p${deck.length}`);
  const cards = deck.map((id) => {
    const c = h('button.mcard', { 'data-id': id },
      h('div.mface.back', h('span', '★')),
      h('div.mface.front', art(id)));
    grid.append(c);
    return c;
  });
  ctx.stage.append(h('div.memory-wrap', grid));
  popIn(cards, 0.04);
  ctx.mood('think');
  const instr = ctx.instruct([`i.memory.${between(0, 1)}`], 'Vira as cartas e encontra os pares iguais.');
  // Easiest level gets a short peek at all the cards first.
  if (ctx.level === 0) {
    await wait(700);
    cards.forEach((c) => c.classList.add('open'));
    await wait(1600);
    cards.forEach((c) => c.classList.remove('open'));
  }
  let first: HTMLElement | null = null, busy = false, found = 0, flips = 0;
  await new Promise<void>((resolve) => {
    for (const c of cards) {
      onTap(c, async () => {
        if (busy || c.classList.contains('open')) return;
        c.classList.add('open');
        sfx('flip', { rate: 0.9 + Math.random() * 0.2 });
        if (!first) { first = c; return; }
        busy = true;
        flips++;
        const a = first, b = c;
        first = null;
        if (a.dataset.id === b.dataset.id) {
          found++;
          await wait(250);
          a.classList.add('matched'); b.classList.add('matched');
          sparkle(b, 8);
          blip(660 + found * 60, 0.1, 'triangle');
          const snd = itemSound(b.dataset.id!);
          if (snd) sfx(snd, { vol: 0.6 });
          say('n.' + b.dataset.id);
          busy = false;
          if (found === ids.length) setTimeout(resolve, 600);
        } else {
          await wait(900);
          a.classList.remove('open'); b.classList.remove('open');
          busy = false;
          // Generous: mismatches only start to count after many flips.
          if (flips > ids.length * 2) ctx.mistakes += 0.25;
        }
      });
    }
  });
  await instr;
  await ctx.good(grid, true);
};

export const simon: Game = async (ctx) => {
  const nTiles = [3, 4, 4][ctx.level];
  const len = [2, 3, 4][ctx.level];
  const tiles = sample(ctx.island.items, nTiles);
  const seq = Array.from({ length: len }, () => pick(tiles));
  for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) seq[i] = pick(tiles.filter((t) => t !== seq[i - 1]));
  const tones = [523, 659, 784, 988];
  const row = h(`div.simon.n${nTiles}`);
  const btns = tiles.map((id, i) => {
    const b = h('button.stile', { 'data-id': id, '--hue': String(i * 85) }, art(id));
    row.append(b);
    return b;
  });
  const dots = h('div.simon-dots', ...seq.map(() => h('span')));
  ctx.stage.append(h('div.simon-wrap', dots, row));
  popIn(btns, 0.08);
  const light = async (id: string, speak = true) => {
    const i = tiles.indexOf(id);
    const b = btns[i];
    b.classList.add('lit');
    blip(tones[i], 0.25, 'sine', 0.3);
    if (speak) await say('n.' + id); else await wait(350);
    await wait(150);
    b.classList.remove('lit');
    await wait(180);
  };
  const playSeq = async () => {
    row.classList.add('watching');
    ctx.mood('point');
    for (const id of seq) await light(id, true);
    row.classList.remove('watching');
  };
  await ctx.instruct([`i.simon.${between(0, 1)}`], 'Vê e ouve com atenção. Depois, repete!');
  await say('ui.watch');
  await playSeq();
  ctx.mood('think');
  let pos = 0;
  await new Promise<void>((resolve) => {
    say('ui.yourTurn');
    testHook({ seq });
    btns.forEach((b) => onTap(b, async () => {
      if (row.classList.contains('watching')) return;
      const id = b.dataset.id!;
      const i = tiles.indexOf(id);
      b.classList.add('lit');
      blip(tones[i], 0.18, 'sine', 0.3);
      setTimeout(() => b.classList.remove('lit'), 250);
      if (id === seq[pos]) {
        dots.children[pos].classList.add('on');
        pos++;
        if (pos === seq.length) { resolve(); }
      } else {
        ctx.bad(b);
        pos = 0;
        [...dots.children].forEach((d) => d.classList.remove('on'));
        await wait(900);
        await playSeq();
      }
    }));
  });
  await ctx.good(row, true);
};

export const pattern: Game = async (ctx) => {
  const kinds = [['A', 'B'], ['A', 'B', 'C'], ['A', 'A', 'B'], ['A', 'B', 'B']];
  const unit = ctx.level === 0 ? kinds[0] : ctx.level === 1 ? pick(kinds.slice(0, 3)) : pick(kinds.slice(1));
  const letters = [...new Set(unit)];
  const ids = sample(ctx.island.items, letters.length);
  const map = Object.fromEntries(letters.map((l, i) => [l, ids[i]]));
  const reps = unit.length === 2 ? 3 : 2;
  const seq = Array.from({ length: unit.length * reps }, (_, i) => map[unit[i % unit.length]]);
  const answer = map[unit[seq.length % unit.length]];
  const row = h('div.pattern-row', ...seq.map((id) => h('div.pcell', art(id))), h('div.pcell.blank', '?'));
  ctx.stage.append(row);
  popIn([...row.children], 0.07);
  const opts = shuffle([...new Set([answer, ...ids, ...sample(ctx.island.items.filter((x) => !ids.includes(x)), 1)])]).slice(0, 3);
  if (!opts.includes(answer)) opts[0] = answer;
  await choose(ctx, { ids: shuffle(opts), correct: answer, keys: [`i.pattern.${between(0, 1)}`], text: 'O que vem a seguir?', sayWrong: false });
  const blank = row.querySelector('.blank')!;
  blank.classList.remove('blank');
  blank.textContent = '';
  blank.append(art(answer));
  pop(blank, 1.2);
  await wait(400);
};

export const size: Game = async (ctx) => {
  const pool = ctx.island.items.filter((id) => ITEMS[id].art !== 'color');
  const id = pick(pool);
  const n = [3, 4, 5][ctx.level];
  const up = ctx.level === 0 || Math.random() < 0.6;
  const scales = Array.from({ length: n }, (_, i) => 0.42 + (i * 0.58) / (n - 1));
  const order = shuffle(scales.map((s, i) => ({ s, i })));
  const slots = h('div.size-slots', ...scales.map(() => h('div.slot')));
  const row = h('div.size-row', ...order.map(({ s, i }) => {
    const b = h('button.sitem', { 'data-i': String(i), style: { '--k': String(s) } }, art(id));
    return b;
  }));
  ctx.stage.append(h('div.size-wrap', row, slots));
  popIn([...row.children], 0.07);
  ctx.mood('think');
  const instr = ctx.instruct([`i.size.${up ? 0 : 1}`], up ? 'Ordena do mais pequeno para o maior.' : 'Ordena do maior para o mais pequeno.');
  testHook({ order: up ? scales.map((_, i) => i) : scales.map((_, i) => n - 1 - i) });
  let step = 0;
  await new Promise<void>((resolve) => {
    [...row.children].forEach((b) => onTap(b, () => {
      const el = b as HTMLElement;
      if (el.classList.contains('placed')) return;
      const want = up ? step : n - 1 - step;
      if (Number(el.dataset.i) !== want) { ctx.bad(el); return; }
      const slot = slots.children[step] as HTMLElement;
      const a = el.getBoundingClientRect();
      el.classList.add('placed');
      slot.append(el);
      const r = el.getBoundingClientRect();
      gsap.fromTo(el, { x: a.left - r.left, y: a.top - r.top }, { x: 0, y: 0, duration: 0.4, ease: 'back.out(1.4)' });
      blip(330 * Math.pow(2, (up ? step : n - step) / 6), 0.1, 'triangle');
      step++;
      if (step === n) setTimeout(resolve, 450);
    }));
  });
  await instr;
  await ctx.good(slots, true);
};

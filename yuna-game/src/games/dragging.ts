// Drag & drop family: fill the basket, sort into groups, feed Gata Tanha.
import gsap from 'gsap';
import { h, wait } from '../core/dom.ts';
import { art, charSrc } from '../core/art.ts';
import { say, sfx, blip } from '../core/audio.ts';
import { popIn, sparkle, pop } from '../core/fx.ts';
import { draggable, settleInto } from '../core/drag.ts';
import { ITEMS } from '../data/items.ts';
import { between, pick, sample, shuffle, fresh } from '../core/rng.ts';
import { type Game, sizeFor, testHook } from './types.ts';

const imgPool = (ids: string[]) => {
  const p = ids.filter((id) => ITEMS[id].art === 'img');
  return p.length >= 3 ? p : ['maca', 'banana', 'laranja-fruta', 'manga', 'uvas', 'morango'];
};

export const basket: Game = async (ctx) => {
  const pool = imgPool(ctx.island.items);
  const [target] = fresh(pool, 1);
  const need = [2, 3, 4][ctx.level];
  const distract = [2, 3, 4][ctx.level];
  const others = sample(pool.filter((x) => x !== target), Math.min(3, pool.length - 1));
  const ids = shuffle([...Array(need).fill(target), ...Array.from({ length: distract }, () => pick(others))]);
  const bin = h('div.basket', h('div.basket-sign', art(target), h('b.need', `0/${need}`)), h('div.basket-in'));
  const tray = h(`div.drag-tray.${sizeFor(ids.length)}`);
  const pieces = ids.map((id) => h('div.piece', { 'data-id': id }, art(id)));
  tray.append(...pieces);
  ctx.stage.append(h('div.drag-wrap', tray, bin));
  popIn(pieces, 0.05);
  popIn(bin);
  ctx.mood('point');
  const instr = ctx.instruct([`i.basket.${between(0, 1)}`], 'Enche o cesto com as imagens iguais!');
  let got = 0;
  await new Promise<void>((resolve) => {
    for (const p of pieces) {
      draggable(p, {
        zones: () => [bin],
        onDrop: (zone) => {
          if (!zone) return 'reject';
          if (p.dataset.id !== target) { ctx.bad(p); return 'reject'; }
          got++;
          p.classList.add('locked');
          settleInto(p, bin, bin.querySelector('.basket-in') as HTMLElement);
          sfx('drop');
          blip(523 * Math.pow(2, got / 12), 0.08, 'triangle');
          say('num.' + got);
          bin.querySelector('.need')!.textContent = `${got}/${need}`;
          pop(bin, 1.08);
          if (got === need) setTimeout(resolve, 500);
          return 'accept';
        },
      });
    }
  });
  await instr;
  pieces.filter((p) => !p.classList.contains('locked')).forEach((p) => gsap.to(p, { opacity: 0, scale: 0.5, duration: 0.3 }));
  await ctx.good(bin, true);
};

export const sort: Game = async (ctx) => {
  const groups = ctx.island.groups.filter((g) => g.items.length >= 2);
  const gs = ctx.level === 2 && groups.length >= 3 ? sample(groups, 3) : sample(groups, 2);
  const per = [2, 3, 3][ctx.level];
  const items = shuffle(gs.flatMap((g) => sample(g.items, Math.min(per, g.items.length)).map((id) => ({ id, g: g.id }))));
  const bins = gs.map((g) => h('div.bin', { 'data-g': g.id },
    h('button.bin-label', { onclick: () => say(`g.${ctx.island.id}.${g.id}`) }, '🔊 ', g.label),
    h('div.bin-in')));
  const tray = h(`div.drag-tray.${sizeFor(items.length)}`);
  const pieces = items.map(({ id, g }) => h('div.piece', { 'data-id': id, 'data-g': g }, art(id)));
  tray.append(...pieces);
  ctx.stage.append(h(`div.sort-wrap.b${bins.length}`, tray, h('div.bins', ...bins)));
  popIn(pieces, 0.05);
  popIn(bins, 0.1);
  ctx.mood('point');
  const instr = (async () => {
    await ctx.instruct([`i.sort.${between(0, 1)}`, ...gs.map((g) => `g.${ctx.island.id}.${g.id}`)], `Arruma: ${gs.map((g) => g.label).join(' · ')}`);
  })();
  let left = pieces.length;
  await new Promise<void>((resolve) => {
    for (const p of pieces) {
      draggable(p, {
        zones: () => bins,
        onDrop: (zone) => {
          if (!zone) return 'reject';
          if (zone.dataset.g !== p.dataset.g) { ctx.bad(p); say('n.' + p.dataset.id); return 'reject'; }
          p.classList.add('locked');
          settleInto(p, zone, zone.querySelector('.bin-in') as HTMLElement);
          sfx('drop');
          sparkle(p, 6);
          say('n.' + p.dataset.id);
          left--;
          if (left === 0) setTimeout(resolve, 600);
          return 'accept';
        },
      });
    }
  });
  await instr;
  await ctx.good(null, true);
};

export const feed: Game = async (ctx) => {
  const pool = imgPool(ctx.island.items);
  const [target] = fresh(pool, 1);
  const ids = shuffle([target, ...sample(pool.filter((x) => x !== target), [2, 3, 4][ctx.level])]);
  const cat = h('div.cat-mouth', h('img', { src: charSrc('tanha-sit'), alt: 'Gata Tanha', draggable: 'false' }), h('div.mouth-zone'));
  const tray = h(`div.drag-tray.${sizeFor(ids.length)}`);
  const pieces = ids.map((id) => h('div.piece', { 'data-id': id }, art(id)));
  tray.append(...pieces);
  ctx.stage.append(h('div.drag-wrap.feed', tray, cat));
  popIn(pieces, 0.06);
  gsap.fromTo(cat, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: 'back.out' });
  testHook({ feed: target });
  const instr = ctx.instruct([`i.feed.${between(0, 1)}`, 'n.' + target], `A Gata Tanha tem fome! Dá-lhe ${ITEMS[target].name}.`);
  await new Promise<void>((resolve) => {
    for (const p of pieces) {
      draggable(p, {
        zones: () => [cat],
        onStart: () => cat.classList.add('open'),
        onDrop: async (zone) => {
          cat.classList.remove('open');
          if (!zone) return 'reject';
          if (p.dataset.id !== target) {
            ctx.bad(p);
            gsap.fromTo(cat, { rotation: 0 }, { keyframes: { rotation: [-6, 6, -4, 0] }, duration: 0.5 });
            return 'reject';
          }
          p.classList.add('locked');
          const c = cat.getBoundingClientRect(), r = p.getBoundingClientRect();
          await gsap.to(p, { x: `+=${c.left + c.width / 2 - (r.left + r.width / 2)}`, y: `+=${c.top + c.height * 0.45 - (r.top + r.height / 2)}`, scale: 0.1, duration: 0.35, ease: 'power2.in' });
          p.style.visibility = 'hidden';
          sfx('meow');
          gsap.fromTo(cat, { scale: 1 }, { scale: 1.12, yoyo: true, repeat: 3, duration: 0.12 });
          setTimeout(() => sfx('purr', { vol: 0.6 }), 500);
          resolve();
          return 'accept';
        },
      });
    }
  });
  await instr;
  await wait(400);
  await ctx.good(cat, true);
};

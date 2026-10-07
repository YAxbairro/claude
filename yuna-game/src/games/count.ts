// Counting family: count, more/less, connect the dots.
import gsap from 'gsap';
import { h, onTap, svg, wait } from '../core/dom.ts';
import { art } from '../core/art.ts';
import { say, blip, sfx } from '../core/audio.ts';
import { pop, popIn, sparkle, burstAt } from '../core/fx.ts';
import { ITEMS } from '../data/items.ts';
import { between, pick, shuffle, sample, fresh } from '../core/rng.ts';
import { type Ctx, type Game, testHook } from './types.ts';
import { choose } from './choice.ts';

const FALLBACK = ['maca', 'banana', 'concha', 'estrela', 'peixe', 'flor', 'bola', 'coco'];
function countables(ctx: Ctx) {
  const local = ctx.island.items.filter((id) => ITEMS[id].art === 'img');
  return local.length >= 3 ? local : FALLBACK;
}

/** Scatter n elements over a box without overlaps (jittered grid). */
function scatter(box: HTMLElement, els: HTMLElement[]) {
  const n = els.length;
  const cols = Math.ceil(Math.sqrt(n * 1.6));
  const rows = Math.ceil(n / cols);
  const cells = shuffle(Array.from({ length: cols * rows }, (_, i) => i)).slice(0, n);
  els.forEach((el, i) => {
    const c = cells[i] % cols, r = Math.floor(cells[i] / cols);
    const jx = (Math.random() - 0.5) * 0.35, jy = (Math.random() - 0.5) * 0.35;
    el.style.left = ((c + 0.5 + jx) / cols) * 100 + '%';
    el.style.top = ((r + 0.5 + jy) / rows) * 100 + '%';
    el.style.setProperty('--rot', between(-12, 12) + 'deg');
    box.append(el);
  });
  box.style.setProperty('--cell', `min(${92 / cols}cqw, ${92 / rows}cqh)`);
}

export const count: Game = async (ctx) => {
  const pool = countables(ctx);
  const [target] = fresh(pool, 1);
  const n = [between(2, 5), between(3, 7), between(4, 9)][ctx.level];
  const distract = ctx.level === 2 ? between(2, 3) : 0;
  const other = pick(pool.filter((x) => x !== target));
  const field = h('div.scatter');
  const objs = [...Array(n).fill(target), ...Array(distract).fill(other)].map((id) => h('button.obj', { 'data-id': id }, art(id)));
  scatter(field, shuffle(objs));
  const hero = ctx.level === 2 ? h('div.count-hint', 'Conta só:', art(target)) : null;
  const wrap = h('div.count-wrap', hero, field);
  ctx.stage.append(wrap);
  popIn(objs, 0.05);
  ctx.mood('point');
  const instr = ctx.instruct([`i.count.${between(0, 1)}`, ...(ctx.level === 2 ? ['n.' + target] : [])], ctx.level === 2 ? `Conta só ${ITEMS[target].name}!` : 'Vamos contar! Toca em cada um.');
  testHook({ count: target });
  let counted = 0;
  await new Promise<void>((resolve) => {
    for (const o of objs) {
      onTap(o, () => {
        if (o.classList.contains('counted')) return;
        if (o.dataset.id !== target) { ctx.bad(o); return; }
        counted++;
        o.classList.add('counted');
        o.append(h('span.num-badge', String(counted)));
        blip(440 * Math.pow(2, counted / 12), 0.09, 'triangle');
        pop(o, 1.25);
        say('num.' + counted);
        if (counted === n) setTimeout(resolve, 650);
      });
    }
  });
  await instr;
  const opts = shuffle([...new Set([n, Math.max(1, n - 1), Math.min(10, n + 1), Math.min(10, n + 2)])].slice(0, 3));
  if (!opts.includes(n)) opts[0] = n;
  wrap.classList.add('shrink');
  await choose(ctx, { ids: shuffle(opts).map((x) => 'n' + x), correct: 'n' + n, keys: ['ui.howMany'], text: 'Quantos são?', sayWrong: false });
  await say('num.' + n);
};

export const more: Game = async (ctx) => {
  const pool = countables(ctx);
  const [a, b] = sample(pool, 2);
  const askMore = Math.random() < 0.6 || ctx.level === 0;
  let na = between(1, [5, 7, 9][ctx.level]), nb = between(1, [5, 7, 9][ctx.level]);
  const minDiff = [3, 2, 1][ctx.level];
  while (Math.abs(na - nb) < minDiff) { na = between(1, [6, 8, 10][ctx.level]); nb = between(1, [6, 8, 10][ctx.level]); }
  const sameKind = ctx.level < 2;
  const trays = [[na, a], [nb, sameKind ? a : b]].map(([n, id], i) => {
    const t = h('button.tray', { 'data-i': i });
    const field = h('div.scatter.small');
    scatter(field, Array.from({ length: n as number }, () => h('div.obj', art(id as string))));
    t.append(field);
    return t;
  });
  const wrap = h('div.more-wrap', trays[0], h('div.vs', '?'), trays[1]);
  ctx.stage.append(wrap);
  popIn(trays, 0.15);
  ctx.mood('think');
  const instr = ctx.instruct([`i.more.${askMore ? 0 : 1}`], askMore ? 'Onde há mais?' : 'Onde há menos?');
  const right = (askMore ? na > nb : na < nb) ? 0 : 1;
  testHook({ tray: right });
  await new Promise<void>((resolve) => {
    trays.forEach((t, i) => onTap(t, async () => {
      if (t.classList.contains('dim')) return;
      if (i === right) {
        t.classList.add('right');
        trays.forEach((x, j) => x.append(h('span.tray-count', String(j === 0 ? na : nb))));
        await ctx.good(t, true);
        resolve();
      } else { ctx.bad(t); t.classList.add('dim'); }
    }));
  });
  await instr;
};

// Dense outlines (0..100 box). Dots are sampled evenly along the perimeter.
const OUTLINES: Record<string, { pts: number[][]; item: string; color: string }> = {
  estrela: { item: 'estrela-forma', color: '#ffc928', pts: Array.from({ length: 10 }, (_, i) => { const r = i % 2 ? 19 : 45, a = -Math.PI / 2 + (i * Math.PI) / 5; return [50 + r * Math.cos(a), 52 + r * Math.sin(a)]; }) },
  coracao: { item: 'coracao', color: '#ff5d8f', pts: Array.from({ length: 40 }, (_, i) => { const t = (i / 40) * Math.PI * 2 + Math.PI; return [50 + 2.6 * 16 * Math.pow(Math.sin(t), 3), 46 - 2.6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]; }) },
  barco: { item: 'barco', color: '#ff8a1f', pts: [[50, 8], [80, 62], [92, 66], [78, 88], [22, 88], [8, 66], [50, 66]] },
  peixe: { item: 'peixe', color: '#2f8ff0', pts: [[12, 50], [30, 30], [55, 25], [75, 38], [92, 22], [88, 50], [92, 78], [75, 62], [55, 75], [30, 70]] },
  triangulo: { item: 'triangulo', color: '#3dbb5b', pts: [[50, 10], [90, 86], [10, 86]] },
};

function resample(pts: number[][], n: number) {
  const closed = [...pts, pts[0]];
  const seg = closed.slice(1).map((p, i) => Math.hypot(p[0] - closed[i][0], p[1] - closed[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const out: number[][] = [];
  for (let k = 0; k < n; k++) {
    let d = (k / n) * total, i = 0;
    while (d > seg[i]) { d -= seg[i]; i++; }
    const t = d / seg[i], A = closed[i], B = closed[i + 1];
    out.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
  }
  return out;
}

export const connect: Game = async (ctx) => {
  const n = [5, 7, 10][ctx.level];
  const key = pick(Object.keys(OUTLINES).filter((k) => !(k === 'estrela' && n < 10) && !(k === 'triangulo' && n > 6)));
  const shape = OUTLINES[key];
  const pts = key === 'estrela' && n === 10 ? shape.pts : resample(shape.pts, n);
  const board = h('div.dots-board');
  const s = svg('svg', { viewBox: '0 0 100 100', class: 'dots-svg' });
  const fill = svg('polygon', { points: pts.map((p) => p.join(',')).join(' '), fill: shape.color, opacity: 0 });
  const line = svg('polyline', { points: '', fill: 'none', stroke: '#8d4fe0', 'stroke-width': 2.6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  s.append(fill, line);
  board.append(s);
  const dots = pts.map((p, i) => {
    const d = h('button.dot', { style: { left: 6 + p[0] * 0.88 + '%', top: 6 + p[1] * 0.88 + '%' } }, String(i + 1));
    board.append(d);
    return d;
  });
  ctx.stage.append(h('div.dots-wrap', board));
  popIn(dots, 0.04);
  ctx.mood('point');
  const instr = ctx.instruct([`i.connect.${between(0, 1)}`], 'Liga os pontos pela ordem dos números.');
  let next = 0;
  testHook({ dots: n });
  const drawn: number[][] = [];
  dots[0].classList.add('next');
  await new Promise<void>((resolve) => {
    const tapDot = (i: number) => {
      if (i !== next) { if (i > next) ctx.bad(dots[i]); return; }
      dots[i].classList.remove('next');
      dots[i].classList.add('done');
      drawn.push(pts[i]);
      line.setAttribute('points', drawn.map((p) => p.join(',')).join(' '));
      blip(392 * Math.pow(2, i / 8), 0.08, 'triangle');
      say('num.' + (i + 1));
      next++;
      if (next === n) {
        drawn.push(pts[0]);
        line.setAttribute('points', drawn.map((p) => p.join(',')).join(' '));
        resolve();
      } else dots[next].classList.add('next');
    };
    dots.forEach((d, i) => onTap(d, () => tapDot(i)));
    // Dragging a finger across the dots also works.
    board.addEventListener('pointermove', (e) => {
      if (e.buttons === 0 && e.pointerType === 'mouse') return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const i = dots.indexOf(el as HTMLElement);
      if (i === next) tapDot(i);
    });
  });
  await instr;
  gsap.to(fill, { attr: { opacity: 0.85 }, duration: 0.6 });
  sfx('star');
  sparkle(board, 16);
  const reveal = h('div.dots-reveal', art(shape.item));
  board.append(reveal);
  popIn(reveal);
  burstAt(board);
  await ctx.good(null, true);
  await say('n.' + shape.item);
  await wait(300);
};

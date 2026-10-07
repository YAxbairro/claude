// Drawing family: tracing letters/numbers/paths, painting by model, mixing colours.
import gsap from 'gsap';
import { h, onTap, svg, wait } from '../core/dom.ts';
import { art } from '../core/art.ts';
import { say, sfx, blip } from '../core/audio.ts';
import { popIn, sparkle, pop, burstAt } from '../core/fx.ts';
import { ITEMS } from '../data/items.ts';
import { between, pick, sample, shuffle } from '../core/rng.ts';
import { type Game, testHook } from './types.ts';

type Pt = [number, number];
const arc = (cx: number, cy: number, rx: number, ry: number, a0: number, a1: number, steps = 18): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });

// Strokes in a 100x100 box, written in the usual school order.
const GLYPHS: Record<string, Pt[][]> = {
  A: [[[22, 90], [50, 10], [78, 90]], [[34, 60], [66, 60]]],
  E: [[[74, 12], [28, 12], [28, 88], [74, 88]], [[28, 50], [64, 50]]],
  I: [[[50, 10], [50, 90]]],
  O: [arc(50, 50, 32, 40, -90, -450, 32)],
  U: [[[26, 10], ...arc(50, 62, 24, 26, 180, 0, 16), [74, 10]]],
  L: [[[30, 10], [30, 88], [76, 88]]],
  M: [[[20, 90], [20, 12], [50, 62], [80, 12], [80, 90]]],
  P: [[[30, 90], [30, 12]], [[30, 12], ...arc(46, 32, 26, 20, -90, 90, 14), [30, 52]]],
  S: [[...arc(50, 30, 24, 19, -20, -270, 14), ...arc(50, 69, 25, 19, -90, 160, 14)]],
  T: [[[14, 12], [86, 12]], [[50, 12], [50, 90]]],
  B: [[[30, 90], [30, 10]], [[30, 10], ...arc(46, 29, 22, 19, -90, 90, 12), ...arc(48, 68, 26, 21, -90, 90, 12), [30, 89]]],
  C: [arc(54, 50, 34, 40, -40, -320, 24)],
  1: [[[32, 26], [54, 10], [54, 90]]],
  2: [[...arc(50, 32, 25, 21, -170, 20, 14), [24, 88], [78, 88]]],
  3: [[...arc(48, 30, 24, 19, -160, 90, 14), ...arc(48, 69, 26, 21, -90, 160, 14)]],
  4: [[[60, 90], [60, 10], [18, 64], [82, 64]]],
  5: [[[72, 12], [32, 12], [28, 46], ...arc(48, 64, 27, 24, -130, 150, 16)]],
  6: [[...arc(58, 50, 30, 40, -60, -180, 10), ...arc(50, 66, 26, 24, 180, 540, 24)]],
  7: [[[22, 12], [78, 12], [40, 90]]],
  8: [[...arc(50, 29, 21, 19, 90, -270, 20), ...arc(50, 69, 25, 21, -90, 270, 24)]],
  9: [[...arc(48, 33, 25, 23, 0, 360, 24), [73, 33], [66, 90]]],
};
const PATHS: Record<string, Pt[][]> = {
  onda: [Array.from({ length: 40 }, (_, i) => [8 + i * 2.15, 50 + Math.sin(i / 39 * Math.PI * 3) * 26] as Pt)],
  ziguezague: [[[8, 30], [26, 72], [44, 30], [62, 72], [80, 30], [92, 60]]],
  espiral: [Array.from({ length: 60 }, (_, i) => { const a = i / 59 * Math.PI * 4.2, r = 42 - i * 0.62; return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as Pt; })],
  laco: [[[8, 70], ...arc(50, 46, 22, 26, 160, -200, 26), [92, 70]]],
  circulo: [arc(50, 50, 38, 38, -90, 270, 32)],
  quadrado: [[[16, 16], [84, 16], [84, 84], [16, 84], [16, 16]]],
  triangulo: [[[50, 10], [90, 86], [10, 86], [50, 10]]],
};

function densify(stroke: Pt[], step = 1.2): Pt[] {
  const out: Pt[] = [stroke[0]];
  for (let i = 1; i < stroke.length; i++) {
    const [ax, ay] = stroke[i - 1], [bx, by] = stroke[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 1; k <= n; k++) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}

export const trace: Game = async (ctx) => {
  const isl = ctx.island.id;
  let key: string, strokes: Pt[][], sayKey: string | null = null, label = '';
  const letters = ctx.island.items.filter((id) => id.startsWith('l')).map((id) => id.slice(1));
  if (isl === 3 || (isl === 17 && Math.random() < 0.5)) {
    key = pick(letters.length ? letters : Object.keys(GLYPHS).filter((k) => isNaN(Number(k))));
    strokes = GLYPHS[key]; sayKey = 'n.l' + key; label = key;
  } else if (isl === 2 || isl === 17) {
    key = String(between(1, ctx.level === 0 ? 5 : 9));
    strokes = GLYPHS[key]; sayKey = 'num.' + key; label = key;
  } else if (isl === 1) {
    key = pick(['circulo', 'quadrado', 'triangulo']);
    strokes = PATHS[key]; sayKey = 'n.' + key;
  } else {
    key = pick(['onda', 'ziguezague', 'espiral', 'laco']);
    strokes = PATHS[key];
  }
  const dense = strokes.map((s) => densify(s));
  const box = h('div.trace-box');
  const cv = h('canvas.trace-cv') as HTMLCanvasElement;
  box.append(cv);
  if (label) box.append(h('div.trace-ghost', label));
  ctx.stage.append(h('div.trace-wrap', box));
  popIn(box);
  ctx.mood('point');
  const instr = ctx.instruct([`i.trace.${between(0, 1)}`, ...(sayKey ? [sayKey] : [])], label ? `Traça ${label} com o dedo.` : 'Segue o caminho com o dedo.');
  await wait(50);
  const dpr = Math.min(2, devicePixelRatio || 1);
  const size = box.clientWidth;
  cv.width = cv.height = size * dpr;
  const g = cv.getContext('2d')!;
  g.scale((size * dpr) / 100, (size * dpr) / 100);
  const lw = [11, 9.5, 8][ctx.level];
  let si = 0, prog = 0;
  const colors = ['#ff5d8f', '#ffb020', '#3dbb5b', '#2f8ff0', '#8d4fe0'];
  const draw = (finger?: Pt) => {
    g.clearRect(0, 0, 100, 100);
    g.lineCap = 'round'; g.lineJoin = 'round';
    dense.forEach((pts, i) => {
      g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.strokeStyle = 'rgba(141,79,224,.16)'; g.lineWidth = lw + 4; g.stroke();
      g.setLineDash([0.1, 4]); g.strokeStyle = 'rgba(141,79,224,.55)'; g.lineWidth = 1.8; g.stroke(); g.setLineDash([]);
      const end = i < si ? pts.length : i === si ? prog + 1 : 0;
      if (end > 1) {
        g.beginPath(); pts.slice(0, end).forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y)));
        g.strokeStyle = colors[i % colors.length]; g.lineWidth = lw; g.stroke();
      }
    });
    if (si < dense.length) {
      const [x, y] = dense[si][prog];
      g.beginPath(); g.arc(x, y, lw * 0.75, 0, Math.PI * 2); g.fillStyle = '#3dbb5b'; g.fill();
      g.lineWidth = 1.5; g.strokeStyle = '#fff'; g.stroke();
      const last = dense[si][dense[si].length - 1];
      g.beginPath(); g.arc(last[0], last[1], lw * 0.55, 0, Math.PI * 2); g.fillStyle = '#ffc928'; g.fill();
    }
    if (finger) { g.beginPath(); g.arc(finger[0], finger[1], 2.4, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); }
  };
  draw();
  const tol = [13, 11, 9][ctx.level];
  testHook({ trace: dense });
  await new Promise<void>((resolve) => {
    let drawing = false, lastBlip = 0;
    const toLocal = (e: PointerEvent): Pt => { const r = cv.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100]; };
    cv.addEventListener('pointerdown', (e) => { drawing = true; cv.setPointerCapture(e.pointerId); move(e); });
    cv.addEventListener('pointerup', () => { drawing = false; });
    cv.addEventListener('pointercancel', () => { drawing = false; });
    const move = (e: PointerEvent) => {
      if (!drawing || si >= dense.length) return;
      const p = toLocal(e);
      const pts = dense[si];
      // Advance to the furthest point within tolerance in a window ahead (can't skip far).
      let best = prog;
      for (let k = prog; k < Math.min(pts.length, prog + 14); k++) if (Math.hypot(pts[k][0] - p[0], pts[k][1] - p[1]) < tol) best = k;
      if (best > prog) {
        prog = best;
        if (performance.now() - lastBlip > 90) { blip(300 + (prog / pts.length) * 500, 0.05, 'triangle', 0.12); lastBlip = performance.now(); }
      }
      if (prog >= pts.length - 2) {
        si++; prog = 0;
        sfx('star', { vol: 0.5 });
        sparkle(box, 8);
        if (si >= dense.length) { draw(); resolve(); return; }
      }
      draw(p);
    };
    cv.addEventListener('pointermove', move);
  });
  await instr;
  gsap.fromTo(box, { rotation: -3 }, { rotation: 0, duration: 0.6, ease: 'elastic.out' });
  if (sayKey) say(sayKey);
  await ctx.good(box, true);
};

// ── Paint by model
type Region = { d?: string; c?: number[]; r?: number[]; e?: number[]; poly?: string; color: string };
const SCENES: Region[][] = [
  // house
  [{ r: [0, 120, 200, 40], color: 'verde' }, { r: [45, 62, 110, 62], color: 'amarelo' }, { poly: '35,64 100,18 165,64', color: 'vermelho' },
    { r: [88, 86, 26, 38], color: 'castanho' }, { r: [124, 76, 22, 20], color: 'azul' }, { c: [28, 28, 16], color: 'laranja' }],
  // boat
  [{ d: 'M0 128 Q50 112 100 128 T200 128 V160 H0Z', color: 'azul' }, { d: 'M40 108 H160 L144 132 H56 Z', color: 'castanho' },
    { poly: '98,24 98,102 50,102', color: 'amarelo' }, { poly: '104,34 104,102 146,102', color: 'rosa' }, { poly: '100,10 122,16 100,22', color: 'vermelho' }, { c: [170, 30, 14], color: 'laranja' }],
  // flower
  [{ r: [96, 80, 8, 64], color: 'verde' }, { e: [124, 112, 18, 8], color: 'verde' }, { c: [100, 38, 14], color: 'rosa' }, { c: [126, 58, 14], color: 'rosa' },
    { c: [74, 58, 14], color: 'rosa' }, { c: [100, 60, 12], color: 'amarelo' }, { d: 'M76 132 H124 L118 158 H82 Z', color: 'laranja' }],
  // fish
  [{ e: [96, 80, 52, 34], color: 'laranja' }, { poly: '146,80 186,50 186,110', color: 'amarelo' }, { poly: '86,48 112,22 118,52', color: 'roxo' },
    { c: [66, 72, 9], color: 'branco' }, { c: [32, 34, 8], color: 'azul' }, { c: [18, 58, 6], color: 'azul' }],
  // balloon
  [{ e: [100, 64, 46, 54], color: 'vermelho' }, { d: 'M100 10 C80 30 80 100 100 118 C120 100 120 30 100 10Z', color: 'amarelo' },
    { r: [86, 132, 28, 20], color: 'castanho' }, { e: [34, 140, 30, 12], color: 'branco' }, { e: [168, 30, 24, 10], color: 'branco' }],
];
const HEX = (id: string) => ITEMS[id].hex!;

function regionEl(rg: Region) {
  if (rg.r) return svg('rect', { x: rg.r[0], y: rg.r[1], width: rg.r[2], height: rg.r[3], rx: 4 });
  if (rg.c) return svg('circle', { cx: rg.c[0], cy: rg.c[1], r: rg.c[2] });
  if (rg.e) return svg('ellipse', { cx: rg.e[0], cy: rg.e[1], rx: rg.e[2], ry: rg.e[3] });
  if (rg.poly) return svg('polygon', { points: rg.poly });
  return svg('path', { d: rg.d! });
}

export const paint: Game = async (ctx) => {
  const scene = pick(SCENES);
  const toPaint = ctx.level === 2 ? scene.map((_, i) => i) : sample(scene.map((_, i) => i), [3, 4][ctx.level]);
  const mk = (model: boolean) => {
    const s = svg('svg', { viewBox: '0 0 200 160', class: model ? 'paint-model' : 'paint-board' });
    s.append(svg('rect', { x: 0, y: 0, width: 200, height: 160, fill: '#eaf8ff', rx: 10 }));
    scene.forEach((rg, i) => {
      const el = regionEl(rg);
      const painted = model || !toPaint.includes(i);
      el.setAttribute('fill', painted ? HEX(rg.color) : '#ffffff');
      el.setAttribute('stroke', '#3b2f5c'); el.setAttribute('stroke-width', '2.2'); el.setAttribute('stroke-linejoin', 'round');
      el.setAttribute('data-i', String(i));
      if (!painted) el.classList.add('paintable');
      s.append(el);
    });
    return s;
  };
  const board = mk(false);
  const model = mk(true);
  const colors = [...new Set(toPaint.map((i) => scene[i].color))];
  const palette = shuffle([...colors, ...sample(['vermelho', 'azul', 'amarelo', 'verde', 'roxo', 'rosa', 'laranja'].filter((c) => !colors.includes(c)), ctx.level === 0 ? 1 : 2)]);
  let selected = '';
  const pots = palette.map((c) => {
    const p = h('button.pot', { 'data-c': c, style: { '--c': HEX(c) } }, h('span'));
    onTap(p, () => {
      selected = c; pots.forEach((x) => x.classList.toggle('sel', x === p));
      sfx('tap'); say('n.' + c);
    });
    return p;
  });
  ctx.stage.append(h('div.paint-wrap', h('div.model-card', h('small', 'Modelo'), model), h('div.board-card', board), h('div.palette', ...pots)));
  popIn([...pots, board], 0.05);
  ctx.mood('point');
  const instr = ctx.instruct([`i.paint.${between(0, 1)}`], 'Escolhe uma cor e pinta como no modelo.');
  testHook({ paint: toPaint.map((i) => [i, scene[i].color]) });
  let left = toPaint.length;
  await new Promise<void>((resolve) => {
    board.querySelectorAll('.paintable').forEach((el) => {
      el.addEventListener('pointerup', () => {
        if (!el.classList.contains('paintable')) return;
        const i = Number(el.getAttribute('data-i'));
        if (!selected) { pots.forEach((p) => pop(p)); return; }
        if (selected !== scene[i].color) {
          el.setAttribute('fill', HEX(selected));
          ctx.bad(null);
          setTimeout(() => el.setAttribute('fill', '#ffffff'), 450);
          return;
        }
        el.classList.remove('paintable');
        el.setAttribute('fill', HEX(selected));
        gsap.fromTo(el, { opacity: 0.3 }, { opacity: 1, duration: 0.3 });
        sfx('paint', { rate: 0.9 + Math.random() * 0.3 });
        left--;
        if (left === 0) setTimeout(resolve, 300);
      });
    });
  });
  await instr;
  burstAt(board);
  await ctx.good(board, true);
};

// ── Mix colours
const MIXES: Record<string, [string, string]> = { laranja: ['vermelho', 'amarelo'], verde: ['azul', 'amarelo'], roxo: ['vermelho', 'azul'], rosa: ['vermelho', 'branco'] };
function blend(a: string, b: string) {
  const p = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return '#' + A.map((v, i) => Math.round((v + B[i]) / 2).toString(16).padStart(2, '0')).join('');
}

export const mix: Game = async (ctx) => {
  const target = pick(ctx.level === 0 ? ['laranja', 'verde'] : Object.keys(MIXES));
  const pots = ['vermelho', 'azul', 'amarelo', 'branco'].map((c) => h('button.pot.big', { 'data-c': c, style: { '--c': HEX(c) } }, h('span')));
  const bowl = h('div.bowl', h('div.bowl-paint'));
  const goal = h('div.mix-goal', h('small', 'Queremos:'), art(target));
  ctx.stage.append(h('div.mix-wrap', goal, bowl, h('div.palette', ...pots)));
  popIn([goal, bowl, ...pots], 0.06);
  ctx.mood('think');
  const k = between(0, 1);
  const instr = ctx.instruct([`i.mix.${k}`, 'n.' + target], `${k ? 'Que duas cores fazem' : 'Mistura duas cores para fazer'} ${ITEMS[target].name}?`);
  testHook({ mix: MIXES[target] });
  const paintEl = bowl.querySelector('.bowl-paint') as HTMLElement;
  let picks: string[] = [];
  await new Promise<void>((resolve) => {
    pots.forEach((p) => onTap(p, async () => {
      if (picks.length >= 2) return;
      const c = p.dataset.c!;
      picks.push(c);
      sfx('splash', { vol: 0.6 });
      pop(p);
      const drop = h('div.paint-drop', { style: { background: HEX(c) } });
      document.body.append(drop);
      const a = p.getBoundingClientRect(), b = bowl.getBoundingClientRect();
      gsap.fromTo(drop, { left: a.left + a.width / 2, top: a.top }, { left: b.left + b.width / 2, top: b.top + b.height * 0.4, duration: 0.45, ease: 'power2.in', onComplete: () => drop.remove() });
      await wait(450);
      if (picks.length === 1) { paintEl.style.background = HEX(c); paintEl.classList.add('on'); return; }
      const res = blend(HEX(picks[0]), HEX(picks[1]));
      paintEl.classList.add('swirl');
      gsap.to(paintEl, { background: res, duration: 0.8 });
      await wait(900);
      paintEl.classList.remove('swirl');
      const ok = MIXES[target].every((x) => picks.includes(x));
      if (ok) {
        resolve();
      } else {
        const made = Object.entries(MIXES).find(([, pair]) => pair.every((x) => picks.includes(x)));
        ctx.bad(bowl);
        if (made) { await wait(300); await say('n.' + made[0]); }
        await wait(500);
        picks = [];
        paintEl.classList.remove('on');
        paintEl.style.background = '';
      }
    }));
  });
  await instr;
  sparkle(bowl, 14);
  await ctx.good(bowl, true);
  await say('n.' + target);
};

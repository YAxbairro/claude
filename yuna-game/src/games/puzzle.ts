// Puzzle of the island illustration, and a maze for Gata Tanha.
import gsap from 'gsap';
import { h, wait } from '../core/dom.ts';
import { art, islandSrc, charSrc } from '../core/art.ts';
import { sfx, blip, say } from '../core/audio.ts';
import { popIn, sparkle, burstAt } from '../core/fx.ts';
import { draggable } from '../core/drag.ts';
import { pick, shuffle, between } from '../core/rng.ts';
import { type Game, testHook } from './types.ts';

export const puzzle: Game = async (ctx) => {
  const g = [2, 3, 3][ctx.level];
  const board = h('div.pz-board', { style: { '--g': String(g) } });
  const tray = h('div.pz-tray');
  const wrap = h('div.pz-wrap', board, tray);
  ctx.stage.append(wrap);
  await wait(30);
  const land = innerWidth > innerHeight;
  const avail = Math.min(wrap.clientWidth * (land ? 0.46 : 0.92), wrap.clientHeight * (land ? 0.96 : 0.48));
  const S = Math.floor(Math.max(200, avail) / g) * g;
  board.style.width = board.style.height = S + 'px';
  const P = S / g;
  const bg = (r: number, c: number) => ({
    backgroundImage: `url(${islandSrc(ctx.island.id)}), radial-gradient(circle at 50% 45%, #7fe3ef, #1fb5d1 70%, #0d8fb5)`,
    backgroundSize: `${S * 0.92}px ${S * 0.92}px, ${S}px ${S}px`,
    backgroundPosition: `${S * 0.04 - c * P}px ${S * 0.04 - r * P}px, ${-c * P}px ${-r * P}px`,
    backgroundRepeat: 'no-repeat',
    width: P + 'px', height: P + 'px',
  });
  board.append(h('div.pz-ghost', { style: { ...bg(0, 0), width: S + 'px', height: S + 'px', backgroundPosition: `${S * 0.04}px ${S * 0.04}px, 0 0`, opacity: ctx.level === 2 ? '0.12' : '0.3' } }));
  const slots: HTMLElement[] = [];
  for (let r = 0; r < g; r++) for (let c = 0; c < g; c++) {
    const s = h('div.pz-slot', { 'data-k': `${r}-${c}`, style: { left: c * P + 'px', top: r * P + 'px', width: P + 'px', height: P + 'px' } });
    board.append(s);
    slots.push(s);
  }
  const pieces = shuffle(slots.map((s) => s.dataset.k!)).map((k) => {
    const [r, c] = k.split('-').map(Number);
    const p = h('div.pz-piece', { 'data-k': k });
    Object.assign(p.style, bg(r, c));
    p.style.setProperty('--rot', between(-8, 8) + 'deg');
    tray.append(p);
    return p;
  });
  popIn(pieces, 0.05);
  ctx.mood('point');
  const instr = ctx.instruct([`i.puzzle.${between(0, 1)}`], `Monta o puzzle: ${ctx.island.place}!`);
  let left = pieces.length;
  await new Promise<void>((resolve) => {
    for (const p of pieces) {
      draggable(p, {
        zones: () => slots.filter((s) => !s.classList.contains('filled')),
        onDrop: (zone) => {
          if (!zone) return 'reject';
          if (zone.dataset.k !== p.dataset.k) { ctx.bad(null); return 'reject'; }
          zone.classList.add('filled');
          p.classList.add('locked', 'placed');
          const a = p.getBoundingClientRect();
          zone.append(p);
          gsap.set(p, { x: 0, y: 0, rotation: 0 });
          const b = p.getBoundingClientRect();
          gsap.fromTo(p, { x: a.left - b.left, y: a.top - b.top, scale: 1.08 }, { x: 0, y: 0, scale: 1, duration: 0.3, ease: 'power2.out' });
          sfx('snap');
          left--;
          if (left === 0) setTimeout(resolve, 350);
          return 'accept';
        },
      });
    }
  });
  await instr;
  board.classList.add('complete');
  sparkle(board, 20);
  burstAt(board, true);
  await ctx.good(board, true);
};

type Cell = { r: number; c: number; walls: [boolean, boolean, boolean, boolean] }; // top right bottom left
function makeMaze(n: number): Cell[][] {
  const grid: Cell[][] = Array.from({ length: n }, (_, r) => Array.from({ length: n }, (_, c) => ({ r, c, walls: [true, true, true, true] as [boolean, boolean, boolean, boolean] })));
  const seen = new Set<string>();
  const stack: Cell[] = [grid[0][0]];
  seen.add('0,0');
  const D = [[-1, 0, 0, 2], [0, 1, 1, 3], [1, 0, 2, 0], [0, -1, 3, 1]];
  while (stack.length) {
    const cur = stack[stack.length - 1];
    const nb = shuffle(D).map(([dr, dc, w, o]) => ({ cell: grid[cur.r + dr]?.[cur.c + dc], w, o })).filter((x) => x.cell && !seen.has(`${x.cell.r},${x.cell.c}`));
    if (!nb.length) { stack.pop(); continue; }
    const { cell, w, o } = nb[0];
    cur.walls[w] = false;
    cell.walls[o] = false;
    seen.add(`${cell.r},${cell.c}`);
    stack.push(cell);
  }
  return grid;
}

function solve(grid: Cell[][], n: number) {
  const D: [number, number, number][] = [[-1, 0, 0], [0, 1, 1], [1, 0, 2], [0, -1, 3]];
  const prev = new Map<string, string>();
  const q: [number, number][] = [[0, 0]];
  const seen = new Set(['0,0']);
  while (q.length) {
    const [r, c] = q.shift()!;
    if (r === n - 1 && c === n - 1) break;
    for (const [dr, dc, w] of D) {
      const k = `${r + dr},${c + dc}`;
      if (grid[r][c].walls[w] || seen.has(k)) continue;
      seen.add(k); prev.set(k, `${r},${c}`); q.push([r + dr, c + dc]);
    }
  }
  const path: number[][] = [];
  for (let k: string | undefined = `${n - 1},${n - 1}`; k; k = prev.get(k)) path.unshift(k.split(',').map(Number));
  return path;
}

export const maze: Game = async (ctx) => {
  const n = [4, 5, 6][ctx.level];
  const grid = makeMaze(n);
  const goalItem = pick(ctx.island.items.filter((id) => !id.startsWith('n') && !id.startsWith('l')));
  const board = h('div.maze', { style: { '--n': String(n) } });
  const cells = grid.flat().map((cell) => {
    const el = h('div.mcell', { 'data-r': String(cell.r), 'data-c': String(cell.c) });
    const [t, r, b, l] = cell.walls;
    el.classList.toggle('wt', t); el.classList.toggle('wr', r); el.classList.toggle('wb', b); el.classList.toggle('wl', l);
    board.append(el);
    return el;
  });
  const cat = h('div.maze-cat', h('img', { src: charSrc('tanha-sit'), alt: '', draggable: 'false' }));
  const goal = h('div.maze-goal', art(goalItem));
  board.append(goal, cat);
  ctx.stage.append(h('div.maze-wrap', board));
  const place = (el: HTMLElement, r: number, c: number) => { el.style.left = `${(c / n) * 100}%`; el.style.top = `${(r / n) * 100}%`; };
  place(goal, n - 1, n - 1);
  testHook({ maze: solve(grid, n) });
  let cr = 0, cc = 0;
  place(cat, 0, 0);
  cells[0].classList.add('trail');
  popIn([board]);
  ctx.mood('point');
  const instr = ctx.instruct([`i.maze.${between(0, 1)}`], 'Ajuda a Gata Tanha a chegar ao fim do caminho.');
  await new Promise<void>((resolve) => {
    let done = false;
    const tryMove = (r: number, c: number) => {
      if (done) return;
      const dr = r - cr, dc = c - cc;
      if (Math.abs(dr) + Math.abs(dc) !== 1) return;
      const w = dr === -1 ? 0 : dc === 1 ? 1 : dr === 1 ? 2 : 3;
      if (grid[cr][cc].walls[w]) { blip(160, 0.08, 'square', 0.08); return; }
      cr = r; cc = c;
      place(cat, r, c);
      cat.classList.toggle('flip', dc < 0);
      cells[r * n + c].classList.add('trail');
      blip(500 + (r + c) * 25, 0.05, 'triangle', 0.15);
      if (r === n - 1 && c === n - 1) { done = true; resolve(); }
    };
    const cellAt = (x: number, y: number) => {
      const b = board.getBoundingClientRect();
      return [Math.floor(((y - b.top) / b.height) * n), Math.floor(((x - b.left) / b.width) * n)];
    };
    let down = false;
    board.addEventListener('pointerdown', (e) => { down = true; board.setPointerCapture(e.pointerId); const [r, c] = cellAt(e.clientX, e.clientY); tryMove(r, c); });
    board.addEventListener('pointermove', (e) => { if (!down) return; const [r, c] = cellAt(e.clientX, e.clientY); tryMove(r, c); });
    board.addEventListener('pointerup', () => { down = false; });
    const key = (e: KeyboardEvent) => {
      const m: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
      if (m[e.key]) { e.preventDefault(); tryMove(cr + m[e.key][0], cc + m[e.key][1]); }
      if (done || ctx.closed()) removeEventListener('keydown', key);
    };
    addEventListener('keydown', key);
  });
  await instr;
  sfx('meow');
  gsap.fromTo(cat, { y: 0 }, { y: -20, yoyo: true, repeat: 3, duration: 0.15 });
  sparkle(goal, 12);
  await ctx.good(goal, true);
  await say('n.' + goalItem);
};

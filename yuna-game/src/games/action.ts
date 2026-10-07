// Action family: pop bubbles, catch falling things, hide-and-seek.
import gsap from 'gsap';
import { h, onTap, wait } from '../core/dom.ts';
import { art } from '../core/art.ts';
import { say, sfx, blip } from '../core/audio.ts';
import { popIn, sparkle, shake } from '../core/fx.ts';
import { ITEMS } from '../data/items.ts';
import { between, pick, sample, shuffle, fresh } from '../core/rng.ts';
import { type Ctx, type Game, testHook } from './types.ts';

function targetChip(id: string, need: number) {
  const n = h('b', `0/${need}`);
  return { el: h('div.target-chip', art(id), n), set: (v: number) => { n.textContent = `${v}/${need}`; } };
}

function loop(ctx: Ctx, step: (dt: number) => boolean) {
  return new Promise<void>((resolve) => {
    let last = performance.now();
    const frame = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      if (ctx.closed() || !step(dt)) return resolve();
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}

export const bubbles: Game = async (ctx) => {
  const pool = ctx.island.items;
  const [target] = fresh(pool, 1);
  const others = pool.filter((x) => x !== target);
  const need = [5, 6, 8][ctx.level];
  const speed = [55, 75, 95][ctx.level];
  const chip = targetChip(target, need);
  testHook({ pop: target });
  const arena = h('div.arena.sea');
  ctx.stage.append(h('div.arena-wrap', chip.el, arena));
  const k = between(0, 1);
  const instr = ctx.instruct([`i.bubbles.${k}`, 'n.' + target], `Rebenta só as bolhas com ${ITEMS[target].name}!`);
  await wait(900);
  type B = { el: HTMLElement; x: number; y: number; ph: number; id: string; dead: boolean };
  const list: B[] = [];
  let got = 0, spawnT = 0, since = 0;
  const W = () => arena.clientWidth, H = () => arena.clientHeight;
  const spawn = () => {
    // Guarantee a target bubble regularly so nobody waits too long.
    const isT = since >= 2 || Math.random() < 0.45;
    since = isT ? 0 : since + 1;
    const id = isT ? target : pick(others);
    const el = h('button.bubble', art(id));
    arena.append(el);
    const size = Math.min(W(), H()) * [0.24, 0.21, 0.19][ctx.level];
    el.style.width = el.style.height = size + 'px';
    const b: B = { el, x: Math.random() * (W() - size), y: H() + 10, ph: Math.random() * 6, id, dead: false };
    list.push(b);
    onTap(el, () => {
      if (b.dead) return;
      if (b.id === target) {
        b.dead = true;
        got++;
        chip.set(got);
        sfx('pop', { rate: 0.9 + Math.random() * 0.3 });
        sparkle(el, 8);
        gsap.to(el, { scale: 1.5, opacity: 0, duration: 0.2, onComplete: () => el.remove() });
      } else {
        blip(200, 0.12, 'sine', 0.2);
        shake(el);
        ctx.mistakes += 0.34;
      }
    });
  };
  await loop(ctx, (dt) => {
    spawnT -= dt;
    if (spawnT <= 0 && list.filter((b) => !b.dead).length < 6) { spawn(); spawnT = [1.1, 0.9, 0.75][ctx.level]; }
    for (const b of list) {
      if (b.dead) continue;
      b.y -= speed * dt * (H() / 500);
      b.ph += dt * 2;
      b.el.style.transform = `translate(${b.x + Math.sin(b.ph) * 14}px, ${b.y}px)`;
      if (b.y < -b.el.clientHeight) { b.dead = true; b.el.remove(); }
    }
    return got < need;
  });
  await instr;
  list.forEach((b) => !b.dead && gsap.to(b.el, { opacity: 0, duration: 0.3 }));
  await ctx.good(chip.el, true);
};

export const catchGame: Game = async (ctx) => {
  const pool = ctx.island.items;
  const [target] = fresh(pool, 1);
  const others = pool.filter((x) => x !== target);
  const need = [4, 5, 7][ctx.level];
  const fall = [110, 150, 190][ctx.level];
  const chip = targetChip(target, need);
  testHook({ catch: target });
  const arena = h('div.arena.sky');
  const basket = h('div.catcher', h('div.catcher-bowl'));
  arena.append(basket);
  ctx.stage.append(h('div.arena-wrap', chip.el, arena));
  const instr = ctx.instruct([`i.catch.${between(0, 1)}`, 'n.' + target], `Mexe o cesto e apanha ${ITEMS[target].name}!`);
  let bx = 0.5;
  const move = (e: PointerEvent) => {
    const r = arena.getBoundingClientRect();
    bx = Math.max(0.08, Math.min(0.92, (e.clientX - r.left) / r.width));
  };
  arena.addEventListener('pointerdown', move);
  arena.addEventListener('pointermove', move);
  await wait(800);
  type F = { el: HTMLElement; x: number; y: number; id: string; dead: boolean; rot: number };
  const list: F[] = [];
  let got = 0, spawnT = 0, since = 0, cur = 0.5;
  await loop(ctx, (dt) => {
    const W = arena.clientWidth, H = arena.clientHeight;
    const size = Math.min(W, H) * 0.17;
    cur += (bx - cur) * Math.min(1, dt * 14);
    const bw = basket.clientWidth;
    basket.style.transform = `translateX(${cur * W - bw / 2}px)`;
    spawnT -= dt;
    if (spawnT <= 0) {
      const isT = since >= 2 || Math.random() < 0.5;
      since = isT ? 0 : since + 1;
      const id = isT ? target : pick(others);
      const el = h('div.faller', art(id));
      el.style.width = el.style.height = size + 'px';
      arena.append(el);
      list.push({ el, x: 0.1 + Math.random() * 0.8, y: -size, id, dead: false, rot: (Math.random() - 0.5) * 90 });
      spawnT = [1.4, 1.15, 0.9][ctx.level];
    }
    const by = H - basket.clientHeight * 0.9;
    for (const f of list) {
      if (f.dead) continue;
      f.y += fall * dt * (H / 600);
      f.el.style.transform = `translate(${f.x * W - size / 2}px, ${f.y}px) rotate(${f.rot * f.y / H}deg)`;
      if (f.y + size * 0.7 > by && f.y < by + 20 && Math.abs(f.x - cur) * W < bw * 0.55) {
        f.dead = true;
        if (f.id === target) {
          got++;
          chip.set(got);
          sfx('drop');
          blip(523 * Math.pow(2, got / 12), 0.08, 'triangle');
          sparkle(basket, 6);
        } else {
          blip(180, 0.15, 'sine', 0.2);
          shake(basket);
          ctx.mistakes += 0.34;
        }
        gsap.to(f.el, { scale: 0.3, opacity: 0, duration: 0.2, onComplete: () => f.el.remove() });
      } else if (f.y > H) { f.dead = true; f.el.remove(); }
    }
    return got < need;
  });
  await instr;
  await ctx.good(basket, true);
};

export const peek: Game = async (ctx) => {
  const n = [4, 6, 8][ctx.level];
  const ids = sample(ctx.island.items, Math.min(n, ctx.island.items.length));
  while (ids.length < n) ids.push(pick(ctx.island.items));
  const target = pick(ids);
  const spots = shuffle(ids).map((id) => {
    const s = h('button.peek-spot', { 'data-id': id }, h('div.peek-item', art(id)), h('div.bush', h('i'), h('i'), h('i')));
    return s;
  });
  const field = h(`div.peek-field.n${n}`, ...spots);
  ctx.stage.append(field);
  popIn(spots, 0.06);
  ctx.mood('point');
  const instr = ctx.instruct([`i.peek.${between(0, 1)}`, 'n.' + target], `Alguém se escondeu! Procura ${ITEMS[target].name}.`);
  testHook({ peek: target });
  let tries = 0;
  await new Promise<void>((resolve) => {
    spots.forEach((s) => onTap(s, async () => {
      if (s.classList.contains('open')) return;
      s.classList.add('open');
      sfx('whoosh', { vol: 0.6 });
      const id = s.dataset.id!;
      if (id === target) {
        await ctx.good(s, true);
        resolve();
      } else {
        tries++;
        say('n.' + id);
        if (tries > Math.ceil(n / 2)) ctx.mistakes += 0.5;
        await wait(1300);
        s.classList.remove('open');
      }
    }));
  });
  await instr;
};

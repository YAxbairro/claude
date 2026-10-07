import gsap from 'gsap';
import { h, onTap, svg, wait } from '../core/dom.ts';
import { islandSrc, charSrc, itemSrc } from '../core/art.ts';
import { say, sfx, music, unlock } from '../core/audio.ts';
import { progress, isUnlocked, islandStars, totalStars, save } from '../core/store.ts';
import { ISLANDS, REGIONS } from '../data/islands.ts';
import { shake } from '../core/fx.ts';
import { go } from '../main.ts';
import { islandScreen } from './island.ts';
import { titleScreen } from './title.ts';
import { openAlbum } from './album.ts';
import { openParents } from './parents.ts';

let greeting: string | null = null;
/** Line to say when the map opens (the welcome after pressing Play). */
export const setGreeting = (key: string) => { greeting = key; };

export function mapScreen(root: HTMLElement) {
  root.classList.add('map-screen');
  music('map');
  const scroller = h('div.map-scroll');
  const world = h('div.map-world');
  const pathSvg = svg('svg', { class: 'map-path' });
  world.append(pathSvg);
  scroller.append(world);

  const hud = h('div.hud.map-hud',
    h('button.round-btn.home', { 'aria-label': 'Início' }, '⌂'),
    h('div.hud-stars', h('span.star-ico', '★'), h('b', String(totalStars()))),
    h('div.hud-spacer'),
    h('button.round-btn.album-btn', { 'aria-label': 'Álbum' }, '📖'),
    h('button.round-btn.gear', { 'aria-label': 'Área dos adultos' }, '⚙'));
  root.append(scroller, hud);

  // Layout: islands zig-zag down an ocean column, a sign before each region.
  const nodes: { el: HTMLElement; i: number }[] = [];
  REGIONS.forEach((reg, r) => {
    world.append(h('div.region-sign', { 'data-r': String(r) }, h('small', `Região ${r + 1}`), h('b', reg.name)));
    for (const i of reg.islands) {
      const isl = ISLANDS[i];
      const unlocked = isUnlocked(i);
      const stars = islandStars(i);
      const el = h(`button.map-island${unlocked ? '' : '.locked'}`, { 'data-i': String(i), style: { '--c': isl.color, '--d': `${(i % 5) * -0.7}s` } },
        h('div.foam'),
        h('img.isl-img', { src: islandSrc(i), alt: isl.name, draggable: 'false', loading: i > 5 ? 'lazy' : 'eager', decoding: 'async' }),
        h('div.isl-plate', h('b', isl.name), h('span.isl-stars', ...[0, 1, 2].map((k) => h(`i${stars > k * 3 ? '.on' : ''}`, '★')))),
        unlocked ? null : h('div.lock', h('img', { src: charSrc('tanha-sleep'), alt: '' })));
      world.append(el);
      nodes.push({ el, i });
    }
  });

  const boat = h('div.map-boat', h('img', { src: charSrc('boat'), alt: 'Barco da Yuna', draggable: 'false' }));
  world.append(boat);

  // Decorative life: a dolphin and a seagull now and then.
  const dolphin = h('img.map-critter', { src: itemSrc('golfinho'), alt: '' });
  const gull = h('img.map-gull', { src: itemSrc('gaivota'), alt: '' });
  world.append(dolphin, gull);

  let points: { x: number; y: number }[] = [];
  const layout = () => {
    const W = world.clientWidth;
    const size = Math.min(W * 0.5, 300);
    const step = size * 0.86;
    let y = 120;
    let idx = 0;
    world.querySelectorAll<HTMLElement>('.region-sign, .map-island').forEach((el) => {
      if (el.classList.contains('region-sign')) {
        el.style.top = y + 'px';
        y += 74;
        return;
      }
      const x = 0.5 + 0.25 * Math.sin(idx * 1.25 + 0.6);
      el.style.width = size + 'px';
      el.style.left = x * W - size / 2 + 'px';
      el.style.top = y + 'px';
      points[idx] = { x: x * W, y: y + size * 0.48 };
      y += step;
      idx++;
    });
    world.style.height = y + size * 0.6 + 'px';
    pathSvg.setAttribute('viewBox', `0 0 ${W} ${y + 200}`);
    pathSvg.setAttribute('width', String(W));
    pathSvg.setAttribute('height', String(y + 200));
    let d = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1], b = points[i];
      d += ` C${a.x} ${(a.y + b.y) / 2} ${b.x} ${(a.y + b.y) / 2} ${b.x} ${b.y}`;
    }
    pathSvg.innerHTML = '';
    pathSvg.append(svg('path', { d, class: 'route-shadow' }), svg('path', { d, class: 'route' }));
    placeBoat(progress.current, false);
  };

  const boatAt = (i: number) => {
    const p = points[i];
    const size = boat.clientWidth || 110;
    return { x: p.x + (i % 2 ? -1 : 1) * Math.min(world.clientWidth * 0.2, 150) - size / 2, y: p.y - size * 0.2 };
  };
  const placeBoat = (i: number, animate: boolean) => {
    const t = boatAt(i);
    if (!animate) gsap.set(boat, { x: t.x, y: t.y });
    return t;
  };

  layout();
  const ro = new ResizeObserver(() => layout());
  ro.observe(world);
  requestAnimationFrame(() => {
    const p = points[progress.current] || points[0];
    scroller.scrollTop = Math.max(0, p.y - scroller.clientHeight * 0.45);
  });

  // Ambient animations.
  const critters = setInterval(() => {
    if (document.hidden) return;
    const top = scroller.scrollTop, H = scroller.clientHeight, W = world.clientWidth;
    if (Math.random() < 0.55) {
      const x = W * (0.15 + Math.random() * 0.6), y = top + H * (0.35 + Math.random() * 0.4);
      gsap.killTweensOf(dolphin);
      gsap.set(dolphin, { x, y, opacity: 1, rotation: -40, scaleX: Math.random() < 0.5 ? -1 : 1 });
      gsap.timeline()
        .to(dolphin, { y: y - 90, x: x + 60, rotation: 0, duration: 0.55, ease: 'power2.out' })
        .to(dolphin, { y, x: x + 120, rotation: 50, duration: 0.55, ease: 'power2.in' })
        .to(dolphin, { opacity: 0, duration: 0.15 });
      setTimeout(() => sfx('splash', { vol: 0.25 }), 1050);
    } else {
      gsap.killTweensOf(gull);
      const y = top + H * (0.1 + Math.random() * 0.3);
      gsap.fromTo(gull, { x: -120, y, opacity: 1 }, { x: W + 120, y: y - 60, duration: 7, ease: 'none', onComplete: () => gsap.set(gull, { opacity: 0 }) });
    }
  }, 6500);

  // Travel to an island along the route, then open it.
  let travelling = false;
  for (const { el, i } of nodes) {
    onTap(el, async () => {
      unlock();
      if (travelling) return;
      if (!isUnlocked(i)) {
        sfx('wrong', { vol: 0.5 });
        shake(el);
        say('ui.locked');
        return;
      }
      travelling = true;
      sfx('tap');
      gsap.fromTo(el, { scale: 1 }, { scale: 1.08, yoyo: true, repeat: 1, duration: 0.15 });
      const from = progress.current;
      if (from !== i) {
        sfx('sail', { vol: 0.6 });
        const dir = i > from ? 1 : -1;
        const hops = Math.abs(i - from);
        const per = Math.min(0.5, 2.2 / hops);
        const tl = gsap.timeline();
        for (let k = from + dir; dir > 0 ? k <= i : k >= i; k += dir) {
          const t = boatAt(k);
          tl.to(boat, { x: t.x, y: t.y, duration: per, ease: hops === 1 ? 'power1.inOut' : 'none' });
        }
        tl.eventCallback('onUpdate', () => {
          const by = gsap.getProperty(boat, 'y') as number;
          scroller.scrollTop += (by - scroller.clientHeight * 0.45 - scroller.scrollTop) * 0.12;
        });
        await tl;
        progress.current = i;
        save();
      } else {
        gsap.fromTo(boat, { y: '-=12' }, { y: '+=12', duration: 0.3, ease: 'bounce.out' });
        await wait(250);
      }
      say('isl.' + i);
      await wait(500);
      go((r) => islandScreen(r, i));
    });
  }

  onTap(hud.querySelector('.home')!, () => go(titleScreen));
  onTap(hud.querySelector('.album-btn')!, () => { unlock(); openAlbum(); });
  onTap(hud.querySelector('.gear')!, () => { unlock(); openParents(() => go(mapScreen)); });

  // Gentle prompt if nothing happens for a while.
  const hello = greeting;
  greeting = null;
  const idle = setTimeout(async () => {
    if (hello) await say(hello);
    if (!travelling) say('ui.chooseIsland');
  }, hello ? 700 : 2500);

  return () => { clearInterval(critters); clearTimeout(idle); ro.disconnect(); };
}

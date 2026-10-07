import gsap from 'gsap';
import { h, onTap } from '../core/dom.ts';
import { islandSrc, charSrc, itemImages, preloadImages, art } from '../core/art.ts';
import { say, sfx, music, preloadVoice } from '../core/audio.ts';
import { starsFor } from '../core/store.ts';
import { ISLANDS, PHASES } from '../data/islands.ts';
import { MECH_SAY } from '../data/mechanics.ts';
import { go } from '../main.ts';
import { mapScreen } from './map.ts';
import { playScreen } from './play.ts';

export function islandScreen(root: HTMLElement, id: number) {
  const isl = ISLANDS[id];
  root.classList.add('island-screen');
  root.style.setProperty('--c', isl.color);
  music('map');

  // Warm the caches for this island while the story is told.
  preloadImages(itemImages(isl.items));
  preloadVoice([`s.${id}`, ...isl.items.flatMap((x) => ['n.' + x, 'c.' + x, 'en.' + x]), ...isl.mechs.flatMap((m) => MECH_SAY[m].map((_, k) => `i.${m}.${k}`))]);

  const back = h('button.round-btn.back', { 'aria-label': 'Voltar ao mapa' }, '←');
  const hero = h('div.isl-hero', h('div.isl-halo'), h('img.isl-big', { src: islandSrc(id), alt: isl.name, draggable: 'false' }));
  const yuna = h('img.isl-yuna', { src: charSrc('yuna-point'), alt: '', draggable: 'false' });
  const tanha = h('img.isl-tanha', { src: charSrc('tanha-sit'), alt: '', draggable: 'false' });
  const story = h('div.story-bubble', h('p', isl.story), h('button.replay', { 'aria-label': 'Ouvir outra vez' }, '🔊'));
  const phases = PHASES.map((p) => {
    const s = starsFor(id, p.id);
    return h(`button.phase-btn.p${p.id}`, { 'data-p': String(p.id) },
      h('span.ph-ico', p.icon),
      h('b', p.name),
      h('span.ph-stars', ...[0, 1, 2].map((k) => h(`i${s > k ? '.on' : ''}`, '★'))));
  });
  const reward = h('div.reward-peek', h('small', 'Prémio da ilha'), art(isl.rewardItem), h('span', isl.reward));
  root.append(
    h('div.isl-bg'),
    h('div.isl-top', back, h('div.isl-title', h('h2', isl.name), h('p', isl.topic))),
    h('div.isl-main', hero, h('div.isl-chars', yuna, tanha)),
    h('div.isl-bottom', story, h('div.phase-row', ...phases), reward),
  );

  gsap.from(hero, { y: 60, scale: 0.7, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' });
  gsap.from([yuna, tanha], { x: -80, opacity: 0, stagger: 0.12, duration: 0.6, ease: 'back.out', delay: 0.2 });
  gsap.from(phases, { y: 60, opacity: 0, stagger: 0.1, duration: 0.5, ease: 'back.out(2)', delay: 0.4 });

  const tell = async () => { await say('s.' + id); };
  tell();
  onTap(story.querySelector('.replay')!, tell);
  onTap(hero, () => { sfx('splash', { vol: 0.4 }); gsap.fromTo(hero, { rotation: -3 }, { rotation: 0, duration: 0.8, ease: 'elastic.out' }); say('isl.' + id); });
  onTap(tanha, () => { sfx('meow'); gsap.fromTo(tanha, { y: 0 }, { y: -30, yoyo: true, repeat: 1, duration: 0.18 }); });
  onTap(back, () => go(mapScreen));
  phases.forEach((b) => onTap(b, () => {
    sfx('tap');
    const p = Number(b.dataset.p);
    gsap.to(b, { scale: 0.92, yoyo: true, repeat: 1, duration: 0.1 });
    go((r) => playScreen(r, id, p));
  }));
}

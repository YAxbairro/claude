import gsap from 'gsap';
import { h, onTap } from '../core/dom.ts';
import { ASSET, charSrc } from '../core/art.ts';
import { unlock, music, say, sfx } from '../core/audio.ts';
import { progress, save } from '../core/store.ts';
import { go } from '../main.ts';
import { worldScreen } from '../world/world.ts';
import { openParents } from './parents.ts';

export function titleScreen(root: HTMLElement) {
  root.classList.add('title-screen');
  const bg = h('div.title-bg', { style: { backgroundImage: `url(${ASSET}ui/archipelago.webp)` } });
  const yuna = h('img.t-yuna', { src: charSrc('yuna-wave'), alt: 'Yuna', draggable: 'false' });
  const tanha = h('img.t-tanha', { src: charSrc('tanha-sit'), alt: 'Gata Tanha', draggable: 'false' });
  const play = h('button.big-play', { 'aria-label': 'Jogar' }, h('span.tri'), h('b', 'Jogar'));
  const logo = h('div.logo',
    h('h1', h('span.l1', 'Yuna'), h('span.amp', '&'), h('span.l2', 'Gata Tanha')),
    h('p', 'Ilhas de Descobertas'));
  const gear = h('button.corner-btn.parents-btn', { 'aria-label': 'Área dos adultos' }, '⚙');
  root.append(bg, h('div.title-sky'), h('div.title-glow'), logo, h('div.title-chars', yuna, tanha), play, gear);

  gsap.from(logo, { y: -80, opacity: 0, scale: 0.6, duration: 1, ease: 'elastic.out(1, .6)', delay: 0.2 });
  gsap.from([yuna, tanha], { y: 200, opacity: 0, duration: 0.9, stagger: 0.15, ease: 'back.out(1.4)', delay: 0.4 });
  gsap.from(play, { scale: 0, duration: 0.6, ease: 'back.out(2.5)', delay: 1 });
  gsap.to(bg, { scale: 1.12, duration: 30, ease: 'none', repeat: -1, yoyo: true });

  let started = false;
  onTap(play, async () => {
    if (started) return;
    started = true;
    unlock();
    sfx('tap');
    music('map');
    gsap.to(play, { scale: 0.85, yoyo: true, repeat: 1, duration: 0.1 });
    const first = !progress.seenIntro;
    progress.seenIntro = true;
    save();
    gsap.to(yuna, { y: -30, yoyo: true, repeat: 1, duration: 0.2, ease: 'power1.out' });
    say(first ? 'ui.welcome' : 'ui.welcomeBack');
    go(worldScreen);
  });
  onTap(yuna, () => { unlock(); gsap.fromTo(yuna, { rotation: -6 }, { rotation: 0, duration: 0.6, ease: 'elastic.out' }); say('ui.welcome'); });
  onTap(tanha, () => { unlock(); sfx('meow'); gsap.fromTo(tanha, { y: 0 }, { y: -40, yoyo: true, repeat: 1, duration: 0.2 }); });
  onTap(gear, () => { unlock(); openParents(); });
}

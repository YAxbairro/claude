import './styles/base.css';
import './styles/screens.css';
import './styles/games.css';
import gsap from 'gsap';
import { h } from './core/dom.ts';
import { stopVoice } from './core/audio.ts';
import { titleScreen } from './screens/title.ts';
import { playScreen } from './screens/play.ts';

export type Screen = (root: HTMLElement) => void | (() => void);

const app = document.getElementById('app')!;
let cleanup: void | (() => void);
let busy = false;

/** Swap screens behind a cloud curtain so transitions feel like travelling. */
export async function go(screen: Screen, opts: { instant?: boolean } = {}) {
  if (busy) return;
  busy = true;
  stopVoice();
  const curtain = document.getElementById('curtain') || document.body.appendChild(
    h('div#curtain', h('div.cloud.c1'), h('div.cloud.c2'), h('div.cloud.c3'), h('div.cloud.c4')));
  if (!opts.instant) {
    curtain.classList.add('on');
    await gsap.fromTo(curtain.children, { scale: 0.2, opacity: 0 }, { scale: 1.3, opacity: 1, duration: 0.42, stagger: 0.04, ease: 'power2.out' });
  }
  if (typeof cleanup === 'function') cleanup();
  app.innerHTML = '';
  const root = h('div.screen');
  app.append(root);
  cleanup = screen(root);
  if (!opts.instant) {
    await gsap.to(curtain.children, { scale: 2.2, opacity: 0, duration: 0.5, stagger: 0.03, ease: 'power2.in' });
    curtain.classList.remove('on');
  }
  busy = false;
}

// Keep a real viewport height on mobile browsers whose toolbars resize.
const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight / 100}px`);
setVh();
addEventListener('resize', setVh);
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// ?test=mech:island:level opens one mini-game directly (used for automated checks).
const test = new URLSearchParams(location.search).get('test');
if (test) {
  const [mech, isl, lvl] = test.split(':');
  go((r) => playScreen(r, Number(isl || 0), Number(lvl || 0), mech.split(/[+ ,]/) as never), { instant: true })
    .then(() => document.getElementById('boot')?.remove());
} else {
  go(titleScreen, { instant: true }).then(() => document.getElementById('boot')?.remove());
}

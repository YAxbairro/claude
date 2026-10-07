// Visual juice: confetti, sparkles, flying stars, shakes and bounces.
import gsap from 'gsap';
import confetti from 'canvas-confetti';
import { h, rectCenter } from './dom.ts';

const layer = () => document.getElementById('fx-layer') || document.body.appendChild(h('div#fx-layer'));
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function burst(x = 0.5, y = 0.6, big = false) {
  if (reduced()) return;
  confetti({
    particleCount: big ? 160 : 60,
    spread: big ? 110 : 70,
    startVelocity: big ? 48 : 34,
    origin: { x, y },
    colors: ['#ffc928', '#8d4fe0', '#ff5d8f', '#2f8ff0', '#3dbb5b', '#ff8a1f'],
    scalar: big ? 1.2 : 0.9,
    ticks: 160,
    disableForReducedMotion: true,
  });
}

export function burstAt(el: Element, big = false) {
  const c = rectCenter(el);
  burst(c.x / innerWidth, c.y / innerHeight, big);
}

export function sparkle(el: Element, n = 10) {
  if (reduced()) return;
  const c = rectCenter(el);
  const L = layer();
  for (let i = 0; i < n; i++) {
    const s = h('div.sparkle', { style: { left: c.x + 'px', top: c.y + 'px' } });
    L.append(s);
    const a = (Math.PI * 2 * i) / n + Math.random() * 0.4;
    const d = 50 + Math.random() * 60;
    gsap.fromTo(s, { scale: 0.2, opacity: 1 }, {
      x: Math.cos(a) * d, y: Math.sin(a) * d, scale: 1 + Math.random(), opacity: 0, rotation: 180,
      duration: 0.7 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => s.remove(),
    });
  }
}

/** Star flies from an element to the HUD star counter. */
export function flyStar(from: Element, onArrive?: () => void) {
  const target = document.querySelector('.hud-stars .star-ico');
  const a = rectCenter(from);
  const b = target ? rectCenter(target) : { x: innerWidth - 60, y: 40 };
  const s = h('div.fly-star', { style: { left: a.x + 'px', top: a.y + 'px' } }, '★');
  layer().append(s);
  const tl = gsap.timeline({ onComplete: () => { s.remove(); onArrive?.(); } });
  tl.fromTo(s, { scale: 0 }, { scale: 1.6, duration: 0.25, ease: 'back.out(3)' })
    .to(s, { x: b.x - a.x, y: b.y - a.y, scale: 0.7, rotation: 360, duration: 0.6, ease: 'power2.in' });
}

export function shake(el: Element) {
  gsap.fromTo(el, { x: 0 }, { keyframes: { x: [-12, 12, -9, 9, -4, 4, 0] }, duration: 0.45, ease: 'none' });
}

export function pop(el: Element, scale = 1.18) {
  gsap.fromTo(el, { scale: 1 }, { scale, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
}

export function popIn(els: Element | Element[], stagger = 0.06, delay = 0) {
  return gsap.fromTo(els, { scale: 0.3, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.5, stagger, delay, ease: 'back.out(1.8)', clearProps: 'transform' });
}

export function hint(el: Element) {
  el.classList.add('hint');
  setTimeout(() => el.classList.remove('hint'), 2600);
}

export function floatText(el: Element, text: string, color = '#fff') {
  const c = rectCenter(el);
  const t = h('div.float-text', { style: { left: c.x + 'px', top: c.y + 'px', color } }, text);
  layer().append(t);
  gsap.fromTo(t, { y: 0, opacity: 1, scale: 0.6 }, { y: -70, opacity: 0, scale: 1.3, duration: 1, ease: 'power1.out', onComplete: () => t.remove() });
}

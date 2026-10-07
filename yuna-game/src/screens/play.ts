import gsap from 'gsap';
import { h, onTap, wait } from '../core/dom.ts';
import { charSrc, islandSrc, art } from '../core/art.ts';
import { say, sfx, music, stopVoice } from '../core/audio.ts';
import { burst, flyStar, shake, sparkle } from '../core/fx.ts';
import { progress, save, recordPhase, isUnlocked } from '../core/store.ts';
import { ISLANDS, PHASES } from '../data/islands.ts';
import { MECH_TITLE, type Mech } from '../data/mechanics.ts';
import { PRAISE, ENCOURAGE } from '../data/lines.ts';
import { GAMES, makeSession } from '../games/index.ts';
import type { Ctx, Level } from '../games/types.ts';
import { go } from '../main.ts';
import { islandScreen } from './island.ts';
import { mapScreen } from './map.ts';

const POSES = ['think', 'point', 'cheer', 'clap', 'wave'] as const;

export function playScreen(root: HTMLElement, islandId: number, phase: number, forced?: Mech[], back?: () => void) {
  const leave = back ?? (() => go((r) => islandScreen(r, islandId)));
  const isl = ISLANDS[islandId];
  root.classList.add('play-screen');
  root.style.setProperty('--c', isl.color);
  music('play');
  POSES.forEach((p) => { new Image().src = charSrc('yuna-' + p); });

  const session = forced ?? makeSession(isl, phase);
  let closed = false;

  const close = h('button.round-btn.close', { 'aria-label': 'Sair' }, '✕');
  const track = h('div.track', ...session.map(() => h('span.step')), h('img.track-boat', { src: charSrc('boat'), alt: '' }));
  const stars = h('div.hud-stars', h('span.star-ico', '★'), h('b', '0'));
  const stage = h('div.stage');
  const yuna = h('img.buddy', { src: charSrc('yuna-think'), alt: 'Yuna', draggable: 'false' });
  const bubbleText = h('p');
  const replay = h('button.replay', { 'aria-label': 'Ouvir outra vez' }, '🔊');
  const bubble = h('div.buddy-bubble', bubbleText, replay);
  const title = h('div.mech-title');
  root.append(
    h('div.play-bg', { style: { backgroundImage: `url(${islandSrc(islandId)})` } }),
    h('div.hud.play-hud', close, track, stars),
    title,
    stage,
    h('div.buddy-zone', yuna, bubble),
  );

  let lastKeys: string[] = [];
  let lastText = '';
  let bubbleToken = 0;
  // The bubble shows the instruction while Yuna speaks, then shrinks to a small
  // speaker button so it never covers the game.
  const speakBubble = async (keys: string[], text: string) => {
    const t = ++bubbleToken;
    bubbleText.textContent = text;
    bubble.classList.remove('collapsed');
    gsap.fromTo(bubble, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)' });
    if (keys.length) await say(keys);
    await wait(keys.length ? 900 : 2500);
    if (t === bubbleToken && !closed) bubble.classList.add('collapsed');
  };
  const setMood = (pose: string) => {
    const src = charSrc('yuna-' + pose);
    if (yuna.getAttribute('src') === src) return;
    gsap.to(yuna, { scale: 0.85, duration: 0.1, onComplete: () => { yuna.setAttribute('src', src); gsap.to(yuna, { scale: 1, duration: 0.35, ease: 'back.out(3)' }); } });
  };
  let praiseIdx = Math.floor(Math.random() * PRAISE.length);
  let lastEncourage = 0;

  const makeCtx = (mech: keyof typeof GAMES, level: Level): Ctx => {
    const ctx: Ctx = {
      island: isl, level, mech, stage, mistakes: 0,
      closed: () => closed,
      instruct: async (keys, text) => {
        lastKeys = keys;
        lastText = text;
        await speakBubble(keys, text);
      },
      say: (k) => say(k),
      good: async (el, final) => {
        sfx('correct');
        if (el) sparkle(el, final ? 14 : 8);
        setMood(final ? 'cheer' : 'clap');
        praiseIdx = (praiseIdx + 1 + Math.floor(Math.random() * 3)) % PRAISE.length;
        await say('p.' + praiseIdx);
        if (final) await wait(150);
      },
      bad: (el) => {
        sfx('wrong', { vol: 0.7 });
        if (el) shake(el);
        ctx.mistakes++;
        setMood('think');
        const now = performance.now();
        if (now - lastEncourage > 3000) {
          lastEncourage = now;
          say('e.' + Math.floor(Math.random() * ENCOURAGE.length));
        }
      },
      mood: (p) => setMood(p),
    };
    return ctx;
  };

  onTap(replay, () => { if (lastText) speakBubble(lastKeys, lastText); });
  onTap(yuna, () => { if (lastText) speakBubble(lastKeys, lastText); gsap.fromTo(yuna, { y: 0 }, { y: -16, yoyo: true, repeat: 1, duration: 0.15 }); });
  onTap(close, () => { closed = true; stopVoice(); leave(); });

  const moveBoat = (k: number) => {
    const steps = track.querySelectorAll('.step');
    steps.forEach((s, i) => s.classList.toggle('done', i < k));
    const target = steps[Math.min(k, steps.length - 1)] as HTMLElement;
    const boat = track.querySelector('.track-boat') as HTMLElement;
    gsap.to(boat, { x: target.offsetLeft + target.offsetWidth / 2 - boat.offsetWidth / 2, duration: 0.6, ease: 'power2.inOut' });
  };

  (async () => {
    await wait(450);
    moveBoat(0);
    let mistakes = 0;
    for (let k = 0; k < session.length; k++) {
      if (closed) return;
      const mech = session[k];
      stage.innerHTML = '';
      stage.className = `stage m-${mech}`;
      title.textContent = MECH_TITLE[mech];
      gsap.fromTo(title, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'back.out(2)' });
      const ctx = makeCtx(mech, phase as Level);
      try {
        await GAMES[mech](ctx);
      } catch (e) {
        console.error('game failed', mech, e);
      }
      if (closed) return;
      mistakes += ctx.mistakes;
      progress.played++;
      save();
      flyStar(track.querySelectorAll('.step')[k], () => {
        sfx('star', { vol: 0.6 });
        (stars.querySelector('b') as HTMLElement).textContent = String(k + 1);
      });
      moveBoat(k + 1);
      setMood('think');
      if (k === 4) { await say('ui.great5'); }
      await gsap.to(stage.children, { opacity: 0, y: -20, duration: 0.3 });
    }
    finish(mistakes);
  })();

  async function finish(mistakes: number) {
    const earned = mistakes <= 2 ? 3 : mistakes <= 5 ? 2 : 1;
    const before = isUnlocked(islandId + 1);
    const { newSticker } = recordPhase(islandId, phase, earned);
    const unlockedNew = islandId < 19 && !before && isUnlocked(islandId + 1);
    stage.innerHTML = '';
    title.textContent = '';
    music(null);
    sfx('fanfare');
    burst(0.5, 0.45, true);
    setTimeout(() => burst(0.2, 0.5), 400);
    setTimeout(() => burst(0.8, 0.5), 700);
    const starEls = [0, 1, 2].map((i) => h(`span.res-star${i < earned ? '.on' : ''}`, '★'));
    const next = phase < 2 ? h('button.btn.primary', `${PHASES[phase + 1].icon} ${PHASES[phase + 1].name}`) : null;
    const again = h('button.btn', '↻ Outra vez');
    const toMap = h('button.btn', back ? '🏝 Voltar à ilha' : '🗺 Mapa');
    const card = h('div.result-card',
      h('img.res-yuna', { src: charSrc('yuna-cheer'), alt: '' }),
      h('img.res-tanha', { src: charSrc('tanha-happy'), alt: '' }),
      h('h2', 'Fase completa!'),
      h('p', `${isl.name} · ${PHASES[phase].name}`),
      h('div.res-stars', ...starEls),
      h('div.res-actions', next, again, toMap));
    root.append(h('div.result-layer', card));
    gsap.from(card, { scale: 0.5, opacity: 0, duration: 0.6, ease: 'back.out(1.8)' });
    starEls.forEach((s, i) => gsap.from(s, { scale: 0, rotation: -180, duration: 0.6, delay: 0.5 + i * 0.25, ease: 'back.out(3)', onStart: () => i < earned && sfx('star', { rate: 1 + i * 0.12 }) }));
    await say('ui.phaseDone');
    if (newSticker) await showSticker();
    if (unlockedNew) { sfx('unlock'); await say('ui.newIsland'); }
    if (next) onTap(next, () => go((r) => playScreen(r, islandId, phase + 1, undefined, back)));
    onTap(again, () => go((r) => playScreen(r, islandId, phase, undefined, back)));
    onTap(toMap, () => (back ? back() : go(mapScreen)));
    music('map');
  }

  async function showSticker() {
    const st = h('div.sticker-reveal', h('div.sticker-rays'), h('div.sticker', art(isl.rewardItem), h('b', isl.reward)));
    root.append(st);
    gsap.from(st.querySelector('.sticker'), { scale: 0, rotation: -30, duration: 0.8, ease: 'back.out(2)' });
    sfx('unlock');
    burst(0.5, 0.4, true);
    await say('r.' + islandId);
    await say('ui.sticker');
    await wait(600);
    onTap(st, () => gsap.to(st, { opacity: 0, duration: 0.3, onComplete: () => st.remove() }));
    setTimeout(() => st.isConnected && gsap.to(st, { opacity: 0, duration: 0.4, onComplete: () => st.remove() }), 2500);
  }

  return () => { closed = true; };
}

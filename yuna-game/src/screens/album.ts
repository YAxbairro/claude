import gsap from 'gsap';
import { h, onTap } from '../core/dom.ts';
import { art, islandSrc } from '../core/art.ts';
import { say, sfx } from '../core/audio.ts';
import { progress, islandStars } from '../core/store.ts';
import { ISLANDS } from '../data/islands.ts';

export function openAlbum() {
  sfx('whoosh');
  say('ui.album');
  const close = h('button.round-btn.close', { 'aria-label': 'Fechar' }, '✕');
  const grid = h('div.album-grid', ...ISLANDS.map((isl) => {
    const got = progress.stickers.includes(isl.id);
    const s = islandStars(isl.id);
    const cell = h(`div.album-cell${got ? '.got' : ''}`,
      h('div.album-sticker', got ? art(isl.rewardItem) : h('img.album-isl', { src: islandSrc(isl.id), alt: '' })),
      h('b', got ? isl.reward : isl.name),
      h('span.album-stars', `★ ${s}/9`));
    if (got) onTap(cell, () => { sfx('star'); say('r.' + isl.id); gsap.fromTo(cell, { rotation: -6 }, { rotation: 0, duration: 0.7, ease: 'elastic.out' }); });
    else onTap(cell, () => say('isl.' + isl.id));
    return cell;
  }));
  const layer = h('div.modal-layer', h('div.album',
    h('div.album-head', h('h2', 'Álbum de descobertas'), close),
    h('p.album-sub', `${progress.stickers.length} de 20 autocolantes · completa as 3 fases de uma ilha para ganhar o seu prémio`),
    grid));
  document.body.append(layer);
  gsap.from(layer.firstElementChild, { y: 80, opacity: 0, duration: 0.45, ease: 'back.out(1.4)' });
  gsap.from(grid.children, { scale: 0.6, opacity: 0, stagger: 0.025, duration: 0.3, delay: 0.15 });
  onTap(close, () => gsap.to(layer, { opacity: 0, duration: 0.25, onComplete: () => layer.remove() }));
}

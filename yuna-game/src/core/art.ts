// Turns an Item into a visual element. All items render into a square box
// and scale with the CSS variable --s on the parent.
import { h, svg } from './dom.ts';
import { ITEMS, type Item } from '../data/items.ts';
import { ISLANDS } from '../data/islands.ts';

export const ASSET = import.meta.env.BASE_URL + 'assets/';
export const itemSrc = (id: string) => `${ASSET}items/${id}.webp`;
export const islandSrc = (i: number) => `${ASSET}islands/${String(i).padStart(2, '0')}-${ISLANDS[i].slug}.webp`;
export const charSrc = (pose: string) => `${ASSET}chars/${pose}.webp`;

const SHAPES: Record<string, (fill: string) => SVGElement> = {
  circulo: (f) => svg('circle', { cx: 50, cy: 50, r: 40, fill: f }),
  quadrado: (f) => svg('rect', { x: 14, y: 14, width: 72, height: 72, rx: 8, fill: f }),
  triangulo: (f) => svg('path', { d: 'M50 10 L90 86 L10 86 Z', fill: f, 'stroke-linejoin': 'round', stroke: f, 'stroke-width': 6 }),
  retangulo: (f) => svg('rect', { x: 6, y: 26, width: 88, height: 50, rx: 8, fill: f }),
  coracao: (f) => svg('path', { d: 'M50 86 C20 64 6 48 6 32 C6 18 18 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C82 8 94 18 94 32 C94 48 80 64 50 86 Z', fill: f }),
  'estrela-forma': (f) => svg('path', { d: 'M50 6 L62 37 L95 38 L69 58 L78 91 L50 72 L22 91 L31 58 L5 38 L38 37 Z', fill: f, 'stroke-linejoin': 'round', stroke: f, 'stroke-width': 4 }),
  losango: (f) => svg('path', { d: 'M50 6 L88 50 L50 94 L12 50 Z', fill: f, 'stroke-linejoin': 'round', stroke: f, 'stroke-width': 4 }),
  oval: (f) => svg('ellipse', { cx: 50, cy: 50, rx: 30, ry: 42, fill: f }),
};
const SHAPE_COLORS: Record<string, string> = {
  circulo: '#2f8ff0', quadrado: '#ef3b4b', triangulo: '#ffc928', retangulo: '#3dbb5b', coracao: '#ff5d8f',
  'estrela-forma': '#ffb020', losango: '#8d4fe0', oval: '#ff8a1f',
};
const GLYPH_COLORS = ['#ef3b4b', '#2f8ff0', '#3dbb5b', '#ff8a1f', '#8d4fe0', '#ff5d8f', '#00a7b5', '#ffb020'];

let gradId = 0;
function shapeSvg(id: string, silhouette = false) {
  const g = `sg${gradId++}`;
  const base = silhouette ? '#1c2340' : SHAPE_COLORS[id] || '#888';
  const root = svg('svg', { viewBox: '0 0 100 100', class: 'shape-svg' });
  const defs = svg('defs');
  const lg = svg('radialGradient', { id: g, cx: '35%', cy: '30%', r: '75%' },
    svg('stop', { offset: '0%', 'stop-color': silhouette ? base : '#ffffff', 'stop-opacity': silhouette ? 1 : 0.55 }),
    svg('stop', { offset: '45%', 'stop-color': base }),
    svg('stop', { offset: '100%', 'stop-color': base, 'stop-opacity': 1 }));
  defs.appendChild(lg);
  root.appendChild(defs);
  const shadow = SHAPES[id]('rgba(0,0,0,.18)');
  shadow.setAttribute('transform', 'translate(2 5)');
  if (!silhouette) root.appendChild(shadow);
  root.appendChild(SHAPES[id](`url(#${g})`));
  return root;
}

function colorBlob(hex: string) {
  const root = svg('svg', { viewBox: '0 0 100 100', class: 'blob-svg' });
  const g = `cb${gradId++}`;
  root.appendChild(svg('defs', {}, svg('radialGradient', { id: g, cx: '35%', cy: '30%', r: '70%' },
    svg('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': 0.7 }),
    svg('stop', { offset: '35%', 'stop-color': hex }),
    svg('stop', { offset: '100%', 'stop-color': hex }))));
  root.appendChild(svg('path', { d: 'M52 8 C72 6 92 22 92 46 C94 70 76 92 50 92 C26 94 8 76 8 52 C6 30 26 10 52 8 Z', fill: 'rgba(0,0,0,.15)', transform: 'translate(2 5)' }));
  root.appendChild(svg('path', { d: 'M52 8 C72 6 92 22 92 46 C94 70 76 92 50 92 C26 94 8 76 8 52 C6 30 26 10 52 8 Z', fill: `url(#${g})`, stroke: hex === '#ffffff' ? '#e3e3ef' : 'none', 'stroke-width': 2 }));
  return root;
}

export function art(it: Item | string, opts: { silhouette?: boolean; tint?: number } = {}): HTMLElement {
  const item = typeof it === 'string' ? ITEMS[it] : it;
  const box = h('div.art', { 'data-id': item.id });
  if (item.art === 'img') {
    const im = h('img', { src: itemSrc(item.id), alt: item.word, draggable: 'false', decoding: 'async' }) as HTMLImageElement;
    if (opts.silhouette) box.classList.add('silhouette');
    box.append(im);
  } else if (item.art === 'shape') {
    box.append(shapeSvg(item.id, opts.silhouette));
  } else if (item.art === 'color') {
    box.append(colorBlob(item.hex!));
  } else {
    const color = GLYPH_COLORS[(opts.tint ?? item.id.charCodeAt(1) + item.id.length) % GLYPH_COLORS.length];
    const text = item.id.startsWith('n') ? item.id.slice(1) : item.word;
    box.append(h('span.glyph', { style: { color } }, text));
  }
  return box;
}

export function preloadImages(urls: string[]) {
  return Promise.all(urls.map((u) => new Promise<void>((res) => {
    const im = new Image();
    im.onload = im.onerror = () => res();
    im.src = u;
  })));
}

export const itemImages = (ids: string[]) => ids.filter((id) => ITEMS[id]?.art === 'img').map(itemSrc);

// Gera pontos de terra (lon/lat) uniformes para globos pontilhados:
// rasteriza a terra numa máscara equiretangular e amostra pontos de Fibonacci.
// Uso: node globe-dots.mjs <saida.js> [n_pontos]
import { readFileSync, writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';

const topo = JSON.parse(readFileSync(new URL('./node_modules/world-atlas/land-50m.json', import.meta.url)));
const land = feature(topo, topo.objects.land);
const W = 4096, H = 2048, mask = new Uint8Array(W * H);

const rings = [];
for (const f of land.features) {
  const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const poly of polys) for (const ring of poly) rings.push(ring.map(([lo, la]) => [(lo + 180) / 360 * W, (90 - la) / 180 * H]));
}
// preenchimento por linhas (regra par-ímpar), com bounding box por anel para ser rápido
const boxes = rings.map((r) => [Math.min(...r.map((q) => q[1])), Math.max(...r.map((q) => q[1]))]);
for (let y = 0; y < H; y++) {
  const yc = y + 0.5, xs = [];
  for (let n = 0; n < rings.length; n++) {
    if (yc < boxes[n][0] || yc > boxes[n][1]) continue;
    const r = rings[n];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [x1, y1] = r[i], [x2, y2] = r[j];
      if ((y1 > yc) !== (y2 > yc)) xs.push(x1 + (yc - y1) / (y2 - y1) * (x2 - x1));
    }
  }
  xs.sort((a, b) => a - b);
  for (let k = 0; k + 1 < xs.length; k += 2)
    for (let x = Math.max(0, Math.ceil(xs[k])); x < Math.min(W, xs[k + 1]); x++) mask[y * W + x] = 1;
}

const N = Number(process.argv[3] || 60000), pts = [], ga = Math.PI * (3 - Math.sqrt(5));
for (let i = 0; i < N; i++) {
  const y = 1 - (i / (N - 1)) * 2, th = ga * i;
  const lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(Math.sin(th), Math.cos(th)) * 180 / Math.PI;
  const px = Math.min(W - 1, Math.floor((lon + 180) / 360 * W)), py = Math.min(H - 1, Math.floor((90 - lat) / 180 * H));
  if (mask[py * W + px]) pts.push(+lon.toFixed(2), +lat.toFixed(2));
}
writeFileSync(process.argv[2], 'window.LAND=' + JSON.stringify(pts) + ';');
console.log('land points', pts.length / 2);

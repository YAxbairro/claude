// Turns each high-res island illustration into a walkable 3D diorama (Trellis 2).
import fs from 'node:fs';
import path from 'node:path';
import { falRun, download, dataUri, pool, CACHE, spent } from './fal-lib.mjs';
const SLUGS = ['cores', 'formas', 'numeros', 'letras', 'quinta', 'pomar', 'corpo', 'casinha', 'praia', 'coral',
  'viagens', 'sabores', 'musica', 'jardim', 'cuidado', 'nuvens', 'hello', 'tracos', 'estrelas', 'amizade'];
const only = process.argv.slice(2).map(Number);
const list = SLUGS.map((s, i) => i).filter((i) => !only.length || only.includes(i));
await pool(list, 4, async (i) => {
  const name = `isl-${String(i).padStart(2, '0')}`;
  const out = path.join(CACHE, '3d', name + '.glb');
  if (fs.existsSync(out)) return;
  const img = path.join(CACHE, 'islands', `${String(i).padStart(2, '0')}-${SLUGS[i]}.png`);
  const res = await falRun('fal-ai/trellis-2', { image_url: dataUri(img), resolution: 1024, texture_size: 2048, decimation_target: 60000, remesh: true },
    { cost: 0.15, label: '3d-' + name });
  await download(res.model_glb.url, out);
  console.log('ok', name);
});
console.log('spent so far $' + spent().toFixed(3));

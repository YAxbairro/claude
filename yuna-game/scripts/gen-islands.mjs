// Re-renders each 225px tile of the island grid as a crisp, high-resolution
// island on a plain background (nano-banana edit, tile used as reference).
// Usage: node scripts/gen-islands.mjs [index ...]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { falRun, download, dataUri, pool, CACHE, spent } from './fal-lib.mjs';

const SLUGS = ['cores', 'formas', 'numeros', 'letras', 'quinta', 'pomar', 'corpo', 'casinha', 'praia', 'coral',
  'viagens', 'sabores', 'musica', 'jardim', 'cuidado', 'nuvens', 'hello', 'tracos', 'estrelas', 'amizade'];

const dir = path.join(CACHE, 'islands');
fs.mkdirSync(dir, { recursive: true });

// Cut the 4x5 grid into 20 reference tiles (with a little upscale so the model sees detail).
execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('art-source/island-grid-a.webp').convert('RGB')
for i in range(20):
    r,c=divmod(i,4)
    im.crop((c*225,r*225,c*225+225,r*225+225)).resize((512,512),Image.LANCZOS).save('${dir}/tile-%02d.png'%i)
`]);

const PROMPT = `Recreate this exact miniature island diorama as a high-resolution, richly detailed 3D render in the same cute stylized game art style (Pixar / Animal Crossing / mobile game diorama). Keep the same main objects, layout, colors and the small wooden pier. The whole island must be fully visible and centered, seen from the same three-quarter top view, with its sandy beach and rocks around the base. Place it on a perfectly plain flat white background with NO ocean and NO water around it. Soft warm sunlight, gentle ambient occlusion, crisp clean edges, vibrant saturated colors, no text, no border.`;

const only = process.argv.slice(2).map(Number);
const list = SLUGS.map((slug, i) => ({ id: slug, i })).filter((x) => !only.length || only.includes(x.i));

await pool(list, 4, async ({ id, i }) => {
  const out = path.join(dir, `${String(i).padStart(2, '0')}-${id}.png`);
  if (fs.existsSync(out)) return out;
  const res = await falRun('fal-ai/nano-banana/edit', {
    prompt: PROMPT,
    image_urls: [dataUri(path.join(dir, `tile-${String(i).padStart(2, '0')}.png`))],
    num_images: 1,
    output_format: 'png',
  }, { cost: 0.0398, label: 'island-' + id });
  await download(res.images[0].url, out);
  console.log('ok', out);
  return out;
});
console.log('spent so far $' + spent().toFixed(3));

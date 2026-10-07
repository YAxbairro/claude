// Generates one illustration per `img` item (flux/dev), then cutout.py makes
// transparent webps in public/assets/items. Usage: node scripts/gen-items.mjs [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { falRun, download, pool, CACHE, spent } from './fal-lib.mjs';

const { ITEMS } = await import('../src/data/items.ts');
const dir = path.join(CACHE, 'items');
fs.mkdirSync(dir, { recursive: true });

const style = (subject) =>
  `A single ${subject}, cute 3D cartoon game asset in the style of a Pixar animated movie and a premium mobile game, chunky rounded friendly shapes, soft clay-like materials, glossy highlights, warm soft studio lighting, vibrant saturated colors, centered, the whole object fully visible with generous margin, isolated on a plain pure white background, no shadow on the ground, no text, no border`;

const only = process.argv.slice(2);
const list = Object.values(ITEMS).filter((it) => it.art === 'img' && (!only.length || only.includes(it.id)));
console.log('items to render', list.length);

await pool(list, 4, async (it) => {
  const out = path.join(dir, it.id + '.png');
  if (fs.existsSync(out)) return;
  const res = await falRun('fal-ai/flux/dev', {
    prompt: style(it.prompt),
    image_size: { width: 640, height: 640 },
    num_inference_steps: 28,
    guidance_scale: 3.5,
    num_images: 1,
    seed: Number(process.env.SEED || 7),
    enable_safety_checker: true,
    output_format: 'png',
  }, { cost: 0.0103, label: 'item-' + it.id });
  await download(res.images[0].url, out);
  console.log('ok', it.id);
});
console.log('spent so far $' + spent().toFixed(3));

// Extra poses of Yuna and Gata Tanha, keeping the reference design.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { falRun, download, dataUri, pool, CACHE, spent } from './fal-lib.mjs';

const dir = path.join(CACHE, 'chars');
fs.mkdirSync(dir, { recursive: true });
const ref = path.join(dir, 'ref.png');
if (!fs.existsSync(ref)) {
  execFileSync('python3', ['-c', `
from PIL import Image
im=Image.open('art-source/yuna-tanha-a.webp').convert('RGBA')
bg=Image.new('RGBA',im.size,(255,255,255,255)); bg.alpha_composite(im); bg.convert('RGB').save('${ref}')`]);
}

const KEEP = `Keep EXACTLY the same character design as the reference: the same little girl (dark brown curly afro hair, warm brown skin, big brown eyes), the same purple corduroy overalls with rolled cuffs, white t-shirt, yellow backpack, purple sneakers with yellow hearts; and the same ginger-and-cream kitten with big green eyes and a purple collar with a gold paw tag. Same high-quality 3D Pixar animation style and lighting. Plain pure white background, the full body visible and centered, no text.`;

const POSES = [
  ['yuna-wave', 'Show only the girl, alone, standing and waving hello with one hand, big friendly smile.'],
  ['tanha-sit', 'Show only the kitten, alone, sitting upright facing the viewer, happy open-mouth smile, tail curled beside it.'],
  ['yuna-cheer', 'Show only the girl, alone, jumping with joy with both arms raised high in celebration, huge happy open smile, feet off the ground.'],
  ['yuna-think', 'Show only the girl, alone, standing in a curious thinking pose with one finger on her chin, looking up with a playful thoughtful smile.'],
  ['yuna-point', 'Show only the girl, alone, standing and pointing forward with one hand, excited encouraging expression, as if saying "look there!".'],
  ['yuna-clap', 'Show only the girl, alone, clapping her hands happily, eyes closed with a proud joyful grin.'],
  ['tanha-happy', 'Show only the kitten, alone, leaping playfully in the air with front paws up and tail curled, very happy face.'],
  ['tanha-sleep', 'Show only the kitten, alone, curled up asleep in a cozy ball, peaceful smile, tiny "z" not needed.'],
  ['boat', 'Show the girl and the kitten together sitting in a small cute wooden sailboat with a white sail with a yellow star, seen from a three-quarter top view, the whole boat visible, the girl waving. No water, plain white background.'],
];

await pool(POSES, 4, async ([id, pose]) => {
  const out = path.join(dir, id + '.png');
  if (fs.existsSync(out)) return;
  const res = await falRun('fal-ai/nano-banana/edit', {
    prompt: `${pose} ${KEEP}`, image_urls: [dataUri(ref)], num_images: 1, output_format: 'png',
  }, { cost: 0.0398, label: 'char-' + id });
  await download(res.images[0].url, out);
  console.log('ok', id);
});
console.log('spent so far $' + spent().toFixed(3));

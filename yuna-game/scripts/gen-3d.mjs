// 3D pipeline: A-pose image -> Trellis 2 mesh -> (characters) Meshy rig + animations.
// usage: node scripts/gen-3d.mjs <step> [...]
import fs from 'node:fs';
import path from 'node:path';
import { falRun, download, dataUri, CACHE, spent } from './fal-lib.mjs';

const dir = path.join(CACHE, '3d');
fs.mkdirSync(dir, { recursive: true });
const [step, ...args] = process.argv.slice(2);

const KEEP = `the same little girl (dark brown curly afro hair, warm brown skin, big brown eyes), the same purple corduroy overalls with rolled cuffs, white t-shirt, small yellow backpack, purple sneakers with yellow hearts. Same 3D Pixar animation style.`;

if (step === 'pose') {
  const res = await falRun('fal-ai/nano-banana/edit', {
    prompt: `Full body front view of ${KEEP} She stands perfectly straight facing the camera in a relaxed A-pose for 3D rigging: arms held slightly away from the body angled down about 30 degrees, open hands, legs slightly apart, feet flat, gentle smile, looking straight ahead. Plain pure white background, entire body visible from head to shoes, centered, no shadow, no other objects, no cat.`,
    image_urls: [dataUri(path.join(CACHE, 'chars', 'yuna-wave.png'))], num_images: 1, output_format: 'png',
  }, { cost: 0.0398, label: '3d-yuna-pose' });
  await download(res.images[0].url, path.join(dir, 'yuna-apose.png'));
  console.log('ok pose');
}

if (step === 'mesh') {
  // args: name imagePath [decimation]
  const [name, img, dec] = args;
  const res = await falRun('fal-ai/trellis-2', {
    image_url: dataUri(img), resolution: 1024, texture_size: 2048, decimation_target: Number(dec || 40000), remesh: true,
  }, { cost: 0.25, label: '3d-mesh-' + name });
  await download(res.model_glb.url, path.join(dir, name + '.glb'));
  fs.writeFileSync(path.join(dir, name + '.json'), JSON.stringify(res, null, 1));
  console.log('ok mesh', name, res.model_glb.url);
}

if (step === 'rig') {
  // args: name glbUrl heightMeters ids(comma)
  const [name, url, height, ids] = args;
  const res = await falRun('fal-ai/meshy/rigging/multi-animation', {
    model_url: url, height_meters: Number(height || 1.1), animation_action_ids: ids.split(',').map(Number),
  }, { cost: 0.08, label: '3d-rig-' + name });
  fs.writeFileSync(path.join(dir, name + '-rig.json'), JSON.stringify(res, null, 1));
  console.log(JSON.stringify(res, null, 1).slice(0, 3000));
}
console.log('spent so far $' + spent().toFixed(3));

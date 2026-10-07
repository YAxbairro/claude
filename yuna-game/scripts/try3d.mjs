import path from 'node:path';
import { falRun, download, dataUri, CACHE, spent } from './fal-lib.mjs';
const img = dataUri(path.join(CACHE, '3d', process.argv[2] || 'yuna-apose.png'));
const tag = process.argv[3] || 'yuna';
await Promise.all([
  false && falRun('fal-ai/hunyuan-3d/v3.1/rapid/image-to-3d', { input_image_url: img }, { cost: 0.3, label: 'try-hunyuan-' + tag })
    .then(async (r) => { await download(r.model_glb.url, path.join(CACHE, '3d', tag + '-hunyuan.glb')); console.log('hunyuan ok'); }).catch((e) => console.log('hunyuan', e.message)),
  falRun('tripo3d/p2/image-to-3d', { image_url: img, face_limit: 30000, texture_quality: 'detailed', pbr: false, texture: true }, { cost: 0.4, label: 'try-tripo-' + tag })
    .then(async (r) => { const u = r.model_mesh?.url || r.model_urls?.glb?.url || r.model_urls?.pbr_model?.url; console.log(JSON.stringify(r).slice(0, 500)); await download(u, path.join(CACHE, '3d', tag + '-tripo.glb')); console.log('tripo ok'); }).catch((e) => console.log('tripo', e.message)),
]);
console.log('spent so far $' + spent().toFixed(3));

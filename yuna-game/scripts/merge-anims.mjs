// Merges a rigged character and several single-clip animation GLBs (same
// skeleton) into one GLB with named clips, then shrinks textures to WebP.
// usage: node scripts/merge-anims.mjs <dir> <out.glb> [maxTexture]
import fs from 'node:fs';
import path from 'node:path';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, textureCompress, resample } from '@gltf-transform/functions';
import sharp from 'sharp';

const [dir, out, maxTex = '1024'] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const base = await io.read(path.join(dir, 'rigged.glb'));
const root = base.getRoot();
root.listAnimations().forEach((a) => a.dispose());
const nodesByName = new Map(root.listNodes().map((n) => [n.getName(), n]));
const buffer = root.listBuffers()[0];

const clips = fs.readdirSync(dir).filter((f) => f.endsWith('.glb') && f !== 'rigged.glb');
for (const file of clips) {
  const name = path.basename(file, '.glb');
  const src = await io.read(path.join(dir, file));
  const anims = src.getRoot().listAnimations();
  if (!anims.length) { console.log('no anim in', file); continue; }
  const srcAnim = anims[0];
  const anim = base.createAnimation(name);
  let n = 0;
  for (const ch of srcAnim.listChannels()) {
    const target = nodesByName.get(ch.getTargetNode()?.getName());
    if (!target) continue;
    const s = ch.getSampler();
    const input = base.createAccessor().setArray(s.getInput().getArray().slice()).setType(s.getInput().getType()).setBuffer(buffer);
    const output = base.createAccessor().setArray(s.getOutput().getArray().slice()).setType(s.getOutput().getType()).setBuffer(buffer);
    const sampler = base.createAnimationSampler().setInput(input).setOutput(output).setInterpolation(s.getInterpolation());
    anim.addSampler(sampler).addChannel(base.createAnimationChannel().setTargetNode(target).setTargetPath(ch.getTargetPath()).setSampler(sampler));
    n++;
  }
  console.log('clip', name, n, 'channels');
}
await base.transform(resample(), dedup(), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [Number(maxTex), Number(maxTex)], quality: 85 }));
await io.write(out, base);
console.log('wrote', out, Math.round(fs.statSync(out).size / 1024), 'KB');

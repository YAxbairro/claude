import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const { ITEMS } = await import('../src/data/items.ts');
const { ISLANDS } = await import('../src/data/islands.ts');
const { allLines } = await import('../src/data/lines.ts');
const A = new URL('../public/assets/', import.meta.url);

test('every island references known items and groups', () => {
  assert.equal(ISLANDS.length, 20);
  for (const isl of ISLANDS) {
    assert.ok(isl.items.length >= 8, `${isl.name} has too few items`);
    for (const id of [...isl.items, isl.rewardItem, ...isl.groups.flatMap((g) => g.items)]) assert.ok(ITEMS[id], `${isl.name}: unknown item ${id}`);
    assert.ok(new Set(isl.mechs).size >= 9, `${isl.name} needs more mechanic variety`);
  }
});

test('every illustrated item and island has its image', () => {
  for (const it of Object.values(ITEMS)) if (it.art === 'img') assert.ok(fs.existsSync(new URL(`items/${it.id}.webp`, A)), `missing art for ${it.id}`);
  for (const isl of ISLANDS) assert.ok(fs.existsSync(new URL(`islands/${String(isl.id).padStart(2, '0')}-${isl.slug}.webp`, A)), `missing island ${isl.slug}`);
  for (const pose of ['yuna-wave', 'yuna-cheer', 'yuna-think', 'yuna-point', 'yuna-clap', 'tanha-sit', 'tanha-happy', 'tanha-sleep', 'boat']) assert.ok(fs.existsSync(new URL(`chars/${pose}.webp`, A)), pose);
});

test('every narrated line is packed in an existing voice sprite', () => {
  const idx = JSON.parse(fs.readFileSync(new URL('../src/data/voice-index.json', import.meta.url)));
  const missing = Object.keys(allLines()).filter((k) => !idx.clips[k]?.length);
  assert.deepEqual(missing, []);
  for (const name of idx.sprites) assert.ok(fs.existsSync(new URL(`voice/${name}.mp3`, A)), `missing sprite ${name}`);
  for (const [k, list] of Object.entries(idx.clips)) for (const [, start, dur] of list) assert.ok(start >= 0 && dur > 0.2, `bad clip ${k}`);
});

// Records every line in src/data/lines.ts with ElevenLabs (via fal) and
// writes public/assets/voice/<key>.mp3. Already-recorded keys are skipped,
// so editing a line only re-records that line (delete its mp3 first).
// Usage: node --experimental-strip-types scripts/gen-voice.mjs [prefix ...]
import fs from 'node:fs';
import path from 'node:path';
import { falRun, download, pool, PUBLIC, spent } from './fal-lib.mjs';

const { allLines } = await import('../src/data/lines.ts');
// "Claudia - Friendly": European Portuguese with a light Angolan warmth.
const VOICE = process.env.VOICE_ID || 'JGnWZj684pcXmK2SxYIv';
const dir = path.join(PUBLIC, 'voice');
fs.mkdirSync(dir, { recursive: true });

const prefixes = process.argv.slice(2);
const lines = Object.entries(allLines()).filter(([k]) => !prefixes.length || prefixes.some((p) => k.startsWith(p)));
const todo = lines.filter(([k]) => !fs.existsSync(path.join(dir, k + '.mp3')));
console.log('lines', lines.length, 'to record', todo.length);

await pool(todo, 4, async ([key, text]) => {
  const english = key.startsWith('en.');
  const res = await falRun('fal-ai/elevenlabs/tts/multilingual-v2', {
    text,
    voice: VOICE,
    stability: 0.4,
    similarity_boost: 0.8,
    style: 0.45,
    speed: english ? 0.9 : 0.95,
    language_code: english ? 'en' : 'pt',
  }, { cost: (text.length / 1000) * 0.1, label: 'voice-' + key });
  await download(res.audio.url, path.join(dir, key + '.mp3'));
});
console.log('spent so far $' + spent().toFixed(3));

// Music (Lyria 2) and sound effects (ElevenLabs SFX) via fal.
// Writes public/assets/audio/{music,sfx}/<id>.mp3
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { falRun, download, pool, CACHE, PUBLIC, spent } from './fal-lib.mjs';

const tmp = path.join(CACHE, 'audio');
fs.mkdirSync(tmp, { recursive: true });
const MUSIC = path.join(PUBLIC, 'audio', 'music');
const SFX = path.join(PUBLIC, 'audio', 'sfx');
fs.mkdirSync(MUSIC, { recursive: true });
fs.mkdirSync(SFX, { recursive: true });

const NEG = 'vocals, singing, lyrics, voice, harsh, distorted, dark, scary, sad, heavy drums, electric guitar, dubstep';
const TRACKS = [
  ['map', 'Joyful Cape Verdean funaná and coladeira inspired children\'s adventure theme, bright cavaquinho strumming, acoustic guitar, cheerful accordion melody, light shakers and congas, marimba, sunny tropical island mood, playful and uplifting, 112 bpm, instrumental'],
  ['play', 'Gentle calm morna inspired background music for a children\'s learning game, soft cavaquinho fingerpicking, warm nylon string guitar, soft marimba, light shaker, relaxed and focused, 88 bpm, instrumental, very soft'],
  ['title', 'Magical whimsical opening theme for a children\'s animated movie about tropical islands, celesta, glockenspiel, pizzicato strings, cavaquinho, soft ocean feel, sense of wonder and adventure, instrumental'],
];

const SOUNDS = [
  ['tap', 'soft cute bubble pop, UI tap sound for a children\'s game', 0.5],
  ['correct', 'bright cheerful ascending two-note xylophone chime, correct answer sound, children\'s game', 1],
  ['wrong', 'soft gentle cartoon boing, playful try again sound, not harsh', 1],
  ['star', 'magical sparkle shimmer, collecting a golden star, glockenspiel twinkle', 1.5],
  ['whoosh', 'quick soft airy whoosh transition', 0.7],
  ['flip', 'playing card flipping over', 0.5],
  ['splash', 'small playful water splash', 1],
  ['fanfare', 'short triumphant children\'s game victory fanfare with xylophone and trumpets, happy kids cheering yay at the end', 4],
  ['unlock', 'magical ascending harp glissando with chimes, new level unlocked', 2.5],
  ['meow', 'cute happy kitten meow', 1],
  ['purr', 'kitten purring softly', 2],
  ['pop', 'bubble pop', 0.4],
  ['drop', 'soft wooden thunk of a toy dropping into a basket', 0.5],
  ['paint', 'wet paint brush splat', 0.7],
  ['snap', 'puzzle piece snapping into place, satisfying click', 0.5],
  ['draw', 'pencil scribbling on paper', 1],
  ['cheer', 'group of little children cheering yay and clapping', 2.5],
  ['waves', 'calm tropical beach ocean waves ambience, gentle and continuous', 10],
  ['sail', 'small wooden sailboat moving through gentle waves, sail flapping in the wind', 3],
  // instruments for the "sound" mini-game
  ['inst-piano', 'a short happy melody played on solo piano', 2.5],
  ['inst-guitarra', 'a short strummed chord progression on solo acoustic guitar', 2.5],
  ['inst-violino', 'a short sweet melody on solo violin', 2.5],
  ['inst-tambor', 'a short rhythm on a solo drum, bum bum bum', 2],
  ['inst-sino', 'a golden bell ringing ding dong', 2],
  ['inst-trompete', 'a short cheerful fanfare on solo trumpet', 2.5],
  ['inst-cavaquinho', 'a short bright strummed rhythm on solo cavaquinho ukulele', 2.5],
  ['inst-maracas', 'maracas shaking a rhythm', 2],
  ['inst-flauta', 'a short melody on a solo wooden recorder flute', 2.5],
  ['inst-xilofone', 'a short ascending melody on a solo xylophone', 2],
  // animals and vehicles play when tapped
  ['an-vaca', 'a cow mooing', 1.5], ['an-cao', 'a small friendly dog barking twice', 1.2], ['an-porco', 'a pig oinking', 1.2],
  ['an-galinha', 'a chicken clucking', 1.5], ['an-ovelha', 'a sheep bleating baa', 1.3], ['an-cavalo', 'a horse neighing', 1.8],
  ['an-pato', 'a duck quacking', 1], ['an-gato', 'a cute cat meowing', 1], ['an-burro', 'a donkey braying hee-haw', 2],
  ['an-pintainho', 'a baby chick peeping', 1], ['an-cabra', 'a goat bleating', 1.3], ['an-passaro', 'a little bird chirping', 1.2],
  ['an-abelha', 'a bee buzzing', 1.2], ['an-golfinho', 'a dolphin clicking and squeaking', 1.5], ['an-gaivota', 'a seagull calling', 1.3],
  ['ve-carro', 'a friendly car horn beep beep', 1], ['ve-comboio', 'a steam train whistle choo choo', 1.8], ['ve-aviao', 'an airplane flying past', 2],
  ['ve-helicoptero', 'a helicopter flying', 2], ['ve-navio', 'a ship horn', 1.5], ['ve-bicicleta', 'a bicycle bell ring ring', 1],
  ['ve-autocarro', 'a bus horn honk', 1], ['ve-mota', 'a motorbike engine vroom', 1.5], ['ve-foguetao', 'a rocket launching whoosh', 2.5],
  ['ve-trator', 'a tractor engine chugging', 1.8],
];

const which = process.argv[2] || 'all';

if (which === 'all' || which === 'music') {
  await pool(TRACKS, 3, async ([id, prompt]) => {
    const raw = path.join(tmp, id + '.wav');
    const out = path.join(MUSIC, id + '.mp3');
    if (fs.existsSync(out)) return;
    if (!fs.existsSync(raw)) {
      const res = await falRun('fal-ai/lyria2', { prompt, negative_prompt: NEG, seed: 11 }, { cost: 0.1, label: 'music-' + id });
      await download(res.audio.url, raw);
    }
    // Loudness-normalise and fade the tail into the head so the loop is seamless enough.
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af',
      'loudnorm=I=-20:TP=-2:LRA=11,afade=t=in:d=0.4,areverse,afade=t=in:d=1.5,areverse',
      '-ac', '2', '-b:a', '128k', out]);
    console.log('music ok', id);
  });
}

if (which === 'all' || which === 'sfx') {
  await pool(SOUNDS, 4, async ([id, text, secs]) => {
    const out = path.join(SFX, id + '.mp3');
    if (fs.existsSync(out)) return;
    const raw = path.join(tmp, 'sfx-' + id + '.mp3');
    if (!fs.existsSync(raw)) {
      const res = await falRun('fal-ai/elevenlabs/sound-effects/v2', { text, duration_seconds: Math.max(0.5, secs), prompt_influence: 0.6 },
        { cost: 0.002 * Math.max(0.5, secs), label: 'sfx-' + id });
      await download(res.audio.url, raw);
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', raw, '-af', 'loudnorm=I=-18:TP=-1.5', '-ac', '1', '-b:a', '96k', out]);
    console.log('sfx ok', id);
  });
}
console.log('spent so far $' + spent().toFixed(3));

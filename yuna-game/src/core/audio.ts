// Web Audio engine: three buses (music, voice, sfx), buffer cache, music
// crossfades and automatic ducking while the narrator speaks.
import { allLines } from '../data/lines.ts';
import { progress } from './store.ts';

const BASE = import.meta.env.BASE_URL + 'assets/';
let ctx: AudioContext | null = null;
let musicBus: GainNode, voiceBus: GainNode, sfxBus: GainNode, duck: GainNode;
const cache = new Map<string, Promise<AudioBuffer | null>>();
let LINES: Record<string, string> | null = null;

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC({ latencyHint: 'interactive' });
    const master = ctx.createGain();
    master.connect(ctx.destination);
    duck = ctx.createGain();
    duck.connect(master);
    musicBus = ctx.createGain();
    musicBus.connect(duck);
    voiceBus = ctx.createGain();
    voiceBus.connect(master);
    sfxBus = ctx.createGain();
    sfxBus.connect(master);
    applyVolumes();
    document.addEventListener('visibilitychange', () => {
      if (!ctx) return;
      if (document.hidden) ctx.suspend(); else ctx.resume();
    });
  }
  if (ctx.state !== 'running') ctx.resume();
}

export function applyVolumes() {
  if (!ctx) return;
  musicBus.gain.value = progress.music * 0.55;
  voiceBus.gain.value = progress.voice;
  sfxBus.gain.value = progress.sfx * 0.7;
}

function load(path: string): Promise<AudioBuffer | null> {
  let p = cache.get(path);
  if (!p) {
    p = fetch(BASE + path)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(r.status)))
      .then((b) => new Promise<AudioBuffer>((res, rej) => {
        if (!ctx) unlockSilently();
        ctx!.decodeAudioData(b, res, rej);
      }))
      .catch(() => null);
    cache.set(path, p);
  }
  return p;
}

function unlockSilently() {
  // Decoding needs a context; creating one without a gesture is allowed, it just stays suspended.
  if (!ctx) unlock();
}

export const voicePath = (key: string) => `voice/${key}.mp3`;
export const preload = (paths: string[]) => paths.forEach((p) => load(p));
export const preloadVoice = (keys: string[]) => preload(keys.map(voicePath));

// ── Sound effects
export function sfx(name: string, opts: { rate?: number; vol?: number } = {}) {
  if (!ctx) return;
  load(`audio/sfx/${name}.mp3`).then((buf) => {
    if (!buf || !ctx) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = opts.rate ?? 1;
    const g = ctx.createGain();
    g.gain.value = opts.vol ?? 1;
    src.connect(g).connect(sfxBus);
    src.start();
  });
}

// Tiny synthesized blip for very frequent feedback (no file needed, zero latency).
export function blip(freq = 660, dur = 0.08, type: OscillatorType = 'sine', vol = 0.25) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  o.frequency.exponentialRampToValueAtTime(freq * 1.5, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur + 0.05);
  o.connect(g).connect(sfxBus);
  o.start();
  o.stop(ctx.currentTime + dur + 0.06);
}

// ── Music
let current: { name: string; src: AudioBufferSourceNode; gain: GainNode } | null = null;
export async function music(name: string | null) {
  if (!ctx) return;
  if (current?.name === name) return;
  const old = current;
  current = null;
  if (old) {
    old.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    setTimeout(() => { try { old.src.stop(); } catch { /* already stopped */ } }, 2000);
  }
  if (!name) return;
  const buf = await load(`audio/music/${name}.mp3`);
  if (!buf || !ctx || current) return;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const gain = ctx.createGain();
  gain.gain.value = 0;
  src.connect(gain).connect(musicBus);
  src.start();
  gain.gain.setTargetAtTime(1, ctx.currentTime, 0.6);
  current = { name, src, gain };
}

// ── Voice
let sayToken = 0;
let voiceSrc: AudioBufferSourceNode | null = null;
let speaking = false;

function setDuck(on: boolean) {
  if (!ctx) return;
  duck.gain.setTargetAtTime(on ? 0.3 : 1, ctx.currentTime, on ? 0.08 : 0.5);
}

export function stopVoice() {
  sayToken++;
  try { voiceSrc?.stop(); } catch { /* not started */ }
  voiceSrc = null;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  speaking = false;
  setDuck(false);
}

export const isSpeaking = () => speaking;

function playBuffer(buf: AudioBuffer): Promise<void> {
  return new Promise((res) => {
    if (!ctx) return res();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(voiceBus);
    voiceSrc = src;
    let done = false;
    const finish = () => { if (!done) { done = true; res(); } };
    src.onended = finish;
    // If audio is suspended (no gesture yet, tab in background) `ended` never
    // fires; never let a game wait forever on the narrator.
    setTimeout(finish, buf.duration * 1000 + 400);
    src.start();
  });
}

function speakFallback(text: string, lang = 'pt-PT'): Promise<void> {
  return new Promise((res) => {
    if (!('speechSynthesis' in window) || progress.voice === 0) return res();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.95;
    u.pitch = 1.15;
    const v = speechSynthesis.getVoices().find((x) => x.lang.toLowerCase().startsWith(lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onend = () => res();
    u.onerror = () => res();
    speechSynthesis.speak(u);
    setTimeout(res, 6000);
  });
}

/** Speak one or more catalogue keys in sequence. A new call interrupts the previous one. */
export async function say(keys: string | string[], gap = 90): Promise<void> {
  const list = Array.isArray(keys) ? keys : [keys];
  stopVoice();
  const token = sayToken;
  speaking = true;
  setDuck(true);
  const bufs = list.map((k) => load(voicePath(k)));
  for (let i = 0; i < list.length; i++) {
    const buf = await bufs[i];
    if (token !== sayToken) return;
    if (buf) await playBuffer(buf);
    else {
      LINES ??= allLines();
      const text = LINES[list[i]];
      if (text) await speakFallback(text, list[i].startsWith('en.') ? 'en-GB' : 'pt-PT');
    }
    if (token !== sayToken) return;
    if (i < list.length - 1) await new Promise((r) => setTimeout(r, gap));
  }
  if (token === sayToken) {
    speaking = false;
    setDuck(false);
  }
}

export const lineText = (key: string) => (LINES ??= allLines())[key] ?? '';

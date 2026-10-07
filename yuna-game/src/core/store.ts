// Progress lives in localStorage on this device. Every access is guarded so a
// private window or blocked storage just means "no saved progress".
export type Progress = {
  stars: Record<string, number>; // "island-phase" -> best stars (0..3)
  stickers: number[];            // islands whose reward was collected
  played: number;                // exercises completed in total
  current: number;               // island where the boat is anchored
  unlockAll: boolean;
  music: number;                 // 0..1
  voice: number;                 // 0..1
  sfx: number;                   // 0..1
  seenIntro: boolean;
};

const KEY = 'yuna-ilhas-v2';
const DEFAULT: Progress = { stars: {}, stickers: [], played: 0, current: 0, unlockAll: false, music: 0.45, voice: 1, sfx: 0.8, seenIntro: false };

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) };
  } catch { /* storage unavailable */ }
  return { ...DEFAULT, stars: {}, stickers: [] };
}

export const progress: Progress = load();

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(progress)); } catch { /* ignore */ }
}

export const starsFor = (island: number, phase: number) => progress.stars[`${island}-${phase}`] || 0;
export const islandStars = (island: number) => [0, 1, 2].reduce((s, p) => s + starsFor(island, p), 0);
export const islandDone = (island: number) => [0, 1, 2].every((p) => starsFor(island, p) > 0);
export const totalStars = () => Object.values(progress.stars).reduce((a, b) => a + b, 0);

export function isUnlocked(island: number) {
  if (progress.unlockAll || island === 0) return true;
  return [0, 1, 2].some((p) => starsFor(island - 1, p) > 0);
}

export function recordPhase(island: number, phase: number, stars: number) {
  const key = `${island}-${phase}`;
  const before = progress.stars[key] || 0;
  progress.stars[key] = Math.max(before, stars);
  progress.current = island;
  let newSticker = false;
  if (islandDone(island) && !progress.stickers.includes(island)) {
    progress.stickers.push(island);
    newSticker = true;
  }
  save();
  return { firstTime: before === 0, newSticker };
}

export function resetProgress() {
  Object.assign(progress, { ...DEFAULT, stars: {}, stickers: [], music: progress.music, voice: progress.voice, sfx: progress.sfx });
  save();
}

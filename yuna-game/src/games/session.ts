import type { Mech } from '../data/mechanics.ts';
import type { Island } from '../data/islands.ts';
import { ITEMS } from '../data/items.ts';
import { shuffle, pick } from '../core/rng.ts';

// Builds the 10 exercises of a phase. Kept free of DOM imports so it can be unit-tested.
export function eligible(m: Mech, isl: Island) {
  const imgs = isl.items.filter((id) => ITEMS[id].art === 'img' || ITEMS[id].art === 'shape').length;
  switch (m) {
    case 'shadow': return imgs >= 3;
    case 'sort': return isl.groups.filter((g) => g.items.length >= 2).length >= 2;
    case 'english': return isl.items.filter((id) => ITEMS[id].en).length >= 3;
    case 'sound': return isl.items.filter((id) => ['piano', 'guitarra', 'violino', 'tambor', 'sino', 'trompete', 'cavaquinho', 'maracas', 'flauta', 'xilofone'].includes(id)).length >= 3;
    default: return isl.items.length >= 4;
  }
}

// How well each mechanic fits each phase: discover → practise → adventure.
const AFFINITY: Record<Mech, [number, number, number]> = {
  find: [5, 2, 1], riddle: [4, 3, 2], english: [5, 4, 3], shadow: [4, 3, 2], peek: [4, 2, 2], sound: [5, 4, 3], colorof: [4, 3, 1],
  letterstart: [3, 4, 3], count: [4, 4, 2], trace: [4, 4, 3], memory: [3, 4, 3], paint: [3, 4, 2], mix: [2, 4, 3],
  odd: [1, 4, 3], sort: [2, 5, 3], basket: [3, 4, 2], feed: [4, 3, 2], pattern: [1, 4, 3], simon: [2, 4, 4], more: [2, 4, 3],
  size: [2, 4, 3], connect: [2, 4, 3], missing: [1, 3, 4], bubbles: [3, 3, 5], catch: [2, 3, 5], maze: [2, 3, 5], puzzle: [1, 2, 5],
};

export function makeSession(isl: Island, phase: number, length = 10): Mech[] {
  const pool = isl.mechs.filter((m) => eligible(m, isl));
  const unique = [...new Set(pool)];
  const weight = (m: Mech) => AFFINITY[m][phase] * (pool.filter((x) => x === m).length);
  const out: Mech[] = [];
  const opener = phase === 0 ? (unique.includes('find') ? 'find' : unique.includes('english') ? 'english' : unique.includes('sound') ? 'sound' : unique[0]) : null;
  if (opener) out.push(opener);
  const finale: Mech | null = phase === 2 && unique.includes('puzzle') ? 'puzzle' : null;
  const target = finale ? length - 1 : length;
  // Weighted pick with repetition limits: max 2 of any mechanic, never back to back.
  while (out.length < target) {
    const counts = (m: Mech) => out.filter((x) => x === m).length;
    const distinct = new Set(out).size;
    const needVariety = distinct < Math.min(7, unique.length) && out.length >= target - (Math.min(7, unique.length) - distinct);
    const cands = shuffle(unique).filter((m) => m !== out[out.length - 1] && m !== finale && counts(m) < (needVariety ? 1 : 2) && !(needVariety && counts(m) > 0));
    const list = cands.length ? cands : unique.filter((m) => m !== out[out.length - 1] && m !== finale);
    const total = list.reduce((s, m) => s + weight(m), 0);
    let r = Math.random() * total;
    let chosen = list[0];
    for (const m of list) { r -= weight(m); if (r <= 0) { chosen = m; break; } }
    out.push(chosen ?? pick(unique));
  }
  if (finale) out.push(finale);
  return out;
}

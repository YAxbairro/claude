export const rand = (n: number) => Math.floor(Math.random() * n);
export const between = (a: number, b: number) => a + rand(b - a + 1);
export const pick = <T>(arr: readonly T[]): T => arr[rand(arr.length)];
export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sample = <T>(arr: readonly T[], n: number): T[] => shuffle(arr).slice(0, n);
export const chance = (p: number) => Math.random() < p;

// Recently-used memory so the same targets don't keep coming back.
const recent: string[] = [];
export function fresh<T extends string>(pool: readonly T[], n = 1): T[] {
  const notRecent = pool.filter((p) => !recent.includes(p));
  const src = notRecent.length >= n ? notRecent : pool;
  const chosen = sample(src, n);
  for (const c of chosen) {
    recent.push(c);
    if (recent.length > Math.max(4, Math.floor(pool.length / 2))) recent.shift();
  }
  return chosen;
}

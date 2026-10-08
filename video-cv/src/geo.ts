import TL from "./timeline.json";

export const FPS = TL.fps;
export type Pt = { x: number; y: number };

// Projeção simples: 360 unidades por grau, origem a NO do arquipélago.
const proj = (lon: number, lat: number): Pt => ({ x: (lon + 25.45) * 360, y: (17.3 - lat) * 360 });

export type Island = {
  id: string;
  name: string;
  c: Pt;
  port: Pt;
  rx: number;
  ry: number;
  rot: number;
  fill: [string, string];
  seed: number;
  labelDy?: number;
  labelDx?: number;
  minor?: boolean;
};

export const ISLANDS: Island[] = [
  { id: "sa", name: "SANTO ANTÃO", c: proj(-25.17, 17.07), port: proj(-25.02, 17.0), rx: 76, ry: 46, rot: -18, fill: ["#3fae5a", "#1f6e3a"], seed: 3, labelDy: -70 },
  { id: "sv", name: "SÃO VICENTE", c: proj(-24.96, 16.84), port: proj(-24.99, 16.88), rx: 36, ry: 25, rot: 10, fill: ["#e2b56b", "#a8743a"], seed: 5, labelDy: 52, labelDx: -30 },
  { id: "sl", name: "", c: proj(-24.75, 16.76), port: proj(-24.75, 16.76), rx: 18, ry: 9, rot: -20, fill: ["#e9cf9a", "#b99358"], seed: 9, minor: true },
  { id: "sn", name: "SÃO NICOLAU", c: proj(-24.25, 16.6), port: proj(-24.3, 16.58), rx: 90, ry: 22, rot: -12, fill: ["#78b45a", "#3e7b35"], seed: 11, labelDy: -52 },
  { id: "sal", name: "SAL", c: proj(-22.93, 16.72), port: proj(-22.93, 16.65), rx: 18, ry: 42, rot: 4, fill: ["#f6e7c1", "#d4b47a"], seed: 13, labelDy: -66 },
  { id: "bv", name: "BOA VISTA", c: proj(-22.82, 16.1), port: proj(-22.88, 16.15), rx: 60, ry: 52, rot: 0, fill: ["#f3d79a", "#cfa35a"], seed: 17, labelDy: 76, labelDx: -40 },
  { id: "maio", name: "MAIO", c: proj(-23.17, 15.23), port: proj(-23.2, 15.15), rx: 30, ry: 38, rot: 10, fill: ["#f1d9a2", "#c99f5c"], seed: 19, labelDy: -58, labelDx: 20 },
  { id: "santiago", name: "SANTIAGO", c: proj(-23.63, 15.1), port: proj(-23.51, 14.93), rx: 48, ry: 92, rot: 18, fill: ["#58a85b", "#2d6a39"], seed: 23, labelDx: -110, labelDy: -40 },
  { id: "fogo", name: "FOGO", c: proj(-24.38, 14.93), port: proj(-24.47, 14.9), rx: 42, ry: 42, rot: 0, fill: ["#6b5a4e", "#2f2621"], seed: 29, labelDy: -66 },
  { id: "brava", name: "BRAVA", c: proj(-24.7, 14.84), port: proj(-24.69, 14.86), rx: 16, ry: 15, rot: 0, fill: ["#6dbb6a", "#357a3b"], seed: 31, labelDy: 46 },
];

// "praia" é o porto/aeroporto de Santiago
export const STOP: Record<string, Island> = Object.fromEntries(ISLANDS.map((i) => [i.id, i]));
STOP.praia = STOP.santiago;

export const MAP_CENTER: Pt = { x: 520, y: 470 };

const rand = (seed: number) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

export const islandPath = (isl: Island) => {
  const r = rand(isl.seed);
  const n = 22;
  const harm = [1, 2, 3, 5].map((k) => ({ k, a: (r() - 0.5) * 0.28 / Math.sqrt(k), p: r() * Math.PI * 2 }));
  const rot = (isl.rot * Math.PI) / 180;
  const pts: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    let m = 1 + harm.reduce((acc, h) => acc + h.a * Math.sin(h.k * a + h.p), 0);
    m += (r() - 0.5) * 0.1;
    const x = Math.cos(a) * isl.rx * m;
    const y = Math.sin(a) * isl.ry * m;
    pts.push({ x: isl.c.x + x * Math.cos(rot) - y * Math.sin(rot), y: isl.c.y + x * Math.sin(rot) + y * Math.cos(rot) });
  }
  // Catmull-Rom -> Bézier para costas suaves
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)} ${c2.x.toFixed(1)} ${c2.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + " Z";
};

export type Leg = (typeof TL.legs)[number];
export const LEGS: Leg[] = TL.legs;

export const legCurve = (leg: Leg, i: number) => {
  const a = STOP[leg.from].port;
  const b = STOP[leg.to].port;
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy);
  const bend = (leg.mode === "plane" ? 0.32 : 0.18) * (i % 2 === 0 ? 1 : -1);
  const ctrl = { x: (a.x + b.x) / 2 - (dy / len) * len * bend, y: (a.y + b.y) / 2 + (dx / len) * len * bend };
  return { a, b, ctrl, len };
};

export const bez = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: (1 - t) ** 2 * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
  y: (1 - t) ** 2 * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
export const bezTan = (a: Pt, c: Pt, b: Pt, t: number): Pt => ({
  x: 2 * (1 - t) * (c.x - a.x) + 2 * t * (b.x - c.x),
  y: 2 * (1 - t) * (c.y - a.y) + 2 * t * (b.y - c.y),
});

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const legProgress = (leg: Leg, t: number) => easeInOut(clamp01((t - leg.start) / (leg.end - leg.start)));

// Câmara (alvo bruto); suavizada no componente com média móvel.
export const cameraTarget = (t: number): { x: number; y: number; z: number; rot: number } => {
  const [jStart] = TL.scenes.journey;
  const lastEnd = LEGS[LEGS.length - 1].end;
  const praia = STOP.praia.port;
  if (t < jStart - 0.5) {
    const k = clamp01((t - TL.scenes.islands[0]) / 3);
    return { x: MAP_CENTER.x, y: MAP_CENTER.y + 10, z: 0.92 + 0.08 * k, rot: -3 + 3 * k };
  }
  if (t < jStart) {
    const k = easeInOut(clamp01((t - (jStart - 0.5)) / 0.5));
    return { x: MAP_CENTER.x + (praia.x - MAP_CENTER.x) * k, y: MAP_CENTER.y + (praia.y - MAP_CENTER.y) * k, z: 1 + 0.9 * k, rot: 0 };
  }
  if (t < lastEnd) {
    const i = LEGS.findIndex((l) => t >= l.start && t < l.end);
    const leg = LEGS[Math.max(0, i)];
    const { a, b, ctrl } = legCurve(leg, i);
    const p = legProgress(leg, t);
    const pos = bez(a, ctrl, b, p);
    const z = leg.mode === "plane" ? 1.9 - 0.75 * Math.sin(Math.PI * p) : 2.15;
    return { x: pos.x, y: pos.y, z, rot: 0 };
  }
  const k = easeInOut(clamp01((t - lastEnd) / 1.2));
  const z = 2.15 + (0.95 - 2.15) * k - 0.04 * clamp01((t - lastEnd - 1.2) / 2);
  return { x: praia.x + (MAP_CENTER.x - praia.x) * k, y: praia.y + (MAP_CENTER.y - praia.y) * k, z, rot: 0 };
};

export const camera = (frame: number) => {
  const N = 9;
  let x = 0, y = 0, z = 0, rot = 0;
  for (let i = 0; i < N; i++) {
    const c = cameraTarget(Math.max(0, frame - i * 1.2) / FPS);
    x += c.x; y += c.y; z += c.z; rot += c.rot;
  }
  return { x: x / N, y: y / N, z: z / N, rot: rot / N };
};

export const beatPulse = (t: number) => {
  const beat = 60 / TL.bpm;
  if (t < TL.sections.groove) return 0;
  const ph = ((t - TL.sections.groove) / beat) % 1;
  return Math.exp(-ph * 7);
};

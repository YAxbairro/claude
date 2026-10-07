// The archipelago: island layout, distance-based loading (a picture far away,
// the walkable 3D diorama up close), ground analysis and points of interest.
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { ISLANDS } from '../data/islands.ts';
import { islandSrc, itemSrc } from '../core/art.ts';
import { ITEMS } from '../data/items.ts';
import { proceduralIsland } from './companions.ts';
import { loadModel, loadTexture, cartoonify } from './assets.ts';
import { SEA_LEVEL } from './environment.ts';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export const ISLAND_SIZE = 19;   // metres across (roomy enough for streets a child can walk)
export const ISLAND_RADIUS = ISLAND_SIZE * 0.48;
const NEAR = 75, FAR = 95;

// Snake path through five regions so neighbouring islands are close by boat.
export const POSITIONS: THREE.Vector3[] = ISLANDS.map((_, i) => {
  const row = Math.floor(i / 4), col = i % 4;
  const c = row % 2 === 0 ? col : 3 - col;
  const jitterX = Math.sin(i * 2.3) * 5, jitterZ = Math.cos(i * 1.7) * 5;
  return new THREE.Vector3((c - 1.5) * 42 + jitterX, 0, -row * 44 + jitterZ);
});

export type Spot = { pos: THREE.Vector3; phase: number };
export type IslandRuntime = {
  id: number;
  group: THREE.Group;
  billboard: THREE.Sprite;
  mesh: THREE.Object3D | null;
  colliders: THREE.Mesh[];
  floorY: number;
  walk: THREE.Vector3[];
  spots: Spot[];
  shells: THREE.Vector3[];
  spawn: THREE.Vector3;
  nav: { N: number; x0: number; z0: number; cs: number; reach: Uint8Array; y: Float32Array } | null;
  loading: boolean;
  ready: boolean;
};

export function createIslands(scene: THREE.Scene) {
  const list: IslandRuntime[] = POSITIONS.map((p, id) => {
    const group = new THREE.Group();
    group.position.copy(p);
    const mat = new THREE.SpriteMaterial({ map: loadTexture(islandSrc(id)), transparent: true, depthWrite: true, alphaTest: 0.2 });
    const billboard = new THREE.Sprite(mat);
    billboard.scale.set(ISLAND_SIZE * 1.05, ISLAND_SIZE * 1.05, 1);
    billboard.position.y = ISLAND_SIZE * 0.3;
    group.add(billboard);
    scene.add(group);
    return { id, group, billboard, mesh: null, colliders: [], floorY: 1, walk: [], spots: [], shells: [], spawn: p.clone(), loading: false, nav: null, ready: false };
  });

  async function load(isl: IslandRuntime) {
    if (isl.loading || isl.ready) return;
    isl.loading = true;
    try {
      let model: THREE.Object3D;
      try {
        const gltf = await loadModel(`isl-${String(isl.id).padStart(2, '0')}`);
        model = gltf.scene.clone(true);
        cartoonify(model, { receive: true });
      } catch {
        // No 3D model for this island yet: build a simple one with its objects as cut-outs.
        const data = ISLANDS[isl.id];
        model = proceduralIsland(ISLAND_SIZE, data.color, data.items.filter((id) => ITEMS[id]?.art === 'img').slice(0, 5), itemSrc);
      }
      // Normalise: centred, ISLAND_SIZE wide, base slightly under water.
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const k = ISLAND_SIZE / Math.max(size.x, size.z);
      model.scale.setScalar(k);
      const box2 = new THREE.Box3().setFromObject(model);
      const c = box2.getCenter(new THREE.Vector3());
      model.position.set(-c.x, -box2.min.y - 0.55, -c.z);
      isl.group.add(model);
      isl.group.updateMatrixWorld(true);
      model.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh) { m.geometry.computeBoundsTree(); isl.colliders.push(m); }
      });
      isl.mesh = model;
      analyse(isl);
      isl.ready = true;
    } catch (e) {
      console.warn('island load failed', isl.id, e);
    }
    isl.loading = false;
  }

  /** Sample the top surface to find the walkable floor and good spots. */
  function analyse(isl: IslandRuntime) {
    const ray = new THREE.Raycaster();
    ray.firstHitOnly = true;
    const hits: { p: THREE.Vector3; ny: number }[] = [];
    const N = 48, half = ISLAND_SIZE * 0.5;
    const grid: ({ p: THREE.Vector3; ny: number } | null)[] = new Array(N * N).fill(null);
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const x = isl.group.position.x - half + (i + 0.5) * (ISLAND_SIZE / N);
      const z = isl.group.position.z - half + (j + 0.5) * (ISLAND_SIZE / N);
      ray.set(new THREE.Vector3(x, 40, z), new THREE.Vector3(0, -1, 0));
      const h = ray.intersectObjects(isl.colliders, false)[0];
      if (h && h.point.y > 0.25) {
        const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
        const cell = { p: h.point.clone(), ny: Math.abs(n.y) }; // some generated faces are flipped
        hits.push(cell);
        grid[i * N + j] = cell;
      }
    }
    // Walkable cells: dry, not too steep, and no big step to any neighbour.
    // The largest connected patch is where Yuna can really go; rings, shells
    // and the spawn point all come from it, so every one of them is reachable.
    const ok = (k: number) => { const c = grid[k]; return !!c && c.p.y > SEA_LEVEL + 0.35 && c.ny > 0.6; };
    const HOP = 1.15; // Yuna hops up ledges this high on her own
    const walkable = new Uint8Array(N * N);
    for (let i = 1; i < N - 1; i++) for (let j = 1; j < N - 1; j++) {
      const k = i * N + j;
      if (!ok(k)) continue;
      const y = grid[k]!.p.y;
      // Most neighbours must be reachable too, so thin ledges don't count.
      if ([k - 1, k + 1, k - N, k + N].filter((q) => ok(q) && Math.abs(grid[q]!.p.y - y) < 0.65).length >= 3) walkable[k] = 1;
    }
    const comp = new Int32Array(N * N).fill(-1);
    let bestComp = -1, bestSize = 0;
    for (let k0 = 0, c = 0; k0 < N * N; k0++) {
      if (!walkable[k0] || comp[k0] >= 0) continue;
      const stack = [k0]; comp[k0] = c; let size = 0;
      while (stack.length) {
        const k = stack.pop()!; size++;
        for (const q of [k - 1, k + 1, k - N, k + N]) if (q >= 0 && q < N * N && walkable[q] && comp[q] < 0 && Math.abs(grid[q]!.p.y - grid[k]!.p.y) < HOP) { comp[q] = c; stack.push(q); }
      }
      if (size > bestSize) { bestSize = size; bestComp = c; }
      c++;
    }
    {
      const reachMask = new Uint8Array(N * N), ys = new Float32Array(N * N);
      for (let k = 0; k < N * N; k++) { reachMask[k] = comp[k] === bestComp ? 1 : 0; ys[k] = grid[k]?.p.y ?? 0; }
      isl.nav = { N, x0: isl.group.position.x - half, z0: isl.group.position.z - half, cs: ISLAND_SIZE / N, reach: reachMask, y: ys };
    }
    // Roomy = reachable and all 8 neighbours reachable too (space for a ring).
    const reach = (k: number) => comp[k] === bestComp;
    const reachable: THREE.Vector3[] = [], roomy: THREE.Vector3[] = [];
    for (let k = 0; k < N * N; k++) {
      if (!reach(k)) continue;
      reachable.push(grid[k]!.p);
      if ([-N - 1, -N, -N + 1, -1, 1, N - 1, N, N + 1].every((d) => reach(k + d))) roomy.push(grid[k]!.p);
    }
    // Floor = most common height among flat hits.
    const bins = new Map<number, number>();
    for (const h of hits) if (h.ny > 0.8) { const b = Math.round(h.p.y * 4) / 4; bins.set(b, (bins.get(b) || 0) + 1); }
    let floor = 1, best = 0;
    bins.forEach((n, b) => { if (n > best) { best = n; floor = b; } });
    isl.floorY = floor;
    isl.walk = reachable.length > 20 ? reachable : hits.filter((h) => h.ny > 0.75 && Math.abs(h.p.y - floor) < 0.7).map((h) => h.p);
    if (!isl.walk.length) isl.walk = [isl.group.position.clone().setY(floor)];
    const center = isl.group.position;
    const base = roomy.length > 20 ? roomy : isl.walk;
    const inner = base.filter((p) => Math.hypot(p.x - center.x, p.z - center.z) < ISLAND_RADIUS * 0.82);
    const pool = inner.length > 10 ? inner : base;
    // Three activity spots spread far apart (farthest-point sampling).
    const spots: THREE.Vector3[] = [];
    let first = pool.reduce((a, b) => (Math.hypot(a.x - center.x, a.z - center.z) < Math.hypot(b.x - center.x, b.z - center.z) ? a : b));
    first = pool.reduce((a, b) => (a.distanceTo(first) > b.distanceTo(first) ? a : b));
    spots.push(first);
    while (spots.length < 3) {
      const next = pool.reduce((a, b) => (Math.min(...spots.map((s) => s.distanceTo(a))) > Math.min(...spots.map((s) => s.distanceTo(b))) ? a : b));
      spots.push(next);
    }
    isl.spots = spots.map((p, phase) => ({ pos: p.clone(), phase }));
    // Golden shells on other walkable points, away from the spots.
    const free = pool.filter((p) => spots.every((s) => s.distanceTo(p) > 2.2));
    const shells: THREE.Vector3[] = [];
    for (let k = 0; k < 5 && free.length; k++) {
      const p = free.reduce((a, b) => (Math.min(99, ...[...spots, ...shells].map((s) => s.distanceTo(a))) > Math.min(99, ...[...spots, ...shells].map((s) => s.distanceTo(b))) ? a : b));
      shells.push(p.clone());
    }
    isl.shells = shells;
    // Spawn on the most open walkable point (farthest from tall objects).
    const obstacles = hits.filter((h) => h.p.y > floor + 0.7).map((h) => h.p);
    const clearance = (p: THREE.Vector3) => obstacles.reduce((m, o) => Math.min(m, Math.hypot(o.x - p.x, o.z - p.z)), 99);
    const away = pool.filter((p) => spots.every((s) => s.distanceTo(p) > 2.8));
    isl.spawn = (away.length ? away : pool).reduce((a, b) => (clearance(a) > clearance(b) ? a : b)).clone();
  }

  function update(focus: THREE.Vector3) {
    for (const isl of list) {
      const d = Math.hypot(isl.group.position.x - focus.x, isl.group.position.z - focus.z);
      if (d < FAR) load(isl);
      const showMesh = isl.ready && d < NEAR;
      if (isl.mesh) isl.mesh.visible = showMesh;
      isl.billboard.visible = !showMesh;
    }
  }

  const nearest = (p: THREE.Vector3) => list.reduce((a, b) => (a.group.position.distanceTo(p) < b.group.position.distanceTo(p) ? a : b));

  return { list, update, load, nearest };
}

/** Walking route over an island's nav grid (BFS + string pulling), or null. */
export function findPath(isl: IslandRuntime, from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3[] | null {
  const nav = isl.nav;
  if (!nav) return null;
  const { N, x0, z0, cs, reach, y } = nav;
  const cellOf = (p: THREE.Vector3) => {
    const i = Math.floor((p.x - x0) / cs), j = Math.floor((p.z - z0) / cs);
    return i >= 0 && j >= 0 && i < N && j < N ? i * N + j : -1;
  };
  // Nearest reachable cell to a point (small spiral search).
  const snap = (p: THREE.Vector3) => {
    const c = cellOf(p);
    if (c >= 0 && reach[c]) return c;
    let best = -1, bd = 1e9;
    for (let k = 0; k < N * N; k++) if (reach[k]) {
      const i = Math.floor(k / N), j = k % N;
      const d = Math.hypot(x0 + (i + 0.5) * cs - p.x, z0 + (j + 0.5) * cs - p.z);
      if (d < bd) { bd = d; best = k; }
    }
    return bd < 3 ? best : -1;
  };
  const a = snap(from), b = snap(to);
  if (a < 0 || b < 0) return null;
  const prev = new Int32Array(N * N).fill(-1);
  prev[a] = a;
  const q = [a];
  for (let h = 0; h < q.length && prev[b] < 0; h++) {
    const k = q[h], i = Math.floor(k / N), j = k % N;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const ii = i + di, jj = j + dj;
      if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
      const n = ii * N + jj;
      if (!reach[n] || prev[n] >= 0) continue;
      if (di && dj && (!reach[i * N + jj] || !reach[ii * N + j])) continue; // no corner cutting
      prev[n] = k; q.push(n);
    }
  }
  if (prev[b] < 0) return null;
  const cells: number[] = [];
  for (let k = b; k !== a; k = prev[k]) cells.push(k);
  cells.reverse();
  const pt = (k: number) => new THREE.Vector3(x0 + (Math.floor(k / N) + 0.5) * cs, y[k], z0 + ((k % N) + 0.5) * cs);
  // String pulling: skip cells while the straight segment stays on reachable ground.
  const clear = (p: THREE.Vector3, r: THREE.Vector3) => {
    const steps = Math.ceil(p.distanceTo(r) / (cs * 0.5));
    for (let s = 1; s < steps; s++) { const c = cellOf(p.clone().lerp(r, s / steps)); if (c < 0 || !reach[c]) return false; }
    return true;
  };
  const out: THREE.Vector3[] = [];
  let cur = from.clone();
  let idx = 0;
  while (idx < cells.length) {
    let far = idx;
    for (let k = cells.length - 1; k > idx; k--) if (clear(cur, pt(cells[k]))) { far = k; break; }
    const p = pt(cells[far]);
    out.push(p); cur = p; idx = far + 1;
  }
  const tc = cellOf(to);
  if (tc >= 0 && reach[tc]) out.push(to.clone());
  return out;
}

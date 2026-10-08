// The explorable 3D archipelago: Yuna walks, skips and jumps across the
// islands, Gata Tanha follows, the boat sails between islands, and glowing
// circles open the learning adventures.
import * as THREE from 'three';
import gsap from 'gsap';
import { h, onTap } from '../core/dom.ts';
import { itemSrc, islandSrc, charSrc } from '../core/art.ts';
import { music, say, sfx, unlock, blip, preloadVoice } from '../core/audio.ts';
import { progress, save, starsFor, isUnlocked, totalStars } from '../core/store.ts';
import { ISLANDS, PHASES } from '../data/islands.ts';
import { burst } from '../core/fx.ts';
import { go } from '../main.ts';
import { titleScreen } from '../screens/title.ts';
import { mapScreen } from '../screens/map.ts';
import { playScreen } from '../screens/play.ts';
import { openAlbum } from '../screens/album.ts';
import { openParents } from '../screens/parents.ts';
import { makeSky, makeOcean, makeClouds, SEA_LEVEL } from './environment.ts';
import { createIslands, findPath, POSITIONS, ISLAND_RADIUS, type IslandRuntime } from './islands.ts';
import { Character, groundAt, wallHit } from './character.ts';
import { Cat, Boat } from './companions.ts';
import { createInput } from './input.ts';
import { loadTexture } from './assets.ts';

const PHASE_COLORS = ['#2f8ff0', '#ff8a1f', '#8d4fe0'];
let toldTutorial = false;

function labelTexture(icon: string, title: string, stars: number, locked: boolean) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 160;
  const g = c.getContext('2d')!;
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.roundRect(8, 8, 240, 110, 30); g.fill();
  g.beginPath(); g.moveTo(112, 116); g.lineTo(128, 146); g.lineTo(144, 116); g.fill();
  g.font = '44px system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText(locked ? '🔒' : icon, 50, 78);
  g.fillStyle = '#2c2350'; g.font = 'bold 34px "Baloo 2", system-ui, sans-serif'; g.textAlign = 'left';
  g.fillText(title, 86, 62);
  g.font = '30px system-ui'; g.fillStyle = '#ffc928';
  g.fillText('★'.repeat(stars) + '☆'.repeat(3 - stars), 86, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function worldScreen(root: HTMLElement) {
  root.classList.add('world-screen');
  music('map');
  const W = () => root.clientWidth || innerWidth, H = () => root.clientHeight || innerHeight;

  // ── Renderer & scene
  const renderer = new THREE.WebGLRenderer({ antialias: devicePixelRatio < 2, powerPreference: 'high-performance' });
  let dpr = Math.min(devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(W(), H());
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.className = 'world-canvas';
  root.append(canvas);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#a8e6ff', 70, 280);
  const camera = new THREE.PerspectiveCamera(50, W() / H(), 0.1, 2000);
  scene.add(makeSky());
  scene.add(new THREE.HemisphereLight('#ffffff', '#6fbfd3', 1.45));
  const sun = new THREE.DirectionalLight('#fff1d6', 2.1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 80 });
  sun.shadow.bias = -0.0008;
  scene.add(sun, sun.target);
  const ocean = makeOcean(POSITIONS, ISLAND_RADIUS);
  scene.add(ocean.ocean);
  scene.add(makeClouds());
  const islands = createIslands(scene);

  // ── Characters
  const yuna = new Character();
  const cat = new Cat();
  const boat = new Boat();
  scene.add(yuna.root, cat.root, boat.root);
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);

  // ── HUD
  const joy = h('div.joy', h('div.joy-knob'));
  const loading = h('div.world-loading', h('img', { src: charSrc('boat'), alt: '' }), h('b', 'A preparar as ilhas…'), h('div.bar', h('i')));
  const chip = h('div.isl-chip');
  const shellCount = h('b', String(progress.shells.length));
  const hud = h('div.hud.world-hud',
    h('button.round-btn.home', { 'aria-label': 'Início' }, '⌂'),
    h('div.hud-stars', h('span.star-ico', '★'), h('b', String(totalStars()))),
    h('div.hud-shells', h('img', { src: itemSrc('concha'), alt: '' }), shellCount),
    h('div.hud-spacer'), chip, h('div.hud-spacer'),
    h('button.round-btn.map-btn', { 'aria-label': 'Mapa' }, '🗺'),
    h('button.round-btn.album-btn', { 'aria-label': 'Álbum' }, '📖'),
    h('button.round-btn.gear', { 'aria-label': 'Área dos adultos' }, '⚙'));
  const jumpBtn = h('button.jump-btn', { 'aria-label': 'Saltar' }, h('span', '⤒'));
  const actionBtn = h('button.action-btn', { 'aria-label': 'Ação' });
  const ringCard = h('div.ring-card');
  const hint = h('div.world-hint', 'Toca no chão para andar · arrasta para olhar à volta');
  root.append(joy, hud, jumpBtn, actionBtn, ringCard, hint, loading);
  const input = createInput(canvas, joy, joy.querySelector('.joy-knob') as HTMLElement);
  const inp = input.state;
  onTap(jumpBtn, () => { unlock(); inp.jump = true; });
  onTap(actionBtn, () => { unlock(); inp.action = true; });

  // ── State
  let mode: 'walk' | 'boat' | 'cutscene' = 'walk';
  let current: IslandRuntime | null = null;
  let moveTarget: THREE.Vector3 | null = null;
  let route: THREE.Vector3[] = [];
  let boatTarget: THREE.Vector3 | null = null;
  let stuckT = 0, waterT = 0, ringAt: { isl: number; phase: number } | null = null, lastRingLeave = 0;
  let camYaw = Math.PI, camDist = 6.8, camYawTouched = -1e9;
  let closed = false;
  const decorated = new Set<number>();
  const shellObjs: { key: string; obj: THREE.Sprite; base: number }[] = [];
  const ringObjs: { isl: number; phase: number; obj: THREE.Group; disc: THREE.Mesh }[] = [];

  const collidersNear = (p: THREE.Vector3) => {
    const res: THREE.Object3D[] = [];
    for (const i of islands.list) if (i.ready && i.group.position.distanceTo(new THREE.Vector3(p.x, 0, p.z)) < ISLAND_RADIUS + 12) res.push(...i.colliders);
    return res;
  };

  function decorate(isl: IslandRuntime) {
    if (decorated.has(isl.id) || !isl.ready) return;
    decorated.add(isl.id);
    const locked = !isUnlocked(isl.id);
    isl.spots.forEach((s) => {
      const g = new THREE.Group();
      g.position.copy(s.pos).add(new THREE.Vector3(0, 0.04, 0));
      const col = new THREE.Color(PHASE_COLORS[s.phase]);
      const disc = new THREE.Mesh(new THREE.CircleGeometry(1.05, 40), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: locked ? 0.25 : 0.5, depthWrite: false }));
      disc.rotation.x = -Math.PI / 2;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.07, 8, 48), new THREE.MeshBasicMaterial({ color: locked ? '#bbbbbb' : '#ffffff' }));
      ring.rotation.x = -Math.PI / 2;
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.05, 2.4, 32, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: locked ? 0.05 : 0.16, side: THREE.DoubleSide, depthWrite: false }));
      beam.position.y = 1.2;
      const label = new THREE.Sprite(new THREE.SpriteMaterial({ map: labelTexture(PHASES[s.phase].icon, PHASES[s.phase].name, starsFor(isl.id, s.phase), locked), transparent: true, depthWrite: false }));
      label.scale.set(1.7, 1.06, 1);
      label.position.y = 2.7;
      g.add(disc, ring, beam, label);
      ringGroup.add(g);
      ringObjs.push({ isl: isl.id, phase: s.phase, obj: g, disc });
    });
    isl.shells.forEach((p, k) => {
      const key = `${isl.id}-${k}`;
      if (progress.shells.includes(key)) return;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: loadTexture(itemSrc('concha')), transparent: true, alphaTest: 0.2 }));
      sp.scale.set(0.8, 0.8, 1);
      sp.position.copy(p).add(new THREE.Vector3(0, 0.8, 0));
      scene.add(sp);
      shellObjs.push({ key, obj: sp, base: sp.position.y });
    });
  }

  function setChip(isl: IslandRuntime | null) {
    chip.textContent = isl ? ISLANDS[isl.id].name : 'Em alto mar';
    chip.style.setProperty('--c', isl ? ISLANDS[isl.id].color : '#1fb5d1');
    gsap.fromTo(chip, { scale: 0.6 }, { scale: 1, duration: 0.4, ease: 'back.out(2)' });
  }

  function arrive(isl: IslandRuntime) {
    if (current === isl) return;
    current = isl;
    progress.current = isl.id;
    save();
    setChip(isl);
    const first = !progress.visited.includes(isl.id);
    if (first) { progress.visited.push(isl.id); save(); say(['isl.' + isl.id, 's.' + isl.id, 'ui.wExplore']); }
    else say('isl.' + isl.id);
    preloadVoice(['s.' + isl.id, ...ISLANDS[isl.id].items.map((x) => 'n.' + x)]);
  }

  // ── Boarding & landing
  function jumpTo(target: THREE.Vector3, after: () => void) {
    mode = 'cutscene';
    const from = yuna.root.position.clone();
    yuna.play('jump', 0.1, 1.2);
    sfx('whoosh', { vol: 0.5 });
    const o = { t: 0 };
    const dist = from.distanceTo(target);
    gsap.to(o, {
      t: 1, duration: 0.6 + dist * 0.05, ease: 'none',
      onUpdate: () => {
        yuna.root.position.lerpVectors(from, target, o.t);
        yuna.root.position.y += Math.sin(o.t * Math.PI) * (1.4 + dist * 0.18);
        yuna.mixer?.update(0);
      },
      onComplete: () => { sfx('splash', { vol: 0.4 }); after(); },
    });
  }

  function embark() {
    const p = yuna.root.position;
    const dir = new THREE.Vector3(Math.sin(yuna.heading), 0, Math.cos(yuna.heading));
    const cols = collidersNear(p);
    let spot: THREE.Vector3 | null = null;
    for (let d = 0.6; d < 9; d += 0.5) {
      const x = p.x + dir.x * d, z = p.z + dir.z * d;
      const g = groundAt(cols, x, z, p.y + 2);
      if (g === null || g < SEA_LEVEL + 0.1) { spot = new THREE.Vector3(x + dir.x * 1.6, 0, z + dir.z * 1.6); break; }
    }
    if (!spot) return;
    boat.root.position.copy(spot);
    boat.heading = yuna.heading;
    boat.speed = 0;
    boat.root.visible = true;
    gsap.fromTo(boat.root.scale, { x: 0.2, y: 0.2, z: 0.2 }, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2)' });
    const seat = new THREE.Vector3();
    boat.seat.getWorldPosition(seat);
    jumpTo(seat, () => { mode = 'boat'; yuna.play('idle', 0.2); say('ui.wSail'); });
  }

  function landingSpot(): THREE.Vector3 | null {
    const bp = boat.root.position;
    // Close to an island → the nearest point of its walkable area (a big leap if needed).
    let best: THREE.Vector3 | null = null, bd = 13;
    for (const isl of islands.list) {
      if (!isl.ready || isl.group.position.distanceTo(new THREE.Vector3(bp.x, 0, bp.z)) > ISLAND_RADIUS + 4) continue;
      for (const w of isl.walk) {
        if (isl.spots.some((sp) => Math.hypot(sp.pos.x - w.x, sp.pos.z - w.z) < 1.8)) continue; // not inside an activity circle
        const d = Math.hypot(w.x - bp.x, w.z - bp.z);
        if (d < bd) { bd = d; best = w; }
      }
    }
    return best;
  }

  function disembark() {
    const spot = landingSpot();
    if (!spot) return;
    jumpTo(spot.clone(), () => {
      mode = 'walk';
      yuna.vy = 0;
      gsap.to(boat.root.scale, { x: 0.2, y: 0.2, z: 0.2, duration: 0.35, onComplete: () => { boat.root.visible = false; } });
      cat.root.position.copy(spot);
      cat.celebrate();
      sfx('meow');
    });
  }

  // ── Activities
  function openRing(islId: number, phase: number) {
    if (!isUnlocked(islId)) { say('ui.locked'); return; }
    sfx('unlock', { vol: 0.6 });
    // Come back just outside the circle so the card doesn't pop up again at once.
    const ring = ringObjs.find((r) => r.isl === islId && r.phase === phase)!.obj.position;
    const isl = islands.list[islId];
    const back = isl.walk.filter((w) => Math.hypot(w.x - ring.x, w.z - ring.z) > 1.8).sort((a, b) => a.distanceTo(ring) - b.distanceTo(ring))[0] ?? yuna.root.position;
    progress.world = { x: back.x, y: back.y, z: back.z, boat: false };
    save();
    go((r) => playScreen(r, islId, phase, undefined, () => go(worldScreen)));
  }

  function showRingCard(islId: number, phase: number) {
    const st = starsFor(islId, phase);
    ringCard.innerHTML = '';
    const play = h('button.btn.primary', '▶ Jogar');
    ringCard.append(h('div.rc-ico', { style: { background: PHASE_COLORS[phase] } }, PHASES[phase].icon),
      h('div.rc-txt', h('b', PHASES[phase].name), h('small', `${ISLANDS[islId].name} · ${'★'.repeat(st)}${'☆'.repeat(3 - st)}`)), play);
    onTap(play, () => openRing(islId, phase));
    ringCard.classList.add('on');
  }

  // ── Quick travel (map overlay)
  function openMap() {
    sfx('whoosh');
    const close = h('button.round-btn.close', '✕');
    const grid = h('div.travel-grid', ...ISLANDS.map((isl) => {
      const ok = isUnlocked(isl.id);
      const b = h(`button.travel-cell${ok ? '' : '.locked'}`, h('img', { src: islandSrc(isl.id), alt: '' }), h('b', isl.name));
      onTap(b, () => {
        if (!ok) { say('ui.locked'); return; }
        layer.remove();
        travelTo(isl.id);
      });
      return b;
    }));
    const layer = h('div.modal-layer', h('div.album', h('div.album-head', h('h2', 'Para onde vamos?'), close), grid));
    root.append(layer);
    onTap(close, () => layer.remove());
  }

  function travelTo(id: number) {
    const target = islands.list[id];
    islands.load(target);
    const from = yuna.root.position;
    const dir = new THREE.Vector3(from.x - target.group.position.x, 0, from.z - target.group.position.z).normalize();
    if (!isFinite(dir.x)) dir.set(0, 0, 1);
    const spot = target.group.position.clone().addScaledVector(dir, ISLAND_RADIUS + 5);
    const fade = h('div.fade-white');
    root.append(fade);
    gsap.fromTo(fade, { opacity: 0 }, { opacity: 1, duration: 0.4, onComplete: () => {
      boat.root.visible = true;
      boat.root.scale.setScalar(1);
      boat.root.position.copy(spot);
      boat.heading = Math.atan2(-dir.x, -dir.z);
      mode = 'boat';
      current = null;
      setChip(null);
      say('ui.sail');
      gsap.to(fade, { opacity: 0, duration: 0.6, delay: 0.2, onComplete: () => fade.remove() });
    } });
  }

  onTap(hud.querySelector('.home')!, () => go(titleScreen));
  onTap(hud.querySelector('.map-btn')!, () => { unlock(); openMap(); });
  onTap(hud.querySelector('.album-btn')!, () => { unlock(); openAlbum(); });
  onTap(hud.querySelector('.gear')!, () => { unlock(); openParents(() => go(worldScreen)); });

  // ── Start
  const startIsland = islands.list[progress.current] || islands.list[0];
  let started = false;
  const bar = loading.querySelector('.bar i') as HTMLElement;
  // The bar creeps towards 95% (it slows down as it gets closer).
  const ticker = setInterval(() => { const w = parseFloat(bar.style.width || '5'); bar.style.width = (w + (95 - w) * 0.04) + '%'; }, 200);
  const timeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<T>((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
  // The cat is nice to have: if she fails to load, Yuna goes on alone.
  const catReady = timeout(cat.load(), 90000).catch((e) => { console.warn('cat failed', e); cat.root.visible = false; });
  timeout(Promise.all([yuna.load(), catReady, islands.load(startIsland)]), 90000).catch((e) => {
    console.warn('world failed to load', e);
    if (closed) return;
    clearInterval(ticker);
    loading.querySelector('b')!.textContent = 'Ups! As ilhas não carregaram.';
    loading.querySelector('.bar')!.remove();
    const again = h('button.btn.primary', '↻ Tentar outra vez');
    const map = h('button.btn', '🗺 Ir ao mapa');
    onTap(again, () => go(worldScreen));
    onTap(map, () => go(mapScreen));
    loading.append(h('div.world-load-actions', again, map), h('small.world-load-why', String((e as Error)?.message || e).slice(0, 160)));
    return 'failed' as const;
  }).then((r) => {
    if (closed || r === 'failed') return;
    const w = progress.world;
    const pos = w && !w.boat && startIsland.group.position.distanceTo(new THREE.Vector3(w.x, 0, w.z)) < ISLAND_RADIUS + 2 ? new THREE.Vector3(w.x, w.y, w.z) : startIsland.spawn.clone();
    yuna.root.position.copy(pos);
    cat.root.position.copy(pos).add(new THREE.Vector3(0.8, 0, -0.8));
    yuna.heading = Math.PI; yuna.root.rotation.y = Math.PI;
    camYaw = 0;
    started = true;
    clearInterval(ticker);
    bar.style.width = '100%';
    gsap.to(loading, { opacity: 0, duration: 0.5, delay: 0.2, onComplete: () => loading.remove() });
    arrive(startIsland);
    yuna.emote('wave');
    if (!toldTutorial) { toldTutorial = true; setTimeout(() => say(['ui.wTap', 'ui.wJump']), 6000); }
  });
  yuna.landed = () => { blip(180, 0.06, 'sine', 0.15); };

  // ── Main loop
  const clock = new THREE.Clock();
  const ray = new THREE.Raycaster();
  let frames = 0, acc = 0, saveT = 0;
  const tmp = new THREE.Vector3();
  // Tap-to-walk goes around trees and houses: if the straight line is blocked,
  // try turning a little more each way (sticking to the side that worked last).
  let steerSide = 1;
  const pathFree = (d: THREE.Vector3, cols: THREE.Object3D[]) => {
    const p = yuna.root.position;
    for (const hgt of [0.45, 1.2]) if (wallHit(cols, p.clone().setY(p.y + hgt), d, 1.1)) return false;
    const g = groundAt(cols, p.x + d.x * 0.9, p.z + d.z * 0.9, p.y + 0.75);
    return g !== null && g > SEA_LEVEL + 0.3 && g - p.y < 1.15;
  };
  const steer = (want: THREE.Vector3, cols: THREE.Object3D[]) => {
    if (!cols.length || pathFree(want, cols)) return want;
    for (const a of [0.45, 0.9, 1.35, 1.8]) {
      for (const side of [steerSide, -steerSide]) {
        const d = want.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), a * side);
        if (pathFree(d, cols)) { steerSide = side; return d; }
      }
    }
    return want;
  };

  function frame() {
    if (closed) return;
    requestAnimationFrame(frame);
    (window as unknown as { __frames: number }).__frames = ((window as unknown as { __frames: number }).__frames || 0) + 1;
    const dt = Math.min(0.05, clock.getDelta());
    const t = clock.elapsedTime;
    ocean.update(t, yuna.root.position);
    if (!started) { camera.position.set(startIsland.group.position.x, 18, startIsland.group.position.z + 30); camera.lookAt(startIsland.group.position); renderer.render(scene, camera); return; }

    islands.update(yuna.root.position);
    for (const i of islands.list) if (i.ready && !decorated.has(i.id) && i.group.position.distanceTo(yuna.root.position) < 80) decorate(i);

    // Camera-relative joystick direction.
    const fwd = new THREE.Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
    const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const dir = new THREE.Vector3().addScaledVector(fwd, inp.y).addScaledVector(right, inp.x);
    if (dir.lengthSq() > 1) dir.normalize();
    const manual = dir.lengthSq() > 0.01;

    // Tap: walk/sail to a point, or poke Yuna / the cat.
    if (inp.tap) {
      const ndc = new THREE.Vector2((inp.tap.x / W()) * 2 - 1, -(inp.tap.y / H()) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      inp.tap = null;
      const pokeCat = ray.intersectObject(cat.root, true)[0];
      const pokeYuna = ray.intersectObject(yuna.root, true)[0];
      if (pokeCat && pokeCat.distance < 30) { sfx('meow'); cat.celebrate(); }
      else if (pokeYuna && pokeYuna.distance < 30 && mode === 'walk') { yuna.emote(Math.random() < 0.5 ? 'wave' : 'happy'); }
      else if (mode === 'walk') {
        // A tap on a ring's light beam or label means "go there", even behind a house.
        const ringHit = ray.intersectObject(ringGroup, true)[0];
        const ringTo = ringHit && ringObjs.find((r) => { let o: THREE.Object3D | null = ringHit.object; while (o && o !== r.obj) o = o.parent; return !!o; });
        const hit = ringTo && ringHit.distance < 45 ? { point: ringTo.obj.position.clone() } : ray.intersectObjects(collidersNear(yuna.root.position), false)[0];
        if (hit) {
          route = findPath(islands.nearest(hit.point), yuna.root.position, hit.point) ?? [hit.point.clone()];
          moveTarget = route.shift() ?? null;
          stuckT = 0; spawnTapMark(hit.point);
        }
      } else if (mode === 'boat') {
        const pl = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const p = ray.ray.intersectPlane(pl, new THREE.Vector3());
        if (p) { boatTarget = p; spawnTapMark(p); }
      }
    }
    if (manual) { moveTarget = null; route = []; boatTarget = null; }

    // Orbit & zoom from gestures.
    if (inp.orbit) { camYaw += inp.orbit; inp.orbit = 0; camYawTouched = t; }
    if (inp.zoom) { camDist = THREE.MathUtils.clamp(camDist + inp.zoom, 4.5, 16); inp.zoom = 0; }

    if (mode === 'walk') {
      let wdir = dir;
      let run = inp.run;
      if (moveTarget) {
        tmp.set(moveTarget.x - yuna.root.position.x, 0, moveTarget.z - yuna.root.position.z);
        const d = tmp.length();
        if (d < (route.length ? 0.5 : 0.35)) { moveTarget = route.shift() ?? null; if (moveTarget) tmp.set(moveTarget.x - yuna.root.position.x, 0, moveTarget.z - yuna.root.position.z); }
        if (moveTarget) { wdir = steer(tmp.normalize(), collidersNear(yuna.root.position)); run = d + route.length * 0.6 > 6; }
      }
      const cols = collidersNear(yuna.root.position);
      const before = yuna.root.position.clone();
      yuna.step(dt, wdir, run, inp.jump, cols);
      if (moveTarget) {
        if (yuna.root.position.distanceTo(before) < 0.2 * dt) stuckT += dt; else stuckT = 0;
        if (stuckT > 1.5) { moveTarget = null; route = []; }
      }
      if (yuna.blockedByWater) waterT = t;
      if (inp.jump) sfx('whoosh', { vol: 0.25, rate: 1.5 });
      // Which island are we on?
      const isl = islands.nearest(yuna.root.position);
      if (isl.group.position.distanceTo(new THREE.Vector3(yuna.root.position.x, 0, yuna.root.position.z)) < ISLAND_RADIUS + 1) arrive(isl);
      // Shells.
      for (let i = shellObjs.length - 1; i >= 0; i--) {
        const s = shellObjs[i];
        if (s.obj.position.distanceTo(yuna.root.position.clone().setY(yuna.root.position.y + 0.8)) < 1.3) {
          progress.shells.push(s.key); save();
          shellCount.textContent = String(progress.shells.length);
          gsap.to(s.obj.scale, { x: 1.8, y: 1.8, duration: 0.25 });
          gsap.to(s.obj.material, { opacity: 0, duration: 0.3, onComplete: () => scene.remove(s.obj) });
          gsap.to(s.obj.position, { y: s.obj.position.y + 1.5, duration: 0.3 });
          shellObjs.splice(i, 1);
          sfx('star');
          yuna.emote('cheer');
          cat.celebrate();
          const islId = Number(s.key.split('-')[0]);
          const left = shellObjs.filter((o) => o.key.startsWith(islId + '-')).length;
          if (left === 0) { say('ui.wAllShells'); burst(0.5, 0.5, true); } else say('ui.wShell');
        }
      }
      // Activity circles.
      let inRing: { isl: number; phase: number } | null = null;
      for (const r of ringObjs) {
        const d = Math.hypot(r.obj.position.x - yuna.root.position.x, r.obj.position.z - yuna.root.position.z);
        if (d < 1.15 && Math.abs(r.obj.position.y - yuna.root.position.y) < 1.5) {
          // Just walking through on the way somewhere else: don't stop here.
          const end = route.length ? route[route.length - 1] : moveTarget;
          if (!end || Math.hypot(end.x - r.obj.position.x, end.z - r.obj.position.z) < 1.5) inRing = { isl: r.isl, phase: r.phase };
        }
      }
      if (inRing && (!ringAt || ringAt.isl !== inRing.isl || ringAt.phase !== inRing.phase) && t - lastRingLeave > 0.5) {
        ringAt = inRing;
        showRingCard(inRing.isl, inRing.phase);
        say(isUnlocked(inRing.isl) ? 'ui.wRing' : 'ui.locked');
        moveTarget = null; route = [];
      } else if (!inRing && ringAt) { ringAt = null; lastRingLeave = t; ringCard.classList.remove('on'); }
    } else if (mode === 'boat') {
      let bdir = dir;
      if (boatTarget) {
        tmp.set(boatTarget.x - boat.root.position.x, 0, boatTarget.z - boat.root.position.z);
        if (tmp.length() < 2) boatTarget = null; else bdir = tmp.normalize();
      }
      boat.update(dt, bdir, t, (x, z) => {
        const g = groundAt(collidersNear(new THREE.Vector3(x, 0, z)), x, z, 20);
        return g !== null && g > SEA_LEVEL + 0.05;
      });
      boat.seat.getWorldPosition(tmp);
      yuna.root.position.copy(tmp);
      yuna.heading = boat.heading;
      yuna.root.rotation.y = boat.heading;
      yuna.play(boat.speed > 1 ? 'sway' : 'idle', 0.4);
      yuna.mixer?.update(dt);
      const near = islands.nearest(boat.root.position);
      if (near.group.position.distanceTo(new THREE.Vector3(boat.root.position.x, 0, boat.root.position.z)) > ISLAND_RADIUS + 10 && current) { current = null; setChip(null); }
    } else {
      yuna.mixer?.update(dt);
    }

    // Gata Tanha.
    if (mode === 'boat') {
      const front = new THREE.Vector3(Math.sin(boat.heading) * 0.9, 0.35, Math.cos(boat.heading) * 0.9).add(boat.root.position);
      cat.root.position.copy(front);
      cat.heading = boat.heading; cat.root.rotation.y = boat.heading;
      cat.update(0, front, boat.heading, [], true);
    } else if (mode === 'walk') {
      cat.update(dt, yuna.root.position, yuna.heading, collidersNear(cat.root.position), false);
    }

    // Context action.
    let label = '';
    if (mode === 'walk' && ringAt && isUnlocked(ringAt.isl)) label = '▶ Jogar';
    else if (mode === 'walk' && t - waterT < 1.5) label = '⛵ Barco';
    else if (mode === 'boat' && landingSpot()) label = '🏝 Desembarcar';
    if (actionBtn.dataset.l !== label) {
      actionBtn.dataset.l = label;
      actionBtn.textContent = label;
      actionBtn.classList.toggle('on', !!label);
      if (label === '⛵ Barco') say('ui.wBoat');
      if (label === '🏝 Desembarcar') say('ui.wLand');
    }
    if (inp.action) {
      inp.action = false;
      if (label === '▶ Jogar' && ringAt) openRing(ringAt.isl, ringAt.phase);
      else if (label === '⛵ Barco') embark();
      else if (label === '🏝 Desembarcar') disembark();
    }
    inp.jump = false;
    jumpBtn.classList.toggle('hidden', mode !== 'walk');

    // Animated decorations.
    for (const s of shellObjs) { s.obj.position.y = s.base + Math.sin(t * 2.5 + s.base) * 0.15; s.obj.scale.x = 0.8 * Math.cos(t * 2.2 + s.base); }
    for (const r of ringObjs) { (r.disc.material as THREE.MeshBasicMaterial).opacity = isUnlocked(r.isl) ? 0.35 + Math.sin(t * 3 + r.phase) * 0.15 : 0.2; r.obj.children[3].position.y = 2.7 + Math.sin(t * 2 + r.phase) * 0.12; }

    // Camera follows; swings behind when walking unless the player is looking around.
    const target = yuna.root.position.clone().add(new THREE.Vector3(0, 1.3, 0));
    const moving = mode === 'boat' ? boat.speed > 0.5 : yuna.speed > 0.4;
    if (moving && t - camYawTouched > 2 && !manual) {
      const behind = (mode === 'boat' ? boat.heading : yuna.heading) + Math.PI;
      let d = behind - camYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
      camYaw += d * Math.min(1, dt * 1.2);
    }
    const dist = mode === 'boat' ? Math.max(camDist, 11) : camDist;
    const want = new THREE.Vector3(target.x + Math.sin(camYaw) * dist, target.y + dist * 0.5, target.z + Math.cos(camYaw) * dist);
    camera.position.lerp(want, Math.min(1, dt * 5));
    camera.lookAt(target);
    sun.position.copy(yuna.root.position).add(new THREE.Vector3(14, 26, 10));
    sun.target.position.copy(yuna.root.position);

    renderer.render(scene, camera);

    // Adaptive quality: drop resolution (then shadows) if the device struggles.
    frames++; acc += dt;
    if (acc > 2.5) {
      const fps = frames / acc;
      if (fps < 40 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); }
      else if (fps < 30 && renderer.shadowMap.enabled) { renderer.shadowMap.enabled = false; }
      (window as unknown as { __fps: number }).__fps = Math.round(fps);
      frames = 0; acc = 0;
    }
    saveT += dt;
    if (saveT > 3 && mode === 'walk') { saveT = 0; progress.world = { x: yuna.root.position.x, y: yuna.root.position.y, z: yuna.root.position.z, boat: false }; save(); }
  }

  function spawnTapMark(p: THREE.Vector3) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.32, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    m.position.copy(p).add(new THREE.Vector3(0, 0.05, 0));
    scene.add(m);
    gsap.to(m.scale, { x: 2.4, y: 2.4, z: 2.4, duration: 0.5 });
    gsap.to(m.material, { opacity: 0, duration: 0.5, onComplete: () => { scene.remove(m); m.geometry.dispose(); } });
  }

  requestAnimationFrame(frame);
  const onResize = () => { renderer.setSize(W(), H()); camera.aspect = W() / H(); camera.updateProjectionMatrix(); };
  addEventListener('resize', onResize);
  // Expose a tiny API for automated tests.
  (window as unknown as { __world: unknown }).__world = {
    yuna, boat, cat, get mode() { return mode; }, islands, travelTo, embark, disembark,
    tap: (x: number, y: number) => { inp.tap = { x, y }; }, project: (v: THREE.Vector3) => { const p = v.clone().project(camera); return { x: (p.x + 1) / 2 * W(), y: (1 - p.y) / 2 * H() }; },
    rings: ringObjs, shells: shellObjs, get ringAt() { return ringAt; }, get route() { return [moveTarget, ...route].filter(Boolean).map((v) => v!.toArray().map((n) => +n.toFixed(2))); },
    walkTo: (x: number, y: number, z: number) => { const v = new THREE.Vector3(x, y, z); route = findPath(islands.nearest(v), yuna.root.position, v) ?? [v]; moveTarget = route.shift() ?? null; stuckT = 0; },
    probe: (x: number, z: number, y = 20) => groundAt(collidersNear(new THREE.Vector3(x, 0, z)), x, z, y),
    wall: (dx: number, dz: number, hgt: number) => { const p = yuna.root.position; const n = wallHit(collidersNear(p), p.clone().setY(p.y + hgt), new THREE.Vector3(dx, 0, dz).normalize(), 1.1); return n ? n.toArray() : null; },
  };

  return () => {
    closed = true;
    clearInterval(ticker);
    input.dispose();
    removeEventListener('resize', onResize);
    renderer.dispose();
  };
}

// Gata Tanha (follows Yuna with cartoon hops) and the little sailboat.
import * as THREE from 'three';
import { loadModel, cartoonify, loadTexture } from './assets.ts';
import { groundAt } from './character.ts';
import { waveHeight } from './environment.ts';

export class Cat {
  root = new THREE.Group();
  body = new THREE.Group();
  heading = 0;
  hop = 0;
  idleT = 0;
  excited = 0;

  async load() {
    const gltf = await loadModel('tanha');
    const m = gltf.scene.clone(true);
    cartoonify(m, { cast: true });
    const box = new THREE.Box3().setFromObject(m);
    const k = 0.68 / (box.max.y - box.min.y);
    m.scale.setScalar(k);
    m.rotation.y = -Math.PI / 2;
    const b2 = new THREE.Box3().setFromObject(m);
    m.position.y = -b2.min.y;
    this.body.add(m);
    this.root.add(this.body);
  }

  /** Follow a point behind Yuna; hop while moving, little bounces when happy. */
  update(dt: number, target: THREE.Vector3, leaderHeading: number, colliders: THREE.Object3D[], inBoat: boolean) {
    const pos = this.root.position;
    const behind = new THREE.Vector3(Math.sin(leaderHeading + 2.4) * 1.2, 0, Math.cos(leaderHeading + 2.4) * 1.2);
    const goal = target.clone().add(behind);
    const d = Math.hypot(goal.x - pos.x, goal.z - pos.z);
    const moving = d > 0.25;
    if (d > 9) { pos.copy(goal); } // teleport if left far behind
    if (moving) {
      const sp = Math.min(d * 3.2, 7);
      pos.x += ((goal.x - pos.x) / d) * sp * dt;
      pos.z += ((goal.z - pos.z) / d) * sp * dt;
      const want = Math.atan2(goal.x - pos.x, goal.z - pos.z);
      let dd = want - this.heading; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
      this.heading += dd * Math.min(1, dt * 10);
    } else {
      let dd = leaderHeading - this.heading; dd = Math.atan2(Math.sin(dd), Math.cos(dd));
      this.heading += dd * Math.min(1, dt * 2);
    }
    this.root.rotation.y = this.heading;
    const g = inBoat ? target.y : (colliders.length ? groundAt(colliders, pos.x, pos.z, Math.max(pos.y, target.y) + 0.8) : null);
    const gy = g ?? target.y;
    pos.y += (gy - pos.y) * Math.min(1, dt * 14);
    // Cartoon hop and squash.
    this.hop += dt * (moving ? 13 : 0);
    this.excited = Math.max(0, this.excited - dt);
    this.idleT += dt;
    let h = moving ? Math.abs(Math.sin(this.hop)) * 0.16 : 0;
    if (this.excited > 0) h = Math.abs(Math.sin(this.excited * 14)) * 0.35;
    else if (!moving && this.idleT % 6 < 0.5) h = Math.abs(Math.sin(this.idleT * 12)) * 0.08;
    this.body.position.y = h;
    const squash = moving ? 1 + Math.sin(this.hop * 2) * 0.06 : 1 + Math.sin(this.idleT * 3) * 0.015;
    this.body.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    this.body.rotation.z = moving ? Math.sin(this.hop) * 0.08 : 0;
  }

  celebrate() { this.excited = 1.2; }
}

function sailTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffaf0'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#ffc928';
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 26 : 62, a = -Math.PI / 2 + (i * Math.PI) / 5;
    g.lineTo(128 + r * Math.cos(a), 140 + r * Math.sin(a));
  }
  g.fill();
  g.strokeStyle = '#e8dcc0'; g.lineWidth = 6; g.strokeRect(3, 3, 250, 250);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Boat {
  root = new THREE.Group();
  seat = new THREE.Object3D();
  heading = 0;
  speed = 0;

  constructor() {
    const wood = new THREE.MeshStandardMaterial({ color: '#b97a45', roughness: 0.8 });
    const dark = new THREE.MeshStandardMaterial({ color: '#8c5630', roughness: 0.8 });
    // Hull: a rounded tub stretched along Z, pointed bow.
    const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), wood);
    hull.scale.set(0.95, 0.55, 1.7);
    hull.rotation.x = Math.PI;
    hull.position.y = 0.5;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.08, 8, 32), dark);
    rim.scale.set(0.95, 1.7, 1);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.5;
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(1, 0.05, 6, 32), new THREE.MeshStandardMaterial({ color: '#8d4fe0' }));
    stripe.scale.set(0.97, 1.72, 1);
    stripe.rotation.x = Math.PI / 2;
    stripe.position.y = 0.32;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.6, 8), dark);
    mast.position.set(0, 1.7, 0.35);
    const sailGeo = new THREE.BufferGeometry();
    sailGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 2.9, 0.38, 0, 0.75, 0.38, 0, 0.75, -1.15], 3));
    sailGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 1, 0.5, 0, 0, 0], 2));
    sailGeo.computeVertexNormals();
    const sail = new THREE.Mesh(sailGeo, new THREE.MeshStandardMaterial({ map: sailTexture(), side: THREE.DoubleSide, roughness: 0.9 }));
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.25), new THREE.MeshStandardMaterial({ color: '#ff5d8f', side: THREE.DoubleSide }));
    flag.position.set(0, 2.85, 0.6);
    flag.rotation.y = Math.PI / 2;
    this.seat.position.set(0, 0.42, -0.2);
    [hull, rim, stripe, mast, sail, flag].forEach((m) => { m.castShadow = true; this.root.add(m); });
    this.root.add(this.seat);
    this.root.visible = false;
  }

  /** Steer towards dir (world space, length 0..1); stop before land. */
  update(dt: number, dir: THREE.Vector3, t: number, landAhead: (x: number, z: number) => boolean) {
    const want = dir.length() > 0.1 ? Math.atan2(dir.x, dir.z) : this.heading;
    let d = want - this.heading; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.heading += d * Math.min(1, dt * 3);
    const target = Math.min(1, dir.length()) * 7.5;
    this.speed += (target - this.speed) * Math.min(1, dt * 1.6);
    const p = this.root.position;
    const nx = p.x + Math.sin(this.heading) * this.speed * dt, nz = p.z + Math.cos(this.heading) * this.speed * dt;
    const probeX = p.x + Math.sin(this.heading) * 2, probeZ = p.z + Math.cos(this.heading) * 2;
    if (this.speed > 0 && landAhead(probeX, probeZ)) this.speed *= 0.5;
    else { p.x = nx; p.z = nz; }
    const r = Math.hypot(p.x, p.z + 90);
    if (r > 230) { p.x *= 229 / r; p.z = (p.z + 90) * (229 / r) - 90; }
    p.y = waveHeight(p.x, p.z, t) - 0.12;
    this.root.rotation.set(Math.sin(t * 1.6) * 0.04, this.heading, Math.cos(t * 1.3) * 0.05 - d * 0.12);
  }
}

/** Stand-in island built from primitives, used when a 3D island is missing. */
export function proceduralIsland(size: number, color: string, props: string[], itemSrc: (id: string) => string) {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.48, size * 0.52, 1.2, 40), new THREE.MeshStandardMaterial({ color: '#f1d9a6', roughness: 1 }));
  sand.position.y = 0.1;
  const grass = new THREE.Mesh(new THREE.CylinderGeometry(size * 0.4, size * 0.44, 0.6, 40), new THREE.MeshStandardMaterial({ color: '#7cc75b', roughness: 1 }));
  grass.position.y = 0.9;
  g.add(sand, grass);
  const trunkM = new THREE.MeshStandardMaterial({ color: '#a8743f' });
  const leafM = new THREE.MeshStandardMaterial({ color: '#3fa34d' });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4, r = size * 0.33;
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.25, 3.2, 8), trunkM);
    trunk.position.y = 1.6;
    palm.add(trunk);
    for (let k = 0; k < 6; k++) {
      const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 6), leafM);
      leaf.position.set(Math.cos(k) * 0.8, 3.2, Math.sin(k) * 0.8);
      leaf.rotation.set(Math.sin(k) * 1.2, 0, -Math.cos(k) * 1.2);
      palm.add(leaf);
    }
    palm.position.set(Math.cos(a) * r, 1.2, Math.sin(a) * r);
    g.add(palm);
  }
  const rockM = new THREE.MeshStandardMaterial({ color: '#9aa0a8', flatShading: true });
  for (let i = 0; i < 9; i++) {
    const a = Math.random() * Math.PI * 2;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 + Math.random() * 0.5, 0), rockM);
    rock.position.set(Math.cos(a) * size * 0.5, 0.3, Math.sin(a) * size * 0.5);
    g.add(rock);
  }
  const accent = new THREE.Mesh(new THREE.TorusGeometry(size * 0.42, 0.12, 6, 48), new THREE.MeshStandardMaterial({ color }));
  accent.rotation.x = Math.PI / 2;
  accent.position.y = 1.22;
  g.add(accent);
  props.forEach((id, i) => {
    const a = (i / props.length) * Math.PI * 2;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: loadTexture(itemSrc(id)), transparent: true, alphaTest: 0.3 }));
    sp.scale.set(2.2, 2.2, 1);
    sp.position.set(Math.cos(a) * size * 0.18, 2.3, Math.sin(a) * size * 0.18);
    g.add(sp);
  });
  g.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { m.receiveShadow = true; m.castShadow = false; } });
  return g;
}

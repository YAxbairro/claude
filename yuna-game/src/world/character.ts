// Yuna: skinned model, animation state machine and a small kinematic controller
// that walks on the island meshes (step-up, walls, gravity, jumping).
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { loadModel, cartoonify } from './assets.ts';
import { SEA_LEVEL } from './environment.ts';

export type Anim = 'idle' | 'walk' | 'skip' | 'running' | 'jump' | 'wave' | 'happy' | 'cheer' | 'dance' | 'sway' | 'swim';
const LOOPS: Anim[] = ['idle', 'walk', 'skip', 'running', 'sway', 'swim'];
const STEP = 0.7;
const HOP = 1.15;
const GRAVITY = 24;

const down = new THREE.Vector3(0, -1, 0);
const ray = new THREE.Raycaster();
ray.firstHitOnly = true;

export function groundAt(colliders: THREE.Object3D[], x: number, z: number, fromY: number) {
  ray.set(new THREE.Vector3(x, fromY, z), down);
  ray.far = 30;
  const h = ray.intersectObjects(colliders, false)[0];
  return h ? h.point.y : null;
}

export function wallHit(colliders: THREE.Object3D[], from: THREE.Vector3, dir: THREE.Vector3, dist: number) {
  ray.set(from, dir);
  ray.far = dist;
  const h = ray.intersectObjects(colliders, false)[0];
  if (!h || !h.face) return null;
  const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
  return Math.abs(n.y) < 0.55 ? n.setY(0).normalize() : null;
}

export class Character {
  root = new THREE.Group();
  model: THREE.Object3D | null = null;
  mixer: THREE.AnimationMixer | null = null;
  actions = new Map<Anim, THREE.AnimationAction>();
  current: Anim | null = null;
  oneShot: Anim | null = null;
  vel = new THREE.Vector3();
  vy = 0;
  onGround = true;
  heading = 0;
  blockedByWater = false;
  speed = 0;

  async load(scale = 1.55) {
    const gltf = await loadModel('yuna');
    const model = cloneSkinned(gltf.scene);
    cartoonify(model, { cast: true });
    model.scale.setScalar(scale);
    model.rotation.y = -Math.PI / 2; // generated model faces +X; the game's forward is +Z
    const box = new THREE.Box3().setFromObject(model);
    model.position.y = -box.min.y;
    this.root.add(model);
    this.model = model;
    this.mixer = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      // Keep the clips in place: the controller moves the character, not the animation.
      for (const tr of clip.tracks) {
        if (tr.name.endsWith('.position') && /hips|root/i.test(tr.name)) {
          const v = tr.values;
          const x0 = v[0], z0 = v[2];
          for (let i = 0; i < v.length; i += 3) { v[i] = x0; v[i + 2] = z0; }
        }
      }
      const a = this.mixer.clipAction(clip);
      if (!LOOPS.includes(clip.name as Anim)) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      this.actions.set(clip.name as Anim, a);
    }
    this.mixer.addEventListener('finished', (e) => {
      if (this.oneShot && e.action === this.actions.get(this.oneShot)) this.oneShot = null;
    });
    this.play('idle', 0);
  }

  play(name: Anim, fade = 0.25, timeScale = 1) {
    const a = this.actions.get(name);
    if (!a) return;
    a.timeScale = timeScale;
    if (this.current === name) return;
    const prev = this.current ? this.actions.get(this.current) : null;
    a.reset().setEffectiveWeight(1).fadeIn(fade).play();
    if (prev) prev.fadeOut(fade);
    this.current = name;
  }

  /** Play a celebration once; movement cancels it. */
  emote(name: Anim) {
    this.oneShot = name;
    this.play(name, 0.2);
  }

  /** dir: desired world-space horizontal direction (length 0..1). */
  step(dt: number, dir: THREE.Vector3, run: boolean, jump: boolean, colliders: THREE.Object3D[]) {
    const pos = this.root.position;
    const max = run ? 5.4 : 3.3;
    const target = dir.clone().multiplyScalar(max);
    const accel = this.onGround ? 12 : 4;
    this.vel.x += (target.x - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (target.z - this.vel.z) * Math.min(1, accel * dt);
    this.blockedByWater = false;

    const move = new THREE.Vector3(this.vel.x * dt, 0, this.vel.z * dt);
    // Cartoon hop: walking into a ledge up to HOP high jumps onto it by itself.
    if (this.onGround && !jump && dir.lengthSq() > 0.25 && colliders.length) {
      const f = dir.clone().normalize();
      const ahead = groundAt(colliders, pos.x + f.x * 0.55, pos.z + f.z * 0.55, pos.y + HOP + 0.1);
      if (ahead !== null && ahead - pos.y > STEP && ahead - pos.y < HOP) jump = true;
    }
    if (move.lengthSq() > 1e-8 && colliders.length) {
      // Slide along walls (tree trunks, houses, big objects).
      for (const h of [0.45, 1.2]) {
        const n = wallHit(colliders, pos.clone().setY(pos.y + h), move.clone().normalize(), move.length() + 0.35);
        if (n) {
          const into = move.dot(n);
          if (into < 0) move.addScaledVector(n, -into);
          const vInto = this.vel.dot(n);
          if (vInto < 0) this.vel.addScaledVector(n, -vInto);
        }
      }
      const nx = pos.x + move.x, nz = pos.z + move.z;
      const g = groundAt(colliders, nx, nz, pos.y + STEP + 0.05);
      if (g === null || g < SEA_LEVEL + 0.3) {
        this.blockedByWater = true;
        this.vel.x *= 0.2; this.vel.z *= 0.2;
      } else if (g - pos.y > STEP && this.onGround) {
        this.vel.x *= 0.3; this.vel.z *= 0.3;
      } else {
        pos.x = nx; pos.z = nz;
      }
    }

    if (jump && this.onGround) { this.vy = 9.2; this.onGround = false; this.oneShot = null; this.play('jump', 0.08, 1.35); }
    this.vy -= GRAVITY * dt;
    pos.y += this.vy * dt;
    const g = colliders.length ? groundAt(colliders, pos.x, pos.z, pos.y + STEP) : SEA_LEVEL;
    if (g !== null && pos.y <= g + (this.onGround && this.vy <= 0 ? 0.3 : 0)) {
      pos.y = g;
      if (!this.onGround && this.vy < -2) this.landed?.();
      this.vy = 0;
      this.onGround = true;
    } else {
      this.onGround = false;
    }

    const hs = Math.hypot(this.vel.x, this.vel.z);
    this.speed = hs;
    if (hs > 0.2) {
      const want = Math.atan2(this.vel.x, this.vel.z);
      let d = want - this.heading;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      this.heading += d * Math.min(1, dt * 12);
      this.root.rotation.y = this.heading;
    }
    if (!this.onGround) { if (this.current !== 'jump') this.play('jump', 0.1, 1.35); }
    else if (hs > 0.25) { this.oneShot = null; if (run) this.play('skip', 0.2, 1.1); else this.play('walk', 0.2, Math.max(0.7, hs / 2.6)); }
    else if (!this.oneShot) this.play('idle', 0.3);
    this.mixer?.update(dt);
  }

  landed?: () => void;
}

// GLB loading with meshopt support and a cache that survives screen changes.
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const cache = new Map<string, Promise<GLTF>>();
// The claude.ai artifact build serves each model as JSON wrapping a plain GLB: it
// can't serve .glb, and its sandbox blocks WebAssembly and fetch() of data: URLs.
const EXT = (globalThis as { __MODEL_EXT?: string }).__MODEL_EXT || 'glb';
// In the artifact, embedded textures load through <img> (blob: URLs), never fetch().
if (EXT === 'glb.json') loader.register((parser) => { (parser as unknown as { textureLoader: THREE.Loader }).textureLoader = new THREE.TextureLoader(parser.options.manager); return { name: 'img-textures' }; });
const decoderReady = EXT === 'glb'
  ? import('three/examples/jsm/libs/meshopt_decoder.module.js').then((m) => { loader.setMeshoptDecoder(m.MeshoptDecoder); })
  : Promise.resolve();
export const MODEL = (name: string) => `${import.meta.env.BASE_URL}assets/3d/${name}.${EXT}`;

export function loadModel(name: string): Promise<GLTF> {
  let p = cache.get(name);
  if (!p) {
    p = EXT === 'glb.json'
      ? fetch(MODEL(name)).then((r) => { if (!r.ok) throw new Error(`${name}: HTTP ${r.status}`); return r.json(); }).then((j: { glb: string }) => {
          const bin = atob(j.glb);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          return loader.parseAsync(bytes.buffer, '');
        })
      : decoderReady.then(() => loader.loadAsync(MODEL(name)));
    p.catch(() => cache.delete(name));
    cache.set(name, p);
  }
  return p;
}

const texLoader = new THREE.TextureLoader();
const texCache = new Map<string, THREE.Texture>();
export function loadTexture(url: string) {
  let t = texCache.get(url);
  if (!t) {
    t = texLoader.load(url);
    t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(url, t);
  }
  return t;
}

/** Make AI-baked textures read like a cartoon: no metal, soft roughness. */
export function cartoonify(root: THREE.Object3D, opts: { cast?: boolean; receive?: boolean } = {}) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    m.castShadow = !!opts.cast;
    m.receiveShadow = !!opts.receive;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats as THREE.MeshStandardMaterial[]) {
      if ('metalness' in mat) { mat.metalness = 0; mat.roughness = 0.85; }
      if (mat.map) mat.map.anisotropy = 4;
    }
  });
}

// Sky dome, sun, cartoon ocean with foam rings around the islands, and clouds.
import * as THREE from 'three';

export const SEA_LEVEL = 0;

export function makeSky() {
  const geo = new THREE.SphereGeometry(900, 32, 16);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color('#3fb6ef') }, mid: { value: new THREE.Color('#a8e6ff') }, bottom: { value: new THREE.Color('#fff4d9') } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
      void main(){ float h = vP.y; vec3 c = h > 0.08 ? mix(mid, top, smoothstep(0.08, 0.6, h)) : mix(bottom, mid, smoothstep(-0.05, 0.08, h));
      gl_FragColor = vec4(c, 1.); }`,
  });
  const sky = new THREE.Mesh(geo, mat);
  sky.renderOrder = -10;
  return sky;
}

/** Wave height used both by the shader and by floating objects (boat). */
export function waveHeight(x: number, z: number, t: number) {
  return Math.sin(x * 0.12 + t * 1.1) * 0.12 + Math.cos(z * 0.15 + t * 0.9) * 0.1 + Math.sin((x + z) * 0.3 + t * 1.7) * 0.04;
}

export function makeOcean(islands: THREE.Vector3[], radius: number) {
  const size = 1400;
  const geo = new THREE.PlaneGeometry(size, size, 160, 160);
  geo.rotateX(-Math.PI / 2);
  const isl = islands.map((p) => new THREE.Vector3(p.x, p.z, radius));
  const mat = new THREE.ShaderMaterial({
    transparent: false, fog: true,
    uniforms: {
      t: { value: 0 },
      deep: { value: new THREE.Color('#0d8fc4') },
      shallow: { value: new THREE.Color('#5fe3e8') },
      foam: { value: new THREE.Color('#ffffff') },
      islands: { value: isl },
      sunDir: { value: new THREE.Vector3(0.4, 0.8, 0.3).normalize() },
      ...THREE.UniformsLib.fog,
    },
    vertexShader: `uniform float t; varying vec3 vW; varying float vH;
      #include <fog_pars_vertex>
      float wave(vec2 p){ return sin(p.x*0.12+t*1.1)*0.12 + cos(p.y*0.15+t*0.9)*0.1 + sin((p.x+p.y)*0.3+t*1.7)*0.04; }
      void main(){ vec3 p = position; vec4 w = modelMatrix * vec4(p,1.); w.y += wave(w.xz); vH = w.y; vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `uniform float t; uniform vec3 deep; uniform vec3 shallow; uniform vec3 foam; uniform vec3 islands[20]; uniform vec3 sunDir;
      varying vec3 vW; varying float vH;
      #include <fog_pars_fragment>
      float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      void main(){
        float d = 1e5; float r = 1.;
        for (int i=0;i<20;i++){ float dd = length(vW.xz - islands[i].xy) - islands[i].z; if (dd < d) { d = dd; } }
        float sh = 1. - smoothstep(0., 16., d);
        vec3 c = mix(deep, shallow, sh*0.85 + 0.12);
        // caustic-like sparkle pattern
        float n = noise(vW.xz*0.35 + vec2(t*0.25, t*0.18)) * noise(vW.xz*0.6 - vec2(t*0.2, -t*0.1));
        c += vec3(0.9,1.,1.) * smoothstep(0.45, 0.7, n) * 0.18;
        // foam ring hugging the shore, pulsing
        float ring = smoothstep(2.6, 0.2, abs(d - 0.6 - sin(t*1.4 + vW.x*0.3)*0.5));
        float fn = noise(vW.xz*1.6 + t*0.6);
        c = mix(c, foam, ring * smoothstep(0.25, 0.6, fn) * 0.9);
        c += vec3(0.08) * smoothstep(0.1, 0.25, vH);
        gl_FragColor = vec4(c, 1.);
        #include <fog_fragment>
      }`,
  });
  const ocean = new THREE.Mesh(geo, mat);
  ocean.receiveShadow = false;
  return { ocean, update: (t: number, center: THREE.Vector3) => { mat.uniforms.t.value = t; ocean.position.set(Math.round(center.x / 20) * 20, 0, Math.round(center.z / 20) * 20); } };
}

function cloudTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 128;
  const g = c.getContext('2d')!;
  const blob = (x: number, y: number, r: number) => {
    const grd = g.createRadialGradient(x, y, r * 0.2, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.7, 'rgba(255,255,255,0.9)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  };
  blob(70, 80, 45); blob(120, 60, 55); blob(175, 82, 42); blob(130, 92, 40);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeClouds(n = 26) {
  const group = new THREE.Group();
  const mat = new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, fog: false });
  for (let i = 0; i < n; i++) {
    const s = new THREE.Sprite(mat);
    const a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 360;
    s.position.set(Math.cos(a) * r, 40 + Math.random() * 50, Math.sin(a) * r);
    const k = 40 + Math.random() * 50;
    s.scale.set(k, k * 0.5, 1);
    group.add(s);
  }
  return group;
}

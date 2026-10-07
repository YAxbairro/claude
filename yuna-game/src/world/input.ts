// Controls for little hands and grown-ups: tap the ground to walk there, a
// floating joystick on the left half, drag on the right half to turn the
// camera, plus WASD/arrows/space on a keyboard.
export type InputState = {
  x: number; y: number;          // joystick / keys (-1..1), y = forward
  run: boolean;
  jump: boolean;                 // consumed by the game each frame
  action: boolean;
  orbit: number;                 // accumulated camera yaw drag (radians)
  zoom: number;                  // accumulated zoom delta
  tap: { x: number; y: number } | null;
  lastManual: number;            // time of last joystick/key use
};

export function createInput(el: HTMLElement, joyEl: HTMLElement, knob: HTMLElement) {
  const s: InputState = { x: 0, y: 0, run: false, jump: false, action: false, orbit: 0, zoom: 0, tap: null, lastManual: 0 };
  const keys = new Set<string>();
  let joyId = -1, jx0 = 0, jy0 = 0;
  const camPtrs = new Map<number, { x: number; y: number; sx: number; sy: number; t: number; moved: boolean }>();
  let pinch0 = 0;

  const updateKeys = () => {
    const k = (a: string, b: string) => (keys.has(a) || keys.has(b) ? 1 : 0);
    if (joyId < 0) {
      s.x = k('KeyD', 'ArrowRight') - k('KeyA', 'ArrowLeft');
      s.y = k('KeyW', 'ArrowUp') - k('KeyS', 'ArrowDown');
      if (s.x || s.y) s.lastManual = performance.now();
    }
    s.run = keys.has('ShiftLeft') || keys.has('ShiftRight');
  };
  const onKey = (e: KeyboardEvent, down: boolean) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (down) { keys.add(e.code); if (e.code === 'Space') s.jump = true; if (e.code === 'KeyE' || e.code === 'Enter') s.action = true; }
    else keys.delete(e.code);
    updateKeys();
  };
  const kd = (e: KeyboardEvent) => onKey(e, true);
  const ku = (e: KeyboardEvent) => onKey(e, false);
  addEventListener('keydown', kd);
  addEventListener('keyup', ku);

  el.addEventListener('pointerdown', (e) => {
    el.setPointerCapture(e.pointerId);
    const left = e.clientX < innerWidth * 0.42 && e.pointerType !== 'mouse';
    if (left && joyId < 0) {
      joyId = e.pointerId; jx0 = e.clientX; jy0 = e.clientY;
      joyEl.style.left = jx0 + 'px'; joyEl.style.top = jy0 + 'px';
      joyEl.classList.add('on');
      knob.style.transform = 'translate(-50%,-50%)';
      return;
    }
    camPtrs.set(e.pointerId, { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: performance.now(), moved: false });
    if (camPtrs.size === 2) { const [a, b] = [...camPtrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  el.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyId) {
      const R = 55;
      let dx = e.clientX - jx0, dy = e.clientY - jy0;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx *= R / d; dy *= R / d; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      s.x = dx / R; s.y = -dy / R;
      s.run = d > R * 0.9;
      s.lastManual = performance.now();
      return;
    }
    const p = camPtrs.get(e.pointerId);
    if (!p) return;
    if (camPtrs.size === 2) {
      p.x = e.clientX; p.y = e.clientY;
      const [a, b] = [...camPtrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      s.zoom += (pinch0 - d) * 0.02; pinch0 = d;
      return;
    }
    const dx = e.clientX - p.x;
    p.x = e.clientX; p.y = e.clientY;
    if (Math.hypot(p.x - p.sx, p.y - p.sy) > 12) p.moved = true;
    if (p.moved) s.orbit -= dx * 0.008;
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId === joyId) {
      joyId = -1; s.x = 0; s.y = 0; s.run = false;
      joyEl.classList.remove('on');
      return;
    }
    const p = camPtrs.get(e.pointerId);
    if (p && !p.moved && performance.now() - p.t < 450 && camPtrs.size === 1) s.tap = { x: e.clientX, y: e.clientY };
    camPtrs.delete(e.pointerId);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('wheel', (e) => { s.zoom += e.deltaY * 0.01; e.preventDefault(); }, { passive: false });

  return { state: s, dispose: () => { removeEventListener('keydown', kd); removeEventListener('keyup', ku); } };
}

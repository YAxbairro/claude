// Pointer-based drag & drop that works the same with mouse, finger or pen.
import gsap from 'gsap';

export type DropResult = 'accept' | 'reject' | 'ignore';
export type DragOptions = {
  zones: () => HTMLElement[];
  onDrop: (zone: HTMLElement | null, el: HTMLElement) => DropResult | Promise<DropResult>;
  onStart?: (el: HTMLElement) => void;
  onMove?: (el: HTMLElement, x: number, y: number) => void;
};

export function draggable(el: HTMLElement, opts: DragOptions) {
  el.classList.add('draggable');
  el.style.touchAction = 'none';
  let sx = 0, sy = 0, active = false, pid = -1;
  let hover: HTMLElement | null = null;

  const zoneAt = (x: number, y: number) => {
    for (const z of opts.zones()) {
      const r = z.getBoundingClientRect();
      const pad = Math.min(r.width, r.height) * 0.15;
      if (x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad) return z;
    }
    return null;
  };

  el.addEventListener('pointerdown', (e) => {
    if (active || el.classList.contains('locked')) return;
    active = true;
    pid = e.pointerId;
    el.setPointerCapture(pid);
    const cur = gsap.getProperty(el, 'x') as number;
    const cury = gsap.getProperty(el, 'y') as number;
    sx = e.clientX - cur;
    sy = e.clientY - cury;
    el.classList.add('dragging');
    gsap.to(el, { scale: 1.12, duration: 0.15 });
    opts.onStart?.(el);
  });
  el.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== pid) return;
    gsap.set(el, { x: e.clientX - sx, y: e.clientY - sy });
    const z = zoneAt(e.clientX, e.clientY);
    if (z !== hover) {
      hover?.classList.remove('drop-hover');
      z?.classList.add('drop-hover');
      hover = z;
    }
    opts.onMove?.(el, e.clientX, e.clientY);
  });
  const end = async (e: PointerEvent) => {
    if (!active || e.pointerId !== pid) return;
    active = false;
    el.classList.remove('dragging');
    hover?.classList.remove('drop-hover');
    const z = zoneAt(e.clientX, e.clientY);
    hover = null;
    const res = await opts.onDrop(z, el);
    if (res !== 'accept') {
      gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.6)' });
    }
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
}

/** Animate an element so it visually lands in a zone, then re-parent it there. */
export function settleInto(el: HTMLElement, zone: HTMLElement, container?: HTMLElement) {
  const host = container || zone;
  const a = el.getBoundingClientRect();
  host.append(el);
  gsap.set(el, { x: 0, y: 0 });
  const b = el.getBoundingClientRect();
  gsap.fromTo(el, { x: a.left - b.left, y: a.top - b.top, scale: 1.1 }, { x: 0, y: 0, scale: 1, duration: 0.35, ease: 'back.out(1.5)' });
}

// Tiny DOM helpers: h('div.card.big', {onclick}, children)
type StyleMap = { [k: string]: string | undefined };
type Attrs = Record<string, unknown> & { style?: StyleMap | string };
type Child = Node | string | number | null | undefined | false | Child[];

export function h<K extends keyof HTMLElementTagNameMap>(sel: K | string, attrs?: Attrs | Child, ...children: Child[]): HTMLElement {
  const [tagId, ...classes] = sel.split('.');
  const [tag, id] = tagId.split('#');
  const el = document.createElement(tag || 'div');
  if (id) el.id = id;
  if (classes.length) el.className = classes.join(' ');
  if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    children.unshift(attrs as Child);
  } else if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === null || v === false) continue;
      if (k === 'style') {
        if (typeof v === 'string') el.setAttribute('style', v);
        else for (const [sk, sv] of Object.entries(v as StyleMap)) {
          if (sv === undefined) continue;
          if (sk.startsWith('--')) el.style.setProperty(sk, sv);
          else (el.style as unknown as Record<string, string>)[sk] = sv;
        }
      } else if (k.startsWith('on') && typeof v === 'function') {
        el.addEventListener(k.slice(2).toLowerCase(), v as EventListener);
      } else if (k === 'class') {
        el.className += ' ' + v;
      } else if (k === 'html') {
        el.innerHTML = String(v);
      } else if (k.startsWith('--')) {
        el.style.setProperty(k, String(v));
      } else {
        el.setAttribute(k, v === true ? '' : String(v));
      }
    }
  }
  append(el, children);
  return el;
}

function append(el: HTMLElement, children: Child[]) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const svgNS = 'http://www.w3.org/2000/svg';
export function svg(tag: string, attrs: Record<string, string | number> = {}, ...children: Element[]): SVGElement {
  const el = document.createElementNS(svgNS, tag) as SVGElement;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  children.forEach((c) => el.appendChild(c));
  return el;
}

export const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function onTap(el: Element, fn: (e: PointerEvent) => void) {
  // pointerup fires faster than click on touch devices and avoids ghost clicks.
  let down = false;
  el.addEventListener('pointerdown', () => { down = true; });
  el.addEventListener('pointerleave', () => { down = false; });
  el.addEventListener('pointerup', (e) => { if (down) { down = false; fn(e as PointerEvent); } });
}

export function rectCenter(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

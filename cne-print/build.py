import sys
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen

BLUE = "#134A8E"
RED = "#E30613"
_cache = {}


def font(name, wght):
    k = (name, wght)
    if k not in _cache:
        f = TTFont(f"fonts/{name}.ttf")
        _cache[k] = instancer.instantiateVariableFont(f, {"wght": wght})
    return _cache[k]


def text_path(name, wght, text, x, baseline, cap_h, tracking=0.0):
    """Return (svg path d, bbox) for text, scaled so cap height == cap_h px.
    tracking in em units (fraction of em)."""
    f = font(name, wght)
    gs = f.getGlyphSet()
    cmap = f.getBestCmap()
    upm = f["head"].unitsPerEm
    cap = f["OS/2"].sCapHeight
    s = cap_h / cap
    pen = SVGPathPen(gs)
    bp = BoundsPen(gs)
    cx = 0
    names = [cmap[ord(c)] for c in text]
    hm = f["hmtx"]
    for i, g in enumerate(names):
        t = (s, 0, 0, -s, x + cx * s, baseline)
        gs[g].draw(TransformPen(pen, t))
        gs[g].draw(TransformPen(bp, t))
        cx += hm[g][0] + (tracking * upm if i < len(names) - 1 else 0)
    return pen.getCommands(), bp.bounds


def icon(sw=12):
    """Ballot-box icon, coordinates in logo pixel space (2000x507 ref)."""
    b = f'stroke="{BLUE}" stroke-width="{sw}" fill="none" stroke-linecap="round" stroke-linejoin="round"'
    r = f'stroke="{RED}" stroke-width="{sw}" fill="none" stroke-linejoin="round"'
    return f"""
  <g id="icon">
    <path transform="translate(1.5,0)" {r} d="M189,92.6 L80,155.5 Q76,158.5 80,161.5 L257,266 Q260,267.8 263,266 L439,161.5 Q443,158.5 439,155.5 L294,72"/>
    <path {b} d="M67,189 L248.5,294 L248.5,492 L67,388 Z"/>
    <path {b} d="M454,189 L274,294 L274,494 L454,388 Z"/>
    <path {b} d="M203.5,180 L203.5,66 L282.5,18.5 L285.5,123"/>
    <path {b} d="M195,187.5 L301,125"/>
    <path {b} d="M221,77.5 L269,97.5 M261.5,59 L226,120"/>
  </g>"""


def logo_group(cne_w=600, tag_w=500):
    parts = [icon()]
    # CNE — cap height 105..399
    bb = None
    for ch, x in (("C", 540.37), ("N", 820.95), ("E", 1134.95)):
        d, bb = text_path("Raleway", 600, ch, x, 399, 294)
        parts.append(f'  <path fill="{BLUE}" d="{d}"/>')
    parts.append(f'  <rect fill="{BLUE}" x="1463" y="101" width="5" height="296"/>')
    lines = [("Comissão", 154.8, 1562), ("Nacional de", 231.5, 1565), ("Eleições de", 308.2, 1565), ("Cabo Verde", 385, 1562)]
    for t, base, left in lines:
        _, b0 = text_path("Raleway", tag_w, t, 0, base, 48)
        d, _ = text_path("Raleway", tag_w, t, left - b0[0], base, 48)
        parts.append(f'  <path fill="{BLUE}" d="{d}"/>')
    return "\n".join(parts), bb


if __name__ == "__main__":
    g, bb = logo_group(int(sys.argv[1]) if len(sys.argv) > 1 else 600)
    print(bb, file=sys.stderr)
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2000 507" width="2000" height="507">\n{g}\n</svg>'
    open("logo_test.svg", "w").write(svg)

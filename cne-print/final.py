import os
import cairosvg
from build import logo_group, text_path, BLUE

OUT = "/home/user/claude/cne-print"
os.makedirs(OUT, exist_ok=True)

g, _ = logo_group()
# logo ink bbox in its own space: x 61..1937, y 12.5..500 -> margin 20
LX0, LY0, LX1, LY1 = 41, -7.5, 1957, 520
lw, lh = LX1 - LX0, LY1 - LY0

# ---------- Logo SVG (width 300 mm, proportional) ----------
mm_w = 300
mm_h = mm_w * lh / lw
logo_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{mm_w}mm" height="{mm_h:.3f}mm" viewBox="{LX0} {LY0} {lw} {lh}">
<title>CNE - Comissão Nacional de Eleições de Cabo Verde</title>
{g}
</svg>
'''
open(f"{OUT}/CNE_logo.svg", "w").write(logo_svg)

# ---------- Poster (9:16, 450 x 800 mm) ----------
W, H = 1125, 2000
s = 0.308
tx, ty = 273 - 61 * s, 545 - 12.5 * s


def place(text, w, cap, base, x0, x1):
    _, b = text_path("Montserrat", w, text, 0, base, cap, 0)
    _, b1 = text_path("Montserrat", w, text, 0, base, cap, 0.1)
    per = (b1[2] - b1[0] - (b[2] - b[0])) / 0.1
    t = ((x1 - x0) - (b[2] - b[0])) / per
    _, bb = text_path("Montserrat", w, text, 0, base, cap, t)
    d, _ = text_path("Montserrat", w, text, x0 - bb[0], base, cap, t)
    return d


def per_letter(text, w, cap, base, lefts):
    out = []
    chars = [c for c in text if c != " "]
    for c, x0 in zip(chars, lefts):
        _, bb = text_path("Montserrat", w, c, 0, base, cap)
        dy = -9.5 if c == "-" else 0  # hyphen sits higher in the artwork
        d, _ = text_path("Montserrat", w, c, x0 - bb[0], base + dy, cap)
        out.append(d)
    return " ".join(out)


# left ink edges measured from the reference artwork
d1 = per_letter("STAFF-CNE", 800, 95, 890, [77, 183, 286, 427, 536, 645, 721, 848, 980])
d2 = per_letter("APOIO AO ELEITOR", 700, 71, 1024,
                [29, 118, 191, 284, 316, 431, 515, 639, 710, 774, 844, 873, 941, 1034])
poster_svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="450mm" height="800mm" viewBox="0 0 {W} {H}">
<title>STAFF-CNE - Apoio ao Eleitor</title>
<rect width="{W}" height="{H}" fill="#FFFFFF"/>
<g transform="translate({tx:.3f},{ty:.3f}) scale({s})">
{g}
</g>
<path fill="{BLUE}" d="{d1}"/>
<path fill="{BLUE}" d="{d2}"/>
</svg>
'''
open(f"{OUT}/STAFF-CNE_cartaz.svg", "w").write(poster_svg)

for name in ("CNE_logo", "STAFF-CNE_cartaz"):
    cairosvg.svg2pdf(url=f"{OUT}/{name}.svg", write_to=f"{OUT}/{name}_RGB.pdf")
    cairosvg.svg2png(url=f"{OUT}/{name}.svg", write_to=f"{OUT}/{name}_preview.png",
                     output_width=2400 if name == "CNE_logo" else 1800, background_color="white")

import subprocess, re, zlib
CMYK_FIX = {  # clean process values for print
    b"0.988 0.808 0.141 0.024": b"1 0.8 0.1 0.02",  # azul CNE
    b"0.039 1 1 0.004": b"0 1 1 0",                   # vermelho CNE
}
for name in ("CNE_logo", "STAFF-CNE_cartaz"):
    tmp = f"{OUT}/_tmp.pdf"
    subprocess.run(["gs", "-q", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-sDEVICE=pdfwrite",
                    "-sColorConversionStrategy=CMYK", "-sProcessColorModel=DeviceCMYK",
                    "-dCompressPages=false", "-dCompatibilityLevel=1.6",
                    f"-sOutputFile={tmp}", f"{OUT}/{name}_RGB.pdf"], check=True)
    data = open(tmp, "rb").read()
    for a, b in CMYK_FIX.items():
        data = data.replace(a, b)
    data = data.replace(b"1 g", b"0 0 0 0 k")
    open(tmp, "wb").write(data)
    subprocess.run(["gs", "-q", "-dSAFER", "-dBATCH", "-dNOPAUSE", "-sDEVICE=pdfwrite",
                    "-sColorConversionStrategy=LeaveColorUnchanged", "-dCompatibilityLevel=1.6",
                    f"-sOutputFile={OUT}/{name}_CMYK.pdf", tmp], check=True)
    os.remove(tmp)

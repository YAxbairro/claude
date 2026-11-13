#!/usr/bin/env python3
"""T-shirts GEW Cabo Verde 2026 – arte para impressão (PNG transparente, 30x40 cm @300dpi) + mockups."""
import json, pathlib
HERE = pathlib.Path(__file__).parent

FONT = "@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@500;600;700;800;900&display=swap');"
BASE = FONT + """
:root{--navy:#04254B;--teal:#0091A3;--blue:#1E8FC6;--orange:#FD760A}
*{margin:0;padding:0;box-sizing:border-box}
html,body{background:transparent;font-family:Montserrat,sans-serif}
.art{position:relative;width:1181px;height:1575px}
img{display:block}
"""

def front(center_html, strip, extra_css=""):
    logos = "".join(f'<img src="{f}" style="height:{h}px">' for f, h in strip)
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE}
.top{{position:absolute;top:40px;left:70px;right:70px;display:flex;justify-content:space-between;align-items:center}}
.center{{position:absolute;top:360px;left:0;right:0;display:flex;flex-direction:column;align-items:center}}
.strip{{position:absolute;bottom:150px;left:60px;right:60px;display:flex;justify-content:space-evenly;align-items:center}}
{extra_css}</style></head><body><div class="art">
<div class="top"><img src="t_ajec.png" style="height:120px"><img src="t_gewcircle.png" style="height:230px"></div>
<div class="center">{center_html}</div>
<div class="strip">{logos}</div>
</div></body></html>"""

BACK = f"""<!doctype html><html><head><meta charset="utf-8"><style>{BASE}
.slogan{{position:absolute;top:150px;left:0;right:0;text-align:center;font-weight:900;font-size:148px;line-height:1.04;letter-spacing:-.01em;color:var(--navy)}}
.slogan .b{{color:var(--blue)}} .slogan .o{{color:var(--orange)}}
.logo{{position:absolute;top:900px;left:0;right:0;display:flex;justify-content:center}}
</style></head><body><div class="art">
<div class="slogan">UMA NOVA<br><span class="b">GERAÇÃO,</span><br>UMA NOVA<br><span class="o">AMBIÇÃO.</span></div>
<div class="logo"><img src="t_ajec.png" style="height:200px"></div>
</div></body></html>"""

ABERTURA = front(
    '<img src="hd_rotamilho.png" style="height:640px">',
    [("t_consulado.png", 100), ("t_mincultura_col.png", 120), ("t_cocrea.png", 38), ("t_fidjuz.png", 130), ("t_ehtcv.png", 105)])

ENC_CENTER = """
<div class="ev">
  <div class="k">Encerramento Oficial · GEW 2026</div>
  <div class="t1">ECOWAS–CABO VERDE</div>
  <div class="t2">BUSINESS FORUM</div>
  <div class="bar"></div>
  <div class="d">28 NOV 2026 · PRAIA</div>
</div>"""
ENC_CSS = """
.center{top:420px}
.ev{text-align:center}
.ev .k{font-weight:700;font-size:34px;letter-spacing:.28em;text-transform:uppercase;color:var(--teal)}
.ev .t1{white-space:nowrap;font-weight:900;font-size:96px;line-height:1;color:var(--navy);margin-top:34px;letter-spacing:-.01em}
.ev .t2{white-space:nowrap;font-weight:900;font-size:122px;line-height:1;color:var(--orange);margin-top:8px;letter-spacing:-.01em}
.ev .bar{width:220px;height:10px;margin:44px auto 0;background:linear-gradient(90deg,var(--orange),var(--teal));border-radius:5px}
.ev .d{font-weight:700;font-size:40px;letter-spacing:.2em;color:var(--navy);margin-top:36px}
.strip{justify-content:center;gap:120px}
"""
ENCERRAMENTO = front(ENC_CENTER, [("hd_cedeao.png", 230), ("hd_unisantiago.png", 190)], ENC_CSS)

# ---------- mockup (camisola branca, frente e costas lado a lado)
SHIRT = "M150 60 L255 20 Q300 70 345 20 L450 60 L560 170 L490 245 L445 205 L445 640 L155 640 L155 205 L110 245 L40 170 Z"
def mock(front_png, back_png):
    def tee(png, label, neck_front=True):
        neck = '<path d="M255 20 Q300 70 345 20" fill="none" stroke="#e2e2e2" stroke-width="6"/>' if neck_front else \
               '<path d="M255 20 Q300 38 345 20" fill="none" stroke="#e2e2e2" stroke-width="6"/>'
        return f"""<div class="tee"><svg viewBox="0 0 600 660"><defs><filter id="s" x="-10%" y="-10%" width="120%" height="120%">
<feDropShadow dx="0" dy="8" stdDeviation="10" flood-opacity=".18"/></filter></defs>
<path d="{SHIRT}" fill="#fff" filter="url(#s)"/>{neck}</svg>
<img class="print" src="{png}"><div class="lbl">{label}</div></div>"""
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{FONT}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1600px;height:1000px;background:#ECEDEF;font-family:Montserrat,sans-serif;display:flex;justify-content:center;align-items:center;gap:60px}}
.tee{{position:relative;width:700px;height:770px}}
.tee svg{{width:100%;height:100%}}
.print{{position:absolute;left:50%;top:132px;width:300px;transform:translateX(-50%)}}
.lbl{{position:absolute;bottom:-70px;left:0;right:0;text-align:center;font-weight:600;letter-spacing:.3em;color:#3a3f47;font-size:22px}}
</style></head><body>{tee(front_png,"FRENTE")}{tee(back_png,"COSTAS",False)}</body></html>"""

PAGES = [
    ("TShirt_Abertura_FRENTE", ABERTURA, 1181, 1575, True),
    ("TShirt_Encerramento_FRENTE", ENCERRAMENTO, 1181, 1575, True),
    ("TShirt_COSTAS_Abertura_e_Encerramento", BACK, 1181, 1575, True),
]
for n, html, *_ in PAGES:
    (HERE / f"{n}.html").write_text(html, encoding="utf-8")
(HERE / "mock_abertura.html").write_text(mock("out/TShirt_Abertura_FRENTE.png", "out/TShirt_COSTAS_Abertura_e_Encerramento.png"), encoding="utf-8")
(HERE / "mock_encerramento.html").write_text(mock("out/TShirt_Encerramento_FRENTE.png", "out/TShirt_COSTAS_Abertura_e_Encerramento.png"), encoding="utf-8")
(HERE / "pages.json").write_text(json.dumps([[n, w, h] for n, _, w, h, _ in PAGES]))

#!/usr/bin/env python3
"""Banners GEW Cabo Verde 2026 (roll-up 85x200 cm e horizontal 300x100 cm). 1 px CSS = 1 mm."""
import json, math, pathlib
HERE = pathlib.Path(__file__).parent

def ring_svg(size=600):
    cols = ['#2E5FA8','#5B4B9A','#F2A1B8','#3BA7B5','#C3125A','#9ED3E8','#13939C','#DDE3EA','#C8D82B','#E4E80F','#A8C531',
            '#7A4A1F','#6A0E1E','#8FA9B8','#E24A3A','#E31B23','#B7D13A','#C8102E','#F7E2B5','#F59E0B','#E86F14','#D61F2F',
            '#F4A3C0','#8F5FA8','#123E8C','#0091A3','#FD760A','#F5C342']
    n = len(cols); R = size/2; r1 = R*.98; r0 = R*.70; out = []
    for k, c in enumerate(cols):
        a0 = 2*math.pi*k/n + .012; a1 = 2*math.pi*(k+1)/n - .012
        ro = r1 - (k*7 % 5)*R*.012
        p = lambda a, rr: f"{R+rr*math.cos(a):.1f},{R+rr*math.sin(a):.1f}"
        out.append(f'<path d="M{p(a0,r0)} L{p(a0,ro)} A{ro:.1f},{ro:.1f} 0 0 1 {p(a1,ro)} L{p(a1,r0)} A{r0:.1f},{r0:.1f} 0 0 0 {p(a0,r0)}Z" fill="{c}"/>')
    return f'<svg viewBox="0 0 {size} {size}">{"".join(out)}</svg>'

TITLE = "Semana Global de<br>Empreendedorismo"
CSS = """@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800;900&family=Playfair+Display:ital,wght@1,500&display=swap');
:root{--navy:#04254B;--navy2:#021A36;--teal:#0091A3;--orange:#FD760A}
*{margin:0;padding:0;box-sizing:border-box}
body{width:var(--w);height:var(--h);overflow:hidden;font-family:Montserrat,sans-serif;color:#fff;background:var(--navy);-webkit-font-smoothing:antialiased}
.page{position:relative;width:var(--w);height:var(--h);overflow:hidden;display:flex;flex-direction:column;
  background:radial-gradient(120% 80% at 100% 0%,#0a3a6e 0%,var(--navy) 45%,var(--navy2) 100%)}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:var(--g) var(--g)}
.ring{position:absolute;pointer-events:none}.ring svg{width:100%;height:100%;display:block}
.head{position:relative;z-index:2;background:#fff;display:flex;align-items:center;justify-content:space-between}
.head img{display:block}
.head .sep{flex:1;height:3px;background:linear-gradient(90deg,var(--teal),var(--orange));opacity:.5}
.eyebrow{font-weight:700;text-transform:uppercase;color:var(--teal);display:flex;align-items:center}
.eyebrow:before{content:"";background:var(--orange)}
h1{font-weight:900;line-height:.98;letter-spacing:-.02em}
h1 .o{color:var(--orange);display:block}
.tag{font-family:'Playfair Display',serif;font-style:italic;font-weight:500;color:#E9EEF6}
.date{background:var(--orange);display:inline-flex;flex-direction:column;align-self:flex-start}
.date small{font-weight:700;text-transform:uppercase;opacity:.92}
.date b{font-weight:900;line-height:1.02;white-space:nowrap}
.hash{font-weight:700;color:var(--teal)}
"""

ROLLUP = f"""<!doctype html><html lang="pt"><head><meta charset="utf-8"><style>{CSS}
:root{{--w:850px;--h:2000px;--g:40px}}
.head{{height:190px;padding:0 60px}} .head .sep{{margin:0 30px}}
.ring{{width:1000px;height:1000px;left:-75px;bottom:-560px}}
.body{{position:relative;z-index:2;flex:1;padding:120px 60px 0;display:flex;flex-direction:column}}
.eyebrow{{font-size:22px;letter-spacing:.3em;gap:18px}} .eyebrow:before{{width:56px;height:4px}}
h1{{font-size:68px;margin-top:44px;line-height:1.06}}
.tag{{font-size:52px;margin-top:64px;line-height:1.25}}
.date{{margin-top:96px;padding:34px 44px;border-radius:8px}}
.date small{{font-size:22px;letter-spacing:.26em}} .date b{{font-size:74px;margin-top:6px}}
.hash{{margin-top:84px;font-size:28px;line-height:1.7}}
</style></head><body><div class="page"><div class="grid"></div>
<div class="ring">{ring_svg()}</div>
<div class="head"><img src="t_gew_h.png" style="height:130px"><div class="sep"></div><img src="t_ajec.png" style="height:96px"></div>
<div class="body">
 <div class="eyebrow">Global Entrepreneurship Week</div>
 <h1>{TITLE}<span class="o">Cabo Verde 2026</span></h1>
 <div class="tag">Uma nova geração,<br>uma nova ambição.</div>
 <div class="date"><small>Datas</small><b>16 — 22 NOV<br>2026</b></div>
 <div class="hash">#GEW2026 &nbsp;#GEWCaboVerde<br>#AJEC &nbsp;#NovaGeraçãoNovaAmbição</div>
</div></div></body></html>"""

HORIZ = f"""<!doctype html><html lang="pt"><head><meta charset="utf-8"><style>{CSS}
:root{{--w:3000px;--h:1000px;--g:50px}}
.page{{flex-direction:row}}
.side{{position:relative;z-index:2;width:560px;background:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:90px}}
.side .sep{{width:200px;height:4px;background:linear-gradient(90deg,var(--teal),var(--orange));opacity:.6}}
.ring{{width:1250px;height:1250px;right:-600px;top:-125px}}
.body{{position:relative;z-index:2;flex:1;padding:0 130px;display:flex;flex-direction:column;justify-content:center}}
.eyebrow{{font-size:30px;letter-spacing:.32em;gap:22px}} .eyebrow:before{{width:70px;height:5px}}
h1{{font-size:150px;margin-top:40px}} h1 .o{{display:inline}}
.row{{display:flex;align-items:center;gap:70px;margin-top:60px}}
.tag{{font-size:62px}}
.date{{padding:30px 46px;border-radius:10px}}
.date small{{font-size:24px;letter-spacing:.26em}} .date b{{font-size:78px;margin-top:4px}}
.hash{{margin-top:56px;font-size:32px}}
</style></head><body><div class="page"><div class="grid"></div>
<div class="side"><img src="t_gew_h.png" style="width:420px"><div class="sep"></div><img src="t_ajec.png" style="width:380px"></div>
<div class="ring">{ring_svg()}</div>
<div class="body">
 <div class="eyebrow">Global Entrepreneurship Week</div>
 <h1>Semana Global de Empreendedorismo<br><span class="o">Cabo Verde 2026</span></h1>
 <div class="row"><div class="date"><small>Datas</small><b>16 — 22 NOV 2026</b></div><div class="tag">Uma nova geração,<br>uma nova ambição.</div></div>
 <div class="hash">#GEW2026 &nbsp;#GEWCaboVerde &nbsp;#AJEC &nbsp;#NovaGeraçãoNovaAmbição</div>
</div></div></body></html>"""

PAGES = {"Banner_RollUp_85x200cm": (ROLLUP, 850, 2000), "Banner_Horizontal_300x100cm": (HORIZ, 3000, 1000)}
for n, (h, w, hh) in PAGES.items():
    (HERE / f"{n}.html").write_text(h, encoding="utf-8")
(HERE / "banners.json").write_text(json.dumps([[n, w, h] for n, (_, w, h) in PAGES.items()]))

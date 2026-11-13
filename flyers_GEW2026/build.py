#!/usr/bin/env python3
"""Gera os flyers GEW Cabo Verde 2026 (HTML -> PNG + PDF via Playwright)."""
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / "out"; OUT.mkdir(exist_ok=True)

HASHTAGS = "#GEW2026 &nbsp;#GEWCaboVerde &nbsp;#AJEC &nbsp;#NovaGeraçãoNovaAmbição"

# Parceiros: logo (ficheiro) ou None -> etiqueta de texto até haver ficheiro oficial
LOGOS = {
    "CEDEAO": "t_cedeao.png",
    "Consulado da Colômbia": "t_consulado.png",
    "Min. Cultura da Colômbia": "t_mincultura_col.png",
    "CO-CREA": "t_cocrea.png",
    "EHTCV": "t_ehtcv.png",
    "Asicotur": "t_asicotur.png",
    "Universidade de Santiago": "t_unisantiago.png",
    "FIC": "t_fic.png",
    "CCB": "t_ccb.png",
    "Fidjuz di Cabral": "t_fidjuz.png",
    "CEUS – Casa do Empreendedor": None,
}

SCALE = {"t_cocrea.png": .4, "t_mincultura_col.png": 1.3, "t_asicotur.png": .9, "t_unisantiago.png": 1.15, "t_ccb.png": .72, "t_consulado.png": 1.25, "t_ehtcv.png": 1.25, "t_fic.png": 1.1, "t_fidjuz.png": 1.35, "t_cedeao.png": 1.4}
import math
def ring_svg(size=600, op=1):
    cols = ['#2E5FA8','#5B4B9A','#F2A1B8','#3BA7B5','#C3125A','#9ED3E8','#13939C','#DDE3EA','#C8D82B','#E4E80F','#A8C531',
            '#7A4A1F','#6A0E1E','#8FA9B8','#E24A3A','#E31B23','#B7D13A','#C8102E','#F7E2B5','#F59E0B','#E86F14','#D61F2F',
            '#F4A3C0','#8F5FA8','#123E8C','#0091A3','#FD760A','#F5C342']
    n = len(cols); R = size/2; r1 = R*.98; r0 = R*.70; out = []
    for k, c in enumerate(cols):
        a0 = 2*math.pi*k/n + .012; a1 = 2*math.pi*(k+1)/n - .012
        ro = r1 - (k*7 % 5)*R*.012
        p = lambda a, rr: f"{R+rr*math.cos(a):.1f},{R+rr*math.sin(a):.1f}"
        out.append(f'<path d="M{p(a0,r0)} L{p(a0,ro)} A{ro:.1f},{ro:.1f} 0 0 1 {p(a1,ro)} L{p(a1,r0)} A{r0:.1f},{r0:.1f} 0 0 0 {p(a0,r0)}Z" fill="{c}"/>')
    return f'<svg viewBox="0 0 {size} {size}" style="opacity:{op}">{"".join(out)}</svg>'

def partner(name, h=54):
    f = LOGOS.get(name)
    if f:
        return f'<div class="p"><img src="{f}" style="max-height:{h*SCALE.get(f,1):.0f}px" alt="{name}"></div>'
    return f'<div class="p txt" style="height:{h}px">{name}</div>'

CSS = """
@import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@1,500;1,600&display=swap');
:root{--navy:#04254B;--navy2:#021A36;--teal:#0091A3;--orange:#FD760A;--sand:#F4EFE6;--ink:#0B1B33}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:var(--w);height:var(--h)}
body{font-family:Montserrat,sans-serif;color:#fff;background:var(--navy);overflow:hidden;-webkit-font-smoothing:antialiased}
.page{position:relative;width:var(--w);height:var(--h);display:flex;flex-direction:column;
  background:radial-gradient(120% 80% at 100% 0%,#0a3a6e 0%,var(--navy) 45%,var(--navy2) 100%);overflow:hidden}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:60px 60px;pointer-events:none}
.ring{position:absolute;pointer-events:none}.ring svg{display:block;width:100%;height:100%}
.head{position:relative;z-index:2;background:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 var(--pad)}
.head img{display:block}
.head .sep{flex:1;height:2px;margin:0 28px;background:linear-gradient(90deg,var(--teal),var(--orange));opacity:.5}
.body{position:relative;z-index:2;flex:1;padding:0 var(--pad);display:flex;flex-direction:column}
.eyebrow{font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:var(--teal);display:flex;align-items:center;gap:16px}
.eyebrow:before{content:"";width:46px;height:3px;background:var(--orange)}
h1{font-weight:900;line-height:.98;letter-spacing:-.02em}
h1 .o{color:var(--orange)}
.tag{font-family:'Playfair Display',serif;font-style:italic;font-weight:500;color:#E9EEF6}
.bar{height:4px;width:120px;background:linear-gradient(90deg,var(--orange),var(--teal));border-radius:2px}
.foot{position:relative;z-index:2;background:#fff;color:var(--ink);padding:18px var(--pad) 20px}
.foot .lbl{font-size:12px;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:#6b7a90;margin-bottom:12px;display:flex;align-items:center;gap:12px}
.foot .lbl:after{content:"";flex:1;height:1px;background:#dde3ea}
.logos{display:flex;align-items:center;justify-content:space-between;gap:22px;flex-wrap:nowrap}
.p{display:flex;align-items:center;justify-content:center}
.p img{display:block;max-width:220px;object-fit:contain}
.p.txt{font-weight:800;font-size:15px;color:var(--navy);text-transform:uppercase;letter-spacing:.06em;text-align:center;line-height:1.15;
  padding:0 14px;border-left:3px solid var(--orange);justify-content:flex-start;max-width:190px}
.hash{font-weight:700;color:var(--teal);letter-spacing:.02em}
.hashbar{position:relative;z-index:2;background:var(--orange);color:#fff;font-weight:800;text-align:center;letter-spacing:.04em;padding:12px var(--pad)}
"""

# ---------------------------------------------------------------- Cartaz principal (A4)
AGENDA = [
    ("16", "Nov", "Praia", "Abertura Oficial GEW 2026 <span>Exposição «Ciclo Histórico do Milho» e Degustação (fusão Colômbia–Cabo Verde)</span>"),
    ("16–21", "Nov", "Sal", "TUI Futureshaper Santa Maria, Sal <span>Programa de Apoio na Preparação para a Certificação Turística (Qualidade e Sustentabilidade)</span>"),
    ("18–21", "Nov", "São Vicente<br>Santo Antão", "<i>GEW Business &amp; Investment Network</i> <span>XXIXª Edição da Feira Internacional de Cabo Verde (FIC) / GEW Investors Lounge (B2B da CEDEAO e Diáspora)</span>"),
    ("19", "Nov", "Praia", "Laboratório «Receitas para a Paz» (Parte I) <span>Mesa-redonda e oficinas técnicas colombianas e cabo-verdianas com milho</span>"),
    ("20", "Nov", "Praia", "Laboratório «Receitas para a Paz» (Parte II) <span>Oficinas de Conservação, Soberania Alimentar e Roda de Memória</span>"),
    ("21", "Nov", "Sal", "Workshop + Mini-exposição de Acesso ao Mercado Turístico <span>Valorização da oferta local</span>"),
    ("26", "Nov", "Praia", "IV Jornada de Cooperação Turística Internacional <span>Gala Cultural: Encontro gastronómico (fusão sabores Cabo Verde e Colômbia)</span>"),
    ("28", "Nov", "Praia", "Encerramento Oficial <span><i>ECOWAS–Cabo Verde Business Forum</i> (Capacitação e B2B) e Pitch Inverso Startups</span>"),
]

def poster():
    rows = "".join(
        f'<div class="row"><div class="d"><b>{d}</b><small>{m}</small></div>'
        f'<div class="loc">{l}</div><div class="t">{t}</div></div>' for d, m, l, t in AGENDA)
    partners = ["CEDEAO", "Consulado da Colômbia", "Min. Cultura da Colômbia", "CO-CREA", "EHTCV",
                "Asicotur", "Universidade de Santiago", "FIC", "CCB", "Fidjuz di Cabral"]
    logos1 = "".join(partner(p, 50) for p in partners[:5])
    logos2 = "".join(partner(p, 50) for p in partners[5:])
    return f"""<!doctype html><html lang="pt"><head><meta charset="utf-8"><style>{CSS}
:root{{--w:1240px;--h:1754px;--pad:84px}}
.head{{height:150px}}
.ring.a{{width:470px;height:470px;right:-320px;top:100px}}
.eyebrow{{font-size:16px;margin-top:56px}}
h1{{font-size:98px;margin-top:22px}}
.tag{{font-size:42px;margin-top:20px}}
.meta{{display:flex;gap:22px;margin-top:38px;align-items:stretch}}
.date{{background:var(--orange);padding:20px 30px;border-radius:6px}}
.date small{{display:block;font-size:14px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;opacity:.9}}
.date b{{display:block;font-size:40px;font-weight:900;line-height:1.05;white-space:nowrap}}
.isl{{flex:1;border:1.5px solid rgba(255,255,255,.28);border-radius:6px;padding:20px 30px;display:flex;flex-direction:column;justify-content:center}}
.isl small{{font-size:14px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--teal)}}
.isl div{{font-size:26px;font-weight:700;margin-top:6px;white-space:nowrap}}
.isl em{{font-style:normal;color:var(--orange);margin:0 10px}}
.agenda{{margin-top:44px;border-top:1px solid rgba(255,255,255,.18)}}
.row{{display:grid;grid-template-columns:128px 168px 1fr;align-items:center;padding:18px 0;border-bottom:1px solid rgba(255,255,255,.18)}}
.row .d b{{font-size:36px;font-weight:900;line-height:1;color:#fff}}
.row .d small{{display:block;font-size:14px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--orange);margin-top:4px}}
.row .loc{{font-size:15px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--teal)}}
.row .t{{font-size:24px;font-weight:600;line-height:1.25}}
.row .t span{{display:block;font-size:18px;font-weight:500;color:#AFC0D6;margin-top:3px}}
.hashes{{margin-top:auto;margin-bottom:56px;font-size:21px}}
.foot .logos+.logos{{margin-top:16px}}
</style></head><body><div class="page"><div class="grid"></div>
<div class="ring a">{ring_svg(600,.92)}</div>
<div class="head"><img src="t_gew_h.png" style="height:104px"><div class="sep"></div><img src="t_ajec.png" style="height:80px"></div>
<div class="body">
 <div class="eyebrow">Global Entrepreneurship Week</div>
 <h1>Semana Global de<br>Empreendedorismo<br><span class="o">Cabo Verde 2026</span></h1>
 <div class="tag">Uma nova geração, uma nova ambição.</div>
 <div class="meta">
  <div class="date"><small>Datas</small><b>16 — 28 Nov 2026</b></div>
  <div class="isl"><small>Ilhas</small><div>Santiago<em>|</em>Sal<em>|</em>São Vicente<em>|</em>Santo Antão</div></div>
 </div>
 <div class="agenda">{rows}</div>
 <div class="hashes hash">{HASHTAGS}</div>
</div>
</div></body></html>"""

# ---------------------------------------------------------------- Flyers individuais (1080x1350)
def single(eyebrow, title, subtitle, info, support, partners, accent="var(--orange)", badge=None, footlbl="Com o apoio de"):
    infos = "".join(f'<div class="i"><small>{k}</small><div>{v}</div></div>' for k, v in info)
    logos = "".join(partner(p, 48) for p in partners)
    return f"""<!doctype html><html lang="pt"><head><meta charset="utf-8"><style>{CSS}
:root{{--w:1080px;--h:1350px;--pad:72px}}
.head{{height:118px}}
.ring.a{{width:480px;height:480px;right:-290px;top:90px}}
.eyebrow{{font-size:15px;margin-top:58px}}
h1{{font-size:90px;margin-top:24px}}
.sub{{font-size:31px;font-weight:600;line-height:1.35;color:#DCE6F2;margin-top:30px;max-width:780px}}
.sub b{{color:{accent}}}
.info{{display:grid;grid-template-columns:repeat(var(--n),1fr);gap:16px;margin-top:50px}}
.i{{border-left:5px solid {accent};background:rgba(255,255,255,.07);padding:24px 24px;border-radius:0 6px 6px 0}}
.i small{{font-size:14px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:var(--teal)}}
.i div{{font-size:27px;font-weight:700;line-height:1.3;margin-top:8px}}
.sup{{margin-top:50px;max-width:860px;font-family:'Playfair Display',serif;font-style:italic;font-size:34px;line-height:1.4;color:#fff;padding-left:28px;border-left:2px solid rgba(255,255,255,.25)}}
.badge{{margin-top:36px;align-self:flex-start;display:flex;align-items:center;gap:22px;background:#fff;border-radius:10px;padding:14px 26px 14px 16px;box-shadow:0 10px 30px rgba(0,0,0,.25)}}
.badge img{{height:118px;display:block}}
.badge small{{display:block;font-size:12px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#6b7a90}}
.badge b{{display:block;font-size:22px;font-weight:800;color:var(--navy);margin-top:4px;line-height:1.2}}
.gewline{{margin-top:auto;margin-bottom:30px;display:flex;justify-content:space-between;align-items:flex-end}}
.gewline .tg{{font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:#AFC0D6}}
.gewline .hash{{font-size:17px;text-align:right;line-height:1.5}}
.logos{{justify-content:center;gap:40px}}
</style></head><body><div class="page"><div class="grid"></div>
<div class="ring a">{ring_svg(600,.95)}</div>
<div class="head"><img src="t_gew_h.png" style="height:84px"><div class="sep"></div><img src="t_ajec.png" style="height:62px"></div>
<div class="body" style="--n:{len(info)}">
 <div class="eyebrow">{eyebrow}</div>
 <h1>{title}</h1>
 <div class="sub">{subtitle}</div>
 <div class="info">{infos}</div>
 <div class="sup">{support}</div>
 {badge or ""}
 <div class="gewline"><div class="tg">Uma nova geração,<br>uma nova ambição.</div><div class="hash">#GEW2026 &nbsp;#GEWCaboVerde<br>#AJEC &nbsp;#NovaGeraçãoNovaAmbição</div></div>
</div>
<div class="foot"><div class="lbl">{footlbl}</div><div class="logos">{logos}</div></div>
</div></body></html>"""

COL = ["Consulado da Colômbia", "Min. Cultura da Colômbia", "CO-CREA", "EHTCV", "Fidjuz di Cabral"]

PAGES = {
    "01_Cartaz_Principal_A4": (poster(), 1240, 1754),
    "A_Abertura_Oficial": (single(
        "GEW 2026 · 16 de Novembro",
        'Abertura Oficial<br><span class="o">GEW 2026</span>',
        "Exposição <span style=\"color:#fff;font-weight:800\">«Ciclo Histórico do Milho»</span> &amp; Degustação: <b>menu de fusão <span style=\"white-space:nowrap\">Cabo Verde–Colômbia</span></b> em torno do Milho",
        [("Data", "16 de Novembro"), ("Horário", "15h00 – 18h00"), ("Local", "Mercado Municipal<br>Praia")],
        "Receitas para a Paz — memórias do milho, hospitalidade e ressignificação.",
        COL, badge='<div class="badge"><img src="t_rotamilho.png" alt="A Rota do Milho"><div><small>Projeto Cultural</small><b>A Rota do Milho<br>Receitas para a Paz</b></div></div>', footlbl="Promovido por"), 1080, 1350),
    "D_Laboratorio_Receitas_para_a_Paz": (single(
        "Laboratório Gastronómico",
        'Laboratório<br><span class="o">«Receitas<br>para a Paz»</span>',
        "Cozinhas <b>Colombiana</b> e <b>Cabo-Verdiana</b> em diálogo",
        [("19 Nov", "14h00 – 17h00"), ("20 Nov", "14h30 – 18h00"), ("Local", "EHTCV, Praia")],
        "Mesas-redondas, oficinas técnicas e rodas de memória em torno do milho, a nossa ponte afro-atlântica.",
        COL, badge='<div class="badge"><img src="t_rotamilho.png" alt="A Rota do Milho"><div><small>Projeto Cultural</small><b>A Rota do Milho<br>Receitas para a Paz</b></div></div>', footlbl="Promovido por"), 1080, 1350),
    "F_Encerramento_ECOWAS_Business_Forum": (single(
        "Encerramento Oficial GEW 2026",
        'ECOWAS–<br>Cabo Verde<br><span class="o">Business Forum</span>',
        "Capacitação em <b>e-commerce</b>, sessões <b>B2B</b> com PME e Representações Diplomáticas da CEDEAO, e <b>Pitch Inverso</b> de Startups.",
        [("Data", "28 de Novembro"), ("Horário", "10h00 – 16h00"), ("Local", "Uni. Santiago<br>Polo Sucupira, Praia")],
        "A grande ponte entre Cabo Verde e a África Ocidental, no coração do maior mercado do país!",
        ["CEDEAO", "Universidade de Santiago"], accent="var(--teal)"), 1080, 1350),
}

import json
meta=[]
for name,(html,w,h) in PAGES.items():
    (HERE/f"{name}.html").write_text(html,encoding="utf-8"); meta.append([name,w,h])
(HERE/"pages.json").write_text(json.dumps(meta))

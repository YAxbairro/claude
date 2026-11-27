"""Build Djobe's knowledge base: docs.json (catalog) + chunks.json (article-level chunks)."""
import json, re, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from slice import slice_act

BASE = os.path.join(os.path.dirname(__file__), "..")
OUT = "/home/user/claude/djobe/data"
BOE = "https://boe.incv.cv/Bulletins/View?id="

# (doc_id, short label, full title, area, source file, act to slice or None, url, start marker or None)
CATALOG = [
    ("constituicao", "Constituição", "Constituição da República de Cabo Verde (revisão de 2010, Lei Constitucional n.º 1/VII/2010)", "Direitos fundamentais", "docs/7080.2col.txt", "Lei Constitucional nº 1/VII/2010", BOE + "7080", None),
    ("cod_laboral", "Código Laboral", "Código Laboral Cabo-verdiano (Decreto-Legislativo n.º 5/2007)", "Trabalho", "docs/7878.2col.txt", "Decreto-Legislativo nº 5/2007", BOE + "7878", None),
    ("cod_laboral_2016", "Código Laboral (alteração 2016)", "Alteração ao Código Laboral de 2016 (publicada como Decreto-Regulamentar n.º 1/2016, BO n.º 6 de 03-02-2016)", "Trabalho", "docs/web/cl2016.2col.txt", "Decreto-Regulamentar nº 1/2016", "https://boe.incv.cv/Bulletins/Download/2139", None),
    ("cod_penal", "Código Penal", "Código Penal (Decreto-Legislativo n.º 4/2003, republicado pela Lei n.º 117/IX/2021)", "Crimes e penas", "docs/48767.2col.txt", "Decreto-Legislativo nº 4/2003", BOE + "48767", None),
    ("cpp", "Código de Processo Penal", "Código de Processo Penal (versão republicada pelo Decreto-Legislativo n.º 5/2015)", "Polícia, detenção e tribunais", "docs/27193.2col.txt", "Decreto-legislativo n.º 5/2015", BOE + "27193", "\nRepublicação"),
    ("cpp_2021", "Código de Processo Penal (alteração 2021)", "Alteração de 2021 ao Código de Processo Penal (Lei n.º 122/IX/2021) — os artigos aqui alterados prevalecem sobre a versão de 2015", "Polícia, detenção e tribunais", "docs/49689.2col.txt", "Lei nº 122/IX/2021", BOE + "49689", None),
    ("vbg", "Lei VBG", "Lei da Violência Baseada no Género (Lei n.º 84/VII/2011)", "Violência doméstica e de género", "docs/5921.2col.txt", "Lei nº 84/VII/2011", BOE + "5921", None),
    ("eca", "Estatuto da Criança", "Estatuto da Criança e do Adolescente (Lei n.º 50/VIII/2013)", "Crianças e jovens", "docs/20677.2col.txt", "Lei nº 50/VIII/2013", BOE + "20677", None),
    ("arrendamento", "Lei do Arrendamento", "Regime geral do arrendamento urbano (Lei n.º 101/VIII/2016)", "Casa e renda", "docs/27842.2col.txt", "Lei nº 101/VIII/2016", BOE + "27842", None),
    ("dados", "Lei de Proteção de Dados", "Proteção de dados pessoais (Lei n.º 133/V/2001, republicada pela Lei n.º 41/VIII/2013)", "Privacidade", "docs/19888.2col.txt", "Lei nº 133/V/2001", BOE + "19888", None),
    ("rempe", "Lei do REMPE", "Regime especial das micro e pequenas empresas — REMPE (Lei n.º 70/VIII/2014)", "Empresas e impostos", "docs/22811.2col.txt", "Lei nº 70/VIII/2014", BOE + "22811", None),
    ("irps", "Código do IRPS", "Código do Imposto sobre o Rendimento das Pessoas Singulares — IRPS (Lei n.º 78/VIII/2014)", "Impostos", "docs/24021.2col.txt", "Lei nº 78/VIII/2014", BOE + "24021", None),
    ("irpc", "Código do IRPC", "Código do Imposto sobre o Rendimento das Pessoas Coletivas — IRPC (Lei n.º 82/VIII/2015)", "Empresas e impostos", "docs/24080.2col.txt", "Lei n.º 82/VIII/2015", BOE + "24080", None),
    ("cgt", "Código Geral Tributário", "Código Geral Tributário (Lei n.º 47/VIII/2013)", "Impostos", "docs/20621.2col.txt", "Lei nº 47/VIII/2013", BOE + "20621", None),
    ("iva", "Regulamento do IVA", "Regulamento do Imposto sobre o Valor Acrescentado — IVA (Lei n.º 21/VI/2003, versão original)", "Impostos", "docs/web/iva.txt", None, "https://www.mf.gov.cv/documents/54571/591130/IVA.pdf", None),
    ("oe2026", "Orçamento do Estado 2026", "Orçamento do Estado para 2026 (Lei n.º 69/X/2025)", "Dinheiro público", "docs/89137.txt", "Lei n.º 69/X/2025", BOE + "89137", None),
    ("smn", "Resolução do salário mínimo", "Resolução n.º 4/2026 — salário mínimo nacional", "Trabalho", "docs/89367.txt", "Resolução n.º 4/2026", BOE + "89367", None),
    ("estrada_2025", "Código da Estrada (alteração 2025)", "Alteração ao Código da Estrada e aos transportes (Decreto-Lei n.º 27/2025)", "Estrada e condução", "docs/86958.txt", "Decreto-Lei n.º 27/2025", BOE + "86958", None),
    ("estrada_pontos", "Carta por pontos", "Registo de infrações e carta por pontos (Decreto-Lei n.º 28/2025)", "Estrada e condução", "docs/86959.txt", "Decreto-Lei n.º 28/2025", BOE + "86959", None),
    ("tcp", "Regime dos trabalhadores por conta própria", "Proteção social dos trabalhadores por conta própria (Decreto-Lei n.º 48/2009)", "Segurança social", "docs/7234.2col.txt", "Decreto-Lei nº 48/2009", BOE + "7234", None),
    ("lei_bases_ps", "Lei de Bases da Proteção Social", "Lei de Bases da Proteção Social (Lei n.º 131/V/2001)", "Segurança social", "docs/inps/lei131_2001.2col.txt", "Lei nº 131/V/2001", "https://inps.cv/legis/", None),
    ("dl_51_2005", "Decreto-Lei n.º 51/2005", "Alteração ao regime de proteção social dos trabalhadores por conta de outrem (Decreto-Lei n.º 51/2005)", "Segurança social", "docs/inps/dl51_2005.2col.txt", "Decreto-Lei nº 51/2005", "https://inps.cv/legis/", None),
    ("dl_50_2009", "Decreto-Lei n.º 50/2009", "Alteração ao Decreto-Lei n.º 5/2004, proteção social dos trabalhadores por conta de outrem (Decreto-Lei n.º 50/2009)", "Segurança social", "docs/inps/dl5_2004.2col.txt", "Decreto-Lei nº 50/2009", "https://inps.cv/legis/", None),
    ("estatuto_mp", "Estatuto dos Magistrados do MP", "Estatuto dos Magistrados do Ministério Público (Lei n.º 2/VIII/2011)", "Justiça e tribunais", "docs/5775.2col.txt", "Lei nº 2/VIII/2011", BOE + "5775", None),
    ("lei_organica_mp", "Lei Orgânica do MP", "Lei Orgânica do Ministério Público (Lei n.º 89/VII/2011)", "Justiça e tribunais", "docs/5863.2col.txt", "Lei nº 89/VII/2011", BOE + "5863", None),
]

DROP = [
    re.compile(r"^\s*https?://kiosk\.incv\.cv\s*$"),
    re.compile(r"^\s*[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}\s*$"),
    re.compile(r"^\s*[A-Z0-9]{8}(-[A-Z0-9]{8}){3,}\s*$"),
    re.compile(r"«\s*B\.\s*O\.?\s*»", re.I),
    re.compile(r"^\s*I\s+S[ÉE]RIE\s*[—-]", re.I),
    re.compile(r"Documento descarregado pelo utilizador", re.I),
    re.compile(r"Todos os direitos reservados", re.I),
    re.compile(r"^\s*\d{1,4}\s*$"),
    re.compile(r"^\s*[–—―-]{3,}\s*$"),
    re.compile(r"PREÇO DESTE NÚMERO", re.I),
]
ART = re.compile(r"^\s*Art(?:igo|\.)\s*(\d+)\s*[.ºo°]*\s*(-\s*[A-Z])?\s*[.ºo°]*\s*$")


def clean(text):
    lines = [l for l in text.split("\n") if not any(p.search(l) for p in DROP)]
    t = "\n".join(lines)
    t = re.sub(r"(\w)-\n(?=[a-zà-ú])", r"\1", t)        # hyphenated word break
    t = re.sub(r"(\w)-\n(?=[A-ZÀ-Ú])", r"\1-", t)
    t = re.sub(r"[ \t]+", " ", t)
    return t


def flow(text):
    """Join wrapped lines into paragraphs, keeping breaks before numbered items."""
    out = []
    for l in text.split("\n"):
        s = l.strip()
        if not s:
            out.append("\n")
            continue
        if out and out[-1] not in ("\n",) and not re.match(r"^(\d+\s*[.)-]|[a-z]\)|[ivx]+\)|-|•)\s", s):
            out[-1] = out[-1] + " " + s
        else:
            out.append(s)
    paras = [p for p in out if p != "\n"]
    return "\n".join(paras)


def split_articles(text):
    lines = text.split("\n")
    idx = [i for i, l in enumerate(lines) if ART.match(l)]
    chunks = []
    if not idx:
        return None
    pre = flow("\n".join(lines[: idx[0]])).strip()
    if len(pre) > 200:
        chunks.append(("Preâmbulo / introdução", pre))
    for k, i in enumerate(idx):
        end = idx[k + 1] if k + 1 < len(idx) else len(lines)
        m = ART.match(lines[i])
        num = m.group(1) + ("-" + m.group(2).replace("-", "").strip() if m.group(2) else "")
        body_lines = lines[i + 1 : end]
        title = ""
        for j, bl in enumerate(body_lines[:3]):
            s = bl.strip()
            if not s:
                continue
            if (s.startswith("(") and len(s) < 160) or (len(s) < 110 and not re.match(r"^(\d|[a-z]\)|É |O |A |Os |As |Para |Sem |Nos |No |Na |Quando |Se )", s) and not s.endswith((".", ";", ":", ",")) and not s[0].islower()):
                title = s.strip("() ")
                body_lines = body_lines[j + 1 :]
            break
        body = flow("\n".join(body_lines)).strip()
        head = f"Artigo {num}.º" + (f" ({title})" if title else "")
        chunks.append((head, body))
    return chunks


def split_plain(text, size=1600):
    paras = flow(text).split("\n")
    chunks, cur = [], ""
    for p in paras:
        if len(cur) + len(p) > size and cur:
            chunks.append(cur)
            cur = ""
        cur = (cur + "\n" + p).strip()
    if cur:
        chunks.append(cur)
    return [(f"Parte {i+1}", c) for i, c in enumerate(chunks)]


def cap(chunks, size=3000):
    out = []
    for head, body in chunks:
        if len(body) <= size:
            out.append((head, body))
            continue
        parts, cur = [], ""
        for p in body.split("\n"):
            if len(cur) + len(p) > size and cur:
                parts.append(cur)
                cur = ""
            cur = (cur + "\n" + p).strip()
        if cur:
            parts.append(cur)
        for n, p in enumerate(parts):
            out.append((head + (f" — parte {n+1}" if len(parts) > 1 else ""), p))
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    docs, chunks = [], []
    report = []
    for doc_id, short, title, area, path, act, url, marker in CATALOG:
        raw = open(os.path.join(BASE, path), encoding="utf-8", errors="ignore").read()
        text = slice_act(raw, act) if act else raw
        if text is None:
            report.append(f"!! {doc_id}: act not found")
            continue
        if marker and marker in text:
            text = text[text.index(marker):]
        if "\nCONSELHO DE MINISTROS" in text[200:]:
            text = text[: 200 + text[200:].index("\nCONSELHO DE MINISTROS")]
        text = clean(text)
        parts = split_articles(text) or split_plain(text)
        parts = cap(parts)
        d = len(docs)
        docs.append({"id": doc_id, "short": short, "title": title, "area": area, "url": url})
        for head, body in parts:
            if len(body) < 15:
                continue
            chunks.append({"d": d, "h": head, "t": body})
        report.append(f"{doc_id}: {len(parts)} chunks, {len(text)} chars")
    # Official web pages (INPS + Ministério das Finanças guide) from the first prototype
    kb = json.load(open("/home/user/claude/djobe/scripts/web_pages.json", encoding="utf-8"))
    for s in kb:
        d = len(docs)
        area = "Segurança social"
        docs.append({"id": "web_" + s["id"].lower(), "short": (s["title"].replace(" — ", " · ")[:70]), "title": s["title"], "area": area, "url": s["url"]})
        for head, body in split_plain(s["text"], 1400):
            chunks.append({"d": d, "h": head, "t": body})
        report.append(f"web {s['id']}: {s['title'][:60]}")
    for i, c in enumerate(chunks):
        c["id"] = "C" + str(i + 1)
    json.dump(docs, open(os.path.join(OUT, "docs.json"), "w", encoding="utf-8"), ensure_ascii=False)
    with open(os.path.join(OUT, "chunks.json"), "w", encoding="utf-8") as f:
        f.write("[\n" + ",\n".join(json.dumps(c, ensure_ascii=False) for c in chunks) + "\n]\n")
    print("\n".join(report))
    print("docs", len(docs), "chunks", len(chunks), "bytes", os.path.getsize(os.path.join(OUT, "chunks.json")))


if __name__ == "__main__":
    main()

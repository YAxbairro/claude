#!/usr/bin/env python3
"""Gera a página de envios (telemóvel) a partir de negocio/envios/semana-*.md.
Uso: python3 negocio/scripts/gerar-pagina.py negocio/envios/semana-2026-11-02.md negocio/envios/pagina.html"""
import re, json, sys, urllib.parse
src, out = sys.argv[1], sys.argv[2]
t = open(src, encoding="utf-8").read()
dias = []
for bloco in re.split(r'(?m)^## ', t)[1:]:
    linhas = bloco.splitlines()
    titulo = linhas[0]
    m = re.search(r'(SEGUNDA|TERÇA|QUARTA|QUINTA|SEXTA)', titulo)
    if not m: continue
    nome_dia = m.group(1).capitalize()
    pessoas = []
    for sec in re.split(r'(?m)^### ', "\n".join(linhas[1:]))[1:]:
        sl = sec.strip().splitlines()
        head = re.sub(r'^(🎵|🏢)\s*', '', sl[0]).strip()
        tipo = "artista" if sl[0].startswith("🎵") else ("marca" if sl[0].startswith("🏢") else "cliente")
        head = re.sub(r'^\[\d+\]\s*', '', head)
        head = re.sub(r'^\d+\.\s*', '', head)
        partes = [p.strip() for p in head.split(" · ")]
        nome = partes[0]
        contacto = partes[-1] if len(partes) >= 3 else ""
        msg, alt = [], ""
        for l in sl[1:]:
            if l.startswith("> Alternativa PT"):
                mm = re.search(r'"(.*)"\s*$', l)
                alt = mm.group(1).replace("'", "’") if mm else ""
            elif l.startswith("> "):
                msg.append(l[2:])
            elif l.strip() and l.strip() != "---":
                msg.append(l)
        handle = re.match(r'^@([\w.]+)$', contacto)
        busca = "https://www.google.com/search?q=" + urllib.parse.quote(nome.split("(")[0].strip() + " instagram")
        if handle:
            link, rotulo = f"https://www.instagram.com/{handle.group(1)}/", "Abrir Instagram"
        elif contacto.startswith("http"):
            link, rotulo = busca, "Procurar Instagram"
        else:
            link, rotulo = (busca, "Procurar Instagram") if tipo != "cliente" else ("", "")
        aviso = ""
        if "confirmar" in contacto or "nao verificado" in contacto:
            aviso = "Confirma primeiro que encontraste a conta certa."
        if tipo == "cliente":
            aviso = "Já tens este contacto no teu telemóvel."
        pessoas.append(dict(nome=nome, tipo=tipo, handle=("@" + handle.group(1)) if handle else "",
                            link=link, rotulo=rotulo, site=contacto if contacto.startswith("http") and "instagram.com" not in contacto else "",
                            msg="\n".join(msg).strip(), alt=alt, aviso=aviso))
    dias.append(dict(dia=nome_dia, pessoas=pessoas))
dados = json.dumps(dias, ensure_ascii=False)
html = open(__file__.replace("gerar-pagina.py", "pagina-modelo.html"), encoding="utf-8").read()
open(out, "w", encoding="utf-8").write(html.replace("/*DADOS*/[]", dados))
print("ok:", sum(len(d["pessoas"]) for d in dias), "pessoas em", len(dias), "dias")

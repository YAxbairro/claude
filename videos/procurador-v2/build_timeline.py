"""Turns script.json (narration lines with measured durations) into timeline.json: line times, word timings, SFX cues, music plan."""
import json, re

lines = json.load(open("script.json", encoding="utf-8"))
GAP = {"l01": .2, "l02": .25, "l03": .6, "l04": .3, "l05": .25, "l06": .45, "l07": .3, "l08": .5,
       "l09": .35, "l10": .45, "l11": .45, "l12": .3, "l13": .7, "l14": 1.6}
KEY = {"26", "crimes.", "Primeiro-Ministro", "narcotráfico", "segurança", "pessoal?", "Nilton", "Moniz.", "Shark", "20",
       "polícia.", "própria", "despacho", "outras", "medidas.", "Moderado.", "alterado", "modelo.", "atentado",
       "ponderosas", "razões", "uma.", "baixou…", "subiu?", "comentários.", "infiltração", "Três", "semanas"}

t = 0.12
for l in lines:
    l["start"] = round(t, 3)
    l["end"] = round(t + l["dur"], 3)
    words = l["cap"].split()
    weights = [max(2, len(re.sub(r"[^\wÀ-ú]", "", w))) + (2 if re.search(r"[.,?…:]$", w) else 0) for w in words]
    tot = sum(weights); acc = 0; out = []
    for w, wt in zip(words, weights):
        a = l["start"] + l["dur"] * acc / tot; acc += wt; b = l["start"] + l["dur"] * acc / tot
        out.append({"w": w, "t0": round(a, 3), "t1": round(b, 3), "key": w in KEY})
    l["words"] = out
    t = l["end"] + GAP[l["id"]]
TOTAL = round(t, 2)
L = {l["id"]: l for l in lines}


def wt(lid, word):
    for w in L[lid]["words"]:
        if w["w"].lower().startswith(word.lower()): return w["t0"]
    raise KeyError(word)


sfx = []
def cue(name, at, gain=1.0): sfx.append({"s": name, "t": round(max(0, at), 3), "g": gain})

cue("boom", 0.0, 1.0); cue("glitch", 0.0, 0.6)
cue("pop", wt("l01", "26"), 0.6)
cue("whoosh_up", L["l02"]["start"] - 0.3, 0.7); cue("stamp", wt("l02", "narcotráfico"), 0.9)
cue("glitch", L["l03"]["start"], 0.7); cue("riser", L["l03"]["end"] - 2.4, 0.6); cue("boom", L["l03"]["end"] + 0.05, 1.0)
cue("whoosh_down", L["l04"]["start"] - 0.25, 0.7); cue("shutter", wt("l04", "Nilton"), 0.9); cue("typewriter", wt("l04", "Nilton") + 0.05, 0.6)
cue("whoosh_up", L["l05"]["start"] - 0.25, 0.6); cue("stamp", wt("l05", "Shark"), 0.7)
for i in range(20): cue("tick", wt("l05", "prendeu") + i * 0.075, 0.55)
cue("whoosh_down", L["l06"]["start"] - 0.25, 0.6)
for w in ("alfândega", "prisões", "saúde"): cue("pop", wt("l06", w), 0.5)
cue("stamp", wt("l06", "polícia"), 1.0); cue("boom", wt("l06", "polícia"), 0.55)
cue("whoosh_up", L["l07"]["start"] - 0.25, 0.6); cue("pop", wt("l07", "Três"), 0.5); cue("stamp", wt("l07", "substitui"), 1.0)
cue("riser", L["l08"]["start"] - 0.4, 0.45); cue("glitch", wt("l08", "Moderado"), 0.5); cue("pop", wt("l08", "Moderado"), 0.7)
cue("whoosh_down", L["l09"]["start"] - 0.25, 0.6); cue("pop", wt("l09", "alterado"), 0.5)
cue("whoosh_up", L["l10"]["start"] - 0.25, 0.6); cue("boom", wt("l10", "atentado"), 0.5)
cue("whoosh_down", L["l11"]["start"] - 0.25, 0.6); cue("shutter", wt("l11", "ponderosas"), 0.6)
cue("glitch", L["l12"]["start"] - 0.1, 0.6); cue("riser", L["l13"]["start"] - 2.5, 0.75)
cue("pop", wt("l13", "baixou"), 0.6); cue("boom", wt("l13", "subiu"), 1.0)
cue("whoosh_up", L["l14"]["start"] - 0.2, 0.6); cue("pop", L["l14"]["start"] + 0.1, 0.6)

sections = [(0, L["l03"]["end"] + 0.05, 0.95), (L["l03"]["end"] + 0.05, L["l05"]["start"], 0.3),
            (L["l05"]["start"], L["l09"]["start"], 0.65), (L["l09"]["start"], L["l12"]["start"] - 0.1, 0.5),
            (L["l12"]["start"] - 0.1, L["l13"]["start"], 0.0), (L["l13"]["start"], TOTAL, 0.95)]

json.dump({"total": TOTAL, "lines": lines, "sfx": sorted(sfx, key=lambda c: c["t"])}, open("timeline.json", "w"), ensure_ascii=False, indent=1)
json.dump({"total": TOTAL, "sections": sections}, open("music_spec.json", "w"))
print("total", TOTAL, "cues", len(sfx))

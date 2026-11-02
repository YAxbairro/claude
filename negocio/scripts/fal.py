#!/usr/bin/env python3
"""Cliente mínimo da fal.ai. A chave vem SEMPRE da variável FAL_KEY (nunca guardar no repo).
Uso como módulo: from fal import run;  run(endpoint, payload, saida, custo_estimado, nota)
Regista cada geração em negocio/clientes/<projeto>/producao/custos.csv se passado `log`."""
import os, json, urllib.request, csv, datetime
def run(endpoint, payload, out_path=None, cost=0.0, note="", log=None):
    key = os.environ["FAL_KEY"]
    req = urllib.request.Request(f"https://fal.run/{endpoint}", data=json.dumps(payload).encode(),
                                 headers={"Authorization": f"Key {key}", "Content-Type": "application/json"})
    try:
        r = json.load(urllib.request.urlopen(req, timeout=600))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"{endpoint}: {e.code} {e.read().decode()[:400]}")
    url = (r.get("images") or [{}])[0].get("url") or (r.get("video") or {}).get("url")
    if out_path and url:
        urllib.request.urlretrieve(url, out_path)
    if log:
        new = not os.path.exists(log)
        with open(log, "a", newline="") as f:
            w = csv.writer(f)
            if new: w.writerow(["data", "endpoint", "ficheiro", "custo_usd", "nota"])
            w.writerow([datetime.datetime.now().isoformat(timespec="minutes"), endpoint, out_path, cost, note])
    return url, r

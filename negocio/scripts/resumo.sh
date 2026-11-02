#!/usr/bin/env bash
# Resumo rápido do negócio: dinheiro vs metas, funil e follow-ups atrasados.
cd "$(dirname "$0")/.." || exit 0
hoje=$(date +%F)
python3 - "$hoje" <<'PY'
import csv, sys, collections
hoje = sys.argv[1]
try:
    pag = list(csv.DictReader(open("crm/pagamentos.csv")))
except FileNotFoundError:
    pag = []
total = sum(float(p["valor_eur"] or 0) for p in pag)
print(f"💰 Recebido: {total:.0f} €")
for nome, meta in [("15 nov", 1000), ("fev", 10000), ("dez 2027", 50000)]:
    print(f"   • Meta {nome}: {meta} € → {100*total/meta:.0f}%")
try:
    leads = list(csv.DictReader(open("crm/leads.csv")))
except FileNotFoundError:
    leads = []
c = collections.Counter(l["estado"] for l in leads)
print(f"📇 Leads: {len(leads)} · " + " · ".join(f"{k}: {v}" for k, v in c.items()))
atras = [l for l in leads if l.get("data_proximo") and l["data_proximo"] <= hoje and l["estado"] not in ("perdido", "pago-100", "referencias")]
if atras:
    print("⏰ Para hoje/atrasados:")
    for l in atras[:10]:
        print(f"   • [{l['id']}] {l['nome']}: {l['proximo_passo']} ({l['data_proximo']})")
PY

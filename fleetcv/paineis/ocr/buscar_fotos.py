"""Descarrega as fotografias de quadrantes (conjuntos públicos do Hugging
Face) para ocr/fotos/, com o número verdadeiro de cada uma em meta.json.
Precisa de:  pip install pyarrow   (as fotografias não vão para o GitHub)"""
import json, os, urllib.request
import pyarrow.parquet as pq
FONTES = [
  ('hendry64/odometer', 'default/train/0000.parquet', 'h'),
  ('hendry64/odometer', 'default/validation/0000.parquet', 'hv'),
  ('ebalseca/odometer-recognition', 'default/train/0000.parquet', 'e'),
]
os.makedirs('fotos', exist_ok=True)
meta = []
for repo, ficheiro, pre in FONTES:
    url = f'https://huggingface.co/datasets/{repo}/resolve/refs%2Fconvert%2Fparquet/{ficheiro}'
    local = pre + '.parquet'
    if not os.path.exists(local):
        urllib.request.urlretrieve(url, local)
    for i, r in enumerate(pq.read_table(local).to_pylist()):
        b = (r['image'] or {}).get('bytes')
        if not b: continue
        nome = f'{pre}{i:02d}' + ('.png' if b[:4] == b'\x89PNG' else '.jpg')
        open('fotos/' + nome, 'wb').write(b)
        a = r.get('answer') or r.get('answers')
        meta.append({'f': nome, 'a': a})
json.dump(meta, open('meta.json', 'w'), ensure_ascii=False)
print(len(meta), 'fotografias')

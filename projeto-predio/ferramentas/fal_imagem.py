#!/usr/bin/env python3
"""Gera ou edita imagens com fal.ai para o projeto BRAVA.

Uso:
  # editar um render existente (mantém a arquitetura)
  python3 fal_imagem.py --img assets/renders-originais/fachada-02-esquina-entrada.jpg \
      --prompt "..." --out assets/gerado/hero.jpg

  # gerar do zero
  python3 fal_imagem.py --prompt "..." --out assets/gerado/teaser.jpg --ratio 4:5

Chave: variável FAL_KEY (num ambiente com proxy pode ser qualquer valor).
"""
import argparse, base64, json, mimetypes, os, sys, urllib.request

EDIT_MODEL = "fal-ai/nano-banana-pro/edit"
GEN_MODEL = "fal-ai/nano-banana-pro"


def data_uri(path):
    mime = mimetypes.guess_type(path)[0] or "image/jpeg"
    with open(path, "rb") as f:
        return f"data:{mime};base64," + base64.b64encode(f.read()).decode()


def call(model, payload):
    req = urllib.request.Request(
        f"https://fal.run/{model}",
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": "Key " + os.environ.get("FAL_KEY", "proxy"),
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.loads(r.read())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--prompt", required=True)
    ap.add_argument("--img", action="append", default=[], help="imagem(ns) de referência")
    ap.add_argument("--out", required=True)
    ap.add_argument("--ratio", default=None, help="ex.: 16:9, 4:5, 9:16, 1:1")
    ap.add_argument("--res", default="2K", help="1K, 2K ou 4K")
    ap.add_argument("--model", default=None)
    a = ap.parse_args()

    payload = {"prompt": a.prompt, "num_images": 1, "output_format": "jpeg", "resolution": a.res}
    if a.ratio:
        payload["aspect_ratio"] = a.ratio
    if a.img:
        payload["image_urls"] = [data_uri(p) for p in a.img]
        model = a.model or EDIT_MODEL
    else:
        model = a.model or GEN_MODEL

    res = call(model, payload)
    try:
        url = res["images"][0]["url"]
    except (KeyError, IndexError):
        print(json.dumps(res)[:2000], file=sys.stderr)
        sys.exit(1)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    urllib.request.urlretrieve(url, a.out)
    print(a.out)


if __name__ == "__main__":
    main()

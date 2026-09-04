"""
Geração de flyers com modelo de imagem (GPT Image).

O subagente de design escreve o briefing; aqui só se transforma em ficheiro.
"""

import base64
import os
import time

import requests

from imoauto import config, store

ENDPOINT = "https://api.openai.com/v1/images/generations"


def gerar_flyer(prompt, tamanho="1024x1536", nome=""):
    """
    Gera o flyer e devolve o caminho local do PNG.
    Formato vertical por omissão — é o que serve para stories e feed.
    """
    nome = nome or f"flyer_{int(time.time())}"
    destino = os.path.join(config.PASTA_MEDIA, f"{nome}.png")

    if config.DRY_RUN or not config.OPENAI_API_KEY:
        store.registar("imagens", "dry_run_flyer", prompt[:400])
        print(f"[DRY_RUN flyer] {destino}\nprompt: {prompt[:300]}")
        return destino

    resposta = requests.post(
        ENDPOINT,
        headers={"Authorization": f"Bearer {config.OPENAI_API_KEY}"},
        json={"model": config.MODELO_IMAGEM, "prompt": prompt,
              "size": tamanho, "n": 1},
        timeout=180,
    )
    corpo = resposta.json()
    if resposta.status_code >= 400:
        raise RuntimeError(f"Geração de imagem: {corpo}")

    dados = corpo["data"][0]
    if dados.get("b64_json"):
        conteudo = base64.b64decode(dados["b64_json"])
    else:
        conteudo = requests.get(dados["url"], timeout=120).content

    with open(destino, "wb") as ficheiro:
        ficheiro.write(conteudo)
    store.registar("imagens", "flyer_criado", destino)
    return destino

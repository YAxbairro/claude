"""
Cliente da API de administração do ImoAuto.

Aqui o robô tem a chave de casa: cria e atualiza listagens, envia fotos e
lê os pedidos de interesse. Os caminhos abaixo assumem uma REST comum
(/api/admin/...) — se o teu site usar outros, muda só as constantes.
"""

import os

import requests

from imoauto import config, store

CAMINHO_LISTAGENS = "/api/admin/listings"
CAMINHO_MEDIA = "/api/admin/media"
CAMINHO_INTERESSES = "/api/admin/leads"


def _cabecalhos():
    return {"Authorization": f"Bearer {config.SITE_API_TOKEN}",
            "Accept": "application/json"}


def criar_listagem(dados):
    """
    Cria a publicação no site. `dados` é o dicionário produzido pelo
    subagente de conteúdo (título, descrição, preço, tipologia, fotos...).
    """
    if config.DRY_RUN or not config.SITE_API_TOKEN:
        store.registar("site", "dry_run_listagem", str(dados)[:500])
        print(f"[DRY_RUN site] criar listagem: {dados.get('titulo')}")
        return {"dry_run": True, "id": "listagem_dry",
                "url": f"{config.SITE_BASE_URL}/imovel/rascunho"}

    resposta = requests.post(
        config.SITE_BASE_URL + CAMINHO_LISTAGENS,
        headers=_cabecalhos(), json=dados, timeout=60,
    )
    if resposta.status_code >= 400:
        raise RuntimeError(f"Site: {resposta.status_code} {resposta.text[:300]}")
    return resposta.json()


def enviar_foto(caminho_ficheiro):
    """Sobe uma foto e devolve o URL público (necessário para o Instagram)."""
    if config.DRY_RUN or not config.SITE_API_TOKEN:
        nome = os.path.basename(caminho_ficheiro)
        return {"dry_run": True, "url": f"{config.SITE_BASE_URL}/media/{nome}"}

    with open(caminho_ficheiro, "rb") as ficheiro:
        resposta = requests.post(
            config.SITE_BASE_URL + CAMINHO_MEDIA,
            headers=_cabecalhos(),
            files={"file": (os.path.basename(caminho_ficheiro), ficheiro)},
            timeout=120,
        )
    if resposta.status_code >= 400:
        raise RuntimeError(f"Site (media): {resposta.status_code} {resposta.text[:300]}")
    return resposta.json()


def interesses_novos(desde=None):
    """Pedidos de contacto recebidos no site, para avisar o proprietário."""
    if config.DRY_RUN or not config.SITE_API_TOKEN:
        return []
    resposta = requests.get(
        config.SITE_BASE_URL + CAMINHO_INTERESSES,
        headers=_cabecalhos(), params={"since": desde} if desde else None,
        timeout=30,
    )
    resposta.raise_for_status()
    return resposta.json().get("data", [])

"""
Publicação em Facebook Page e Instagram Business via Graph API oficial.

É o caminho legítimo: contas Business, tokens de página, sem automação de
browser. O mesmo que as ferramentas de agendamento usam.
"""

import time

import requests

from imoauto import config, store

GRAPH = "https://graph.facebook.com/{versao}/{caminho}"


def _url(caminho):
    return GRAPH.format(versao=config.GRAPH_VERSION, caminho=caminho)


def _post(caminho, dados):
    resposta = requests.post(_url(caminho), data=dados, timeout=60)
    corpo = resposta.json()
    if resposta.status_code >= 400:
        store.registar("meta", "erro", str(corpo)[:500])
        raise RuntimeError(f"Graph API: {corpo}")
    return corpo


def publicar_facebook(legenda, url_imagem=""):
    """Publica na Página. Com imagem usa /photos, sem imagem usa /feed."""
    if config.DRY_RUN:
        store.registar("meta", "dry_run_facebook", legenda[:400])
        print(f"[DRY_RUN facebook]\n{legenda}\nimagem: {url_imagem}")
        return {"dry_run": True, "id": "fb_dry"}

    if url_imagem:
        return _post(f"{config.FACEBOOK_PAGE_ID}/photos", {
            "url": url_imagem,
            "caption": legenda,
            "access_token": config.META_TOKEN,
        })
    return _post(f"{config.FACEBOOK_PAGE_ID}/feed", {
        "message": legenda,
        "access_token": config.META_TOKEN,
    })


def publicar_instagram(legenda, url_imagem, esperar=True):
    """
    Instagram é em dois passos: criar o contentor de media e depois
    publicá-lo. A imagem tem de estar acessível num URL público.
    """
    if config.DRY_RUN:
        store.registar("meta", "dry_run_instagram", legenda[:400])
        print(f"[DRY_RUN instagram]\n{legenda}\nimagem: {url_imagem}")
        return {"dry_run": True, "id": "ig_dry"}

    contentor = _post(f"{config.INSTAGRAM_USER_ID}/media", {
        "image_url": url_imagem,
        "caption": legenda,
        "access_token": config.META_TOKEN,
    })
    criacao = contentor["id"]

    if esperar:
        for _ in range(15):
            estado = requests.get(
                _url(criacao),
                params={"fields": "status_code", "access_token": config.META_TOKEN},
                timeout=30,
            ).json()
            if estado.get("status_code") == "FINISHED":
                break
            if estado.get("status_code") == "ERROR":
                raise RuntimeError(f"Instagram falhou a processar a media: {estado}")
            time.sleep(3)

    return _post(f"{config.INSTAGRAM_USER_ID}/media_publish", {
        "creation_id": criacao,
        "access_token": config.META_TOKEN,
    })


def comentarios_recentes(post_id, limite=25):
    """Lê comentários de um post — base para o subagente de vendas responder."""
    resposta = requests.get(
        _url(f"{post_id}/comments"),
        params={"limit": limite, "access_token": config.META_TOKEN,
                "fields": "id,message,from,created_time"},
        timeout=30,
    ).json()
    return resposta.get("data", [])


def responder_comentario(comentario_id, texto):
    """Responder a quem comentou é permitido — a pessoa já interagiu."""
    if config.DRY_RUN:
        store.registar("meta", "dry_run_comentario", f"{comentario_id}: {texto[:200]}")
        return {"dry_run": True}
    return _post(f"{comentario_id}/comments", {
        "message": texto,
        "access_token": config.META_TOKEN,
    })

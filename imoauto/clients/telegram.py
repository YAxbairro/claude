"""
Cliente do Telegram — o canal interno entre o robô e ti.

Sem restrições de políticas: é aqui que os subagentes te entregam leads,
rascunhos de posts e pedidos de aprovação.
"""

import json

import requests

from imoauto import config, store

BASE = "https://api.telegram.org/bot{token}/{metodo}"


def configurado():
    return bool(config.TELEGRAM_TOKEN and config.TELEGRAM_CHAT_ID)


def _chamar(metodo, **dados):
    url = BASE.format(token=config.TELEGRAM_TOKEN, metodo=metodo)
    resposta = requests.post(url, json=dados, timeout=30)
    corpo = resposta.json()
    if not corpo.get("ok"):
        raise RuntimeError(f"Telegram {metodo}: {corpo.get('description')}")
    return corpo["result"]


def enviar(texto, botoes=None, chat_id=None):
    """Envia texto (Markdown) com botões inline opcionais."""
    chat = chat_id or config.TELEGRAM_CHAT_ID
    if not configurado():
        # Sem Telegram o robô continua a trabalhar — vê-se tudo no painel.
        store.registar("telegram", "sem_configuracao", "envio ignorado")
        return {"sem_telegram": True}
    if config.DRY_RUN:
        store.registar("telegram", "dry_run_enviar", texto[:500])
        print(f"[DRY_RUN telegram] {texto}")
        return {"dry_run": True}
    dados = {"chat_id": chat, "text": texto, "parse_mode": "Markdown",
             "disable_web_page_preview": False}
    if botoes:
        dados["reply_markup"] = {"inline_keyboard": botoes}
    return _chamar("sendMessage", **dados)


def enviar_foto(url_imagem, legenda="", botoes=None, chat_id=None):
    chat = chat_id or config.TELEGRAM_CHAT_ID
    if not configurado():
        # Sem Telegram o robô continua a trabalhar — vê-se tudo no painel.
        store.registar("telegram", "sem_configuracao", "envio ignorado")
        return {"sem_telegram": True}
    if config.DRY_RUN:
        store.registar("telegram", "dry_run_foto", f"{url_imagem} | {legenda[:300]}")
        print(f"[DRY_RUN telegram foto] {url_imagem}\n{legenda}")
        return {"dry_run": True}
    dados = {"chat_id": chat, "photo": url_imagem, "caption": legenda[:1024],
             "parse_mode": "Markdown"}
    if botoes:
        dados["reply_markup"] = {"inline_keyboard": botoes}
    return _chamar("sendPhoto", **dados)


def responder_callback(callback_id, texto=""):
    if config.DRY_RUN or not configurado():
        return {"dry_run": True}
    return _chamar("answerCallbackQuery", callback_query_id=callback_id, text=texto)


def obter_atualizacoes(offset=None, timeout=25):
    """Long polling. Devolve a lista de updates novos."""
    dados = {"timeout": timeout, "allowed_updates": ["message", "callback_query"]}
    if offset is not None:
        dados["offset"] = offset
    url = BASE.format(token=config.TELEGRAM_TOKEN, metodo="getUpdates")
    resposta = requests.post(url, json=dados, timeout=timeout + 10)
    corpo = resposta.json()
    if not corpo.get("ok"):
        raise RuntimeError(f"Telegram getUpdates: {corpo.get('description')}")
    return corpo["result"]


def botao(texto, dados):
    return {"text": texto, "callback_data": json.dumps(dados, separators=(",", ":"))}


def botao_url(texto, url):
    return {"text": texto, "url": url}

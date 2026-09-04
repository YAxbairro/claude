"""
Cliente da WhatsApp Cloud API.

Funciona com Coexistence: o mesmo número que usas na app WhatsApp Business
fica ligado à API. Tu escreves a primeira mensagem na app; o robô continua
a conversa por aqui.

Nenhum envio passa por este módulo sem antes ser aprovado pela camada de
conformidade.
"""

import requests

from imoauto import compliance, config, store

BASE = "https://graph.facebook.com/{versao}/{id}/messages"


def _url():
    return BASE.format(versao=config.GRAPH_VERSION, id=config.WHATSAPP_PHONE_ID)


def _publicar(payload, telefone, texto_registo):
    if config.DRY_RUN:
        store.registar("whatsapp", "dry_run_enviar", f"{telefone}: {texto_registo[:400]}")
        print(f"[DRY_RUN whatsapp -> {telefone}] {texto_registo}")
        store.guardar_mensagem(telefone, "saida", texto_registo)
        return {"dry_run": True}

    resposta = requests.post(
        _url(),
        headers={"Authorization": f"Bearer {config.WHATSAPP_TOKEN}"},
        json=payload,
        timeout=30,
    )
    corpo = resposta.json()
    if resposta.status_code >= 400:
        store.registar("whatsapp", "erro", str(corpo)[:500])
        raise RuntimeError(f"WhatsApp: {corpo}")
    store.guardar_mensagem(telefone, "saida", texto_registo)
    return corpo


def enviar_texto(telefone, texto):
    """Resposta livre — só dentro da janela de 24h."""
    compliance.exigir_permissao(telefone)
    payload = {
        "messaging_product": "whatsapp",
        "to": store.so_digitos(telefone),
        "type": "text",
        "text": {"preview_url": True, "body": texto},
    }
    return _publicar(payload, telefone, texto)


def enviar_template(telefone, nome_template, variaveis=None, idioma="pt_PT"):
    """
    Notificação de serviço fora da janela de 24h (ex.: avisar o proprietário
    de que alguém mostrou interesse). Exige template aprovado pela Meta.
    """
    compliance.exigir_permissao(telefone, e_notificacao_servico=True,
                                e_template=True)
    componentes = []
    if variaveis:
        componentes = [{
            "type": "body",
            "parameters": [{"type": "text", "text": str(v)} for v in variaveis],
        }]
    payload = {
        "messaging_product": "whatsapp",
        "to": store.so_digitos(telefone),
        "type": "template",
        "template": {
            "name": nome_template,
            "language": {"code": idioma},
            "components": componentes,
        },
    }
    return _publicar(payload, telefone, f"[template:{nome_template}] {variaveis}")


def descarregar_media(media_id, destino):
    """
    Descarrega uma foto que o proprietário enviou. Duas chamadas: primeiro
    pedir o URL temporário, depois buscar o ficheiro.
    """
    cabecalho = {"Authorization": f"Bearer {config.WHATSAPP_TOKEN}"}
    meta = requests.get(
        f"https://graph.facebook.com/{config.GRAPH_VERSION}/{media_id}",
        headers=cabecalho, timeout=30,
    ).json()
    url = meta.get("url")
    if not url:
        raise RuntimeError(f"Media sem URL: {meta}")
    binario = requests.get(url, headers=cabecalho, timeout=60)
    binario.raise_for_status()
    with open(destino, "wb") as ficheiro:
        ficheiro.write(binario.content)
    return destino


def extrair_mensagens(corpo_webhook):
    """Normaliza o payload do webhook numa lista simples de mensagens."""
    resultado = []
    for entrada in corpo_webhook.get("entry", []):
        for alteracao in entrada.get("changes", []):
            valor = alteracao.get("value", {})
            for msg in valor.get("messages", []):
                item = {
                    "telefone": msg.get("from", ""),
                    "tipo": msg.get("type"),
                    "id": msg.get("id"),
                    "texto": "",
                    "media_id": "",
                }
                if msg.get("type") == "text":
                    item["texto"] = msg["text"]["body"]
                elif msg.get("type") in ("image", "video", "document"):
                    bloco = msg[msg["type"]]
                    item["media_id"] = bloco.get("id", "")
                    item["texto"] = bloco.get("caption", "")
                resultado.append(item)
    return resultado

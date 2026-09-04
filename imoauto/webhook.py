"""
Servidor de webhooks.

Duas portas de entrada:
  /webhook/whatsapp  mensagens dos proprietários (Meta Cloud API)
  /webhook/site      eventos do ImoAuto (alguém mostrou interesse)

Precisa de estar acessível por HTTPS público. Em testes, um túnel
(ngrok/cloudflared) chega.
"""

from flask import Flask, request

from imoauto import config, store
from imoauto.clients import whatsapp
from imoauto.orquestrador import Orquestrador

app = Flask(__name__)
robo = Orquestrador()


@app.get("/webhook/whatsapp")
def verificar():
    """Handshake de verificação da Meta."""
    if request.args.get("hub.verify_token") == config.WHATSAPP_VERIFY_TOKEN:
        return request.args.get("hub.challenge", ""), 200
    return "token inválido", 403


@app.post("/webhook/whatsapp")
def receber_whatsapp():
    corpo = request.get_json(silent=True) or {}
    for mensagem in whatsapp.extrair_mensagens(corpo):
        try:
            robo.mensagem_whatsapp(
                mensagem["telefone"], mensagem["texto"], mensagem["media_id"]
            )
        except Exception as erro:
            store.registar("webhook", "erro_whatsapp", str(erro))
    return "", 200


@app.post("/webhook/site")
def receber_site():
    """
    O site avisa que alguém mostrou interesse num anúncio.
    Espera: {"listagem": {...}, "interessado": {...},
             "telefone_proprietario": "+351..."}
    """
    corpo = request.get_json(silent=True) or {}
    if corpo.get("token") != config.WHATSAPP_VERIFY_TOKEN:
        return "não autorizado", 403
    try:
        enviado = robo.interesse_no_anuncio(
            corpo.get("listagem", {}),
            corpo.get("interessado", {}),
            corpo.get("telefone_proprietario", ""),
        )
        return {"avisado": enviado}, 200
    except Exception as erro:
        store.registar("webhook", "erro_site", str(erro))
        return {"erro": str(erro)}, 500


@app.get("/saude")
def saude():
    essenciais, opcionais = config.em_falta()
    return {"ok": True, "modo": "simulacao" if config.DRY_RUN else "ao_vivo",
            "em_falta": essenciais, "opcionais_em_falta": opcionais}


def correr(porta=8080):
    store.iniciar()
    app.run(host="0.0.0.0", port=porta)


if __name__ == "__main__":
    correr()

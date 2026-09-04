"""
Bot do Telegram — a tua consola.

Corre em long polling (sem servidor, sem domínio, sem certificados).
Comandos:
  /leads          leads por contactar, ordenados por nota
  /estado         estado do sistema e configurações em falta
  /lead <texto>   cola aqui o texto de um anúncio e ele qualifica-o
  /publicar <id>  força a publicação de um rascunho
"""

import json
import time

from imoauto import config, store
from imoauto.clients import telegram
from imoauto.orquestrador import Orquestrador


def _formatar_leads(leads):
    if not leads:
        return "Sem leads por contactar."
    linhas = []
    for lead in leads:
        linhas.append(
            f"`#{lead['id']}` *{lead['nota']}* · {lead['titulo'] or '—'}\n"
            f"   {lead['preco'] or '—'} · {lead['localidade'] or '—'} · "
            f"[link]({lead['url']})"
        )
    return "*Leads por contactar*\n\n" + "\n".join(linhas)


def tratar_comando(robo, texto, chat_id):
    comando, _, argumento = texto.partition(" ")
    comando = comando.lower().lstrip("/")

    if comando in ("start", "ajuda", "help"):
        return (
            f"*{config.MARCA}* — robô de operações\n\n"
            "/leads — leads por contactar\n"
            "/lead <texto do anúncio> — qualifica um anúncio\n"
            "/estado — estado do sistema\n"
            "/publicar <id> — publica um rascunho aprovado"
        )

    if comando == "leads":
        return _formatar_leads(store.listar_leads(store.ENVIADO))

    if comando == "estado":
        essenciais, opcionais = config.em_falta()
        modo = "SIMULAÇÃO (nada sai para o mundo)" if config.DRY_RUN else "AO VIVO"
        return (
            f"*Modo:* {modo}\n"
            f"*Aprovação manual de posts:* "
            f"{'sim' if config.APROVACAO_MANUAL_POSTS else 'não'}\n"
            f"*Leads:* {len(store.listar_leads(limite=999))}\n"
            f"*Em falta (essencial):* {', '.join(essenciais) or 'nada'}\n"
            f"*Em falta (opcional):* {', '.join(opcionais) or 'nada'}"
        )

    if comando == "lead":
        if not argumento.strip():
            return "Cola o texto do anúncio a seguir ao comando."
        lead = robo.novo_anuncio(argumento, "manual", f"manual://{time.time()}")
        return f"Lead `#{lead['id']}` qualificado: {lead['nota']}/100."

    if comando == "publicar":
        try:
            robo.publicador.aprovar(int(argumento.strip()))
            return "Publicado."
        except (ValueError, PermissionError) as erro:
            return f"Não deu: {erro}"

    return "Comando desconhecido. /ajuda"


def tratar_callback(robo, callback):
    dados = json.loads(callback["data"])
    resposta = robo.acao_telegram(dados["a"], dados["id"])
    telegram.responder_callback(callback["id"], resposta[:190])
    telegram.enviar(resposta, chat_id=callback["message"]["chat"]["id"])


def correr():
    robo = Orquestrador()
    essenciais, _ = config.em_falta()
    if essenciais:
        raise SystemExit(f"Configura primeiro: {', '.join(essenciais)}")

    print(f"[{config.MARCA}] bot a correr "
          f"({'simulação' if config.DRY_RUN else 'AO VIVO'}). Ctrl+C para parar.")
    offset = None
    while True:
        try:
            for update in telegram.obter_atualizacoes(offset):
                offset = update["update_id"] + 1
                if "callback_query" in update:
                    tratar_callback(robo, update["callback_query"])
                    continue
                mensagem = update.get("message", {})
                texto = mensagem.get("text", "")
                chat_id = mensagem.get("chat", {}).get("id")
                if not texto or not chat_id:
                    continue
                if str(chat_id) != str(config.TELEGRAM_CHAT_ID):
                    store.registar("bot", "chat_nao_autorizado", str(chat_id))
                    continue
                telegram.enviar(tratar_comando(robo, texto, chat_id), chat_id=chat_id)
        except KeyboardInterrupt:
            print("\nParado.")
            return
        except Exception as erro:
            store.registar("bot", "erro", str(erro))
            print(f"[erro] {erro}")
            time.sleep(5)


if __name__ == "__main__":
    correr()

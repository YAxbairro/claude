"""
Entrada por linha de comandos.

  python -m imoauto.cli painel     # painel web no browser
  python -m imoauto.cli bot        # consola do Telegram (long polling)
  python -m imoauto.cli webhook    # servidor de webhooks
  python -m imoauto.cli diagnostico
  python -m imoauto.cli lead "texto do anúncio" --rede facebook --url ...
"""

import argparse
import sys

from imoauto import config, store


def diagnostico():
    essenciais, opcionais = config.em_falta()
    store.iniciar()
    print(f"ImoAuto — modo {'SIMULAÇÃO' if config.DRY_RUN else 'AO VIVO'}")
    print(f"Base de dados: {config.BASE_DADOS}")
    print(f"Media: {config.PASTA_MEDIA}")
    print(f"Site: {config.SITE_BASE_URL}")
    print()
    print("Essenciais em falta:", ", ".join(essenciais) or "nenhum")
    print("Opcionais em falta:", ", ".join(opcionais) or "nenhum")
    print()
    for estado in (store.DESCOBERTO, store.ENVIADO, store.CONTACTADO,
                   store.RESPONDEU, store.A_NEGOCIAR, store.PUBLICADO):
        print(f"  {estado:14} {len(store.listar_leads(estado, 999))}")
    return 0 if not essenciais else 1


def main(argv=None):
    parser = argparse.ArgumentParser(prog="imoauto")
    sub = parser.add_subparsers(dest="comando", required=True)

    p_painel = sub.add_parser("painel", help="painel web no browser")
    p_painel.add_argument("--porta", type=int, default=5000)

    sub.add_parser("bot", help="consola do Telegram")

    p_webhook = sub.add_parser("webhook", help="servidor de webhooks")
    p_webhook.add_argument("--porta", type=int, default=8080)

    sub.add_parser("diagnostico", help="estado da configuração")

    p_lead = sub.add_parser("lead", help="qualifica um anúncio")
    p_lead.add_argument("texto")
    p_lead.add_argument("--rede", default="manual")
    p_lead.add_argument("--url", default="")

    args = parser.parse_args(argv)

    if args.comando == "diagnostico":
        return diagnostico()

    if args.comando == "painel":
        from imoauto import painel
        painel.correr(args.porta)
        return 0

    if args.comando == "bot":
        from imoauto import bot
        bot.correr()
        return 0

    if args.comando == "webhook":
        from imoauto import webhook
        webhook.correr(args.porta)
        return 0

    if args.comando == "lead":
        from imoauto.orquestrador import Orquestrador
        lead = Orquestrador().novo_anuncio(
            args.texto, args.rede, args.url or f"manual://{hash(args.texto)}"
        )
        print(f"Lead #{lead['id']} — {lead['nota']}/100 — {lead['motivo']}")
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())

"""
Camada de conformidade — o guarda do sistema.

Regra única e inegociável: o robô nunca inicia conversa com um
desconhecido. A primeira mensagem a um anunciante é sempre enviada por ti,
a partir da app. Só depois da resposta é que o robô assume.

Isto não é burocracia: é o que protege a conta Business do ImoAuto de ser
banida, que é o ativo de marketing mais caro que existe aqui.
"""

import time

from imoauto import store

JANELA_SERVICO = 24 * 60 * 60  # janela de 24h da Meta para resposta livre


class BloqueioConformidade(Exception):
    """Levantada quando uma ação violaria as políticas da Meta."""


def pode_enviar_whatsapp(telefone, e_notificacao_servico=False):
    """
    Decide se o robô pode enviar uma mensagem a este número.

    Devolve (permitido, motivo). Três casos:
      1. Nunca houve conversa      -> NÃO. Tens de escrever tu primeiro.
      2. Conversa aberta há < 24h  -> SIM, texto livre.
      3. Conversa antiga (> 24h)   -> só com template aprovado
                                      (notificação de serviço a quem já é
                                      utilizador do ImoAuto).
    """
    if not store.houve_contacto_humano(telefone):
        return False, (
            "Sem conversa aberta com este número. A primeira mensagem tem de "
            "ser enviada por ti a partir da app — contacto frio automatizado "
            "viola as políticas da Meta."
        )

    ultima = store.ultima_mensagem_recebida(telefone)
    if ultima and (time.time() - ultima) < JANELA_SERVICO:
        return True, "Janela de 24h aberta: resposta livre permitida."

    if e_notificacao_servico:
        return True, (
            "Fora da janela de 24h: enviar apenas como template aprovado "
            "(notificação de serviço a utilizador do ImoAuto)."
        )

    return False, (
        "Fora da janela de 24h e sem template aprovado. Aguarda nova "
        "mensagem da pessoa ou usa um template de notificação."
    )


def exigir_permissao(telefone, e_notificacao_servico=False):
    permitido, motivo = pode_enviar_whatsapp(telefone, e_notificacao_servico)
    if not permitido:
        store.registar("conformidade", "bloqueio", f"{telefone}: {motivo}")
        raise BloqueioConformidade(motivo)
    return motivo


def rotular_lead(lead):
    """
    O que é permitido fazer com um lead recolhido de uma rede social.

    Ler dados públicos e organizá-los é legítimo. O que não se faz:
    contactar automaticamente, nem reutilizar fotos de terceiros sem
    autorização explícita do dono.
    """
    return {
        "pode_listar": True,
        "pode_pontuar": True,
        "pode_contactar_automaticamente": False,
        "pode_usar_fotos": bool(lead.get("fotos_autorizadas")),
        "acao_seguinte": "Enviar para o Telegram e aguardar o teu envio manual.",
    }

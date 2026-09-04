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


def pode_enviar_whatsapp(telefone, e_notificacao_servico=False, e_template=False):
    """
    Decide se o robô pode enviar uma mensagem a este número.

    Devolve (permitido, motivo). Os casos:
      1. Nunca houve conversa nem consentimento -> NÃO. Falas tu primeiro.
      2. Sem conversa mas COM consentimento     -> só template aprovado. É o
         caso de tu teres falado com a pessoa (no anúncio, ao telefone) e ela
         ter aceitado que o robô continue por WhatsApp.
      3. Conversa aberta há < 24h               -> SIM, texto livre.
      4. Conversa antiga (> 24h)                -> só template aprovado.
    """
    if not store.houve_contacto_humano(telefone):
        if e_template and store.tem_consentimento(telefone):
            return True, (
                "Sem conversa ainda, mas com consentimento registado por ti: "
                "primeiro contacto permitido como template aprovado."
            )
        return False, (
            "Sem conversa aberta nem consentimento registado. A primeira "
            "mensagem tem de ser enviada por ti — contacto frio automatizado "
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


def exigir_permissao(telefone, e_notificacao_servico=False, e_template=False):
    permitido, motivo = pode_enviar_whatsapp(
        telefone, e_notificacao_servico, e_template)
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

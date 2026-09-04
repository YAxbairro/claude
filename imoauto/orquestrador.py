"""
Orquestrador — o robô central.

Recebe eventos (lead novo, mensagem de WhatsApp, interesse no site, clique
no Telegram), chama o subagente certo e executa a ação. Toda a decisão de
"quem faz o quê" está aqui; os subagentes só sabem do seu ofício.
"""

import json
import os

from imoauto import compliance, config, store
from imoauto.agents import (Aquisicao, Copywriter, Designer, Publicador,
                            SEO, Vendas, Vigia)
from imoauto.clients import site, telegram, whatsapp


class Orquestrador:

    def __init__(self):
        self.aquisicao = Aquisicao()
        self.copy = Copywriter()
        self.seo = SEO()
        self.design = Designer()
        self.publicador = Publicador()
        self.vendas = Vendas()
        self.vigia = Vigia(self.aquisicao)
        store.iniciar()

    # --- 1. Lead novo ---------------------------------------------------

    def novo_anuncio(self, texto_anuncio, rede, url):
        """
        Um anúncio foi encontrado. Qualifica-o e entrega-o no Telegram.
        Não contacta ninguém — essa parte é tua.
        """
        lead = self.aquisicao.qualificar(texto_anuncio, rede, url)
        self.enviar_lead_para_telegram(lead)
        store.atualizar_lead(lead["id"], estado=store.ENVIADO)
        return lead

    def enviar_lead_para_telegram(self, lead):
        extra = json.loads(lead.get("extra") or "{}")
        abordagem = extra.get("abordagem_sugerida", "")
        telefone = lead.get("telefone") or "—"

        texto = (
            f"*Lead {lead['nota']}/100* · {lead['rede']}\n"
            f"*{lead['titulo'] or 'Sem título'}*\n"
            f"{lead['preco'] or '—'} · {lead['localidade'] or '—'}\n"
            f"Contacto: `{telefone}`\n\n"
            f"_{lead['motivo']}_\n\n"
            f"*Mensagem sugerida (envia tu):*\n{abordagem}\n\n"
            f"[Ver anúncio]({lead['url']})"
        )
        botoes = [[
            telegram.botao("Já contactei", {"a": "contactado", "id": lead["id"]}),
            telegram.botao("Descartar", {"a": "descartar", "id": lead["id"]}),
        ]]
        if telefone != "—":
            digitos = store.so_digitos(telefone)
            botoes.insert(0, [telegram.botao_url(
                "Abrir WhatsApp", f"https://wa.me/{digitos}"
            )])
        return telegram.enviar(texto, botoes)

    # --- 1b. A ronda diária ----------------------------------------------

    def ronda_diaria(self):
        """
        O que corre à hora marcada: varre as fontes, qualifica o que é novo
        e avisa-te de cada lead que valha a pena. Continua sem contactar
        ninguém — a decisão e a primeira mensagem são tuas.
        """
        resultado = self.vigia.ronda(ao_encontrar=self._avisar_lead_novo)
        self._resumo_da_ronda(resultado)
        return resultado

    def _avisar_lead_novo(self, lead):
        store.atualizar_lead(lead["id"], estado=store.ENVIADO)
        try:
            self.enviar_lead_para_telegram(lead)
        except Exception as erro:
            store.registar("orquestrador", "aviso_falhou", str(erro))

    def _resumo_da_ronda(self, resultado):
        if not resultado["leads"] and not resultado["problemas"]:
            return  # ronda silenciosa: nada novo, não vale a pena incomodar
        linhas = [
            f"*Ronda terminada* · {len(resultado['leads'])} "
            f"lead{'s' if len(resultado['leads']) != 1 else ''} "
            f"para veres",
            f"Vistos {resultado['vistos']} · novos {resultado['novos']} "
            f"· analisados {resultado['analisados']}",
        ]
        if resultado["problemas"]:
            linhas.append("\n_Fontes com problemas:_\n" +
                          "\n".join(f"· {p}" for p in resultado["problemas"][:4]))
        try:
            telegram.enviar("\n".join(linhas))
        except Exception as erro:
            store.registar("orquestrador", "resumo_falhou", str(erro))

    # --- 1c. Passar o número ao robô --------------------------------------

    def assumir_lead(self, lead_id, telefone, com_consentimento=False, nota=""):
        """
        Falaste com a pessoa. Agora passas o número ao robô e ele continua.

        Com `com_consentimento`, estás a declarar que ela aceitou ser
        contactada por WhatsApp — e aí o robô pode abrir a conversa com um
        template aprovado. Sem isso, fica à espera que ela escreva.
        """
        lead = store.obter_lead(lead_id)
        if not lead:
            raise ValueError(f"Lead {lead_id} não existe")

        telefone = telefone.strip()
        store.atualizar_lead(lead_id, telefone=telefone, estado=store.CONTACTADO)

        if not com_consentimento:
            return {"assumido": True, "abriu_conversa": False,
                    "motivo": "À espera que a pessoa escreva. Quando escrever, "
                              "o robô assume sozinho."}

        store.registar_consentimento(
            telefone, origem="contacto_do_yanick", nota=nota, lead_id=lead_id
        )
        try:
            whatsapp.enviar_template(
                telefone, "primeiro_contacto",
                [lead["titulo"] or "o seu anúncio"],
            )
        except compliance.BloqueioConformidade as erro:
            return {"assumido": True, "abriu_conversa": False, "motivo": str(erro)}
        except Exception as erro:
            store.registar("orquestrador", "template_falhou", str(erro))
            return {"assumido": True, "abriu_conversa": False,
                    "motivo": f"Número guardado, mas o template falhou: {erro}"}

        return {"assumido": True, "abriu_conversa": True,
                "motivo": "Conversa aberta. O robô continua a partir daqui."}

    # --- 2. Conversa no WhatsApp ----------------------------------------

    def mensagem_whatsapp(self, telefone, texto, media_id=""):
        """
        Chegou mensagem de um proprietário. O subagente de vendas responde.

        Só chega aqui depois de a pessoa ter escrito — o que significa que
        a janela de conversa está aberta e a resposta é permitida.
        """
        lead = store.lead_por_telefone(telefone)
        lead_id = lead["id"] if lead else None
        store.guardar_mensagem(telefone, "entrada", texto or "[media]", lead_id)

        if lead and lead["estado"] in (store.ENVIADO, store.CONTACTADO):
            store.atualizar_lead(lead["id"], estado=store.RESPONDEU)

        if media_id:
            self._guardar_foto(telefone, media_id, lead_id)

        decisao = self.vendas.responder(telefone, texto, lead)

        if decisao.get("escalar_para_humano"):
            telegram.enviar(
                f"*Escalada* · `{telefone}`\n"
                f"{decisao.get('motivo_escalada', 'sem motivo indicado')}\n\n"
                f"Última mensagem: _{texto}_"
            )

        resposta = decisao.get("resposta", "").strip()
        if resposta:
            try:
                whatsapp.enviar_texto(telefone, resposta)
            except compliance.BloqueioConformidade as erro:
                telegram.enviar(f"*Bloqueio de conformidade* `{telefone}`: {erro}")

        if lead and decisao.get("dados_recolhidos"):
            self._juntar_dados(lead, decisao["dados_recolhidos"])

        if decisao.get("pronto_para_publicar") and lead:
            self.criar_publicacao(lead["id"])

        return decisao

    def _guardar_foto(self, telefone, media_id, lead_id):
        pasta = os.path.join(config.PASTA_MEDIA, store.so_digitos(telefone))
        os.makedirs(pasta, exist_ok=True)
        destino = os.path.join(pasta, f"{media_id}.jpg")
        try:
            whatsapp.descarregar_media(media_id, destino)
            store.registar("orquestrador", "foto_recebida", destino)
        except Exception as erro:
            store.registar("orquestrador", "erro_foto", str(erro))

    def _juntar_dados(self, lead, novos):
        extra = json.loads(lead.get("extra") or "{}")
        recolhidos = extra.get("dados", {})
        recolhidos.update({k: v for k, v in novos.items() if v})
        extra["dados"] = recolhidos
        store.atualizar_lead(
            lead["id"],
            estado=store.A_NEGOCIAR,
            extra=json.dumps(extra, ensure_ascii=False),
        )

    # --- 3. Criar a publicação -------------------------------------------

    def criar_publicacao(self, lead_id):
        """
        O ponto onde a conversa vira produto: listagem no site, SEO, flyer
        e rascunhos para as redes — tudo de uma vez.
        """
        lead = store.obter_lead(lead_id)
        extra = json.loads(lead.get("extra") or "{}")
        dados = extra.get("dados", {})
        dados.setdefault("preco", lead["preco"])
        dados.setdefault("localidade", lead["localidade"])

        conteudo = self.copy.descricao_listagem(dados)
        otimizacao = self.seo.otimizar({**dados, **conteudo})

        fotos = self._fotos_locais(lead["telefone"])
        urls_fotos = []
        for foto in fotos:
            try:
                urls_fotos.append(site.enviar_foto(foto).get("url", ""))
            except Exception as erro:
                store.registar("orquestrador", "erro_upload_foto", str(erro))

        payload = {
            "titulo": conteudo.get("titulo", lead["titulo"]),
            "descricao": conteudo.get("descricao", ""),
            "preco": dados.get("preco", ""),
            "localidade": dados.get("localidade", ""),
            "tipologia": dados.get("tipologia", ""),
            "area": dados.get("area", ""),
            "fotos": urls_fotos,
            "seo": otimizacao,
            "origem": {"rede": lead["rede"], "url": lead["url"]},
            "estado": "rascunho",
        }
        criada = site.criar_listagem(payload)
        listagem_id = store.guardar_listagem(
            lead_id, payload["titulo"], payload,
            site_id=str(criada.get("id", "")), url=criada.get("url", ""),
        )
        store.atualizar_lead(lead_id, estado=store.PUBLICADO)

        caminho_flyer, _ = self.design.criar_flyer(payload, nome=f"lead{lead_id}")
        url_flyer = site.enviar_foto(caminho_flyer).get("url", "") \
            if os.path.exists(caminho_flyer) else ""

        social = self.copy.legenda_social(payload, "instagram")
        legenda = social.get("legenda", "") + "\n\n" + \
            " ".join(social.get("hashtags", []))

        rascunhos = self.publicador.preparar(listagem_id, legenda, url_flyer)
        self._pedir_aprovacao(rascunhos, payload, criada.get("url", ""))
        return {"listagem_id": listagem_id, "publicacoes": rascunhos,
                "flyer": caminho_flyer}

    def _fotos_locais(self, telefone):
        pasta = os.path.join(config.PASTA_MEDIA, store.so_digitos(telefone))
        if not os.path.isdir(pasta):
            return []
        return [os.path.join(pasta, f) for f in sorted(os.listdir(pasta))
                if f.lower().endswith((".jpg", ".jpeg", ".png"))]

    def _pedir_aprovacao(self, rascunhos, payload, url_listagem):
        for rascunho in rascunhos:
            texto = (
                f"*Post pronto* · {rascunho['plataforma']}\n"
                f"*{payload['titulo']}*\n"
                f"{url_listagem}\n\n"
                f"{rascunho['legenda'][:800]}"
            )
            botoes = [[
                telegram.botao("Publicar", {"a": "publicar", "id": rascunho["id"]}),
                telegram.botao("Rejeitar", {"a": "rejeitar", "id": rascunho["id"]}),
            ]]
            if rascunho["imagem"]:
                telegram.enviar_foto(rascunho["imagem"], texto, botoes)
            else:
                telegram.enviar(texto, botoes)

    # --- 4. Interesse no site --------------------------------------------

    def interesse_no_anuncio(self, listagem, interessado, telefone_proprietario):
        """
        Alguém mostrou interesse. Avisa o proprietário no WhatsApp, para
        ele não ter de andar a visitar o site.

        Permitido: é notificação de serviço a quem já é utilizador do
        ImoAuto. Fora da janela de 24h vai como template aprovado.
        """
        texto = self.vendas.aviso_de_interesse(listagem, interessado)
        permitido, _ = compliance.pode_enviar_whatsapp(telefone_proprietario)
        try:
            if permitido:
                whatsapp.enviar_texto(telefone_proprietario, texto)
            else:
                whatsapp.enviar_template(
                    telefone_proprietario, "aviso_interesse",
                    [listagem.get("titulo", ""), interessado.get("nome", ""),
                     interessado.get("contacto", "")],
                )
        except compliance.BloqueioConformidade as erro:
            telegram.enviar(
                f"*Não foi possível avisar o proprietário* "
                f"`{telefone_proprietario}`: {erro}\n"
                f"Anúncio: {listagem.get('titulo', '')}"
            )
            return False
        return True

    # --- 5. Botões do Telegram -------------------------------------------

    def acao_telegram(self, acao, identificador):
        if acao == "contactado":
            store.atualizar_lead(identificador, estado=store.CONTACTADO)
            return "Marcado como contactado. O robô assume quando ele responder."

        if acao == "ronda":
            resultado = self.ronda_diaria()
            return (f"Ronda feita: {resultado['vistos']} vistos, "
                    f"{resultado['novos']} novos, "
                    f"{len(resultado['leads'])} para veres.")

        if acao == "descartar":
            store.atualizar_lead(identificador, estado=store.DESCARTADO)
            return "Lead descartado."

        if acao == "publicar":
            self.publicador.aprovar(identificador)
            return "Publicado."

        if acao == "rejeitar":
            store.atualizar_publicacao(identificador, estado="rejeitado")
            return "Rascunho rejeitado."

        return f"Ação desconhecida: {acao}"

"""
Testes do robô ImoAuto.

Não precisam de nenhuma chave: os subagentes são substituídos por
respostas fixas e o DRY_RUN impede qualquer saída para o mundo.

    python test_imoauto.py
"""

import os
import tempfile
import unittest

os.environ["IMOAUTO_DRY_RUN"] = "1"
os.environ["IMOAUTO_DB"] = os.path.join(tempfile.mkdtemp(), "teste.db")
os.environ["IMOAUTO_MEDIA"] = tempfile.mkdtemp()

from imoauto import compliance, store  # noqa: E402
from imoauto.agents.base import extrair_json  # noqa: E402
from imoauto.orquestrador import Orquestrador  # noqa: E402

ANUNCIO = """Vendo apartamento T2 em Almada, 85m2, remodelado.
Preço 165.000€. Contacto 912 345 678."""


def responder_fixo(resultado):
    """Substitui o pensamento do subagente por uma resposta conhecida."""
    return lambda *args, **kwargs: resultado


class BaseTeste(unittest.TestCase):
    """
    Cada teste com a sua base de dados. Sem isto, o que um teste grava
    aparece no seguinte — e os testes começam a mentir.
    """

    def setUp(self):
        from imoauto import config
        config.BASE_DADOS = os.path.join(tempfile.mkdtemp(), "teste.db")
        store.iniciar()


class TestConformidade(BaseTeste):
    """A regra que protege a conta: nada de contacto frio."""

    def test_bloqueia_numero_sem_conversa(self):
        permitido, motivo = compliance.pode_enviar_whatsapp("+351911111111")
        self.assertFalse(permitido)
        self.assertIn("primeira mensagem", motivo)

    def test_permite_depois_de_a_pessoa_escrever(self):
        store.guardar_mensagem("+351922222222", "entrada", "Boa tarde")
        permitido, _ = compliance.pode_enviar_whatsapp("+351922222222")
        self.assertTrue(permitido)

    def test_fora_da_janela_exige_template(self):
        telefone = "+351933333333"
        store.guardar_mensagem(telefone, "entrada", "olá")
        with store.ligar() as c:
            c.execute(
                "UPDATE mensagens SET criado_em = criado_em - 200000 "
                "WHERE telefone = ?", (telefone,)
            )
        self.assertFalse(compliance.pode_enviar_whatsapp(telefone)[0])
        self.assertTrue(
            compliance.pode_enviar_whatsapp(telefone, e_notificacao_servico=True)[0]
        )

    def test_envio_bloqueado_levanta_excecao(self):
        from imoauto.clients import whatsapp
        with self.assertRaises(compliance.BloqueioConformidade):
            whatsapp.enviar_texto("+351944444444", "olá, tenho uma proposta")

    def test_lead_nunca_e_contactavel_automaticamente(self):
        regras = compliance.rotular_lead({"titulo": "T2"})
        self.assertFalse(regras["pode_contactar_automaticamente"])
        self.assertFalse(regras["pode_usar_fotos"])


class TestArmazenamento(BaseTeste):

    def test_nao_duplica_o_mesmo_anuncio(self):
        url = "https://facebook.com/marketplace/item/999"
        primeiro = store.guardar_lead("facebook", url, "T3 Setúbal")
        segundo = store.guardar_lead("facebook", url, "T3 Setúbal")
        self.assertEqual(primeiro["id"], segundo["id"])

    def test_encontra_lead_pelo_telefone_em_qualquer_formato(self):
        store.guardar_lead("instagram", "https://ig.com/p/abc", "T1 Lisboa",
                           telefone="+351 961 234 567")
        encontrado = store.lead_por_telefone("351961234567")
        self.assertIsNotNone(encontrado)
        self.assertEqual(encontrado["titulo"], "T1 Lisboa")


class TestFluxoCompleto(BaseTeste):
    """Do anúncio encontrado até ao post pronto a aprovar."""

    def setUp(self):
        super().setUp()
        self.robo = Orquestrador()

        self.robo.aquisicao.pensar = responder_fixo({
            "tipo": "imovel", "titulo": "T2 Almada 85m2", "preco": "165.000€",
            "localidade": "Almada", "telefone": "+351912345678",
            "particular": True, "nota": 84, "motivo": "particular, anúncio fraco",
            "abordagem_sugerida": "Boa tarde, vi o seu anúncio do T2 em Almada.",
        })
        self.robo.copy.pensar = responder_fixo({
            "titulo": "T2 remodelado em Almada, 85 m2",
            "descricao": "Apartamento de dois quartos...",
            "legenda": "T2 em Almada por 165.000€",
            "hashtags": ["#almada", "#imoveisportugal"],
        })
        self.robo.seo.pensar = responder_fixo({
            "title": "T2 Almada 85m2 — 165.000€",
            "meta_description": "Apartamento T2 remodelado em Almada.",
            "slug": "t2-almada-85m2", "palavras_chave": ["t2 almada"],
            "schema": {}, "sugestoes": [],
        })
        self.robo.design.pensar = responder_fixo({
            "prompt": "vertical real estate flyer, clean layout",
            "texto_na_imagem": ["165.000€", "T2 Almada"],
            "paleta": ["#0b1f3a"], "notas": "",
        })

    def test_lead_qualificado_fica_a_aguardar_o_humano(self):
        lead = self.robo.novo_anuncio(ANUNCIO, "facebook", "https://fb.com/m/1")
        self.assertEqual(lead["nota"], 84)
        self.assertEqual(store.obter_lead(lead["id"])["estado"], store.ENVIADO)

    def test_robo_so_responde_depois_da_pessoa_escrever(self):
        lead = self.robo.novo_anuncio(ANUNCIO, "facebook", "https://fb.com/m/2")
        self.robo.acao_telegram("contactado", lead["id"])

        self.robo.vendas.pensar = responder_fixo({
            "resposta": "Boa tarde! Publicamos o seu anúncio sem custos.",
            "dados_recolhidos": {"tipologia": "T2"},
            "em_falta": ["fotos"], "pronto_para_publicar": False,
            "escalar_para_humano": False, "motivo_escalada": "",
        })
        self.robo.mensagem_whatsapp("351912345678", "Boa tarde, diga")

        conversa = store.historico("351912345678")
        self.assertEqual(conversa[0]["direcao"], "entrada")
        self.assertEqual(conversa[-1]["direcao"], "saida")
        self.assertEqual(
            store.obter_lead(lead["id"])["estado"], store.A_NEGOCIAR
        )

    def test_conversa_completa_gera_listagem_e_posts(self):
        lead = self.robo.novo_anuncio(ANUNCIO, "facebook", "https://fb.com/m/3")
        self.robo.vendas.pensar = responder_fixo({
            "resposta": "Perfeito, já tenho tudo. Vou publicar.",
            "dados_recolhidos": {"tipologia": "T2", "area": "85",
                                 "nome_proprietario": "Sr. Costa"},
            "em_falta": [], "pronto_para_publicar": True,
            "escalar_para_humano": False, "motivo_escalada": "",
        })
        self.robo.mensagem_whatsapp("351912345678", "Aqui vão as fotos")

        self.assertEqual(store.obter_lead(lead["id"])["estado"], store.PUBLICADO)
        with store.ligar() as c:
            listagens = c.execute("SELECT * FROM listagens").fetchall()
            posts = c.execute("SELECT * FROM publicacoes").fetchall()
        self.assertEqual(len(listagens), 1)
        self.assertEqual({p["plataforma"] for p in posts},
                         {"facebook", "instagram"})
        self.assertTrue(all(p["estado"] == "rascunho" for p in posts))

    def test_post_nao_sai_sem_aprovacao(self):
        listagem_id = store.guardar_listagem(1, "T2 Almada", {})
        pub_id = store.guardar_publicacao(listagem_id, "facebook", "legenda")
        with self.assertRaises(PermissionError):
            self.robo.publicador.publicar(pub_id)

        self.robo.acao_telegram("publicar", pub_id)
        self.assertEqual(store.obter_publicacao(pub_id)["estado"], "publicado")

    def test_aviso_ao_proprietario_precisa_de_conversa_aberta(self):
        listagem = {"titulo": "T2 Almada"}
        interessado = {"nome": "Ana", "contacto": "919999999"}
        self.robo.vendas.pensar = responder_fixo("Alguém se interessou pelo T2.")

        # Sem conversa aberta: não envia, avisa-te a ti.
        self.assertFalse(
            self.robo.interesse_no_anuncio(listagem, interessado, "+351955555555")
        )

        # Com conversa aberta: envia.
        store.guardar_mensagem("+351956666666", "entrada", "olá")
        self.assertTrue(
            self.robo.interesse_no_anuncio(listagem, interessado, "+351956666666")
        )


class TestPainelSemTelegram(BaseTeste):
    """O painel tem de funcionar antes de o Telegram estar configurado."""

    def setUp(self):
        super().setUp()
        self.robo = Orquestrador()
        self.robo.aquisicao.pensar = responder_fixo({
            "titulo": "T2 Almada", "preco": "165.000€", "localidade": "Almada",
            "telefone": "+351912345678", "nota": 84, "motivo": "particular",
            "abordagem_sugerida": "Boa tarde, vi o seu anúncio.",
        })

    def test_lead_criado_sem_telegram_configurado(self):
        lead = self.robo.novo_anuncio(ANUNCIO, "colado", "manual://sem-telegram")
        self.assertEqual(store.obter_lead(lead["id"])["estado"], store.ENVIADO)

    def test_paginas_do_painel_abrem(self):
        from imoauto import painel
        lead = self.robo.novo_anuncio(ANUNCIO, "colado", "manual://painel")
        cliente = painel.app.test_client()
        for rota in ("/", "/leads", f"/lead/{lead['id']}", "/posts", "/configuracao"):
            self.assertEqual(cliente.get(rota).status_code, 200, rota)


class TestVigia(BaseTeste):
    """A ronda diária: só traz o que é novo, e só uma vez."""

    def setUp(self):
        super().setUp()
        self.robo = Orquestrador()
        self.anuncios = [
            {"titulo": "Vende se T2 Almada", "preco": "280.000 €",
             "localidade": "Almada", "data": "hoje", "fonte": "OLX",
             "url": "https://olx.pt/d/anuncio/t2-almada-1.html"},
            {"titulo": "T2 para alugar Almada", "preco": "1.200 €",
             "localidade": "Almada", "data": "hoje", "fonte": "OLX",
             "url": "https://olx.pt/d/anuncio/t2-alugar-2.html"},
        ]
        self.robo.vigia.recolher = lambda: (list(self.anuncios), [])
        # A triagem corta o arrendamento; só o primeiro é analisado.
        self.robo.vigia.pensar = responder_fixo({"aprovados": [0], "motivo": "venda"})
        self.robo.aquisicao.pensar = responder_fixo({
            "titulo": "T2 renovado em Almada", "preco": "280.000 €",
            "localidade": "Almada", "telefone": "", "particular": True,
            "nota": 88, "motivo": "particular, descrição fraca",
            "abordagem_sugerida": "Boa tarde, vi o seu T2.",
        })

    def test_ronda_traz_so_o_que_passa_a_triagem(self):
        resultado = self.robo.ronda_diaria()
        self.assertEqual(resultado["vistos"], 2)
        self.assertEqual(resultado["analisados"], 1)
        self.assertEqual(len(resultado["leads"]), 1)
        self.assertEqual(resultado["leads"][0]["estado"], store.DESCOBERTO)
        self.assertEqual(
            store.obter_lead(resultado["leads"][0]["id"])["estado"], store.ENVIADO
        )

    def test_segunda_ronda_nao_repete_nada(self):
        """Inclui o que a triagem rejeitou — senão reanalisava-o todos os dias."""
        self.robo.ronda_diaria()
        segunda = self.robo.ronda_diaria()
        self.assertEqual(segunda["vistos"], 2)
        self.assertEqual(segunda["novos"], 0)
        self.assertEqual(segunda["analisados"], 0)

    def test_lead_com_nota_baixa_nao_te_incomoda(self):
        self.robo.aquisicao.pensar = responder_fixo({
            "titulo": "T3 de agência", "preco": "480.000 €", "localidade": "Almada",
            "telefone": "", "particular": False, "nota": 31,
            "motivo": "linguagem de promotor", "abordagem_sugerida": "",
        })
        resultado = self.robo.ronda_diaria()
        self.assertEqual(len(resultado["leads"]), 0)
        with store.ligar() as c:
            estado = c.execute("SELECT estado FROM leads LIMIT 1").fetchone()
        self.assertEqual(estado["estado"], store.DESCARTADO)

    def test_fonte_que_falha_nao_derruba_a_ronda(self):
        def recolher():
            return list(self.anuncios), ["OLX · Porto: ligação recusada"]
        self.robo.vigia.recolher = recolher
        resultado = self.robo.ronda_diaria()
        self.assertEqual(len(resultado["leads"]), 1)
        self.assertEqual(len(resultado["problemas"]), 1)


class TestPassarAoRobo(BaseTeste):
    """Falaste com a pessoa; agora passas o número e o robô continua."""

    def setUp(self):
        super().setUp()
        self.robo = Orquestrador()
        self.lead = store.guardar_lead(
            "olx", "https://olx.pt/d/anuncio/passar.html", "T2 Almada"
        )

    def test_sem_consentimento_fica_a_espera(self):
        resultado = self.robo.assumir_lead(self.lead["id"], "+351911000001")
        self.assertFalse(resultado["abriu_conversa"])
        atualizado = store.obter_lead(self.lead["id"])
        self.assertEqual(atualizado["estado"], store.CONTACTADO)
        self.assertEqual(atualizado["telefone"], "+351911000001")

    def test_com_consentimento_o_robo_abre_a_conversa(self):
        resultado = self.robo.assumir_lead(
            self.lead["id"], "+351911000002", com_consentimento=True,
            nota="disse que sim ao telefone",
        )
        self.assertTrue(resultado["abriu_conversa"])
        self.assertTrue(store.tem_consentimento("+351911000002"))

    def test_consentimento_nao_abre_a_porta_a_texto_livre(self):
        """Só template. Texto livre continua a exigir que ela escreva."""
        from imoauto.clients import whatsapp
        store.registar_consentimento("+351911000003", origem="teste")
        with self.assertRaises(compliance.BloqueioConformidade):
            whatsapp.enviar_texto("+351911000003", "olá")

    def test_numero_sem_consentimento_continua_bloqueado(self):
        from imoauto.clients import whatsapp
        with self.assertRaises(compliance.BloqueioConformidade):
            whatsapp.enviar_template("+351911000004", "primeiro_contacto")


class TestAgenda(BaseTeste):

    def setUp(self):
        super().setUp()
        store.guardar_definicao("rondas_feitas", [])
        store.guardar_horas_da_ronda([9, 18])

    def test_ronda_da_manha_fica_em_falta_ate_ser_feita(self):
        from imoauto import agenda
        import datetime
        manha = datetime.datetime(2026, 9, 4, 10, 0)
        self.assertEqual(agenda.horas_em_falta(manha), [9])
        agenda.marcar_feita(9, manha)
        self.assertEqual(agenda.horas_em_falta(manha), [])

    def test_nao_corre_antes_da_hora(self):
        from imoauto import agenda
        import datetime
        madrugada = datetime.datetime(2026, 9, 4, 7, 0)
        self.assertEqual(agenda.horas_em_falta(madrugada), [])


class TestUtilitarios(unittest.TestCase):

    def test_json_com_ruido_a_volta(self):
        self.assertEqual(extrair_json('Aqui está: {"a": 1}'), {"a": 1})
        self.assertEqual(extrair_json('```json\n{"b": [1,2]}\n```'), {"b": [1, 2]})


if __name__ == "__main__":
    unittest.main(verbosity=2)

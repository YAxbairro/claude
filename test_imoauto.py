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


class TestConformidade(unittest.TestCase):
    """A regra que protege a conta: nada de contacto frio."""

    def setUp(self):
        store.iniciar()

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


class TestArmazenamento(unittest.TestCase):

    def setUp(self):
        store.iniciar()

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


class TestFluxoCompleto(unittest.TestCase):
    """Do anúncio encontrado até ao post pronto a aprovar."""

    def setUp(self):
        store.iniciar()
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


class TestUtilitarios(unittest.TestCase):

    def test_json_com_ruido_a_volta(self):
        self.assertEqual(extrair_json('Aqui está: {"a": 1}'), {"a": 1})
        self.assertEqual(extrair_json('```json\n{"b": [1,2]}\n```'), {"b": [1, 2]})


if __name__ == "__main__":
    unittest.main(verbosity=2)

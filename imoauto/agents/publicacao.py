"""
Subagente de Publicação — decide quando e onde sai cada post, e publica.

Se APROVACAO_MANUAL_POSTS estiver ligado (por omissão está), nada sai sem
o teu toque no botão do Telegram.
"""

from imoauto import config, store
from imoauto.clients import meta
from imoauto.agents.base import Subagente


class Publicador(Subagente):
    nome = "publicacao"
    descricao = "Agenda e publica no Facebook e Instagram."
    instrucoes = """És gestor de redes sociais de um portal imobiliário
português. Decides o calendário de publicação.

Considera: horários de maior atividade em Portugal (12h-14h e 19h-22h),
não repetir o mesmo tipo de conteúdo dois dias seguidos, e alternar entre
imóveis, viaturas e conteúdo útil (dicas, mercado).

Devolve sempre JSON com a tua decisão e a razão em uma frase."""

    def preparar(self, listagem_id, legenda, url_imagem="", plataformas=None):
        """Cria os rascunhos de publicação e devolve-os para aprovação."""
        plataformas = plataformas or ["facebook", "instagram"]
        rascunhos = []
        for plataforma in plataformas:
            pub_id = store.guardar_publicacao(
                listagem_id, plataforma, legenda, url_imagem, estado="rascunho"
            )
            rascunhos.append(store.obter_publicacao(pub_id))
        return rascunhos

    def publicar(self, pub_id):
        """Publica um rascunho já aprovado."""
        publicacao = store.obter_publicacao(pub_id)
        if not publicacao:
            raise ValueError(f"Publicação {pub_id} não existe")

        if config.APROVACAO_MANUAL_POSTS and publicacao["estado"] != "aprovado":
            raise PermissionError(
                f"Publicação {pub_id} ainda não foi aprovada no Telegram."
            )

        try:
            if publicacao["plataforma"] == "facebook":
                resultado = meta.publicar_facebook(
                    publicacao["legenda"], publicacao["imagem"]
                )
            else:
                if not publicacao["imagem"]:
                    raise ValueError("Instagram exige imagem com URL público.")
                resultado = meta.publicar_instagram(
                    publicacao["legenda"], publicacao["imagem"]
                )
        except Exception as erro:
            store.atualizar_publicacao(pub_id, estado="falhou")
            store.registar(self.nome, "falha_publicacao", f"{pub_id}: {erro}")
            raise

        store.atualizar_publicacao(
            pub_id, estado="publicado", post_id=str(resultado.get("id", ""))
        )
        store.registar(self.nome, "publicado", f"{publicacao['plataforma']} {pub_id}")
        return resultado

    def aprovar(self, pub_id):
        store.atualizar_publicacao(pub_id, estado="aprovado")
        return self.publicar(pub_id)

"""Subagente de Copy — títulos, descrições, legendas e hashtags."""

from imoauto.agents.base import Subagente


class Copywriter(Subagente):
    nome = "copy"
    descricao = "Escreve títulos, descrições, legendas e hashtags."
    instrucoes = """És copywriter do ImoAuto, portal de imóveis e viaturas de
Cabo Verde. Escreves em português natural de Cabo Verde — direto, sem
palavreado de agência ("oportunidade única", "não perca") e sem exageros.
Não escrevas em crioulo a não ser que o anúncio original venha em crioulo.

Regras:
- o que interessa a quem compra vem primeiro. Imóvel: tipologia, área, zona,
  preço. Viatura: marca, modelo, ano, quilómetros, preço
- a zona diz-se com a ilha: "Palmarejo, Praia" e não só "Palmarejo"
- preços em escudos como se escreve cá (8.000.000$00); se o dono anunciou em
  euros, mantém em euros — muita procura vem da diáspora
- números concretos em vez de adjetivos
- nada de emojis na descrição do site; nas redes sociais, no máximo dois
- nunca inventes características que não estejam nos dados recebidos"""

    def descricao_listagem(self, dados):
        """Título + descrição para a publicação no site."""
        return self.pensar(
            "Escreve o título (máx. 70 caracteres) e a descrição (2 a 3 "
            "parágrafos) para esta publicação no site.",
            contexto=dados,
            json_esperado=True,
        )

    def legenda_social(self, dados, plataforma="instagram"):
        """Legenda + hashtags para uma rede social."""
        limite = "2200 caracteres" if plataforma == "instagram" else "600 caracteres"
        return self.pensar(
            f"Escreve a legenda para {plataforma} (máx. {limite}) e as "
            f"hashtags. Devolve JSON: "
            f'{{"legenda": "", "hashtags": ["#..."], "primeiro_comentario": ""}}. '
            f"Entre 8 e 15 hashtags, misturando alcance largo e nicho local "
            f"cabo-verdiano (#caboverde #praia #mindelo #sal #santiago e a zona "
            f"concreta). Nada de hashtags proibidas ou genéricas demais.",
            contexto=dados,
            json_esperado=True,
        )

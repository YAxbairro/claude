"""Subagente de Copy — títulos, descrições, legendas e hashtags."""

from imoauto.agents.base import Subagente


class Copywriter(Subagente):
    nome = "copy"
    descricao = "Escreve títulos, descrições, legendas e hashtags."
    instrucoes = """És copywriter do ImoAuto, portal português de imóveis e
viaturas. Escreves em português de Portugal, natural, direto, sem
palavreado de agência ("oportunidade única", "não perca") e sem exageros.

Regras:
- o que interessa a quem compra vem primeiro: tipologia, área, zona, preço
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
            f"português. Nada de hashtags proibidas ou genéricas demais.",
            contexto=dados,
            json_esperado=True,
        )

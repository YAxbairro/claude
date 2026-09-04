"""Subagente de SEO — otimiza a listagem para pesquisa."""

from imoauto.agents.base import Subagente


class SEO(Subagente):
    nome = "seo"
    descricao = "Otimiza títulos, meta-descrições, slugs e dados estruturados."
    instrucoes = """És especialista de SEO para um portal imobiliário
português. Trabalhas pesquisa local: as pessoas procuram "t2 para venda em
Almada", "carros usados Setúbal".

Regras:
- title até 60 caracteres, meta description até 155
- slug curto, minúsculas, sem acentos, separado por hífens
- palavras-chave reais de pesquisa, não frases de marketing
- dados estruturados schema.org corretos para o tipo (RealEstateListing
  para imóveis, Vehicle para viaturas)"""

    def otimizar(self, dados):
        return self.pensar(
            "Otimiza esta publicação para pesquisa. Devolve JSON: "
            '{"title": "", "meta_description": "", "slug": "", '
            '"palavras_chave": [], "schema": {}, "sugestoes": []}',
            contexto=dados,
            json_esperado=True,
        )

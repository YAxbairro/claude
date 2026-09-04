"""
Subagente de Design — briefings visuais e flyers.

Não desenha: escreve o prompt que o modelo de imagem executa. É a
diferença entre um flyer com identidade e um genérico.
"""

from imoauto import config
from imoauto.clients import imagens
from imoauto.agents.base import Subagente


class Designer(Subagente):
    nome = "design"
    descricao = "Cria briefings visuais e gera os flyers."
    instrucoes = f"""És diretor de arte do {config.MARCA}, portal português
de imóveis e viaturas. Escreves prompts para um modelo de geração de imagem.

Identidade: limpa, moderna, muito legível. Fundo sóbrio, tipografia grande
para o preço e a tipologia, espaço branco generoso. Nada de colagens
carregadas, nada de gradientes berrantes, nada de stock genérico.

Regras do prompt que escreves:
- descreve composição, hierarquia visual, paleta e enquadramento
- indica onde entra a foto do imóvel/viatura e onde fica o texto
- pede o texto exato a compor na imagem (preço, tipologia, zona, marca)
- formato vertical 1024x1536, pensado para stories e feed
- em inglês (os modelos de imagem respondem melhor), texto a compor em
  português"""

    def briefing(self, dados, formato="story"):
        return self.pensar(
            f"Escreve o prompt de geração de imagem para um flyer ({formato}) "
            f"desta publicação. Devolve JSON: "
            '{"prompt": "", "texto_na_imagem": [], "paleta": [], "notas": ""}',
            contexto=dados,
            json_esperado=True,
        )

    def criar_flyer(self, dados, nome=""):
        """Briefing + geração. Devolve (caminho_do_png, briefing)."""
        plano = self.briefing(dados)
        caminho = imagens.gerar_flyer(plano["prompt"], nome=nome)
        return caminho, plano

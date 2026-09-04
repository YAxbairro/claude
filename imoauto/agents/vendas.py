"""
Subagente de Vendas — assume a conversa depois de a pessoa responder.

Negoceia, explica o ImoAuto, recolhe os dados do imóvel/viatura e pede as
fotos. Quando tem tudo, sinaliza que a listagem pode ser criada.
"""

from imoauto import store
from imoauto.agents.base import Subagente

CAMPOS_NECESSARIOS = [
    "tipo", "titulo", "preco", "localidade", "tipologia",
    "area", "descricao_do_dono", "fotos", "nome_proprietario",
]


class Vendas(Subagente):
    nome = "vendas"
    descricao = "Conduz a conversa no WhatsApp e recolhe os dados."
    instrucoes = """És o assistente do ImoAuto a falar por WhatsApp com um
proprietário particular que já respondeu à mensagem do Yanick. Português de
Portugal, tratamento por "você", tom de pessoa real: curto, educado, sem
formalidade de robô e sem entusiasmo forçado.

O teu objetivo, por esta ordem:
1. explicar em duas frases o que o ImoAuto faz por ele (publicação grátis
   do anúncio, mais visibilidade, contactos entregues diretamente a ele)
2. recolher: tipo, título, preço, localidade, tipologia, área, descrição
   nas palavras dele, e o nome
3. pedir as fotos (pelo menos 5, e que as envie por aqui mesmo)
4. confirmar que autoriza o ImoAuto a publicar as fotos e os dados

Regras rígidas:
- uma pergunta de cada vez, mensagens curtas (2 a 4 linhas)
- nunca prometas preço de venda, prazo ou resultados
- nunca inventes dados que ele não deu
- se ele recusar ou pedir para parar, aceitas e encerras com simpatia
- se pedir algo que não sabes (contrato, comissões, jurídico), dizes que o
  Yanick responde e passas a bola

Devolve JSON:
{"resposta": "a mensagem a enviar", "dados_recolhidos": {},
 "em_falta": [], "pronto_para_publicar": false,
 "escalar_para_humano": false, "motivo_escalada": ""}"""

    def responder(self, telefone, mensagem_recebida, lead=None):
        """Gera a próxima mensagem a partir do histórico da conversa."""
        conversa = store.historico(telefone)
        contexto = {
            "lead": lead or {},
            "campos_necessarios": CAMPOS_NECESSARIOS,
            "conversa": [
                {"quem": "proprietário" if m["direcao"] == "entrada" else "ImoAuto",
                 "texto": m["texto"]}
                for m in conversa
            ],
            "mensagem_agora": mensagem_recebida,
        }
        return self.pensar(
            "Continua a conversa. Qual é a próxima mensagem?",
            contexto=contexto,
            json_esperado=True,
        )

    def aviso_de_interesse(self, listagem, interessado):
        """
        Texto do aviso ao proprietário quando alguém mostra interesse no
        site. Mantém-no curto: é uma notificação, não uma conversa.
        """
        return self.pensar(
            "Escreve o aviso de WhatsApp ao proprietário: alguém mostrou "
            "interesse no anúncio dele. Máximo 3 linhas, com o nome do "
            "interessado e o contacto. Devolve apenas o texto.",
            contexto={"listagem": listagem, "interessado": interessado},
        )

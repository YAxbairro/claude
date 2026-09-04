"""
Subagente de Aquisição — encontra e qualifica anúncios.

Lê dados públicos, organiza e pontua. Nunca contacta ninguém: o que
produz é uma ficha de lead que vai para o teu Telegram, para tu decidires
e escreveres a primeira mensagem.
"""

from imoauto import compliance, store
from imoauto.agents.base import Subagente


class Aquisicao(Subagente):
    nome = "aquisicao"
    descricao = "Encontra anúncios nas redes e qualifica-os como leads."
    instrucoes = """És analista de aquisição de um portal imobiliário e
automóvel português (ImoAuto). Recebes o texto de um anúncio publicado numa
rede social por um particular.

O teu trabalho: extrair os dados e avaliar se vale a pena o ImoAuto abordar
este anunciante para publicar o imóvel/viatura no portal.

Pontua de 0 a 100 tendo em conta:
- é particular (bom) ou agência/stand já profissionalizado (mau)? Sinais de
  agência: o anúncio diz "profissional", tem logótipo e nome de imobiliária
  (Remax, Century21, ERA...), referência interna, ou linguagem de folheto
  ("excelente oportunidade de investimento", "marque já a sua visita")
- é venda ou arrendamento? Só interessa VENDA — um preço de 800 a 1.500 €
  é renda mensal, não preço de venda. Arrendamento leva nota 0
- o anúncio está pobre (poucas fotos, descrição fraca)? isso é oportunidade
- há sinais de urgência de venda ("negociável", "vendo por motivo de")?
- o preço e a localização fazem sentido para o mercado português?

O telefone quase nunca está visível nestes portais — fica escondido atrás de
um botão. Se não o vires, deixa vazio: quem o vai buscar é o humano.

Devolve JSON:
{"tipo": "imovel|viatura|outro", "titulo": "", "preco": "", "localidade": "",
 "telefone": "", "particular": true, "nota": 0-100, "motivo": "uma frase",
 "abordagem_sugerida": "rascunho curto e humano da 1ª mensagem, tratamento
 formal, sem parecer spam, máximo 3 frases",
 "onde_contactar": "chat do portal | telefone visível | nenhum"}

A abordagem sugerida é para o humano ler, ajustar e enviar ele próprio.
Nunca escrevas como se fosses tu a enviá-la."""

    def qualificar(self, texto_anuncio, rede, url):
        """Analisa um anúncio e grava-o como lead pontuado."""
        ficha = self.pensar(
            f"Anúncio encontrado em {rede}:\n\n{texto_anuncio}",
            json_esperado=True,
        )
        lead = store.guardar_lead(
            rede=rede,
            url=url,
            titulo=ficha.get("titulo", ""),
            preco=str(ficha.get("preco", "")),
            localidade=ficha.get("localidade", ""),
            telefone=str(ficha.get("telefone", "")),
            nota=int(ficha.get("nota", 0)),
            motivo=ficha.get("motivo", ""),
            extra={
                "tipo": ficha.get("tipo", ""),
                "particular": ficha.get("particular"),
                "abordagem_sugerida": ficha.get("abordagem_sugerida", ""),
                "permissoes": compliance.rotular_lead(ficha),
            },
        )
        return lead

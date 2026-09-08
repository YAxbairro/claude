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
    instrucoes = """És analista de aquisição do ImoAuto, portal de imóveis e
viaturas de Cabo Verde. Recebes o texto de um anúncio — de um portal, de um
grupo de Facebook ou colado à mão.

O teu trabalho: extrair os dados e avaliar se vale a pena o ImoAuto abordar
este anunciante para publicar o imóvel ou a viatura no portal.

O ImoAuto trata das duas coisas. Num anúncio de viatura o que interessa é:
marca, modelo, ano, quilómetros, combustível, caixa, e se tem documentos em
ordem. Num de imóvel: tipologia, área, andar, estado.

Pontua de 0 a 100 tendo em conta:
- é particular (bom) ou agência/stand já profissionalizado (mau)? Sinais de
  agência: o anúncio diz "profissional" ou "mediação imobiliária", tem
  logótipo e nome — imóveis: Remax CV, IMOR, Sigma, Ayodele, Kaps Habitat,
  Expo Imóveis, TopCasas, AMICV; viaturas: Caetano, FreexAuto, Duarte Auto,
  Multimarcas, BE FORWARD — referência interna, ou linguagem de folheto
  ("excelente oportunidade de investimento", "marque já a sua visita").
  Quando o portal marca "Particular", acredita nisso
- é venda ou aluguer? Só interessa VENDA.
  Imóveis: uma renda anda entre 15.000$ e 80.000$/mês; uma venda anda nos
  milhões de escudos (5.000.000$ a 30.000.000$) ou dezenas de milhares de
  euros. Viaturas: um aluguer anda nos 3.000$–8.000$/dia; uma venda anda nos
  300.000$ a 4.000.000$. Se o valor for de aluguer, nota 0
- o anúncio está pobre (poucas fotos, descrição fraca)? isso é oportunidade
- há sinais de urgência de venda ("negociável", "vendo por motivo de")?
- o preço e a zona fazem sentido? As zonas que contam: na Praia (Palmarejo,
  Achada Santo António, Fonte Filipe, Prainha, Terra Branca, Cidadela), no
  Mindelo (Monte Sossego, Fonte Filipe, Ribeira Bote), no Sal (Santa Maria,
  Espargos), na Boa Vista (Sal Rei). Também Assomada, Tarrafal, São Filipe
- preços vêm em escudos (8.000.000$00, 8 000 000 CVE) ou em euros — a
  diáspora anuncia muito em euros. Regista como está escrito, não converte

O telefone: nos portais fica quase sempre escondido, mas nos grupos de
Facebook e no Instagram as pessoas publicam-no à vista, muitas vezes com
"(também WhatsApp)". Se o vires, regista-o com o indicativo +238. Se não,
deixa vazio — quem o vai buscar é o humano.

Devolve JSON:
{"tipo": "imovel|viatura|outro", "titulo": "", "preco": "", "localidade": "",
 "ficha": {"tipologia|marca": "", "area|modelo": "", "estado|ano": "",
           "andar|quilometros": "", "extra|combustivel": ""},
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

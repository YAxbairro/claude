"""
Subagente Vigia — a ronda diária.

Todos os dias, à hora marcada, percorre as fontes, descarta o que já viu,
e manda o que é novo para o subagente de Aquisição qualificar. O que
sobreviver chega-te ao Telegram e ao painel.

Continua a não contactar ninguém. Só olha, ordena e avisa.
"""

import time

from imoauto import fontes, store
from imoauto.agents.aquisicao import Aquisicao
from imoauto.agents.base import Subagente

NOTA_MINIMA = 55       # abaixo disto não vale a pena incomodar-te
MAXIMO_POR_RONDA = 12  # trava de custo: nunca qualifica mais do que isto


class Vigia(Subagente):
    nome = "vigia"
    descricao = "Faz a ronda diária pelas fontes e traz o que é novo."
    instrucoes = """És o vigia de um portal imobiliário português. Recebes uma
lista de anúncios encontrados numa ronda e decides quais merecem análise a
fundo — que é cara e demorada.

Aprova os que parecem de particulares, recentes, e com preço plausível.
Rejeita duplicados óbvios, anúncios de agências e imobiliárias, empreendimentos
novos e o que não é um imóvel ou viatura concreto.

Devolve JSON: {"aprovados": [índices], "motivo": "uma frase"}"""

    def __init__(self, aquisicao=None):
        self.aquisicao = aquisicao or Aquisicao()

    # --- A ronda ---------------------------------------------------------

    def recolher(self):
        """Passa por todas as fontes ativas e junta o que encontrou."""
        encontrados, problemas = [], []
        for fonte in fontes.fontes_ativas():
            try:
                achados = fonte.procurar()
                encontrados.extend(achados)
                store.registar(self.nome, "fonte_lida",
                               f"{fonte.nome}: {len(achados)}")
            except Exception as erro:
                problemas.append(f"{fonte.nome}: {erro}")
                store.registar(self.nome, "fonte_falhou", f"{fonte.nome}: {erro}")
        return encontrados, problemas

    def filtrar_novos(self, anuncios):
        """Deita fora o que já está na base de dados e os repetidos da ronda."""
        novos, vistos = [], set()
        for anuncio in anuncios:
            url = (anuncio.get("url") or "").strip()
            if not url or url in vistos or store.url_ja_visto(url):
                continue
            vistos.add(url)
            novos.append(anuncio)
        return novos

    def triar(self, anuncios):
        """
        Primeira peneira, barata: o modelo olha para a lista e diz quais
        valem a análise completa. Poupa tempo e dinheiro.
        """
        if not anuncios:
            return []
        resumo = [
            {"i": i, "titulo": a.get("titulo", ""), "preco": a.get("preco", ""),
             "localidade": a.get("localidade", ""), "data": a.get("data", "")}
            for i, a in enumerate(anuncios)
        ]
        try:
            decisao = self.pensar(
                "Quais destes anúncios merecem análise a fundo?",
                contexto={"anuncios": resumo}, json_esperado=True,
            )
            indices = [i for i in decisao.get("aprovados", [])
                       if isinstance(i, int) and 0 <= i < len(anuncios)]
        except Exception as erro:
            # Se a triagem falhar, seguimos com todos — mais vale gastar
            # a mais do que perder um bom anúncio.
            store.registar(self.nome, "triagem_falhou", str(erro))
            indices = list(range(len(anuncios)))
        return [anuncios[i] for i in indices][:MAXIMO_POR_RONDA]

    def qualificar(self, anuncio):
        """Lê o anúncio inteiro e passa-o ao subagente de Aquisição."""
        url = anuncio["url"]
        texto = ""
        if fontes.configurado():
            try:
                texto = fontes.ler_anuncio(url)
            except Exception as erro:
                store.registar(self.nome, "leitura_falhou", f"{url}: {erro}")
        if not texto:
            texto = (f"{anuncio.get('titulo','')}\n{anuncio.get('preco','')}\n"
                     f"{anuncio.get('localidade','')}\n{anuncio.get('resumo','')}")
        return self.aquisicao.qualificar(texto, anuncio.get("fonte", "web"), url)

    def ronda(self, ao_encontrar=None):
        """
        A ronda completa. `ao_encontrar` é chamado por cada lead que passe a
        nota mínima — é assim que o orquestrador te avisa.
        """
        inicio = time.time()
        encontrados, problemas = self.recolher()
        novos = self.filtrar_novos(encontrados)
        candidatos = self.triar(novos)
        # Marcar TODOS os novos, não só os que passaram a triagem: sobre os
        # outros já houve decisão, e reanalisá-los amanhã é dinheiro deitado
        # fora.
        store.marcar_vistos(novos)

        leads = []
        for anuncio in candidatos:
            try:
                lead = self.qualificar(anuncio)
            except Exception as erro:
                store.registar(self.nome, "qualificacao_falhou", str(erro))
                continue
            if lead["nota"] >= NOTA_MINIMA:
                leads.append(lead)
                if ao_encontrar:
                    ao_encontrar(lead)
            else:
                store.atualizar_lead(lead["id"], estado=store.DESCARTADO)

        store.registar_ronda(
            vistos=len(encontrados), novos=len(novos), qualificados=len(leads),
            erro="; ".join(problemas)[:500],
            detalhe={"candidatos": len(candidatos),
                     "segundos": round(time.time() - inicio, 1)},
        )
        return {"vistos": len(encontrados), "novos": len(novos),
                "analisados": len(candidatos), "leads": leads,
                "problemas": problemas}

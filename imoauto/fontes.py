"""
Fontes de anúncios — onde o robô vai procurar.

Duas maneiras de procurar, ambas sobre conteúdo público:

  BuscaWeb        pesquisa (tipo Google) por uma frase, em todo o lado
  PaginaListagem  extrai os anúncios de uma página de resultados
                  (OLX, Imovirtual, CustoJusto...)

Ambas assentam no Firecrawl, que é um serviço de pesquisa e leitura de páginas
com API própria. Precisa de FIRECRAWL_API_KEY.

Nota deliberada: não há aqui varredura do Facebook Marketplace nem de grupos
fechados. A Meta bloqueia-o ativamente e a conta que se queima é a do ImoAuto.
Esses continuam a entrar pelo painel, colados à mão.
"""

import os

import requests

from imoauto import store

BASE = "https://api.firecrawl.dev/v2"

ESQUEMA_ANUNCIOS = {
    "type": "object",
    "properties": {
        "anuncios": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "titulo": {"type": "string"},
                    "preco": {"type": "string"},
                    "localidade": {"type": "string"},
                    "data": {"type": "string"},
                    "url": {"type": "string"},
                },
            },
        }
    },
}

INSTRUCAO = (
    "Extrai os anúncios de imóveis ou viaturas listados nesta página. "
    "Para cada um: titulo, preco, localidade, data de publicação, e o link "
    "completo. Ignora banners, publicidade e anúncios patrocinados de agências."
)


def chave():
    return os.getenv("FIRECRAWL_API_KEY", "").strip()


def configurado():
    return bool(chave())


def _pedir(caminho, payload, timeout=120):
    resposta = requests.post(
        f"{BASE}/{caminho}",
        headers={"Authorization": f"Bearer {chave()}",
                 "Content-Type": "application/json"},
        json=payload, timeout=timeout,
    )
    corpo = resposta.json()
    if resposta.status_code >= 400 or not corpo.get("success", True):
        raise RuntimeError(f"Firecrawl {caminho}: {str(corpo)[:300]}")
    return corpo.get("data", {})


class Fonte:
    """Uma coisa onde procurar. Devolve sempre a mesma forma de anúncio."""

    tipo = "fonte"

    def __init__(self, nome, alvo, ativa=True):
        self.nome = nome
        self.alvo = alvo
        self.ativa = ativa

    def procurar(self):
        raise NotImplementedError

    def como_dicionario(self):
        return {"tipo": self.tipo, "nome": self.nome,
                "alvo": self.alvo, "ativa": self.ativa}


class PaginaListagem(Fonte):
    """
    Uma página de resultados de um portal (OLX, Imovirtual, CustoJusto).
    É a fonte mais rica: dá título, preço, localidade, data e link de cada
    anúncio numa só leitura.
    """

    tipo = "listagem"

    def procurar(self):
        dados = _pedir("scrape", {
            "url": self.alvo,
            "formats": ["json"],
            "onlyMainContent": True,
            "maxAge": 0,
            "jsonOptions": {"prompt": INSTRUCAO, "schema": ESQUEMA_ANUNCIOS},
        })
        anuncios = (dados.get("json") or {}).get("anuncios", [])
        for anuncio in anuncios:
            anuncio["fonte"] = self.nome
        return anuncios


class BuscaWeb(Fonte):
    """
    Pesquisa livre na web — o "Google" do robô. Serve para apanhar o que
    está fora dos portais.
    """

    tipo = "busca"

    def __init__(self, nome, alvo, ativa=True, limite=10, local="Portugal"):
        super().__init__(nome, alvo, ativa)
        self.limite = limite
        self.local = local

    def procurar(self):
        dados = _pedir("search", {
            "query": self.alvo, "limit": self.limite, "location": self.local,
        })
        anuncios = []
        for resultado in dados.get("web", []):
            anuncios.append({
                "titulo": resultado.get("title", ""),
                "preco": "",
                "localidade": "",
                "data": "",
                "url": resultado.get("url", ""),
                "resumo": resultado.get("description", ""),
                "fonte": self.nome,
            })
        return anuncios

    def como_dicionario(self):
        base = super().como_dicionario()
        base.update({"limite": self.limite, "local": self.local})
        return base


def ler_anuncio(url):
    """Abre um anúncio concreto e devolve o texto, para o qualificar bem."""
    dados = _pedir("scrape", {
        "url": url, "formats": ["markdown"], "onlyMainContent": True,
    })
    return (dados.get("markdown") or "")[:8000]


# --- Fontes que vêm de origem ------------------------------------------
# Editáveis no painel. Estas são as que já provámos funcionar.

FONTES_INICIAIS = [
    # O que faz a diferença é o ?search[private_business]=private — sem ele
    # o OLX devolve sobretudo agências. Foi testado.
    {"tipo": "listagem", "nome": "OLX · Almada (só particulares)", "ativa": True,
     "alvo": "https://www.olx.pt/imoveis/apartamento-casa-a-venda/almada-almada/"
             "?search%5Bprivate_business%5D=private"},
    {"tipo": "listagem", "nome": "OLX · Setúbal (só particulares)", "ativa": True,
     "alvo": "https://www.olx.pt/imoveis/apartamento-casa-a-venda/setubal/"
             "?search%5Bprivate_business%5D=private"},
    {"tipo": "listagem", "nome": "OLX · Lisboa (só particulares)", "ativa": True,
     "alvo": "https://www.olx.pt/imoveis/apartamento-casa-a-venda/lisboa/"
             "?search%5Bprivate_business%5D=private"},
    {"tipo": "busca", "nome": "Web · vende-se sem imobiliária", "ativa": False,
     "alvo": "vende-se apartamento particular sem imobiliária contacto"},
]


def construir(definicao):
    classe = PaginaListagem if definicao.get("tipo") == "listagem" else BuscaWeb
    extra = {}
    if classe is BuscaWeb:
        extra = {"limite": definicao.get("limite", 10),
                 "local": definicao.get("local", "Portugal")}
    return classe(definicao["nome"], definicao["alvo"],
                  definicao.get("ativa", True), **extra)


def fontes_ativas():
    return [construir(d) for d in store.ler_fontes() if d.get("ativa")]

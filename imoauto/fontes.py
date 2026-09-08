"""
Fontes de anúncios — onde o robô vai procurar.

Duas maneiras de procurar, ambas sobre conteúdo público:

  BuscaWeb        pesquisa (tipo Google) por uma frase, em todo o lado
  PaginaListagem  extrai os anúncios de uma página de resultados
                  (NhaKaza e outros portais cabo-verdianos)

Ambas assentam no Firecrawl, que é um serviço de pesquisa e leitura de páginas
com API própria. Precisa de FIRECRAWL_API_KEY.

Nota deliberada: não há aqui varredura do Facebook Marketplace nem de grupos
fechados. A Meta bloqueia-o ativamente e a conta que se queima é a do ImoAuto.
Esses continuam a entrar pelo painel ou pelo Telegram, colados à mão.

Em Cabo Verde isso pesa mais do que noutros sítios: os portais online são
poucos e magros, e o mercado real vive nos grupos de Facebook e no WhatsApp.
A ronda automática apanha o que houver nos portais; o grosso vais tu buscar
com um copiar-colar. Está pensado para isso ser rápido.
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
                    "anunciante": {"type": "string"},
                },
            },
        }
    },
}

INSTRUCAO = (
    "Extrai os anúncios de imóveis ou viaturas listados nesta página. "
    "Para cada um: titulo, preco, localidade (ilha e zona), data de "
    "publicação, o link completo, e se o anunciante é particular ou "
    "imobiliária, quando a página o indicar. Os preços podem vir em escudos "
    "cabo-verdianos (8.000.000$00 ou 8 000 000 CVE) ou em euros. Ignora "
    "banners, publicidade e anúncios patrocinados de agências."
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
    Uma página de resultados de um portal (NhaKaza, e o que mais houver).
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

    def __init__(self, nome, alvo, ativa=True, limite=10, local="Cabo Verde"):
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

# NhaKaza é o portal de anúncios de Cabo Verde onde particulares publicam de
# graça, e marca cada anúncio como "Particular" ou imobiliária — é o sinal
# que interessa. As locations_id são as ilhas.
NHAKAZA = "https://nhakaza.cv/?view_page={pagina}"

FONTES_INICIAIS = [
    {"tipo": "listagem", "nome": "NhaKaza · vendas (todo o país)", "ativa": True,
     "alvo": "https://nhakaza.cv/Comprar-Casa-Apartamento-Lojas-Escritorio/"
             "?view_page=buy&tp_to=2"},
    {"tipo": "listagem", "nome": "NhaKaza · Santiago", "ativa": True,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Santiago/?view_page=rent&locations_id=257"},
    {"tipo": "listagem", "nome": "NhaKaza · São Vicente", "ativa": True,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Sao-Vicente/?view_page=rent&locations_id=251"},
    {"tipo": "listagem", "nome": "NhaKaza · Sal", "ativa": True,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Sal/?view_page=rent&locations_id=253"},
    {"tipo": "listagem", "nome": "NhaKaza · Boa Vista", "ativa": False,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Boavista/?view_page=rent&locations_id=254"},
    {"tipo": "busca", "nome": "Web · vende-se particular Cabo Verde", "ativa": True,
     "alvo": "vende-se casa OR apartamento OR terreno particular Cabo Verde "
             "contacto WhatsApp -imobiliaria -remax", "local": "Cabo Verde"},
]

# Portais que são de imobiliárias (imor.cv, sigma.cv, ayodele.cv, remax.cv,
# kaps-habitat.com). Não servem para procurar leads — os anúncios já estão
# com uma agência. Ficam aqui documentados para não voltarem a ser tentados.
PORTAIS_DE_AGENCIAS = ["imor.cv", "sigma.cv", "ayodele.cv", "remax.cv",
                       "kaps-habitat.com", "properstar.pt"]


def construir(definicao):
    classe = PaginaListagem if definicao.get("tipo") == "listagem" else BuscaWeb
    extra = {}
    if classe is BuscaWeb:
        extra = {"limite": definicao.get("limite", 10),
                 "local": definicao.get("local", "Cabo Verde")}
    return classe(definicao["nome"], definicao["alvo"],
                  definicao.get("ativa", True), **extra)


def fontes_ativas():
    return [construir(d) for d in store.ler_fontes() if d.get("ativa")]

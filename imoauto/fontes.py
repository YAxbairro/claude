"""
Fontes de anúncios — onde o robô vai procurar.

Duas maneiras de procurar, ambas sobre conteúdo público:

  PaginaListagem  extrai os anúncios de uma página de resultados
                  (NhaKaza para imóveis, Stand.cv para viaturas)
  PaginaFacebook  lê os posts de uma página do Facebook, pela API oficial
  CaixaDeEmail    lê os avisos de grupos que o Facebook te manda por email
  BuscaWeb        pesquisa (tipo Google) por uma frase, em todo o lado

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


class PaginaFacebook(Fonte):
    """
    Uma página do Facebook, lida pela Graph API oficial.

    Há dois caminhos para isto, e a diferença importa:

    1. Páginas que TU administras (ou onde o dono te deu admin) — funciona
       hoje, sem pedir nada a ninguém. É o caminho rápido: falas com o dono
       da página, ele dá-te acesso, e o robô passa a ler os anúncios dela.

    2. Páginas públicas de terceiros — exige a funcionalidade "Page Public
       Content Access", que a Meta só dá depois de rever a tua app
       (verificação de negócio e um vídeo a mostrar o uso). Não dá para
       testar antes: em modo de desenvolvimento a app só vê páginas onde o
       administrador também é administrador da app.

    O código é o mesmo nos dois casos. O que muda é o que o token deixa ver.
    Nada aqui contorna o Facebook — quando não há acesso, a fonte falha e
    diz porquê.
    """

    tipo = "facebook"
    CAMPOS = "id,message,created_time,permalink_url,full_picture"

    def procurar(self):
        from imoauto import config
        if not config.META_TOKEN:
            raise RuntimeError(
                "Sem META_PAGE_TOKEN não dá para ler páginas do Facebook.")

        pagina = self.alvo.strip().rstrip("/").split("/")[-1].split("?")[0]
        resposta = requests.get(
            f"https://graph.facebook.com/{config.GRAPH_VERSION}/{pagina}/posts",
            params={"fields": self.CAMPOS, "limit": 25,
                    "access_token": config.META_TOKEN},
            timeout=60,
        )
        corpo = resposta.json()
        if "error" in corpo:
            erro = corpo["error"].get("message", "")
            if "Public Content Access" in erro or corpo["error"].get("code") == 200:
                raise RuntimeError(
                    f"O Facebook não deixa ler '{pagina}': é preciso ser "
                    f"administrador dela, ou ter a Page Public Content Access "
                    f"aprovada pela Meta. ({erro})")
            raise RuntimeError(f"Facebook: {erro}")

        anuncios = []
        for post in corpo.get("data", []):
            texto = (post.get("message") or "").strip()
            if len(texto) < 30:
                continue  # posts sem texto não são anúncios
            anuncios.append({
                "titulo": texto.split("\n")[0][:120],
                "preco": "",
                "localidade": "",
                "data": post.get("created_time", ""),
                "url": post.get("permalink_url", ""),
                "resumo": texto[:3000],
                "imagem": post.get("full_picture", ""),
                "fonte": self.nome,
            })
        return anuncios


class CaixaDeEmail(Fonte):
    """
    Lê os avisos que o Facebook te manda por email.

    Quando ligas as notificações de um grupo ("Todas as publicações" +
    email), o Facebook envia-te uma mensagem por cada post novo. Essas
    mensagens chegam à TUA caixa de correio, e ler o teu próprio email não
    depende de autorização nenhuma da Meta nem toca no Facebook.

    É o único caminho conhecido em que o robô vê os grupos sozinho. Tem uma
    condição prática: o Facebook tem vindo a encurtar o conteúdo destes
    avisos ao longo dos anos, e o que vem em cada um varia. Vale a pena
    ligar num grupo, esperar um dia e ver o que chega antes de contar com
    isto para os cinco.

    Precisa de EMAIL_SERVIDOR, EMAIL_UTILIZADOR e EMAIL_SENHA. No Gmail a
    senha é uma "palavra-passe de aplicação", não a tua senha normal.
    """

    tipo = "email"
    REMETENTES = ["facebookmail.com", "facebook.com"]

    def procurar(self):
        import email
        import imaplib
        from email.header import decode_header, make_header
        from imoauto import config

        if not (config.EMAIL_SERVIDOR and config.EMAIL_UTILIZADOR
                and config.EMAIL_SENHA):
            raise RuntimeError(
                "Falta a configuração de email (servidor, utilizador e "
                "palavra-passe de aplicação).")

        caixa = imaplib.IMAP4_SSL(config.EMAIL_SERVIDOR)
        try:
            caixa.login(config.EMAIL_UTILIZADOR, config.EMAIL_SENHA)
            caixa.select(self.alvo or config.EMAIL_PASTA)
            _, resultado = caixa.search(None, 'UNSEEN FROM "facebookmail.com"')
            identificadores = resultado[0].split()[-40:]

            anuncios = []
            for identificador in identificadores:
                _, dados = caixa.fetch(identificador, "(RFC822)")
                mensagem = email.message_from_bytes(dados[0][1])
                assunto = str(make_header(decode_header(
                    mensagem.get("Subject", ""))))
                corpo = _texto_do_email(mensagem)
                if len(corpo.strip()) < 40:
                    continue
                anuncios.append({
                    "titulo": assunto[:120],
                    "preco": "", "localidade": "",
                    "data": mensagem.get("Date", ""),
                    "url": f"email://{identificador.decode()}",
                    "resumo": corpo[:4000],
                    "fonte": self.nome,
                })
            return anuncios
        finally:
            try:
                caixa.logout()
            except Exception:
                pass


def _texto_do_email(mensagem):
    """Tira o texto de um email, preferindo a parte simples à HTML."""
    if not mensagem.is_multipart():
        texto = _descodificar(mensagem)
        # Os avisos do Facebook vêm muitas vezes só em HTML, sem parte
        # simples. Sem isto, o subagente recebia as etiquetas todas.
        if mensagem.get_content_type() == "text/html":
            return _limpar_html(texto)
        return texto

    simples, html = "", ""
    for parte in mensagem.walk():
        tipo = parte.get_content_type()
        if tipo == "text/plain" and not simples:
            simples = _descodificar(parte)
        elif tipo == "text/html" and not html:
            html = _descodificar(parte)
    return simples or _limpar_html(html)


def _limpar_html(html):
    import re as _re
    sem_cabecalho = _re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", html)
    sem_etiquetas = _re.sub(r"<[^>]+>", " ", sem_cabecalho)
    return _re.sub(r"\s{2,}", " ", sem_etiquetas).strip()


def _descodificar(parte):
    try:
        carga = parte.get_payload(decode=True) or b""
        return carga.decode(parte.get_content_charset() or "utf-8", "replace")
    except Exception:
        return ""


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

# NhaKaza (imóveis) e Stand.cv (viaturas) são a mesma plataforma, feita cá:
# particulares publicam de graça e os anúncios vêm marcados "Particular" ou
# com o nome da agência/stand. É o sinal que interessa. As locations_id são
# as ilhas, iguais nos dois sites.
ILHAS = {"São Vicente": 251, "São Nicolau": 252, "Sal": 253, "Boa Vista": 254,
         "Maio": 256, "Santiago": 257, "Fogo": 258, "Brava": 259}

FONTES_INICIAIS = [
    # --- Imóveis -------------------------------------------------------
    {"tipo": "listagem", "nome": "NhaKaza · imóveis à venda", "ativa": True,
     "alvo": "https://nhakaza.cv/Comprar-Casa-Apartamento-Lojas-Escritorio/"
             "?view_page=buy&tp_to=2"},
    {"tipo": "listagem", "nome": "NhaKaza · Santiago", "ativa": True,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Santiago/?view_page=rent&locations_id=257"},
    {"tipo": "listagem", "nome": "NhaKaza · São Vicente", "ativa": True,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Sao-Vicente/?view_page=rent&locations_id=251"},
    {"tipo": "listagem", "nome": "NhaKaza · Sal", "ativa": False,
     "alvo": "https://nhakaza.cv/Arrendar-Alugar-Comprar-Vender-Apartamentos-"
             "Moradias-Sal/?view_page=rent&locations_id=253"},

    # --- Viaturas ------------------------------------------------------
    {"tipo": "listagem", "nome": "Stand.cv · viaturas à venda", "ativa": True,
     "alvo": "https://stand.cv/Comprar-Carro-Pecas-Comerciais-Pesados/"
             "?view_page=buy&tp_to=2"},
    {"tipo": "listagem", "nome": "Stand.cv · Santiago", "ativa": True,
     "alvo": "https://stand.cv/Alugar-Comprar-Vender-Carros-Viaturas-Santiago/"
             "?view_page=rent&locations_id=257"},
    {"tipo": "listagem", "nome": "Stand.cv · São Vicente", "ativa": True,
     "alvo": "https://stand.cv/Alugar-Comprar-Vender-Carros-Viaturas-Sao-"
             "Vicente/?view_page=rent&locations_id=251"},
    {"tipo": "listagem", "nome": "CVX · carros e motas", "ativa": False,
     "alvo": "https://cvx.cv/carros-e-motas/"},

    # --- Grupos, pela caixa de correio ---------------------------------
    {"tipo": "email", "nome": "Avisos de grupos por email", "ativa": False,
     "alvo": "INBOX"},

    # --- Páginas do Facebook -------------------------------------------
    # Vazio de propósito: acrescentas as tuas no painel. Cada uma precisa de
    # acesso — ou és administrador dela, ou tens a Page Public Content
    # Access aprovada pela Meta. Ver docs/FACEBOOK.md.

    # --- Web ------------------------------------------------------------
    {"tipo": "busca", "nome": "Web · vende-se particular Cabo Verde", "ativa": True,
     "alvo": "vende-se casa OR apartamento OR terreno OR carro particular "
             "Cabo Verde contacto WhatsApp -imobiliaria -stand -remax",
     "local": "Cabo Verde"},
]

# Sites que são de agências e stands: os imóveis e carros deles já estão
# com alguém. Ficam documentados para não voltarem a ser tentados.
PORTAIS_DE_AGENCIAS = [
    # imóveis
    "imor.cv", "sigma.cv", "ayodele.cv", "remax.cv", "kaps-habitat.com",
    "properstar.pt",
    # viaturas
    "caetano.cv", "freexauto.cv", "duarteauto.cv", "multimarcasauto.com",
    "beforward.jp",
]


def construir(definicao):
    tipos = {"listagem": PaginaListagem, "facebook": PaginaFacebook,
             "email": CaixaDeEmail, "busca": BuscaWeb}
    classe = tipos.get(definicao.get("tipo"), BuscaWeb)
    extra = {}
    if classe is BuscaWeb:
        extra = {"limite": definicao.get("limite", 10),
                 "local": definicao.get("local", "Cabo Verde")}
    return classe(definicao["nome"], definicao["alvo"],
                  definicao.get("ativa", True), **extra)


def fontes_ativas():
    return [construir(d) for d in store.ler_fontes() if d.get("ativa")]

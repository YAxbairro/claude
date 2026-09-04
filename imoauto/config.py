"""
Configurações do robô ImoAuto.

Tudo vem de variáveis de ambiente (.env). Nada de segredos no código.
"""

import os
from dotenv import load_dotenv

CAMINHO_ENV = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env")
load_dotenv(CAMINHO_ENV, override=True)


def _env(nome, default=""):
    return os.getenv(nome, default).strip()


def _bool(nome, default=False):
    valor = _env(nome, "1" if default else "0").lower()
    return valor in ("1", "true", "yes", "sim", "on")


# --- Anthropic (cérebro dos subagentes) ---------------------------------
ANTHROPIC_API_KEY = _env("ANTHROPIC_API_KEY")
MODELO_PRINCIPAL = _env("IMOAUTO_MODELO", "claude-sonnet-5")
MODELO_RAPIDO = _env("IMOAUTO_MODELO_RAPIDO", "claude-haiku-4-5-20251001")

# --- Telegram (relay interno contigo) -----------------------------------
TELEGRAM_TOKEN = _env("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = _env("TELEGRAM_CHAT_ID")  # o teu chat pessoal

# --- WhatsApp Cloud API (Coexistence no número Business) ----------------
WHATSAPP_TOKEN = _env("WHATSAPP_TOKEN")
WHATSAPP_PHONE_ID = _env("WHATSAPP_PHONE_NUMBER_ID")
WHATSAPP_VERIFY_TOKEN = _env("WHATSAPP_VERIFY_TOKEN", "imoauto")

# --- Meta Graph (Facebook Page + Instagram Business) --------------------
META_TOKEN = _env("META_PAGE_TOKEN")
FACEBOOK_PAGE_ID = _env("FACEBOOK_PAGE_ID")
INSTAGRAM_USER_ID = _env("INSTAGRAM_USER_ID")
GRAPH_VERSION = _env("META_GRAPH_VERSION", "v21.0")

# --- Site ImoAuto (conta de administrador) ------------------------------
SITE_BASE_URL = _env("IMOAUTO_SITE_URL", "https://imoauto.pt").rstrip("/")
SITE_API_TOKEN = _env("IMOAUTO_API_TOKEN")

# --- Geração de imagem (flyers) -----------------------------------------
OPENAI_API_KEY = _env("OPENAI_API_KEY")
MODELO_IMAGEM = _env("IMOAUTO_MODELO_IMAGEM", "gpt-image-1")

# --- Operação ------------------------------------------------------------
BASE_DADOS = _env("IMOAUTO_DB", "./imoauto.db")
PASTA_MEDIA = _env("IMOAUTO_MEDIA", "./media")
MARCA = _env("IMOAUTO_MARCA", "ImoAuto")
IDIOMA = _env("IMOAUTO_IDIOMA", "pt-PT")

# Interruptor mestre: com DRY_RUN nada sai para o mundo (nem posts, nem
# mensagens). Só regista o que teria feito. Começa sempre assim.
DRY_RUN = _bool("IMOAUTO_DRY_RUN", True)

# Publicação em redes sociais exige aprovação humana no Telegram?
APROVACAO_MANUAL_POSTS = _bool("IMOAUTO_APROVAR_POSTS", True)

os.makedirs(PASTA_MEDIA, exist_ok=True)


def em_falta():
    """Devolve as configurações essenciais que ainda não estão preenchidas."""
    essenciais = {
        "ANTHROPIC_API_KEY": ANTHROPIC_API_KEY,
        "TELEGRAM_BOT_TOKEN": TELEGRAM_TOKEN,
        "TELEGRAM_CHAT_ID": TELEGRAM_CHAT_ID,
    }
    opcionais = {
        "WHATSAPP_TOKEN": WHATSAPP_TOKEN,
        "WHATSAPP_PHONE_NUMBER_ID": WHATSAPP_PHONE_ID,
        "META_PAGE_TOKEN": META_TOKEN,
        "FACEBOOK_PAGE_ID": FACEBOOK_PAGE_ID,
        "INSTAGRAM_USER_ID": INSTAGRAM_USER_ID,
        "IMOAUTO_API_TOKEN": SITE_API_TOKEN,
        "OPENAI_API_KEY": OPENAI_API_KEY,
    }
    return (
        [k for k, v in essenciais.items() if not v],
        [k for k, v in opcionais.items() if not v],
    )


# --- Configuração a quente ----------------------------------------------
# O painel web escreve no .env e recarrega sem ser preciso reiniciar nada.

CAMPOS_EDITAVEIS = [
    ("ANTHROPIC_API_KEY", "Chave da Anthropic", "essencial",
     "O cérebro dos subagentes. Obtém em console.anthropic.com"),
    ("TELEGRAM_BOT_TOKEN", "Token do bot de Telegram", "essencial",
     "Fala com o @BotFather no Telegram e cria um bot. Ele dá-te isto."),
    ("TELEGRAM_CHAT_ID", "O teu ID de Telegram", "essencial",
     "Fala com o @userinfobot no Telegram. Ele diz-te o número."),
    ("WHATSAPP_TOKEN", "Token do WhatsApp", "opcional",
     "Da app da Meta, em developers.facebook.com"),
    ("WHATSAPP_PHONE_NUMBER_ID", "ID do número de WhatsApp", "opcional",
     "Na mesma página da Meta, por baixo do número."),
    ("META_PAGE_TOKEN", "Token da Página do Facebook", "opcional",
     "Necessário para publicar no Facebook e Instagram."),
    ("FACEBOOK_PAGE_ID", "ID da Página do Facebook", "opcional", ""),
    ("INSTAGRAM_USER_ID", "ID da conta Instagram Business", "opcional", ""),
    ("IMOAUTO_SITE_URL", "Endereço do site", "opcional",
     "Por exemplo: https://imoauto.pt"),
    ("IMOAUTO_API_TOKEN", "Token de administrador do site", "opcional",
     "Para o robô poder criar as publicações sozinho."),
    ("OPENAI_API_KEY", "Chave para gerar os flyers", "opcional",
     "Obtém em platform.openai.com"),
]


def valor_atual(chave):
    return globals().get(chave, "") or os.getenv(chave, "")


def escrever_env(novos_valores):
    """Grava no .env preservando o que lá está e recarrega a configuração."""
    existentes = {}
    ordem = []
    if os.path.exists(CAMINHO_ENV):
        for linha in open(CAMINHO_ENV, encoding="utf-8"):
            if "=" in linha and not linha.strip().startswith("#"):
                chave = linha.split("=", 1)[0].strip()
                existentes[chave] = linha.rstrip("\n")
                ordem.append(chave)

    for chave, valor in novos_valores.items():
        linha = f"{chave}={valor}"
        if chave in existentes:
            existentes[chave] = linha
        else:
            existentes[chave] = linha
            ordem.append(chave)

    with open(CAMINHO_ENV, "w", encoding="utf-8") as ficheiro:
        ficheiro.write("# Configuração do robô ImoAuto\n")
        ficheiro.write("# Escrito pelo painel. Podes editar à mão se quiseres.\n\n")
        for chave in ordem:
            ficheiro.write(existentes[chave] + "\n")

    recarregar()


def recarregar():
    """Volta a ler o .env e atualiza os valores em memória."""
    global ANTHROPIC_API_KEY, MODELO_PRINCIPAL, MODELO_RAPIDO
    global TELEGRAM_TOKEN, TELEGRAM_CHAT_ID
    global WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_VERIFY_TOKEN
    global META_TOKEN, FACEBOOK_PAGE_ID, INSTAGRAM_USER_ID, GRAPH_VERSION
    global SITE_BASE_URL, SITE_API_TOKEN
    global OPENAI_API_KEY, MODELO_IMAGEM
    global BASE_DADOS, PASTA_MEDIA, MARCA, IDIOMA
    global DRY_RUN, APROVACAO_MANUAL_POSTS

    load_dotenv(CAMINHO_ENV, override=True)

    ANTHROPIC_API_KEY = _env("ANTHROPIC_API_KEY")
    MODELO_PRINCIPAL = _env("IMOAUTO_MODELO", "claude-sonnet-5")
    MODELO_RAPIDO = _env("IMOAUTO_MODELO_RAPIDO", "claude-haiku-4-5-20251001")
    TELEGRAM_TOKEN = _env("TELEGRAM_BOT_TOKEN")
    TELEGRAM_CHAT_ID = _env("TELEGRAM_CHAT_ID")
    WHATSAPP_TOKEN = _env("WHATSAPP_TOKEN")
    WHATSAPP_PHONE_ID = _env("WHATSAPP_PHONE_NUMBER_ID")
    WHATSAPP_VERIFY_TOKEN = _env("WHATSAPP_VERIFY_TOKEN", "imoauto")
    META_TOKEN = _env("META_PAGE_TOKEN")
    FACEBOOK_PAGE_ID = _env("FACEBOOK_PAGE_ID")
    INSTAGRAM_USER_ID = _env("INSTAGRAM_USER_ID")
    GRAPH_VERSION = _env("META_GRAPH_VERSION", "v21.0")
    SITE_BASE_URL = _env("IMOAUTO_SITE_URL", "https://imoauto.pt").rstrip("/")
    SITE_API_TOKEN = _env("IMOAUTO_API_TOKEN")
    OPENAI_API_KEY = _env("OPENAI_API_KEY")
    MODELO_IMAGEM = _env("IMOAUTO_MODELO_IMAGEM", "gpt-image-1")
    BASE_DADOS = _env("IMOAUTO_DB", "./imoauto.db")
    PASTA_MEDIA = _env("IMOAUTO_MEDIA", "./media")
    MARCA = _env("IMOAUTO_MARCA", "ImoAuto")
    IDIOMA = _env("IMOAUTO_IDIOMA", "pt-PT")
    DRY_RUN = _bool("IMOAUTO_DRY_RUN", True)
    APROVACAO_MANUAL_POSTS = _bool("IMOAUTO_APROVAR_POSTS", True)
    os.makedirs(PASTA_MEDIA, exist_ok=True)

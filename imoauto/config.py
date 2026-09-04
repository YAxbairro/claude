"""
Configurações do robô ImoAuto.

Tudo vem de variáveis de ambiente (.env). Nada de segredos no código.
"""

import os
from dotenv import load_dotenv

load_dotenv()


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

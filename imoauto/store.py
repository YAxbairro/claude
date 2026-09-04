"""
Armazenamento local (SQLite). Guarda leads, proprietários, conversas,
publicações e o registo de tudo o que o robô fez.
"""

import json
import sqlite3
import time
from contextlib import contextmanager

from imoauto import config

# Estados do ciclo de vida de um lead (anúncio encontrado numa rede social)
DESCOBERTO = "descoberto"          # subagente encontrou o anúncio
ENVIADO = "enviado"                # link entregue no teu Telegram
CONTACTADO = "contactado"          # TU mandaste a 1ª mensagem (WhatsApp)
RESPONDEU = "respondeu"            # a pessoa respondeu -> robô assume
A_NEGOCIAR = "a_negociar"          # robô a recolher dados e fotos
PUBLICADO = "publicado"            # listagem criada no site
DESCARTADO = "descartado"

ESQUEMA = """
CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rede TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    titulo TEXT,
    preco TEXT,
    localidade TEXT,
    telefone TEXT,
    nota INTEGER DEFAULT 0,
    motivo TEXT,
    estado TEXT NOT NULL DEFAULT 'descoberto',
    criado_em REAL NOT NULL,
    atualizado_em REAL NOT NULL,
    extra TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS mensagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    telefone TEXT NOT NULL,
    direcao TEXT NOT NULL,          -- 'entrada' ou 'saida'
    texto TEXT,
    canal TEXT DEFAULT 'whatsapp',
    criado_em REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS listagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER,
    site_id TEXT,
    titulo TEXT,
    dados TEXT DEFAULT '{}',
    url TEXT,
    criado_em REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS publicacoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listagem_id INTEGER,
    plataforma TEXT NOT NULL,       -- facebook | instagram
    post_id TEXT,
    legenda TEXT,
    imagem TEXT,
    estado TEXT DEFAULT 'rascunho', -- rascunho | aprovado | publicado | falhou
    criado_em REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS registo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ator TEXT NOT NULL,
    acao TEXT NOT NULL,
    detalhe TEXT,
    criado_em REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_estado ON leads(estado);
CREATE INDEX IF NOT EXISTS idx_msg_telefone ON mensagens(telefone, criado_em);
"""


@contextmanager
def ligar():
    conexao = sqlite3.connect(config.BASE_DADOS)
    conexao.row_factory = sqlite3.Row
    try:
        yield conexao
        conexao.commit()
    finally:
        conexao.close()


def iniciar():
    with ligar() as c:
        c.executescript(ESQUEMA)


# --- Leads ---------------------------------------------------------------

def guardar_lead(rede, url, titulo="", preco="", localidade="", telefone="",
                 nota=0, motivo="", extra=None):
    """Insere um lead. Se o URL já existe, devolve o que lá está (sem duplicar)."""
    agora = time.time()
    with ligar() as c:
        existente = c.execute("SELECT * FROM leads WHERE url = ?", (url,)).fetchone()
        if existente:
            return dict(existente)
        cur = c.execute(
            """INSERT INTO leads (rede, url, titulo, preco, localidade, telefone,
                                  nota, motivo, estado, criado_em, atualizado_em, extra)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
            (rede, url, titulo, preco, localidade, telefone, nota, motivo,
             DESCOBERTO, agora, agora, json.dumps(extra or {}, ensure_ascii=False)),
        )
        return dict(c.execute("SELECT * FROM leads WHERE id = ?",
                              (cur.lastrowid,)).fetchone())


def atualizar_lead(lead_id, **campos):
    if not campos:
        return
    campos["atualizado_em"] = time.time()
    colunas = ", ".join(f"{k} = ?" for k in campos)
    with ligar() as c:
        c.execute(f"UPDATE leads SET {colunas} WHERE id = ?",
                  (*campos.values(), lead_id))


def obter_lead(lead_id):
    with ligar() as c:
        linha = c.execute("SELECT * FROM leads WHERE id = ?", (lead_id,)).fetchone()
        return dict(linha) if linha else None


def lead_por_telefone(telefone):
    """Encontra o lead associado a um número (para saber quem está a falar)."""
    digitos = so_digitos(telefone)
    with ligar() as c:
        for linha in c.execute(
            "SELECT * FROM leads WHERE telefone != '' ORDER BY atualizado_em DESC"
        ):
            if so_digitos(linha["telefone"])[-9:] == digitos[-9:]:
                return dict(linha)
    return None


def listar_leads(estado=None, limite=20):
    consulta = "SELECT * FROM leads"
    args = []
    if estado:
        consulta += " WHERE estado = ?"
        args.append(estado)
    consulta += " ORDER BY nota DESC, criado_em DESC LIMIT ?"
    args.append(limite)
    with ligar() as c:
        return [dict(l) for l in c.execute(consulta, args)]


# --- Mensagens -----------------------------------------------------------

def guardar_mensagem(telefone, direcao, texto, lead_id=None, canal="whatsapp"):
    with ligar() as c:
        c.execute(
            """INSERT INTO mensagens (lead_id, telefone, direcao, texto, canal, criado_em)
               VALUES (?,?,?,?,?,?)""",
            (lead_id, telefone, direcao, texto, canal, time.time()),
        )


def historico(telefone, limite=30):
    with ligar() as c:
        linhas = c.execute(
            """SELECT direcao, texto, criado_em FROM mensagens
               WHERE telefone = ? ORDER BY criado_em DESC LIMIT ?""",
            (telefone, limite),
        ).fetchall()
    return [dict(l) for l in reversed(linhas)]


def houve_contacto_humano(telefone):
    """
    A pergunta que decide tudo: já existe conversa aberta com este número?

    O robô só pode falar depois de a pessoa ter escrito primeiro (ou de tu
    teres iniciado a conversa a partir da app). Sem isto, seria contacto
    frio automatizado — proibido pela Meta.
    """
    with ligar() as c:
        return c.execute(
            "SELECT 1 FROM mensagens WHERE telefone = ? LIMIT 1", (telefone,)
        ).fetchone() is not None


def ultima_mensagem_recebida(telefone):
    with ligar() as c:
        linha = c.execute(
            """SELECT criado_em FROM mensagens
               WHERE telefone = ? AND direcao = 'entrada'
               ORDER BY criado_em DESC LIMIT 1""",
            (telefone,),
        ).fetchone()
    return linha["criado_em"] if linha else None


# --- Listagens e publicações --------------------------------------------

def guardar_listagem(lead_id, titulo, dados, site_id="", url=""):
    with ligar() as c:
        cur = c.execute(
            """INSERT INTO listagens (lead_id, site_id, titulo, dados, url, criado_em)
               VALUES (?,?,?,?,?,?)""",
            (lead_id, site_id, titulo, json.dumps(dados, ensure_ascii=False),
             url, time.time()),
        )
        return cur.lastrowid


def guardar_publicacao(listagem_id, plataforma, legenda, imagem="",
                       estado="rascunho", post_id=""):
    with ligar() as c:
        cur = c.execute(
            """INSERT INTO publicacoes (listagem_id, plataforma, post_id, legenda,
                                        imagem, estado, criado_em)
               VALUES (?,?,?,?,?,?,?)""",
            (listagem_id, plataforma, post_id, legenda, imagem, estado, time.time()),
        )
        return cur.lastrowid


def atualizar_publicacao(pub_id, **campos):
    if not campos:
        return
    colunas = ", ".join(f"{k} = ?" for k in campos)
    with ligar() as c:
        c.execute(f"UPDATE publicacoes SET {colunas} WHERE id = ?",
                  (*campos.values(), pub_id))


def obter_publicacao(pub_id):
    with ligar() as c:
        linha = c.execute("SELECT * FROM publicacoes WHERE id = ?",
                          (pub_id,)).fetchone()
        return dict(linha) if linha else None


# --- Registo -------------------------------------------------------------

def registar(ator, acao, detalhe=""):
    with ligar() as c:
        c.execute(
            "INSERT INTO registo (ator, acao, detalhe, criado_em) VALUES (?,?,?,?)",
            (ator, acao, str(detalhe)[:2000], time.time()),
        )


def so_digitos(texto):
    return "".join(ch for ch in (texto or "") if ch.isdigit())

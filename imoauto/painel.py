"""
Painel web do ImoAuto — a interface para quem não quer saber de terminal.

Abre no browser (também no telemóvel, se estiverem na mesma rede). Mostra os
leads, as conversas, os posts à espera de aprovação, e tem um formulário para
colar as chaves sem tocar em ficheiros.

Por segurança só ouve em 127.0.0.1: ninguém de fora lhe chega.
"""

import datetime
import json
import urllib.parse

from flask import Flask, flash, redirect, render_template, request, url_for

from imoauto import agenda, config, fontes, store
from imoauto.orquestrador import Orquestrador

app = Flask(__name__)
app.secret_key = "painel-imoauto-local"

ETIQUETAS = {
    store.DESCOBERTO: "encontrado",
    store.ENVIADO: "à espera que contactes",
    store.CONTACTADO: "contactado, à espera da resposta",
    store.RESPONDEU: "respondeu",
    store.A_NEGOCIAR: "conversa a decorrer",
    store.PUBLICADO: "publicado no site",
    store.DESCARTADO: "descartado",
}

GRUPOS = [
    ("pesquisa", "Para o Vigia procurar sozinho",
     "É esta chave que lhe dá olhos para varrer os anúncios todos os dias."),
    ("essencial", "Para o robô arrancar",
     "Sem estas três, nada funciona. São gratuitas de obter."),
    ("opcional", "Para o robô publicar sozinho",
     "Podes deixar em branco por agora e preencher depois."),
]

_robo = None


def robo():
    global _robo
    if _robo is None:
        _robo = Orquestrador()
    return _robo


def _comum(pagina):
    return {"marca": config.MARCA, "pagina": pagina,
            "modo_simulacao": config.DRY_RUN, "etiquetas": ETIQUETAS}


def saudacao():
    hora = datetime.datetime.now().hour
    if hora < 13:
        return "Bom dia"
    return "Boa tarde" if hora < 20 else "Boa noite"


def _contar():
    contagens = {}
    with store.ligar() as c:
        for linha in c.execute(
            "SELECT estado, COUNT(*) AS n FROM leads GROUP BY estado"
        ):
            contagens[linha["estado"]] = linha["n"]
    for estado in ETIQUETAS:
        contagens.setdefault(estado, 0)
    return contagens


@app.get("/")
def painel():
    essenciais, _ = config.em_falta()
    with store.ligar() as c:
        pendentes = c.execute(
            "SELECT COUNT(*) AS n FROM publicacoes WHERE estado = 'rascunho'"
        ).fetchone()["n"]
    return render_template(
        "painel.html", **_comum("painel"),
        contagens=_contar(), posts_pendentes=pendentes, saudacao=saudacao(),
        em_falta=essenciais, leads=store.listar_leads(store.ENVIADO, 5),
    )


@app.get("/leads")
def leads():
    return render_template("leads.html", **_comum("leads"),
                           leads=store.listar_leads(limite=100))


@app.get("/lead/<int:lead_id>")
def lead(lead_id):
    ficha = store.obter_lead(lead_id)
    if not ficha:
        return redirect(url_for("leads"))
    extra = json.loads(ficha.get("extra") or "{}")
    abordagem = extra.get("abordagem_sugerida", "")
    return render_template(
        "lead.html", **_comum("leads"), lead=ficha,
        abordagem=abordagem,
        abordagem_url=urllib.parse.quote(abordagem),
        telefone=store.so_digitos(ficha["telefone"]),
        dados=extra.get("dados", {}),
        conversa=store.historico(ficha["telefone"]) if ficha["telefone"] else [],
    )


@app.post("/lead/<int:lead_id>/<acao>")
def acao_lead(lead_id, acao):
    if acao in ("contactado", "descartar"):
        flash(robo().acao_telegram(acao, lead_id))
    return redirect(url_for("lead", lead_id=lead_id))


@app.post("/novo-lead")
def novo_lead():
    texto = request.form.get("texto", "").strip()
    if not texto:
        flash("Cola o texto do anúncio primeiro.")
        return redirect(url_for("painel"))
    if not config.ANTHROPIC_API_KEY:
        flash("Falta a chave da Anthropic. Vai à Configuração.")
        return redirect(url_for("configuracao"))
    url = request.form.get("url", "").strip() or f"manual://{abs(hash(texto))}"
    try:
        ficha = robo().novo_anuncio(texto, "colado", url)
    except Exception as erro:
        flash(f"Não consegui analisar: {erro}")
        return redirect(url_for("painel"))
    flash(f"Analisado: nota {ficha['nota']}/100.")
    return redirect(url_for("lead", lead_id=ficha["id"]))


@app.get("/vigia")
def vigia():
    proxima = agenda.proxima_ronda()
    rondas = []
    for r in store.ultimas_rondas(8):
        rondas.append({**r, "quando": datetime.datetime.fromtimestamp(
            r["criado_em"]).strftime("%d/%m às %H:%M")})
    return render_template(
        "vigia.html", **_comum("vigia"),
        horas=store.horas_da_ronda(), fontes=store.ler_fontes(),
        proxima=proxima.strftime("%d/%m às %Hh") if proxima else None,
        rondas=rondas, firecrawl=fontes.configurado(),
        a_correr=True,
    )


@app.post("/vigia/horas")
def vigia_horas():
    store.guardar_horas_da_ronda(request.form.getlist("hora"))
    flash("Horário guardado.")
    return redirect(url_for("vigia"))


@app.post("/vigia/fontes")
def vigia_fontes():
    atuais = store.ler_fontes()
    for i, fonte in enumerate(atuais):
        fonte["ativa"] = bool(request.form.get(f"ativa_{i}"))
    nome = request.form.get("novo_nome", "").strip()
    alvo = request.form.get("novo_alvo", "").strip()
    if nome and alvo:
        atuais.append({"tipo": "listagem", "nome": nome,
                       "alvo": alvo, "ativa": True})
    store.guardar_fontes(atuais)
    flash("Sítios guardados.")
    return redirect(url_for("vigia"))


@app.post("/vigia/correr")
def vigia_correr():
    if not fontes.configurado():
        flash("Falta a FIRECRAWL_API_KEY — sem ela o Vigia não vê nada.")
        return redirect(url_for("vigia"))
    try:
        resultado = robo().ronda_diaria()
        flash(f"Ronda feita: {resultado['vistos']} vistos, "
              f"{resultado['novos']} novos, "
              f"{len(resultado['leads'])} para veres.")
    except Exception as erro:
        flash(f"A ronda falhou: {erro}")
    return redirect(url_for("leads"))


@app.post("/lead/<int:lead_id>/assumir")
def assumir(lead_id):
    telefone = request.form.get("telefone", "").strip()
    if not telefone:
        flash("Falta o número.")
        return redirect(url_for("lead", lead_id=lead_id))
    resultado = robo().assumir_lead(
        lead_id, telefone,
        com_consentimento=bool(request.form.get("consentimento")),
    )
    flash(resultado["motivo"])
    return redirect(url_for("lead", lead_id=lead_id))


@app.get("/posts")
def posts():
    with store.ligar() as c:
        linhas = c.execute(
            "SELECT * FROM publicacoes ORDER BY criado_em DESC LIMIT 50"
        ).fetchall()
    return render_template("posts.html", **_comum("posts"),
                           posts=[dict(l) for l in linhas])


@app.post("/post/<int:pub_id>/<acao>")
def acao_post(pub_id, acao):
    try:
        if acao == "publicar":
            flash(robo().acao_telegram("publicar", pub_id))
        elif acao == "rejeitar":
            flash(robo().acao_telegram("rejeitar", pub_id))
    except Exception as erro:
        flash(f"Não deu: {erro}")
    return redirect(url_for("posts"))


@app.route("/configuracao", methods=["GET", "POST"])
def configuracao():
    if request.method == "POST":
        novos = {}
        for chave, _, _, _ in config.CAMPOS_EDITAVEIS:
            valor = request.form.get(chave, "").strip()
            if valor:
                novos[chave] = valor
        novos["IMOAUTO_DRY_RUN"] = "1" if request.form.get("IMOAUTO_DRY_RUN") else "0"
        novos["IMOAUTO_APROVAR_POSTS"] = \
            "1" if request.form.get("IMOAUTO_APROVAR_POSTS") else "0"
        config.escrever_env(novos)
        flash("Guardado. Já está a valer — não precisas de reiniciar nada.")
        return redirect(url_for("configuracao"))

    return render_template(
        "config.html", **_comum("config"),
        campos=config.CAMPOS_EDITAVEIS, grupos=GRUPOS,
        valores={c[0]: config.valor_atual(c[0]) for c in config.CAMPOS_EDITAVEIS},
        dry_run=config.DRY_RUN, aprovar=config.APROVACAO_MANUAL_POSTS,
    )


def correr(porta=5000, publico=False):
    store.iniciar()
    endereco = "0.0.0.0" if publico else "127.0.0.1"
    print(f"\n  Painel do {config.MARCA} aberto em:  http://localhost:{porta}\n")
    app.run(host=endereco, port=porta)


if __name__ == "__main__":
    correr()

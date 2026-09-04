"""
Base comum dos subagentes.

Um subagente = instruções + uma chamada ao modelo + resposta estruturada.
Sem estado partilhado: o que precisa de persistir vai para o store.
"""

import json
import re

from imoauto import config, store

try:
    import anthropic
except ImportError:
    anthropic = None

_cliente = None


def cliente():
    global _cliente
    if _cliente is None:
        if anthropic is None:
            raise RuntimeError("Instala o pacote: pip install anthropic")
        if not config.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY não configurada")
        _cliente = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
    return _cliente


class Subagente:
    """Especialista com um trabalho só."""

    nome = "subagente"
    descricao = ""
    instrucoes = "És um assistente."
    modelo = None
    max_tokens = 2000

    def pensar(self, pedido, contexto=None, json_esperado=False):
        """Faz uma pergunta ao modelo e devolve texto (ou dict, se JSON)."""
        mensagem = pedido
        if contexto:
            mensagem = (
                f"{pedido}\n\n<contexto>\n"
                f"{json.dumps(contexto, ensure_ascii=False, indent=2)}\n</contexto>"
            )
        if json_esperado:
            mensagem += (
                "\n\nResponde apenas com JSON válido, sem texto à volta "
                "e sem blocos de código."
            )

        resposta = cliente().messages.create(
            model=self.modelo or config.MODELO_PRINCIPAL,
            max_tokens=self.max_tokens,
            system=self.instrucoes,
            messages=[{"role": "user", "content": mensagem}],
        )
        texto = "".join(
            bloco.text for bloco in resposta.content if bloco.type == "text"
        ).strip()
        store.registar(self.nome, "pensou", texto[:600])

        if json_esperado:
            return extrair_json(texto)
        return texto


def extrair_json(texto):
    """Aceita JSON puro ou dentro de ```json — devolve sempre dict/list."""
    limpo = texto.strip()
    bloco = re.search(r"```(?:json)?\s*(.+?)```", limpo, re.DOTALL)
    if bloco:
        limpo = bloco.group(1).strip()
    try:
        return json.loads(limpo)
    except json.JSONDecodeError:
        inicio = min(
            (i for i in (limpo.find("{"), limpo.find("[")) if i >= 0),
            default=-1,
        )
        fim = max(limpo.rfind("}"), limpo.rfind("]"))
        if inicio >= 0 and fim > inicio:
            return json.loads(limpo[inicio:fim + 1])
        raise

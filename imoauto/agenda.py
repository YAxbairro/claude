"""
Agenda — a ronda diária à hora marcada.

Corre num fio em segundo plano, dentro do mesmo programa. Acorda de dez em
dez minutos, vê se já é a hora, e se for faz a ronda. Uma ronda por hora
marcada, mesmo que o computador tenha estado desligado a essa hora exata.
"""

import datetime
import threading
import time

from imoauto import store

INTERVALO = 600  # verifica de 10 em 10 minutos


def _marca_da_hora(agora, hora):
    return f"{agora:%Y-%m-%d}:{hora:02d}"


def horas_em_falta(agora=None):
    """Que rondas de hoje ainda não foram feitas (e já passou a hora)."""
    agora = agora or datetime.datetime.now()
    feitas = set(store.ler_definicao("rondas_feitas", []))
    return [h for h in store.horas_da_ronda()
            if agora.hour >= h and _marca_da_hora(agora, h) not in feitas]


def marcar_feita(hora, agora=None):
    agora = agora or datetime.datetime.now()
    feitas = store.ler_definicao("rondas_feitas", [])
    feitas.append(_marca_da_hora(agora, hora))
    store.guardar_definicao("rondas_feitas", feitas[-60:])


def proxima_ronda(agora=None):
    """A que horas é a próxima, para mostrar no painel."""
    agora = agora or datetime.datetime.now()
    horas = store.horas_da_ronda()
    if not horas:
        return None
    feitas = set(store.ler_definicao("rondas_feitas", []))
    for hora in horas:
        if agora.hour < hora or _marca_da_hora(agora, hora) not in feitas:
            if agora.hour < hora:
                return agora.replace(hour=hora, minute=0, second=0, microsecond=0)
    amanha = agora + datetime.timedelta(days=1)
    return amanha.replace(hour=horas[0], minute=0, second=0, microsecond=0)


def correr_em_fundo(fazer_ronda):
    """Arranca o vigia em segundo plano. `fazer_ronda` é o que executa."""

    def ciclo():
        while True:
            try:
                for hora in horas_em_falta():
                    store.registar("agenda", "ronda_automatica", f"hora {hora}")
                    marcar_feita(hora)
                    fazer_ronda()
            except Exception as erro:
                store.registar("agenda", "erro", str(erro))
            time.sleep(INTERVALO)

    fio = threading.Thread(target=ciclo, daemon=True)
    fio.start()
    return fio

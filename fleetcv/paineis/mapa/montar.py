# -*- coding: utf-8 -*-
"""Mete as partes comuns — o mapa da Praia e a nuvem — dentro de cada painel.

Os painéis são ficheiros únicos — abrem com dois cliques, sem servidor,
sem internet. Por isso o mapa tem de ir lá dentro. Este script é que o
põe lá, para não andarmos a copiar à mão e ficarem versões diferentes.
"""
import io, os, re, sys

INI = '/*<<<MAPA*/'
FIM = '/*MAPA>>>*/'

# Os módulos estão sempre ao lado deste script. Os painéis podem estar
# ao lado dele (como na bancada de trabalho) ou um andar acima (como no
# repositório, onde o mapa vive na sua própria pasta). Assim o mesmo
# comando funciona nos dois sítios.
AQUI = os.path.dirname(os.path.abspath(__file__))
MODULOS = ('mapa_praia.js', 'mapa_render.js', 'nuvem.js')
PAINEIS = ('painel_condutor.html', 'painel_dono.html')


def por_omissao():
    for base in (AQUI, os.path.dirname(AQUI)):
        v = [os.path.join(base, n) for n in PAINEIS]
        if all(os.path.isfile(f) for f in v):
            return v
    raise SystemExit('montar.py: nao encontrei os paineis nem em %s nem um '
                     'andar acima' % AQUI)


def montar(painel):
    h = io.open(painel, encoding='utf-8').read()
    bloco = INI + '\n' + '\n'.join(
        io.open(os.path.join(AQUI, f), encoding='utf-8').read().rstrip()
        for f in MODULOS) + '\n' + FIM
    if INI in h:
        h = re.sub(re.escape(INI) + r'.*?' + re.escape(FIM), lambda m: bloco, h, flags=re.S)
    else:
        alvo = '<script>\n(function(){\n"use strict";'
        assert alvo in h, painel + ': nao encontrei onde meter o mapa'
        h = h.replace(alvo, '<script>\n' + bloco + '\n</script>\n\n' + alvo, 1)
    io.open(painel, 'w', encoding='utf-8').write(h)
    print('%-22s %6d bytes' % (painel, len(h.encode('utf-8'))))

for f in (sys.argv[1:] or por_omissao()):
    montar(f)

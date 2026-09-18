# -*- coding: utf-8 -*-
"""Mete as partes comuns — o mapa da Praia e a nuvem — dentro de cada painel.

Os painéis são ficheiros únicos — abrem com dois cliques, sem servidor,
sem internet. Por isso o mapa tem de ir lá dentro. Este script é que o
põe lá, para não andarmos a copiar à mão e ficarem versões diferentes.
"""
import io, re, sys

INI = '/*<<<MAPA*/'
FIM = '/*MAPA>>>*/'

def montar(painel):
    h = io.open(painel, encoding='utf-8').read()
    bloco = INI + '\n' + '\n'.join(
        io.open(f, encoding='utf-8').read().rstrip()
        for f in ('mapa_praia.js', 'mapa_render.js', 'nuvem.js')) + '\n' + FIM
    if INI in h:
        h = re.sub(re.escape(INI) + r'.*?' + re.escape(FIM), lambda m: bloco, h, flags=re.S)
    else:
        alvo = '<script>\n(function(){\n"use strict";'
        assert alvo in h, painel + ': nao encontrei onde meter o mapa'
        h = h.replace(alvo, '<script>\n' + bloco + '\n</script>\n\n' + alvo, 1)
    io.open(painel, 'w', encoding='utf-8').write(h)
    print('%-22s %6d bytes' % (painel, len(h.encode('utf-8'))))

for f in (sys.argv[1:] or ['painel_condutor.html', 'painel_dono.html']):
    montar(f)

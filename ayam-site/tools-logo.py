# -*- coding: utf-8 -*-
"""Limpa o logótipo extraído do PDF e gera assets/ayam-logo.webp.

O original saiu de um PDF como JPEG de baixa resolução: dentro das áreas
chapadas tinha ruído de mosquito (pontos roxos e verdes no bordô, um padrão de
xadrez no dourado) e as arestas estavam moles. Isto não inventa detalhe — o
detalhe perdido só volta com o ficheiro vectorial original da marca. O que faz
é tirar o ruído que a compressão acrescentou, e isso é bem visível.

Passos: pintar o transparente com a cor média (senão o filtro espalha lixo das
bordas), mediana para matar o ruído, ampliar, encostar a uma paleta de 14 cores
SEM difusão (a difusão é o que cria o xadrez), endurecer o alfa, gravar sem
perdas — num desenho de cores chapadas o sem-perdas é mais nítido E mais leve.
"""
from PIL import Image, ImageFilter
import os

SRC   = 'fontes/ayam-logo-original.webp'   # o que saiu do PDF, fora de assets/ para não ir para o alojamento
OUT   = 'assets/ayam-logo.webp'
LARG  = 960          # cobre 296px de CSS em ecrãs 3x
CORES = 14

src = Image.open(SRC).convert('RGBA')
r, g, b, a = src.split()
rgb = Image.merge('RGB', (r, g, b))

mask = a.point(lambda v: 255 if v > 8 else 0)
tmp = rgb.copy(); tmp.putalpha(mask)
px = [p[:3] for p in tmp.getdata() if p[3] > 0]
avg = tuple(sum(c[i] for c in px) // len(px) for i in range(3))

flat = Image.composite(rgb, Image.new('RGB', src.size, avg), mask)
den  = flat.filter(ImageFilter.MedianFilter(3))

alt = int(round(LARG * src.height / src.width))
den = den.resize((LARG, alt), Image.LANCZOS)
aa  = a.filter(ImageFilter.MedianFilter(3)).resize((LARG, alt), Image.LANCZOS)
aa  = aa.point(lambda v: 0 if v < 40 else (255 if v > 205 else int((v - 40) * 255 / 165)))

out = den.quantize(colors=CORES, method=Image.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
out.putalpha(aa)
out.save(OUT, 'WEBP', lossless=True, quality=100, method=6)

n = len(out.convert('RGB').getcolors(maxcolors=300000))
print('%s — %dx%d · %d cores · %.0f KB' % (OUT, out.width, out.height, n, os.path.getsize(OUT)/1024))

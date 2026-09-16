# -*- coding: utf-8 -*-
"""Gera o mapa-múndi em pontos a partir de um raster equirectangular.

O sistema de coordenadas é o mesmo que o SVG usa: 1000 unidades para 360° de
longitude, e a latitude vai de +78 a -56. Assim os arcos e os pinos desenhados
no SVG assentam no mapa sem qualquer conversão.
"""
from PIL import Image, ImageDraw

SRC = 'wm-equirectangular.jpg'   # NASA Blue Marble, domínio público, equirectangular
LAT_TOP, LAT_BOT = 78.0, -56.0
SCALE = 1000.0 / 360.0                      # unidades SVG por grau
VB_W  = 1000.0
VB_H  = (LAT_TOP - LAT_BOT) * SCALE         # 372.2

PX   = 2                                    # 2 píxeis por unidade SVG (retina)
STEP = 5.2                                  # espaçamento da grelha, em unidades
RAD  = 1.25                                 # raio do ponto, em unidades

src = Image.open(SRC).convert('RGB')
SW, SH = src.size
sp = src.load()

def is_land(lon, lat):
    x = (lon + 180.0) / 360.0 * (SW - 1)
    y = (90.0 - lat) / 180.0 * (SH - 1)
    hit = 0; tot = 0
    for dx in (-2, 0, 2):
        for dy in (-2, 0, 2):
            xx = int(min(SW - 1, max(0, x + dx)))
            yy = int(min(SH - 1, max(0, y + dy)))
            r, g, b = sp[xx, yy]
            tot += 1
            if not (b > r + 8 and b > g + 8):
                hit += 1
    return hit / tot >= 0.34

W, H = int(VB_W * PX), int(VB_H * PX)
img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
dr = ImageDraw.Draw(img)

BURGUNDY = (91, 26, 20)
n = 0
uy = 0.0
while uy <= VB_H:
    lat = LAT_TOP - uy / SCALE
    ux = 0.0
    while ux <= VB_W:
        lon = ux / SCALE - 180.0
        if is_land(lon, lat):
            # os pontos esbatem-se para os extremos: o olho fica no centro do mapa
            edge = min(1.0, (VB_H / 2 - abs(uy - VB_H / 2)) / (VB_H * 0.22))
            a = int(52 + 46 * max(0.0, edge))
            cx, cy = ux * PX, uy * PX
            r = RAD * PX
            dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BURGUNDY + (a,))
            n += 1
        ux += STEP
    uy += STEP

out = 'assets/map-dots.webp'
img.save(out, 'WEBP', quality=88, method=6)
import os
print('%d pontos · %dx%d · %.0f KB' % (n, W, H, os.path.getsize(out) / 1024))
print('viewBox do SVG: 0 0 %.0f %.1f' % (VB_W, VB_H))
img.save('/tmp/map-preview.png')

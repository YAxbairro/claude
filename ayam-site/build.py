# -*- coding: utf-8 -*-
"""Gera o index.html autónomo (para alojar) a partir de _content.html.

_content.html é a fonte: contém o <title>, os <link> e todo o markup, mas sem
<head> nem <body> — é também o ficheiro que se publica como Artifact, onde a
plataforma fornece esse invólucro. Aqui acrescentamos o invólucro completo.
"""
import io

MARK = '<link rel="stylesheet" href="styles.css">'

src = io.open('_content.html', encoding='utf-8').read()
if MARK not in src:
    raise SystemExit('erro: não encontrei "%s" em _content.html' % MARK)

i = src.index(MARK) + len(MARK)
head_part, body_part = src[:i], src[i:]

HEAD_EXTRA = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#140604">
<link rel="icon" href="assets/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="assets/favicon.png">

<meta property="og:type" content="website">
<meta property="og:site_name" content="AYAM Viagens &amp; Turismo">
<meta property="og:title" content="AYAM Viagens &amp; Turismo — O mundo à sua medida">
<meta property="og:description" content="Agência de viagens 100% cabo-verdiana. Bilhetes aéreos, viagens corporativas e particulares, pacotes sob medida.">
<meta property="og:image" content="assets/hero.jpg">
<meta property="og:locale" content="pt_CV">
<meta name="twitter:card" content="summary_large_image">

<style>[hidden]{display:none!important}</style>
'''

out = ('<!DOCTYPE html>\n<html lang="pt">\n<head>\n'
       + HEAD_EXTRA + head_part.strip() + '\n</head>\n<body>\n'
       + body_part.strip() + '\n</body>\n</html>\n')

io.open('index.html', 'w', encoding='utf-8').write(out)
print('index.html gerado —', len(out.encode('utf-8')) // 1024, 'KB')

import sys
pages = {
 'pt': dict(title='Manual de Apoio aos<br>Observadores', sub='Eleição Presidencial, 15 de Novembro de 2026', qr='Para mais informações', lang='pt'),
 'fr': dict(title='Manuel d’Appui aux<br>Observateurs Électoraux', sub='Élection Présidentielle, le 15 novembre 2026', qr='Pour plus d’informations', lang='fr'),
 'en': dict(title='Support Manual for<br>Election Observers', sub='Presidential Election, 15 November 2026', qr='For more information', lang='en'),
}
tpl = open('tpl.html').read()
for k,v in pages.items():
    h = tpl
    for kk,vv in v.items(): h = h.replace('{{'+kk+'}}', vv)
    open(f'cover_{k}.html','w').write(h)

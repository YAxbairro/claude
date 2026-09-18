import json, urllib.request, urllib.parse, time, sys
Q = '[out:json][timeout:90];node["place"](14.885,-23.575,14.975,-23.455);out body;'
ESP = ['https://overpass.kumi.systems/api/interpreter',
       'https://overpass.private.coffee/api/interpreter',
       'https://overpass.osm.jp/api/interpreter',
       'https://overpass-api.de/api/interpreter']
d = urllib.parse.urlencode({'data': Q}).encode()
for volta in range(3):
    for u in ESP:
        try:
            j = json.loads(urllib.request.urlopen(u, d, timeout=120).read().decode())
            locais = [{'nome': e['tags']['name'], 'lat': round(e['lat'],5),
                       'lon': round(e['lon'],5), 'tipo': e['tags'].get('place')}
                      for e in j['elements'] if e.get('tags',{}).get('name')]
            json.dump(locais, open('locais.json','w'), ensure_ascii=False)
            print('FONTE', u, '->', len(locais))
            for l in locais: print(l['tipo'], '·', l['nome'])
            sys.exit(0)
        except Exception as ex:
            print('falhou', u, type(ex).__name__, str(ex)[:60]); time.sleep(4)
print('TODOS FALHARAM')

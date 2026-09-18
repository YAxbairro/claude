# -*- coding: utf-8 -*-
"""Junta os dois painéis num ficheiro só, com um ecrã de escolha à entrada.

Os dois painéis continuam a existir e a funcionar sozinhos — este script
não lhes toca, só os lê. Correr sempre depois de mexer num deles:

    python3 juntar.py

Como é que dois programas cabem no mesmo ficheiro sem se estorvarem:

  · O CSS — os dois usam os mesmos nomes de classe (.cartao, .bt, ...) com
    medidas diferentes. Cada folha passa a valer só dentro de `body.condutor`
    ou `body.dono`, por isso nunca se pisam. As cores e o tipo de letra são
    comuns aos dois e ficam de fora, escritos uma vez.
  · O programa — cada painel passa de "corre já" a "uma função que se chama".
    Só arranca aquele que o utilizador escolheu, por isso os cliques, os
    relógios e o ecrã são sempre de um só.
  · O mapa da Praia — vai uma vez só, e serve os dois.
"""
import io, re, sys, subprocess

# Os painéis levam lá dentro uma cópia do mapa e da nuvem. Se um
# desses módulos mudou e os painéis não foram montados, juntava-se
# aqui uma versão velha sem dar erro nenhum — por isso monta-se
# sempre primeiro.
subprocess.run([sys.executable, 'montar.py'], check=True)

COND, DONO = 'painel_condutor.html', 'painel_dono.html'
SAIDA = 'fleetcv.html'
MARCA_INI, MARCA_FIM = '/*<<<MAPA*/', '/*MAPA>>>*/'


def blocos(css):
    """Parte o CSS em (seletor, corpo) do primeiro nível, com aninhados."""
    fora, i, n = [], 0, len(css)
    while i < n:
        j = css.find('{', i)
        if j < 0:
            break
        sel = css[i:j].strip()
        prof, k = 1, j + 1
        while k < n and prof:
            if css[k] == '{':
                prof += 1
            elif css[k] == '}':
                prof -= 1
            k += 1
        fora.append((sel, css[j + 1:k - 1]))
        i = k
    return fora


COMUM = re.compile(r'^(\*|html|body|:root)\b')


def e_comum(sel):
    return all(COMUM.match(s.strip()) for s in sel.split(','))


def escopar(sel, classe):
    return ', '.join('body.' + classe + ' ' + s.strip() for s in sel.split(','))


def separar(css, classe):
    """Devolve (comum, próprio). O comum é igual nos dois painéis."""
    comum, proprio = [], []
    for sel, corpo in blocos(css):
        if sel.startswith('@keyframes'):
            proprio.append(sel + '-' + classe + '{' + corpo + '}')
        elif sel.startswith('@media') and ':root' in corpo:
            comum.append(sel + '{' + corpo + '}')
        elif sel.startswith('@media'):
            dentro = [(e_comum(s) and s or escopar(s, classe)) + '{' + c + '}'
                      for s, c in blocos(corpo)]
            proprio.append(sel + '{' + ''.join(dentro) + '}')
        elif e_comum(sel):
            comum.append(sel + '{' + corpo + '}')
        else:
            proprio.append(escopar(sel, classe) + '{' + corpo + '}')
    proprio = '\n'.join(proprio)
    for nome in re.findall(r'@keyframes\s+([\w-]+?)-' + classe, proprio):
        proprio = re.sub(r'(animation\s*:[^;}]*?\b)' + nome + r'\b',
                         r'\1' + nome + '-' + classe, proprio)
    return '\n'.join(comum), proprio


def ler(p):
    h = io.open(p, encoding='utf-8').read()
    css = h[h.index('<style>') + 7:h.index('</style>')]
    corpo = h[h.index('</style>') + 8:h.index('<script>')].strip()
    prog = h[h.rindex('<script>') + 8:h.rindex('</script>')]
    mapa = ''
    if MARCA_INI in h:
        a = h.index(MARCA_INI) + len(MARCA_INI)
        mapa = h[a:h.index(MARCA_FIM)]
    return css, corpo, prog, mapa


def funcao(prog, nome):
    """(function(){ … })(); passa a function nome(){ … }"""
    a = prog.index('(function(){')
    b = prog.rindex('})();')
    return 'function ' + nome + '(){\n' + prog[a + len('(function(){'):b] + '}\n'


cssC, corpoC, progC, mapa = ler(COND)
cssD, corpoD, progD, _ = ler(DONO)
comumC, soC = separar(cssC, 'condutor')
comumD, soD = separar(cssD, 'dono')
# as quebras de linha não contam; o que conta é dizerem o mesmo
def limpo(t):
    return sorted(x.strip() for x in re.sub(r'\s+', ' ', t).split(';') if x.strip())
if limpo(comumC) != limpo(comumD):
    soC_ = set(limpo(comumC)) - set(limpo(comumD))
    soD_ = set(limpo(comumD)) - set(limpo(comumC))
    sys.exit('O que devia ser igual nos dois painéis deixou de ser:\n'
             '  só no condutor: %s\n  só no dono:     %s\n'
             'Iguala-os nos dois antes de juntar.'
             % (sorted(soC_)[:4], sorted(soD_)[:4]))

# o botão de trocar de painel fica no cabeçalho, fora do que os
# programas repintam, senão desaparecia a cada actualização do ecrã
def com_trocar(corpo):
    return corpo.replace('<div class="dir" id="dir"></div>',
        '<div class="dir" id="dir"></div>\n'
        '  <button class="trocar" id="trocar" title="Trocar de painel">⇄</button>', 1)

CHOOSER_CSS = '''
body.escolher{justify-content:center; align-items:center; overflow:auto; padding:28px 18px}
.escolha-cx{width:100%; max-width:410px; display:flex; flex-direction:column; gap:12px}
.escolha-cx .marca{font-family:var(--display); font-weight:700; font-size:27px;
  letter-spacing:-.025em; display:flex; gap:11px; align-items:center}
.escolha-cx .marca .pt{width:11px; height:11px; border-radius:50%;
  background:var(--accent)}
.escolha-cx>p{margin:3px 0 14px 22px; color:var(--muted); font-size:14.5px}
.porta{display:flex; align-items:center; gap:15px; width:100%; text-align:left;
  padding:18px 17px; border-radius:16px; border:1px solid var(--line);
  background:var(--surface); box-shadow:var(--sombra); cursor:pointer;
  font-family:var(--sans); color:var(--ink);
  transition:border-color .15s ease, transform .12s ease}
.porta:hover{border-color:var(--accent)}
.porta:active{transform:scale(.988)}
.porta:focus-visible{outline:2px solid var(--accent); outline-offset:2px}
.porta .ic{flex:none; width:48px; height:48px; border-radius:14px; display:grid;
  place-items:center; background:var(--accent-wash); color:var(--accent)}
.porta .ic svg{width:25px; height:25px; display:block}
.porta .t{font-family:var(--display); font-size:17px; font-weight:700;
  letter-spacing:-.012em; display:block}
.porta .d{display:block; margin-top:3px; font-size:13.5px; color:var(--muted);
  line-height:1.42}
.porta .seta{margin-left:auto; color:var(--line); font-size:24px; font-weight:300;
  line-height:1}
.porta:hover .seta{color:var(--accent)}
.escolha-cx .pe{margin:12px 2px 0; font-size:12.5px; color:var(--muted);
  line-height:1.55}
.escolha-cx .pe b{font-weight:600; color:var(--ink)}
.trocar{flex:none; width:31px; height:31px; margin-left:7px; border-radius:9px;
  border:1px solid var(--line); background:var(--surface2); color:var(--muted);
  font-size:14px; cursor:pointer; display:grid; place-items:center;
  font-family:var(--sans)}
.trocar:hover{border-color:var(--accent); color:var(--accent)}
'''

PORTEIRO = '''
/* ─── o porteiro ──────────────────────────────────────────
   Decide qual dos dois painéis arranca. A escolha fica guardada,
   por isso só se pergunta na primeira vez; o botão ⇄ no cabeçalho
   volta a perguntar.                                              */
(function(){
  "use strict";
  var QUEM='fleetcv-quem';
  var sv=function(d){ return '<svg viewBox="0 0 24 24" fill="none" '+
    'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" '+
    'stroke-linejoin="round" aria-hidden="true">'+d+'</svg>'; };
  /* um volante para quem conduz, uma chave para quem e dono */
  var IC_VOLANTE=sv('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3"/>'+
    '<path d="M3.3 10.2h6.1M14.6 10.2h6.1M12 15v6"/>');
  var IC_CHAVE=sv('<circle cx="8.5" cy="8.5" r="4.5"/>'+
    '<path d="M11.7 11.7 20 20M17.2 17.2l-2 2M19.6 14.8l-2 2"/>');
  var CORPOS={
    condutor:%(corpoC)s,
    dono:%(corpoD)s };

  function arrancar(quem){
    document.body.className=quem;
    document.body.innerHTML=CORPOS[quem];
    var b=document.getElementById('trocar');
    if(b) b.onclick=function(){
      try{ localStorage.removeItem(QUEM); }catch(e){}
      location.reload(); };
    if(quem==='condutor') appCondutor(); else appDono();
  }

  function perguntar(){
    document.body.className='escolher';
    document.body.innerHTML=
      '<div class="escolha-cx">'+
      '<div class="marca"><span class="pt"></span>FleetCV</div>'+
      '<p>Controlo de frota para táxis, na Praia.</p>'+
      '<button class="porta" data-quem="condutor">'+
        '<span class="ic">'+IC_VOLANTE+'</span>'+
        '<span><span class="t">Sou condutor</span>'+
        '<span class="d">Abrir turno, marcar os km, abastecer e fechar o dia.</span>'+
        '</span><span class="seta">\\u203A</span></button>'+
      '<button class="porta" data-quem="dono">'+
        '<span class="ic">'+IC_CHAVE+'</span>'+
        '<span><span class="t">Sou o proprietário</span>'+
        '<span class="d">Ver os carros ao vivo, os turnos, os alertas e as contas.</span>'+
        '</span><span class="seta">\\u203A</span></button>'+
      '<p class="pe">A escolha fica guardada neste telemóvel. Para trocar, '+
      'carregue em <b>\\u21C4</b> no canto de cima.</p></div>';
    Array.prototype.forEach.call(document.querySelectorAll('[data-quem]'),
      function(x){ x.onclick=function(){
        var q=x.getAttribute('data-quem');
        try{ localStorage.setItem(QUEM,q); }catch(e){}
        arrancar(q); }; });
  }

  var guardado=null;
  try{ guardado=localStorage.getItem(QUEM); }catch(e){}
  if(guardado==='condutor'||guardado==='dono') arrancar(guardado); else perguntar();
})();
'''

import json
saida = u'''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<title>FleetCV</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">

<style>
/* ── o que é igual nos dois painéis: cores, letra, base ── */
%(comum)s
/* ── o ecrã de escolha ── */
%(escolha)s
</style>

<style>
/* ── só dentro do painel do condutor ── */
%(soC)s
</style>

<style>
/* ── só dentro do painel do proprietário ── */
%(soD)s
</style>

<body>

<script>
%(mapa)s
</script>

<script>
%(fC)s
</script>

<script>
%(fD)s
</script>

<script>
%(porteiro)s
</script>
''' % {
  'comum': comumC,
  'escolha': CHOOSER_CSS.strip(),
  'soC': soC,
  'soD': soD,
  'mapa': mapa.strip(),
  'fC': funcao(progC, 'appCondutor'),
  'fD': funcao(progD, 'appDono'),
  'porteiro': (PORTEIRO % {
      'corpoC': json.dumps(com_trocar(corpoC)),
      'corpoD': json.dumps(com_trocar(corpoD))}).strip(),
}

io.open(SAIDA, 'w', encoding='utf-8').write(saida)
print('%-22s %6d bytes  (condutor %d + dono %d + mapa %d)'
      % (SAIDA, len(saida.encode('utf-8')), len(soC), len(soD), len(mapa)))

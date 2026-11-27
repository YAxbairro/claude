import re
GEN = re.compile(r'^\s*(Lei Constitucional|Lei|Decreto-Lei|Decreto-[Ll]egislativo|Decreto Legislativo|Decreto-Regulamentar|Decreto Regulamentar|Decreto|Resolução|Portaria( Conjunta)?|Despacho|Declaração de [Rr]ectificação|Rectificação|Retificação)\s+n\.?\s*[º°oO]?\.?\s*[\w./-]+\s*$')
DATE = re.compile(r'^\s*de\s+\d{1,2}\s+de\s+[A-Za-zçÇ]+', re.I)
def canon(s):
    s=s.strip().rstrip(':').lower()
    m=re.match(r'([a-zçãé \-]+?)\s+n\.?\s*[º°o]?\.?\s*([\w./-]+)$', s)
    if not m: return None
    return (re.sub(r'[\s-]','',m.group(1)), m.group(2))
def headers(lines, dated=True):
    hs=[]
    for i,l in enumerate(lines):
        if GEN.match(l) and not l.strip().endswith(':'):
            nxt=[x for x in lines[i+1:i+4] if x.strip()]
            if not dated or (nxt and DATE.match(nxt[0])): hs.append(i)
    return hs
def slice_act(text, act):
    lines=text.split('\n'); key=canon(act)
    dated=headers(lines,True)
    for k,i in enumerate(dated):
        if canon(lines[i])==key:
            end=dated[k+1] if k+1<len(dated) else len(lines)
            return '\n'.join(lines[i:end])
    # fallback: undated header occurrence (not in the index)
    for i in headers(lines,False):
        if canon(lines[i])==key:
            later=[j for j in dated if j>i]
            end=later[0] if later else len(lines)
            return '\n'.join(lines[i:end])
    return None

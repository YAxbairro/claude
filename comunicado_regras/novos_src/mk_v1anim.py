# Gera assets (ícones PNG A/B, imagens) e motion/v1/beats.js para o motor v1anim.html, a partir do storyboard aprovado.
import sys,os,json,re,unicodedata; HERE=os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0,HERE)
import bp_v1beats as BB, bp_v1all as V
from PIL import Image
D=HERE+'/motion/v1'; os.makedirs(D,exist_ok=True)
def ic(kind,col,name):
    im=Image.new('RGBA',(600,600),(0,0,0,0)); V.icon(im,kind,300,300,440,col,V.RED,w=17); im.save(f'{D}/{name}.png')
kinds=set()
for b in BB.B:
    if isinstance(b[3],list): kinds|={k for k in b[3] if k.islower()}
kinds|={'mesa4row','cne','pessoas','cracha','mesa4pres'}
for k in kinds:
    ic(k,V.WHITE,k+'_A'); ic(k,V.CBLUE,k+'_B')
# relógio sem ponteiros (ponteiros animados em SVG)
for st,col in(('A',V.WHITE),('B',V.CBLUE)):
    im=Image.new('RGBA',(600,600),(0,0,0,0)); d=V.ImageDraw.Draw(im); w=17; k=4.4
    d.ellipse((300-42*k,300-42*k,300+42*k,300+42*k),outline=col,width=w); im.save(f'{D}/relogio0_{st}.png')
V.S12.URNA.save(D+'/urna.png'); V.S12.PAL.save(D+'/palacio.png')
V.LOGO_COR.save(D+'/le.png'); V.LOGO_CNE.save(D+'/lc.png'); V.LOGO_COR_W.save(D+'/le_w.png'); V.LOGO_CNE_W.save(D+'/lc_w.png')
# tempos das linhas a partir das palavras da locução
W=json.load(open(HERE+'/audio/V1_acesso_words.json'))
norm=lambda s:''.join(c for c in unicodedata.normalize('NFKD',s.lower()) if c.isalnum())
def tsec(t): a,b=t.replace('s','').replace(',','.').split('–'); return float(a),float(b)
beats=[]
for n,st,tt,ics,kick,lines,mov in BB.B:
    t0,t1=tsec(tt); L=[]; prev=t0
    for i,(tx,ro) in enumerate(lines or []):
        fw=norm(tx.split()[0]); cand=[s for s,e,w in W if norm(w)==fw and prev-0.2<=s<t1-0.3]
        tin=cand[0] if cand else None; L.append([tx,ro,tin]); 
        if tin: prev=tin+0.1
    # preencher os que não casaram: espaçar entre vizinhos
    for i,l in enumerate(L):
        if l[2] is None: l[2]=max(prev if i==0 else L[i-1][2]+0.5, t0+0.35+i*0.45) if i else t0+0.35
    for i in range(1,len(L)): L[i][2]=max(L[i][2],L[i-1][2]+0.35)
    beats.append(dict(n=n,st=st,t0=t0,t1=t1,ics=ics if isinstance(ics,(list,str)) else list(ics),kick=kick,lines=L))
beats[-1]['t1']=88.74
open(D+'/beats.js','w').write('window.BEATS='+json.dumps(beats,ensure_ascii=False)+';')
for b in beats: print(b['n'],b['t0'],[round(l[2],1) for l in b['lines']])

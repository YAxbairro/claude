# Blueprint do VÍDEO 1 completo (10 cenas), mistura dos estilos A (azul institucional) e B (claro oficial).
# Reaproveita o código original dos estilos A/B (bp_ab.py). Uso: python3 bp_v1all.py <saida.jpg>
import sys,os; OUT=sys.argv[1]; HERE=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x',HERE+'/logos','.']
exec(open(HERE+'/bp_ab.py',encoding='utf-8').read().split('# ---------------- montagem')[0])
_icon=icon
def icon(b,kind,cx,cy,s,col,acc=RED,w=None):
    d=ImageDraw.Draw(b); w=w or max(3,int(s*.07)); k=s/100; P=lambda x,y:(cx+(x-50)*k,cy+(y-50)*k)
    def ln(*pts,c=col): d.line([P(*p) for p in pts],fill=c,width=w,joint='curve')
    def el(x0,y0,x1,y1,c=col): d.ellipse((*P(x0,y0),*P(x1,y1)),outline=c,width=w)
    def ar(x0,y0,x1,y1,c=col): d.arc((*P(x0,y0),*P(x1,y1)),180,360,fill=c,width=w)
    if kind=='mesa4':   # 4 pessoas, presidente da mesa ao centro e à frente; tudo da mesma cor
        for x in (16,84): el(x-10,6,x+10,26); ar(x-15,30,x+15,70)
        el(30,2,46,18); el(54,2,70,18)
        el(39,20,61,42); ar(32,46,68,88)
        ln((0,72),(100,72)); ln((8,72),(8,100)); ln((92,72),(92,100)); return
    if kind=='cne':     # representante da CNE: pessoa com colete + escudo/crachá
        el(38,4,62,28); ln((18,96),(18,56),(32,38),(68,38),(82,56),(82,96)); ln((40,38),(50,58),(60,38))
        ln((56,64),(66,59),(76,64),(76,75),(66,86),(56,75),(56,64),c=acc); ln((61,72),(65,77),(71,68),c=acc); return
    if kind=='boletim': # boletim de voto presidencial: candidatos com quadrados, um marcado com X
        d.rounded_rectangle((*P(14,2),*P(86,98)),int(6*k),outline=col,width=w)
        for i,y in enumerate((20,44,68)):
            el(22,y-7,36,y+7); ln((42,y),(62,y)); d.rectangle((*P(68,y-8),*P(80,y+8)),outline=col,width=w)
        ln((69,37),(79,51),c=acc); ln((79,37),(69,51),c=acc); return
    if kind=='eleitor_sai': # eleitor a sair pela porta, a caminhar, com seta
        d.rectangle((*P(62,6),*P(96,98)),outline=col,width=w); ln((62,98),(78,90),(78,14),(62,6))
        el(22,6,38,22); ln((30,24),(26,56)); ln((26,56),(14,96)); ln((26,56),(42,94)); ln((29,32),(14,48)); ln((29,32),(46,44))
        ln((4,74),(4,74)); return
    _icon(b,kind,cx,cy,s,col,acc,w)
S=[ # (estilo, t, ícones, kicker, linhas[(texto,papel)])
 ('A','0–5s',['boletim'],'15 DE NOVEMBRO',[('CABO VERDE VAI ÀS URNAS','n'),('ELEGER O PRESIDENTE','b'),('DA REPÚBLICA','r')]),
 ('B','5–10s',['porta'],'ATENÇÃO',[('O ACESSO E A PERMANÊNCIA','n'),('NAS ASSEMBLEIAS DE VOTO','n'),('SÃO RESTRITOS','r')]),
 ('A','10–22s',['cracha'],'CÓDIGO ELEITORAL',[('A CNE RECORDA:','n'),('APENAS PESSOAS','n'),('LEGALMENTE AUTORIZADAS','b'),('PODEM ENTRAR E PERMANECER','n'),('NO LOCAL DE VOTO','r')]),
 ('B','22–35s','LISTA','SÓ PODEM ENTRAR E PERMANECER',None),
 ('A','35–48s',['globo','cracha'],'OBSERVADORES INTERNACIONAIS',[('DEVIDAMENTE','n'),('CREDENCIADOS','b'),('SÓ O TEMPO NECESSÁRIO','n'),('À OBSERVAÇÃO','r')]),
 ('B','48–62s',['mesa4','cracha'],'PRESIDENTE DA MESA',[('DEVE EXIGIR E VERIFICAR','n'),('CREDENCIAIS E CRACHÁS','b'),('EMITIDOS PELA CNE','r'),('ANTES DE AUTORIZAR A PERMANÊNCIA','s')]),
 ('A','62–69s',['relogio'],'ELEITORES',[('SÓ PODEM PERMANECER','n'),('O TEMPO NECESSÁRIO','b'),('PARA VOTAR','r')]),
 ('B','69–75s',['saida'],'PRESIDENTE DA MESA',[('DETERMINA A SAÍDA','b'),('DE TODAS AS PESSOAS','n'),('NÃO AUTORIZADAS','r')]),
 ('A','75–82s',['eleitor_sai'],'CARO ELEITOR',[('APÓS VOTAR','n'),('ABANDONA O LOCAL','r'),('E RESPEITA AS ORIENTAÇÕES','s'),('DOS MEMBROS DA MESA','b')]),
 ('B','82–89s','FIM',None,[('JUNTOS POR ELEIÇÕES','n'),('LIVRES, JUSTAS E TRANSPARENTES','r')])]
SZ={'n':50,'b':72,'r':76,'s':38}
def fit(t,sz,mw):
    while f(sz).getlength(t)>mw and sz>24: sz-=2
    return sz
def textblock(b,st,x,y,lines,mw=840):
    d=ImageDraw.Draw(b); dense=len(lines)>=5; T=WHITE if st=='A' else NAVY
    for t,ro in lines:
        sz=fit(t,int(SZ[ro]*(.82 if dense else 1)),mw); y+=int(sz*1.05)
        if st=='A':   # A: caixas navy/vermelho em fundo azul
            tag(b,x,y,t,sz,{'n':'plain','s':'plain','b':'navy','r':'red'}[ro])
        else:         # B: texto navy/vermelho em fundo claro + traço vermelho (mistura com caixa navy do A no 'b')
            tag(b,x,y,t,sz,'plain',{'n':NAVY,'b':NAVY,'s':(70,80,110),'r':RED}[ro])
        y+=int(sz*.32)+12
    return y
def scene(sc):
    st,tt,ics,kick,lines=sc; b={'A':bg_A,'B':bg_B}[st]()
    if st=='B': paste(b,LOGO_COR,60,40,120); paste(b,LOGO_CNE,1560,60,80)
    else: paste(b,LOGO_COR_W,60,40,120); paste(b,LOGO_CNE_W,1560,60,80)
    I=WHITE if st=='A' else CBLUE
    if ics=='LISTA':
        kicker(b,st,140,250,kick)
        items=[('mesa4','MEMBROS','DA MESA (4)'),('cne','REPRESENTANTES','DA CNE E APOIO'),('pessoas','CANDIDATOS','E MANDATÁRIOS'),('cracha','DELEGADOS','DAS CANDIDATURAS')]
        for k,(ic,a,c) in enumerate(items):
            x=140+k*405; y=310
            card(b,(x,y,x+375,y+520),WHITE,32)
            icon(b,ic,x+187,y+180,200,CBLUE,RED,w=9)
            tag(b,x+34,y+390,a,fit(a,42,310),'plain',NAVY); tag(b,x+34,y+446,c,fit(c,30,310),'plain',RED)
        tag(b,140,920,'NOS TERMOS DA LEI',34,'plain',NAVY); return b
    if ics=='FIM':
        paste(b,LOGO_COR,960-int(LOGO_COR.width*300/LOGO_COR.height)//2,140,300); paste(b,LOGO_CNE,960-int(LOGO_CNE.width*100/LOGO_CNE.height)//2,490,100)
        d=ImageDraw.Draw(b); d.text((960,710),'JUNTOS POR ELEIÇÕES',font=f(50,7),fill=NAVY,anchor='ms'); d.text((960,800),'LIVRES, JUSTAS E TRANSPARENTES',font=f(68),fill=RED,anchor='ms'); return b
    ci=WHITE if st=='A' else CBLUE
    if st=='B': card(b,(220,290,800,830),WHITE,44)
    if len(ics)==1: icon(b,ics[0],510,560,360,ci,RED,w=13)
    else:
        icon(b,ics[0],395,540,230 if ics[0]!='mesa4' else 230,ci,RED,w=10); icon(b,ics[1],645,600,200,ci,RED,w=10)
    kicker(b,st,960,320,kick)
    textblock(b,st,960,350 if len(lines)>=4 else 380,lines,mw=880)
    return b
tw,th=640,360; gap=26; top=200; cols=4; rows=3
BW=gap+cols*(tw+gap); BH=top+rows*(th+70)+20
bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
d.text((40,62),'VÍDEO 1 · ACESSO E PERMANÊNCIA — todas as cenas (A e B alternados)',font=f(44),fill=WHITE,anchor='ls')
d.text((40,108),'A = azul institucional · B = claro oficial · alternam cena a cena · mesa: 4 pessoas, presidente ao centro (fica vermelho só na animação) · canto inferior direito livre para a intérprete',font=f(22,7),fill=(190,205,240),anchor='ls')
for i,sc in enumerate(S):
    x=gap+(i%cols)*(tw+gap); y=top+(i//cols)*(th+70)
    d.text((x,y-14),f'CENA {i+1} · {sc[1]} · ESTILO {sc[0]}',font=f(22),fill=NAVY if sc[0]=='B' else RED,anchor='ls')
    bd.paste(scene(sc).convert('RGB').resize((tw,th),Image.LANCZOS),(x,y)); d.rectangle((x-1,y-1,x+tw,y+th),outline=(200,205,215))
bd.save(OUT,quality=90); print('ok',bd.size)

# Blueprint do VÍDEO 1 completo (10 cenas), mistura dos estilos A (azul institucional) e B (claro oficial).
# Reaproveita o código original dos estilos A/B (bp_ab.py). Uso: python3 bp_v1all.py <saida.jpg>
import sys,os; OUT=sys.argv[1] if len(sys.argv)>1 else ''; HERE=os.path.dirname(os.path.abspath(__file__))
sys.argv=['x',HERE+'/logos','.']
exec(open(HERE+'/bp_ab.py',encoding='utf-8').read().split('# ---------------- montagem')[0])
import bp_s12 as S12   # cenas 1 (B) e 2 (D) escolhidas
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
    if kind in('mesa4row','mesa4pres'):   # sempre igual; nas cenas do presidente só ele fica destacado
        for i,x in enumerate((14,38,62,86)):
            c=acc if (kind=='mesa4pres' and i==1) else col; el(x-8,24,x+8,40,c); ar(x-12,46,x+12,74,c)
        ln((0,62),(100,62)); ln((8,62),(8,96)); ln((92,62),(92,96)); return
    if kind=='livro':   # Código Eleitoral
        d.rounded_rectangle((*P(20,6),*P(80,94)),int(5*k),outline=col,width=w); ln((30,6),(30,94)); ln((40,30),(70,30)); ln((40,42),(64,42))
        ln((62,94),(62,80),(68,86),(74,80),(74,94),c=acc); return
    if kind=='info':    # prestar informações
        d.rounded_rectangle((*P(6,10),*P(94,74)),int(10*k),outline=col,width=w); ln((24,74),(18,94),(44,74)); el(46,20,54,28,acc); ln((50,38),(50,62),c=acc); return
    if kind=='lupa':    # verificar crachá
        d.rounded_rectangle((*P(8,18),*P(56,92)),int(5*k),outline=col,width=w); ln((24,18),(24,8),(40,8),(40,18)); el(22,32,42,52); ln((18,66),(46,66)); ln((18,76),(40,76))
        el(48,40,84,76,acc); ln((80,72),(96,90),c=acc); return
    if kind=='tempo':   # ampulheta
        ln((22,6),(78,6)); ln((22,94),(78,94)); ln((28,6),(28,22),(50,50),(28,78),(28,94)); ln((72,6),(72,22),(50,50),(72,78),(72,94))
        ln((38,86),(50,72),(62,86),(38,86),c=acc); ln((40,24),(60,24),(50,36),(40,24),c=acc); return
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
 ('A','0–3,5s',['FOTO'],'15 DE NOVEMBRO',[('CABO VERDE VAI ÀS URNAS','n')]),
 ('A','3,5–5,6s',['PALACIO'],None,[('ELEGER O PRESIDENTE','b'),('DA REPÚBLICA','r')]),
 ('B','5–10s',['porta'],'ATENÇÃO',[('O ACESSO E A PERMANÊNCIA','n'),('NAS ASSEMBLEIAS DE VOTO','n'),('SÃO RESTRITOS','h')]),
 ('A','10–22s',['cracha'],'CÓDIGO ELEITORAL',[('A CNE RECORDA:','n'),('APENAS PESSOAS','n'),('LEGALMENTE AUTORIZADAS','b'),('PODEM ENTRAR E PERMANECER','n'),('NO LOCAL DE VOTO','r')]),
 ('B','22–35s','LISTA','SÓ PODEM ENTRAR E PERMANECER',None),
 ('A','35–48s',['globo','cracha'],'OBSERVADORES INTERNACIONAIS',[('DEVIDAMENTE','n'),('CREDENCIADOS','hn'),('SÓ O TEMPO NECESSÁRIO','n'),('À OBSERVAÇÃO','r')]),
 ('B','48–62s',['mesa4pres','cracha'],'PRESIDENTE DA MESA',[('DEVE EXIGIR E VERIFICAR','n'),('CREDENCIAIS E CRACHÁS','b'),('EMITIDOS PELA CNE','r'),('ANTES DE AUTORIZAR A PERMANÊNCIA','s')]),
 ('A','62–69s',['relogio'],'ELEITORES',[('SÓ PODEM PERMANECER','n'),('O TEMPO','hn'),('NECESSÁRIO','b'),('PARA VOTAR','r')]),
 ('B','69–75s',['mesa4pres','saida'],'PRESIDENTE DA MESA',[('DETERMINA A SAÍDA','b'),('DE TODAS AS PESSOAS','n'),('NÃO AUTORIZADAS','h')]),
 ('A','75–82s',['saida'],'CARO ELEITOR',[('APÓS VOTAR','n'),('ABANDONA O LOCAL','h'),('E RESPEITA AS ORIENTAÇÕES','s'),('DOS MEMBROS DA MESA','b')]),
 ('B','82–89s','FIM',None,[('JUNTOS POR ELEIÇÕES','n'),('LIVRES, JUSTAS E TRANSPARENTES','r')])]
SZ={'n':50,'b':72,'r':76,'s':38,'h':118,'hn':118}
def fit(t,sz,mw):
    while f(sz).getlength(t)>mw and sz>24: sz-=2
    return sz
def textblock(b,st,x,y,lines,mw=840):
    d=ImageDraw.Draw(b); dense=len(lines)>=5; T=WHITE if st=='A' else NAVY
    for t,ro in lines:
        sz=fit(t,int(SZ[ro]*(.82 if dense and ro[0]!='h' else 1)),mw); y+=int(sz*1.05)
        if st=='A':   # A: caixas navy/vermelho em fundo azul
            tag(b,x,y,t,sz,{'n':'plain','s':'plain','b':'navy','r':'red','h':'red','hn':'navy'}[ro])
        else:         # B: texto navy/vermelho em fundo claro + traço vermelho (mistura com caixa navy do A no 'b')
            tag(b,x,y,t,sz,'plain',{'n':NAVY,'b':NAVY,'s':(70,80,110),'r':RED,'h':RED,'hn':NAVY}[ro])
        y+=int(sz*.32)+12
    return y
def scene(sc):
    st,tt,ics,kick,lines=sc; b={'A':bg_A,'B':bg_B}[st]()
    if st=='B': paste(b,LOGO_COR,60,40,120); paste(b,LOGO_CNE,1560,60,80)
    else: paste(b,LOGO_COR_W,60,40,120); paste(b,LOGO_CNE_W,1560,60,80)
    I=WHITE if st=='A' else CBLUE
    if isinstance(ics,tuple) and ics[0]=='LISTA':
        foc=ics[1]; kicker(b,st,140,250,kick)
        items=[('mesa4row','MEMBROS','DA MESA (4)'),('cne','REPRESENTANTES','DA CNE E APOIO'),('pessoas','CANDIDATOS','E MANDATÁRIOS'),('cracha','DELEGADOS','DAS CANDIDATURAS')]
        order=[k for k in range(4) if k!=foc]+([foc] if foc is not None else [])
        for k in order:
            ic,a_,c=items[k]; l=Image.new('RGBA',b.size,(0,0,0,0)); x=140+k*405; y=340; sc_=1.0
            if foc is not None and k==foc: sc_=1.16
            cx,cy=x+187,y+260; W2,H2=375*sc_/2,520*sc_/2; X0,Y0=cx-W2,cy-H2
            card(l,(X0,Y0,X0+2*W2,Y0+2*H2),WHITE,32)
            if sc_>1: ImageDraw.Draw(l).rounded_rectangle((X0,Y0,X0+2*W2,Y0+2*H2),32,outline=RED,width=6)
            icon(l,ic,cx,Y0+180*sc_,200*sc_,CBLUE,RED,w=int(9*sc_))
            tag(l,X0+34,Y0+390*sc_,a_,fit(a_,int(42*sc_),int(310*sc_)),'plain',NAVY); tag(l,X0+34,Y0+446*sc_,c,fit(c,int(30*sc_),int(310*sc_)),'plain',RED)
            if foc is not None and k!=foc:
                al=np.asarray(l).copy(); al[...,3]=(al[...,3]*.35).astype('uint8'); l=Image.fromarray(al)
            if foc is not None and k>foc and False: pass
            if foc is not None and k not in range(0,foc+1) : l=Image.new('RGBA',b.size,(0,0,0,0))   # ainda não entrou
            b.alpha_composite(l)
        if foc is None: tag(b,140,920,'NOS TERMOS DA LEI',34,'plain',NAVY)
        return b
    if ics=='FIM':
        paste(b,LOGO_COR,960-int(LOGO_COR.width*300/LOGO_COR.height)//2,140,300); paste(b,LOGO_CNE,960-int(LOGO_CNE.width*100/LOGO_CNE.height)//2,490,100)
        d=ImageDraw.Draw(b); d.text((960,710),'JUNTOS POR ELEIÇÕES',font=f(50,7),fill=NAVY,anchor='ms'); d.text((960,800),'LIVRES, JUSTAS E TRANSPARENTES',font=f(68),fill=RED,anchor='ms'); return b
    if ics==['FOTO']: S12.c1_B(b); return b
    if ics==['FOTO2']:   # urna (foto) mais pequena, braço a sair pelo topo
        u=S12.rsH(S12.URNA,760); S12.shadow(b,(250,730,770,790)); b.alpha_composite(u,(510-u.width//2,-6)); ics=[]
    if ics==['PALACIO']: S12.c2_D(b); return b
    ci=WHITE if st=='A' else CBLUE
    if ics==['FOTO']:   # imagem sem fundo, sem moldura
        ph=Image.open(HERE+'/logos/urna_mao.png').convert('RGBA'); hh=920; ph=ph.resize((int(ph.width*hh/ph.height),hh),Image.LANCZOS)
        sh=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(sh).ellipse((200,820,880,880),fill=(0,20,60,110)); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
        b.alpha_composite(ph,(540-ph.width//2,-70))  # braço sai pelo topo do ecrã
        ics=[]
    if ics==['PALACIO']:   # Palácio do Plateau sem céu, base esbatida
        ph=Image.open(HERE+'/logos/palacio.png').convert('RGBA'); ww=800; ph=ph.resize((ww,int(ph.height*ww/ph.width)),Image.LANCZOS)
        b.alpha_composite(ph,(90,560-ph.height//2+20)); ics=[]
    if st=='B': card(b,(220,290,800,830),WHITE,44)
    if not ics: pass
    elif len(ics)==1: icon(b,ics[0],510,560,360,ci,RED,w=13)
    else:
        icon(b,ics[0],395,540,230 if ics[0]!='mesa4' else 230,ci,RED,w=10); icon(b,ics[1],645,600,200,ci,RED,w=10)
    if kick: kicker(b,st,960,320,kick)
    textblock(b,st,960,350 if len(lines)>=4 else 380,lines,mw=880)
    return b
if __name__=='__main__':
    tw,th=640,360; gap=26; top=200; cols=4; rows=3
    BW=gap+cols*(tw+gap); BH=top+rows*(th+70)+20
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((40,62),'VÍDEO 1 · ACESSO E PERMANÊNCIA — todas as cenas (A e B alternados)',font=f(44),fill=WHITE,anchor='ls')
    d.text((40,108),'A = azul institucional · B = claro oficial · alternam cena a cena · mesa: 4 pessoas, sempre 4 lado a lado, presidente só destacado quando referido · canto inferior direito livre para a intérprete',font=f(22,7),fill=(190,205,240),anchor='ls')
    for i,sc in enumerate(S):
        x=gap+(i%cols)*(tw+gap); y=top+(i//cols)*(th+70)
        d.text((x,y-14),f'CENA {i+1} · {sc[1]} · ESTILO {sc[0]}',font=f(22),fill=NAVY if sc[0]=='B' else RED,anchor='ls')
        bd.paste(scene(sc).convert('RGB').resize((tw,th),Image.LANCZOS),(x,y)); d.rectangle((x-1,y-1,x+tw,y+th),outline=(200,205,215))
    bd.save(OUT,quality=90); print('ok',bd.size)
    
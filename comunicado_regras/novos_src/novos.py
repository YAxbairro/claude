# Vídeos só-grafismo, ESTILO B (pictograma sólido), sincronizados com a locução (audio/*_words.json).
# Uso: python3 novos.py <V1|V2> <frame_ini> <frame_fim> <saida.mp4>   (ver build_novos.sh)
#      python3 novos.py <V1|V2> TEST t1 t2 ...  -> folha de frames
import sys,os,subprocess
import numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
from icons_b import icon_solid
HERE=os.path.dirname(os.path.abspath(__file__))
F8=HERE+'/../realista_src/fonts/M800.ttf'; F7=HERE+'/../realista_src/fonts/M700.ttf'
W,H,FPS=1920,1080,25
NAVY=(25,41,109); RED=(212,41,46); WHITE=(255,255,255); CBLUE=(22,75,140); CIRC=(226,236,250); GREY=(70,80,110); BGC=(246,248,252)
def ease(x): x=min(1,max(0,x)); return x*x*(3-2*x)
def eout(x): x=min(1,max(0,x)); return 1-(1-x)**3
def eback(x):
    x=min(1,max(0,x)); c1=1.70158; c3=c1+1; return 1+c3*(x-1)**3+c1*(x-1)**2
_fc={}
def f(sz,b=8):
    k=(sz,b)
    if k not in _fc: _fc[k]=ImageFont.truetype(F8 if b==8 else F7,sz)
    return _fc[k]
def fitsz(text,sz,maxw,b=8):
    while sz>14 and f(sz,b).getlength(text)>maxw: sz-=2
    return sz
# ---------- logos ----------
def L(path):
    im=Image.open(path).convert('RGBA'); a=np.asarray(im).astype(np.float32)
    a[...,3]=np.clip((255-a[...,:3].min(2))/60,0,1)*a[...,3]
    im=Image.fromarray(a.astype('uint8')); return im.crop(im.getbbox())
def rs(im,h): return im.resize((int(im.width*h/im.height),h),Image.LANCZOS)
LOGO_COR=L(HERE+'/logos/1.webp'); LOGO_CNE=L(HERE+'/logos/4.webp')
LC_S,LN_S=rs(LOGO_COR,120),rs(LOGO_CNE,80); LC_B,LN_B=rs(LOGO_COR,360),rs(LOGO_CNE,120)
# ---------- fundo (claro + faixas + 2 círculos suaves a flutuar) ----------
BG=Image.new('RGBA',(W,H),BGC+(255,)); _d=ImageDraw.Draw(BG)
_d.rectangle((0,H-18,W,H),fill=NAVY); _d.rectangle((0,H-28,W,H-18),fill=RED)
def blob(r,col,a):
    m=Image.new('L',(2*r+200,2*r+200),0); ImageDraw.Draw(m).ellipse((100,100,100+2*r,100+2*r),fill=a)
    s=Image.new('RGBA',m.size,col+(255,)); s.putalpha(m.filter(ImageFilter.GaussianBlur(60))); return s
BLOB1,BLOB2=blob(420,(205,222,245),150),blob(300,(250,215,215),90)
def background(t):
    b=BG.copy()
    b.alpha_composite(BLOB1,(int(-260+60*np.sin(t*.11)),int(380+40*np.cos(t*.09))))
    b.alpha_composite(BLOB2,(int(1440+50*np.cos(t*.13)),int(-160+40*np.sin(t*.1))))
    return b
# ---------- sprites (cache) ----------
_sc={}
def circle_sprite(kind,r):
    k=('c',kind,r)
    if k in _sc: return _sc[k]
    pad=50; S=2*r+2*pad; im=Image.new('RGBA',(S,S+20),(0,0,0,0))
    sh=Image.new('RGBA',im.size,(0,0,0,0)); ImageDraw.Draw(sh).ellipse((pad,pad+12,pad+2*r,pad+2*r+12),fill=(0,20,60,55))
    im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(16)))
    ImageDraw.Draw(im).ellipse((pad,pad,pad+2*r,pad+2*r),fill=CIRC+(255,))
    icon_solid(im,kind,pad+r,pad+r,r*1.15,CBLUE,RED,CIRC); _sc[k]=im; return im
def text_sprite(text,sz,col,b=8,under=None):
    k=('t',text,sz,col,b,under)
    if k in _sc: return _sc[k]
    ft=f(sz,b); w=int(ft.getlength(text)); asc=int(sz*1.0); im=Image.new('RGBA',(w+20,asc+40),(0,0,0,0))
    ImageDraw.Draw(im).text((10,asc),text,font=ft,fill=col,anchor='ls'); _sc[k]=(im,asc,w); return _sc[k]
def fade(im,a):
    if a>=1: return im
    im=im.copy(); al=np.asarray(im.split()[3]).astype(np.float32)*max(0,a); im.putalpha(Image.fromarray(al.astype('uint8'))); return im
# ---------- elementos animados ----------
def put_circle(b,kind,cx,cy,r,t,tin,a=1):
    p=(t-tin)/.5
    if p<=0: return
    s=eback(p); sp=circle_sprite(kind,r)
    if s<=0.02: return
    if abs(s-1)>1e-3: sp=sp.resize((max(1,int(sp.width*s)),max(1,int(sp.height*s))),Image.BILINEAR)
    sp=fade(sp,min(1,p*2.5)*a); b.alpha_composite(sp,(int(cx-sp.width/2),int(cy-(sp.height-20*s)/2)))
def put_text(b,text,sz,col,cx,base,t,tin,a=1,bold=8,under=None):
    p=(t-tin)/.45
    if p<=0: return
    im,asc,w=text_sprite(text,sz,col,bold); dy=int((1-eout(p))*26)
    b.alpha_composite(fade(im,ease(p*1.3)*a),(int(cx-w/2-10),int(base-asc+dy)))
    if under:
        u=eout((t-tin-.2)/.45)
        if u>0:
            layer=Image.new('RGBA',(w+4,14),(0,0,0,0)); uw=w*u
            ImageDraw.Draw(layer).rounded_rectangle(((w-uw)/2,2,(w+uw)/2,12),5,fill=under+(int(255*a),))
            b.alpha_composite(layer,(int(cx-w/2-2),int(base+10+dy)))
def put_pill(b,text,cx,y,t,tin,a=1):
    p=(t-tin)/.4
    if p<=0: return
    ft=f(36); w=ft.getlength(text); e=eout(p); ww=(w+60)*(0.3+0.7*e)
    l=Image.new('RGBA',(int(w+80),80),(0,0,0,0)); g=ImageDraw.Draw(l); x0=(w+80-ww)/2
    g.rounded_rectangle((x0,8,x0+ww,70),31,fill=RED+(int(255*min(1,p*2)*a),))
    if e>.5: g.text(((w+80)/2,62),text,font=ft,fill=WHITE+(int(255*min(1,(e-.5)*2)*a),),anchor='ms')
    b.alpha_composite(l,(int(cx-(w+80)/2),int(y-62)))
# ---------- cenas ----------
SZ={'n':50,'b':72,'r':72,'big':170,'s':34}
COL={'n':NAVY,'b':NAVY,'r':RED,'big':RED,'s':GREY}
UND={'b':RED,'r':NAVY}
def scene_draw(b,sc,t):
    t0,t1=sc['t']; out=1-ease((t-(t1-.35))/.35); oy=int((1-out)*-30)
    a=out
    if sc.get('end'): return endcard(b,sc,t)
    if 'items' in sc: return items(b,sc,t,a,oy)
    ic=sc.get('icons',[]); nl=len(sc['lines']); dense=nl>=4
    r=120 if (len(ic)>1 or dense) else 150
    sizes=[fitsz(text,SZ[role]-(6 if dense and role!='big' else 0),1500,8 if role!='n' else 7) for text,role,tin in sc['lines']]
    y=0
    if ic: cy=r; y=2*r+56
    if sc.get('kick'): ky=y+54; y=ky+8+46
    bases=[]; prev=None
    for sz in sizes:
        y=y+int(sz*.74) if prev is None else y+int(prev*.30)+int(sz*.98)+12
        bases.append(y); prev=sz
    off=600-(y+20)/2+oy
    for i,(k,tin) in enumerate(ic):
        put_circle(b,k,960+(i-(len(ic)-1)/2)*290,cy+off,r,t,max(tin,t0),a)
    if sc.get('kick'): put_pill(b,sc['kick'][0],960,ky+off,t,max(sc['kick'][1],t0),a)
    for (text,role,tin),sz,yb in zip(sc['lines'],sizes,bases):
        put_text(b,text,sz,COL[role],960,yb+off,t,max(tin,t0),a,8 if role!='n' else 7,UND.get(role))
def items(b,sc,t,a,oy):
    t0=sc['t'][0]; its=sc['items']; n=len(its); cw=1680/n
    if sc.get('kick'): put_pill(b,sc['kick'][0],960,300+oy,t,max(sc['kick'][1],t0),a)
    for k,it in enumerate(its):
        cx=120+cw*(k+.5); cy=520+oy
        put_circle(b,it['icon'],cx,cy,120,t,max(it['t'],t0),a)
        y=740+oy; prev=None
        for j,(text,role,tin) in enumerate(it['lines']):
            rr={'n':'n','b':'b','r':'r','big':'r','s':'s'}[role]; base={'n':40,'b':52,'r':52,'big':64,'s':26}[role]
            sz=fitsz(text,base,cw-60,8 if rr!='n' else 7)
            if prev: y+=int(prev*.30)+int(sz*.98)+12
            prev=sz; put_text(b,text,sz,COL[role],cx,y,t,max(tin,t0),a,8 if rr!='n' else 7,UND.get(rr))
    if sc.get('foot'): put_text(b,sc['foot'][0],30,GREY,960,990+oy,t,sc['foot'][1],a,7)
def endcard(b,sc,t):
    t0=sc['t'][0]; p=eout((t-t0)/.6)
    if p>0:
        im=fade(LC_B,p); b.alpha_composite(im,(int(960-im.width/2),int(130+(1-p)*30)))
    p2=eout((t-t0-.4)/.6)
    if p2>0:
        im=fade(LN_B,p2); b.alpha_composite(im,(int(960-im.width/2),int(540+(1-p2)*20)))
    y=790
    for text,role,tin in sc['lines']:
        put_text(b,text,{'n':46,'r':58}[role],COL[role],960,y,t,tin,1,8 if role!='n' else 7,UND.get(role)); y+=78
def corner_logos(b,t,end_t):
    a=1-ease((t-end_t)/.4)
    if a<=0: return
    b.alpha_composite(fade(LC_S,a),(60,40)); b.alpha_composite(fade(LN_S,a),(1560,60))
# ---------- guiões ----------
V1=dict(audio='audio/V1_acesso.mp3',dur=88.74,scenes=[
 dict(t=(0,5.6),icons=[('urna',0.0)],kick=('15 DE NOVEMBRO',0.5),lines=[('CABO VERDE VAI ÀS URNAS','n',1.6),('ELEGER O PRESIDENTE DA REPÚBLICA','r',3.6)]),
 dict(t=(5.6,10.5),icons=[('porta',5.8)],kick=('ATENÇÃO',5.9),lines=[('O ACESSO E A PERMANÊNCIA','n',7.0),('NAS ASSEMBLEIAS DE VOTO','n',8.1),('SÃO RESTRITOS','r',9.1)]),
 dict(t=(10.5,22.4),icons=[('cracha',10.8)],kick=('CÓDIGO ELEITORAL',14.0),lines=[('A CNE RECORDA','n',10.8),('APENAS PESSOAS','n',15.4),('LEGALMENTE AUTORIZADAS','b',16.1),('PODEM ENTRAR E PERMANECER','n',17.3),('NO LOCAL DA ASSEMBLEIA DE VOTO','r',19.4)]),
 dict(t=(22.4,35.4),kick=('SÃO ELES',22.7),foot=('NOS TERMOS DA LEI',34.0),items=[
   dict(icon='mesa',t=23.8,lines=[('MEMBROS','b',23.8),('DA MESA','n',24.1)]),
   dict(icon='urna',t=25.0,lines=[('REPRESENTANTES','b',25.2),('DA CNE E DO APOIO ELEITORAL','n',26.0)]),
   dict(icon='pessoas',t=28.3,lines=[('CANDIDATOS','b',28.8),('E MANDATÁRIOS','n',29.9)]),
   dict(icon='cracha',t=32.2,lines=[('DELEGADOS','b',32.3),('DAS CANDIDATURAS','n',32.8)])]),
 dict(t=(35.4,48.2),icons=[('globo',35.7),('cracha',38.0)],kick=('OBSERVADORES INTERNACIONAIS',35.7),lines=[('DEVIDAMENTE CREDENCIADOS','b',38.0),('PODEM SER ADMITIDOS','n',39.6),('SÓ PELO TEMPO NECESSÁRIO','n',41.8),('À OBSERVAÇÃO','r',44.8)]),
 dict(t=(48.2,62.6),icons=[('mesa',48.5),('cracha',52.1)],kick=('PRESIDENTE DA MESA',48.5),lines=[('DEVE EXIGIR E VERIFICAR','n',49.6),('CREDENCIAIS E CRACHÁS','b',52.1),('EMITIDOS PELA CNE','r',54.7),('ANTES DE AUTORIZAR A PERMANÊNCIA','n',56.0),('OU DE PRESTAR INFORMAÇÕES','n',58.6)]),
 dict(t=(62.6,69.3),icons=[('relogio',62.9)],kick=('ELEITORES',62.9),lines=[('SÓ PODEM PERMANECER','n',63.6),('O TEMPO NECESSÁRIO','b',65.6),('PARA VOTAR','r',67.3)]),
 dict(t=(69.3,75.0),icons=[('saida',71.2)],kick=('PRESIDENTE DA MESA',69.5),lines=[('DETERMINA A SAÍDA','b',71.2),('DE TODAS AS PESSOAS','n',72.4),('NÃO AUTORIZADAS','r',73.3)]),
 dict(t=(75.0,82.2),icons=[('urna',76.4),('saida',77.6)],kick=('CARO ELEITOR',75.3),lines=[('APÓS VOTAR','n',76.4),('ABANDONA O LOCAL','r',77.6),('E RESPEITA AS ORIENTAÇÕES','n',80.1),('DOS MEMBROS DA MESA','b',81.5)]),
 dict(t=(82.2,1e9),end=True,lines=[('JUNTOS POR ELEIÇÕES','n',84.8),('LIVRES, JUSTAS E TRANSPARENTES','r',85.8)])])
V2=dict(audio='audio/V2_membros.mp3',dur=64.26,scenes=[
 dict(t=(0,3.4),icons=[('aviso',0.0)],kick=('ATENÇÃO',0.0),lines=[('MEMBROS DAS MESAS','b',1.0),('DAS ASSEMBLEIAS DE VOTO','n',1.9)]),
 dict(t=(3.4,8.1),icons=[('urna',3.6)],kick=('15 DE NOVEMBRO',4.1),lines=[('CABO VERDE ELEGE','n',5.4),('O PRESIDENTE DA REPÚBLICA','r',6.5)]),
 dict(t=(8.1,16.4),icons=[('mesa',8.4)],kick=('SE FOSTE INDICADO',8.4),lines=[('PARA INTEGRAR UMA MESA DE VOTO','n',9.4),('A TUA PRESENÇA É FUNDAMENTAL','b',11.3),('PARA O BOM FUNCIONAMENTO','n',13.4),('DAS OPERAÇÕES ELEITORAIS','r',14.9)]),
 dict(t=(16.4,23.4),icons=[('cracha',16.7)],kick=('CÓDIGO ELEITORAL',18.8),lines=[('A FUNÇÃO DE MEMBRO DE MESA','n',20.1),('É OBRIGATÓRIA','r',22.0)]),
 dict(t=(23.4,29.0),icons=[('relogio',23.7)],kick=('COMPARECE ÀS',24.5),lines=[('7H','big',25.4),('DA MANHÃ','b',25.9),('PARA O INÍCIO PONTUAL DA VOTAÇÃO','n',26.9)]),
 dict(t=(29.0,47.7),kick=('COMPENSAÇÃO',29.2),items=[
   dict(icon='notas',t=29.9,lines=[('MEMBROS DAS MESAS','n',29.9),('3.500$00','big',31.3),('INCLUI 1.000$00 DE ALIMENTAÇÃO','s',33.0)]),
   dict(icon='tel',t=36.7,lines=[('PRESIDENTES DAS MESAS','n',36.8),('+ 500$00','big',40.2),('SUBSÍDIO DE COMUNICAÇÃO','s',38.7)]),
   dict(icon='pessoas',t=41.7,lines=[('SUPLENTES','n',41.8),('SÓ SE SUBSTITUÍREM','r',44.1),('EFETIVAMENTE UM MEMBRO','s',45.6)])]),
 dict(t=(47.7,53.1),icons=[('banco',48.0)],kick=('ATENÇÃO',48.0),lines=[('PAGAMENTO POSTERIOR','n',48.9),('POR TRANSFERÊNCIA','b',51.1),('BANCÁRIA','r',51.5)]),
 dict(t=(53.1,55.7),icons=[('pessoas',53.3)],lines=[('A TUA PRESENÇA','b',53.4),('FAZ A DIFERENÇA','r',54.2)]),
 dict(t=(55.7,1e9),end=True,lines=[('JUNTOS POR ELEIÇÕES','n',57.2),('LIVRES, JUSTAS E TRANSPARENTES','r',58.6)])])
VIDS={'V1':V1,'V2':V2}
def frame(V,t):
    b=background(t); end_t=[s['t'][0] for s in V['scenes'] if s.get('end')][0]
    corner_logos(b,t,end_t)
    for sc in V['scenes']:
        if sc['t'][0]<=t<sc['t'][1]: scene_draw(b,sc,t)
    return b
if __name__=='__main__':
    V=VIDS[sys.argv[1]]
    if sys.argv[2]=='TEST':
        ts=[float(x) for x in sys.argv[3:-1]]; out=[]
        for tt in ts:
            g=frame(V,tt).convert('RGB'); ImageDraw.Draw(g).text((20,1040),f'{tt}s',font=f(40),fill=(255,0,200)); out.append(g.resize((480,270)))
        sh=Image.new('RGB',(480*5,270*((len(out)+4)//5)),'white')
        for k,im in enumerate(out): sh.paste(im,((k%5)*480,(k//5)*270))
        sh.save(sys.argv[-1]); sys.exit()
    n0,n1,out=int(sys.argv[2]),int(sys.argv[3]),sys.argv[4]
    p=subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
        '-c:v','libx264','-preset','medium','-crf','15','-pix_fmt','yuv420p',out],stdin=subprocess.PIPE)
    for n in range(n0,n1): p.stdin.write(np.asarray(frame(V,n/FPS).convert('RGB')).tobytes())
    p.stdin.close(); p.wait(); print('done',out,flush=True)

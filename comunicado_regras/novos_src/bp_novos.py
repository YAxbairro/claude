# Blueprints de estilo para os 2 vídeos novos (só grafismo).
# Cada estilo muda TUDO: fundo, família de ícones, composição, tipografia e destaques.
#  A  Institucional : ícones de linha fina (traço do logo CNE), caixas navy/vermelho, ícone à esquerda / texto à direita
#  B  Pictograma    : ícones sólidos dentro de círculos, composição centrada, destaques sublinhados, fundo claro
#  C  Infográfico   : ícones de traço grosso em hexágonos, números de passo grandes, linha do tempo, fundo navy
# Uso: python3 bp_novos.py <pasta_logos> <pasta_saida>
import sys,os
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__))
F8=HERE+'/../realista_src/fonts/M800.ttf'; F7=HERE+'/../realista_src/fonts/M700.ttf'
LOGOS=sys.argv[1]; OUTD=sys.argv[2]
W,H=1920,1080
NAVY=(25,41,109); RED=(212,41,46); WHITE=(255,255,255); CBLUE=(22,75,140); SKY=(20,150,204)
CORAL=(255,96,96); MUTE=(160,180,230)
def f(sz,b=8): return ImageFont.truetype(F8 if b==8 else F7,sz)
def L(i):
    im=Image.open(f'{LOGOS}/{i}.webp').convert('RGBA'); a=np.asarray(im).astype(np.float32)
    a[...,3]=np.clip((255-a[...,:3].min(2))/60,0,1)*a[...,3]
    im=Image.fromarray(a.astype('uint8')); return im.crop(im.getbbox())
def white(im): a=np.asarray(im).copy(); a[...,:3]=255; return Image.fromarray(a)
LOGO_COR=L(1); LOGO_CNE=L(4); LOGO_COR_W,LOGO_CNE_W=white(LOGO_COR),white(LOGO_CNE)
def paste(b,im,x,y,h):
    r=im.resize((int(im.width*h/im.height),h),Image.LANCZOS); b.alpha_composite(r,(int(x),int(y))); return r.width
def layer(b,fn):
    l=Image.new('RGBA',b.size,(0,0,0,0)); fn(ImageDraw.Draw(l)); b.alpha_composite(l)
def shadow(b,box,r,blur=16,off=10,a=60,ellipse=False):
    s=Image.new('RGBA',b.size,(0,0,0,0)); d=ImageDraw.Draw(s); bx=(box[0],box[1]+off,box[2],box[3]+off)
    (d.ellipse(bx,fill=(0,20,60,a)) if ellipse else d.rounded_rectangle(bx,r,fill=(0,20,60,a)))
    b.alpha_composite(s.filter(ImageFilter.GaussianBlur(blur)))
def fitsz(text,sz,maxw):
    while sz>14 and f(sz).getlength(text)>maxw: sz-=2
    return sz
# =================== ÍCONES ===================
# A / C: traço (linha). C usa traço grosso branco + acento vermelho.
def icon_line(b,kind,cx,cy,s,col,acc,w):
    d=ImageDraw.Draw(b); k=s/100; P=lambda x,y:(cx+(x-50)*k,cy+(y-50)*k)
    def ln(*pts,c=col): d.line([P(*p) for p in pts],fill=c,width=w,joint='curve')
    def el(x0,y0,x1,y1,c=col): d.ellipse((*P(x0,y0),*P(x1,y1)),outline=c,width=w)
    def rc(x0,y0,x1,y1,c=col): d.rounded_rectangle((*P(x0,y0),*P(x1,y1)),int(6*k),outline=c,width=w)
    if kind=='urna':
        ln((15,40),(50,22),(85,40),c=acc); ln((15,40),(50,58),(85,40),c=acc)
        ln((15,45),(15,80),(48,97),(48,62)); ln((52,62),(52,97),(85,80),(85,45))
        ln((38,48),(38,8),(60,0),(60,40)); ln((44,26),(54,14)); ln((44,14),(54,26))
    if kind=='porta': rc(25,8,75,95); el(35,30,55,50,c=acc); ln((45,50),(45,62),c=acc)
    if kind=='mesa': el(38,8,62,32); ln((25,60),(30,42),(70,42),(75,60)); ln((5,62),(95,62),c=acc); ln((15,62),(15,95)); ln((85,62),(85,95))
    if kind=='pessoas':
        for ox in (-22,22): el(40+ox,12,60+ox,32); ln((32+ox,70),(32+ox,48),(68+ox,48),(68+ox,70))
        el(38,30,62,54,c=acc); ln((28,95),(28,72),(72,72),(72,95),c=acc)
    if kind=='cracha': rc(22,22,78,95); ln((40,22),(40,8),(60,8),(60,22)); el(38,36,62,60,c=acc); ln((34,74),(66,74)); ln((34,84),(58,84))
    if kind=='globo':
        el(10,10,90,90); d.arc((*P(32,10),*P(68,90)),0,360,fill=col,width=w); ln((10,50),(90,50)); ln((18,28),(82,28)); ln((18,72),(82,72))
        el(62,62,92,92,c=acc)
    if kind=='saida': rc(10,8,58,95); ln((40,50),(92,50),c=acc); ln((78,36),(92,50),(78,64),c=acc)
    if kind=='relogio': el(8,8,92,92); ln((50,22),(50,50),(70,62),c=acc)
    if kind=='notas': rc(8,28,92,78); el(38,40,62,66,c=acc)
    if kind=='banco':
        ln((8,36),(50,10),(92,36),(8,36),c=acc); ln((8,92),(92,92))
        for x in (22,42,58,78): ln((x,44),(x,84))
    if kind=='aviso': ln((50,8),(94,90),(6,90),(50,8)); ln((50,38),(50,64),c=acc); ln((50,77),(50,79),c=acc)
    if kind=='tel': rc(28,6,72,94); ln((44,82),(56,82),c=acc)
# B: sólido (formas cheias), cortes na cor do círculo
def icon_solid(b,kind,cx,cy,s,fg,acc,cut):
    d=ImageDraw.Draw(b); k=s/100; P=lambda x,y:(cx+(x-50)*k,cy+(y-50)*k)
    def R(x0,y0,x1,y1,c=fg,r=6): d.rounded_rectangle((*P(x0,y0),*P(x1,y1)),int(r*k),fill=c)
    def E(x0,y0,x1,y1,c=fg): d.ellipse((*P(x0,y0),*P(x1,y1)),fill=c)
    def G(pts,c=fg): d.polygon([P(*p) for p in pts],fill=c)
    def Ln(pts,c=cut,w=7): d.line([P(*p) for p in pts],fill=c,width=int(w*k),joint='curve')
    if kind=='porta': R(24,6,76,96); E(38,30,56,48,cut); R(44,44,50,64,cut,1)
    if kind=='mesa': E(37,4,63,30); d.pieslice((*P(26,34),*P(74,82)),180,360,fill=fg); R(4,58,96,68,acc,2); R(12,66,20,96); R(80,66,88,96)
    if kind=='urna':
        G([(36,10),(62,4),(68,50),(42,56)],acc); Ln([(46,22),(58,36)]); Ln([(58,20),(47,38)])
        R(12,44,88,94); R(30,44,70,50,cut,1)
    if kind=='pessoas':
        for ox in (-26,26): E(38+ox,10,62+ox,34); d.pieslice((*P(28+ox,38),*P(72+ox,86)),180,360,fill=fg)
        E(36,26,64,54,acc); d.pieslice((*P(22,58),*P(78,114)),180,360,fill=acc)
    if kind=='cracha': R(20,20,80,96); R(40,6,60,26); E(36,32,64,60,cut); R(30,68,70,75,cut,2); R(30,81,60,88,cut,2); E(42,38,58,54,acc)
    if kind=='globo':
        E(6,6,94,94); Ln([(6,50),(94,50)],w=5); Ln([(14,28),(86,28)],w=5); Ln([(14,72),(86,72)],w=5)
        d.arc((*P(30,6),*P(70,94)),0,360,fill=cut,width=int(5*k)); E(60,60,96,96,acc); Ln([(70,78),(76,84),(88,70)],w=5)
    if kind=='saida': R(8,6,56,96); E(42,48,50,56,cut); R(48,44,82,56,acc,2); G([(78,30),(98,50),(78,70)],acc)
    if kind=='relogio': E(6,6,94,94); Ln([(50,20),(50,50),(70,62)],w=8); E(44,44,56,56,acc)
    if kind=='notas': R(4,24,96,80); E(36,34,64,70,cut); E(43,42,57,62,acc); E(10,30,20,40,cut); E(80,64,90,74,cut)
    if kind=='banco':
        G([(4,36),(50,6),(96,36)],acc); R(6,86,94,96,fg,2)
        for x in (14,34,56,76): R(x,40,x+10,82,fg,2)
    if kind=='aviso': G([(50,6),(98,92),(2,92)],acc); R(45,34,55,66,cut,3); E(44,72,56,84,cut)
    if kind=='tel': R(26,2,74,98,fg,10); R(32,12,68,80,cut,2); E(44,84,56,94,acc)
def hexagon(b,cx,cy,r,fill1,fill2,outline):
    m=Image.new('L',b.size,0); pts=[(cx+r*np.cos(np.radians(60*i-90)),cy+r*np.sin(np.radians(60*i-90))) for i in range(6)]
    ImageDraw.Draw(m).polygon(pts,fill=255)
    t=np.clip((_yy-(cy-r))/(2*r),0,1)[...,None]; g=np.array(fill1,np.float32)*(1-t)+np.array(fill2,np.float32)*t
    gl=Image.fromarray(np.dstack([g,np.asarray(m,np.float32)]).astype('uint8'),'RGBA')
    sh=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(sh).polygon([(x,y+14) for x,y in pts],fill=(0,0,0,110)); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)))
    b.alpha_composite(gl); ImageDraw.Draw(b).polygon(pts,outline=outline,width=5)
# =================== FUNDOS ===================
_yy,_xx=np.mgrid[0:H,0:W].astype(np.float32)
def bg(style):
    if style=='A':
        r=np.sqrt(((_xx-960)/1100)**2+((_yy-540)/700)**2).clip(0,1)[...,None]
        a=np.array(SKY,np.float32)*(1-r)+np.array((11,90,160),np.float32)*r
        return Image.fromarray(a.astype('uint8')).convert('RGBA')
    if style=='B':
        b=Image.new('RGBA',(W,H),(246,248,252,255)); d=ImageDraw.Draw(b)
        d.rectangle((0,H-18,W,H),fill=NAVY); d.rectangle((0,H-28,W,H-18),fill=RED); return b
    t=(_yy/H)[...,None]; a=np.array((14,24,70),np.float32)*(1-t)+np.array((6,12,40),np.float32)*t
    b=Image.fromarray(a.astype('uint8')).convert('RGBA')
    layer(b,lambda d:[d.line((x,0,x,H),fill=(255,255,255,12)) for x in range(0,W,80)]+[d.line((0,y,W,y),fill=(255,255,255,12)) for y in range(0,H,80)])
    return b
# =================== TEXTO POR ESTILO ===================
# linhas: (texto, papel) com papel in n (normal), b (destaque navy), r (destaque vermelho), big (número), s (pequeno)
SZ={'n':50,'b':72,'r':72,'big':250,'s':34}
def boxtag(b,x,y,t,sz,col,fg=WHITE,anchor='ls'):
    d=ImageDraw.Draw(b); ft=f(sz); w=ft.getlength(t); cap=int(sz*.72); p=int(sz*.28)
    if anchor=='ms': x-=w/2
    if col: d.rectangle((x-p,y-cap-p,x+w+p,y+p*.8),fill=col)
    d.text((x,y),t,font=ft,fill=fg,anchor='ls')
def lines_A(b,x,y,lines,maxw=820):
    prev=None
    for t,role in lines:
        sz=fitsz(t,SZ[role],maxw)
        if prev: y+=int(prev*.30)+int(sz*.98)+14
        prev=sz
        if role in('b','r'): boxtag(b,x,y,t,sz,NAVY if role=='b' else RED)
        else: boxtag(b,x,y,t,sz,None)
def lines_B(b,cx,y,lines,maxw=1500):
    prev=None; d=ImageDraw.Draw(b)
    for t,role in lines:
        sz=fitsz(t,min(SZ[role],170),maxw)
        if prev: y+=int(prev*.30)+int(sz*.98)+10
        prev=sz; col={'n':NAVY,'b':NAVY,'r':RED,'big':RED,'s':(70,80,110)}[role]
        d.text((cx,y),t,font=f(sz,8 if role!='n' else 7),fill=col,anchor='ms')
        if role in('b','r'):
            w=f(sz).getlength(t); d.rounded_rectangle((cx-w/2,y+12,cx+w/2,y+22),5,fill=RED if role=='b' else NAVY)
def lines_C(b,x,y,lines,maxw=860):
    prev=None; d=ImageDraw.Draw(b)
    for t,role in lines:
        sz=fitsz(t,SZ[role],maxw)
        if prev: y+=int(prev*.30)+int(sz*.98)+12
        prev=sz; col={'n':MUTE,'b':WHITE,'r':CORAL,'big':WHITE,'s':MUTE}[role]
        d.text((x,y),t,font=f(sz),fill=col,anchor='ls')
def kicker(b,style,x,y,t):
    d=ImageDraw.Draw(b)
    if style=='A': boxtag(b,x,y,t,44,RED)
    if style=='B':
        ft=f(36); w=ft.getlength(t); d.rounded_rectangle((x-w/2-30,y-46,x+w/2+30,y+16),31,fill=RED); d.text((x,y),t,font=ft,fill=WHITE,anchor='ms')
    if style=='C':
        d.rectangle((x,y-26,x+60,y-20),fill=RED); ft=f(32); xx=x+80
        for ch in t: d.text((xx,y),ch,font=ft,fill=CORAL,anchor='ls'); xx+=ft.getlength(ch)+5
def stepnum(b,n,x,y):
    layer(b,lambda d:d.text((x,y),f'{n:02d}',font=f(300),fill=(0,0,0,0),stroke_width=3,stroke_fill=(255,255,255,55),anchor='ls'))
# =================== RENDER DE CENAS ===================
def render(style,sc,num):
    b=bg(style)
    if style=='B': paste(b,LOGO_COR,60,40,120); paste(b,LOGO_CNE,1560,60,80)
    else: paste(b,LOGO_COR_W,60,40,120); paste(b,LOGO_CNE_W,1560,60,80)
    if 'items' in sc: items(b,style,sc,num); return b
    ic=sc['icons']
    if style=='A':
        for i,k in enumerate(ic): icon_line(b,k,(500 if len(ic)==1 else 360+i*300),560,330 if len(ic)==1 else 250,WHITE,RED,12)
        kicker(b,'A',1000,330,sc['kick']); lines_A(b,1000,450,sc['lines'])
    if style=='B':
        n=len(ic); r=150 if n==1 else 120
        for i,k in enumerate(ic):
            cx=960+(i-(n-1)/2)*290; cy=330
            shadow(b,(cx-r,cy-r,cx+r,cy+r),0,ellipse=True); ImageDraw.Draw(b).ellipse((cx-r,cy-r,cx+r,cy+r),fill=(226,236,250))
            icon_solid(b,k,cx,cy,r*1.15,CBLUE,RED,(226,236,250))
        kicker(b,'B',960,560,sc['kick']); lines_B(b,960,660,sc['lines'])
    if style=='C':
        stepnum(b,num,90,960); d=ImageDraw.Draw(b); d.rectangle((120,290,128,850),fill=RED)
        kicker(b,'C',170,330,sc['kick']); lines_C(b,170,440,sc['lines'])
        for i,k in enumerate(ic):
            cx,cy,r=(1420,560,250) if len(ic)==1 else (1300+i*330,560-(i*2-1)*140,175)
            hexagon(b,cx,cy,r,(60,80,170),(20,32,95),RED); icon_line(b,k,cx,cy,r*1.0,WHITE,CORAL,int(r*.075))
    return b
def items(b,style,sc,num):
    its=sc['items']; n=len(its); d=ImageDraw.Draw(b)
    if style=='A':
        kicker(b,'A',140,250,sc['kick']); cw=(1640-(n-1)*40)/n
        for k,it in enumerate(its):
            x=140+k*(cw+40); y=320
            layer(b,lambda dd:dd.rounded_rectangle((x,y,x+cw,y+540),30,fill=(255,255,255,38),outline=(255,255,255,90),width=3))
            icon_line(b,it['icon'],x+cw/2,y+160,170,WHITE,RED,9)
            lines_A(b,x+40,y+340,[(t,r) for t,r in it['lines']],maxw=cw-70)
        if sc.get('foot'): boxtag(b,140,960,sc['foot'],32,None)
    if style=='B':
        kicker(b,'B',960,230,sc['kick']); cw=1680/n
        for k,it in enumerate(its):
            cx=120+cw*(k+.5); cy=420; r=120
            shadow(b,(cx-r,cy-r,cx+r,cy+r),0,ellipse=True); ImageDraw.Draw(b).ellipse((cx-r,cy-r,cx+r,cy+r),fill=(226,236,250))
            icon_solid(b,it['icon'],cx,cy,r*1.15,CBLUE,RED,(226,236,250))
            lines_B(b,cx,640,it['lines'],maxw=cw-50)
        if sc.get('foot'): ImageDraw.Draw(b).text((960,960),sc['foot'],font=f(30,7),fill=(70,80,110),anchor='ms')
    if style=='C':
        stepnum(b,num,90,960); kicker(b,'C',170,230,sc['kick'])
        x0,x1=260,1660; y=470; d.line((x0,y,x1,y),fill=(255,255,255,90),width=4)
        for k,it in enumerate(its):
            cx=x0+(x1-x0)*k/(n-1); r=105
            hexagon(b,cx,y,r,(60,80,170),(20,32,95),RED); icon_line(b,it['icon'],cx,y,r*1.05,WHITE,CORAL,8)
            d.text((cx,y-r-26),f'{k+1:02d}',font=f(30),fill=CORAL,anchor='ms')
            yy=y+r+70; pv=None
            for j,(t,role) in enumerate(it['lines']):
                sz=fitsz(t,{'n':30,'b':40,'r':40,'big':64,'s':24}[role],(x1-x0)/(n-1)-30)
                if pv: yy+=int(pv*.35)+sz+12
                pv=sz
                d.text((cx,yy),t,font=f(sz),fill={'n':MUTE,'b':WHITE,'r':CORAL,'big':WHITE,'s':MUTE}[role],anchor='ms')
        if sc.get('foot'): d.text((170,1000),sc['foot'],font=f(28),fill=MUTE,anchor='ls')
# =================== CENAS ===================
V1=[dict(kick='ATENÇÃO',icons=['porta'],lines=[('O ACESSO E A PERMANÊNCIA','n'),('NAS ASSEMBLEIAS DE VOTO','n'),('SÃO RESTRITOS','r')]),
    dict(kick='SÓ PODEM ENTRAR E PERMANECER',foot='NOS TERMOS DA LEI',items=[
        dict(icon='mesa',lines=[('MEMBROS','b'),('DA MESA','n')]),dict(icon='urna',lines=[('REPRESENTANTES','b'),('CNE E APOIO ELEITORAL','n')]),
        dict(icon='pessoas',lines=[('CANDIDATOS','b'),('E MANDATÁRIOS','n')]),dict(icon='cracha',lines=[('DELEGADOS','b'),('DAS CANDIDATURAS','n')])]),
    dict(kick='OBSERVADORES INTERNACIONAIS',icons=['globo','cracha'],lines=[('DEVIDAMENTE','n'),('CREDENCIADOS','b'),('SÓ O TEMPO NECESSÁRIO','n'),('À OBSERVAÇÃO','r')]),
    dict(kick='CARO ELEITOR',icons=['saida'],lines=[('APÓS VOTAR','n'),('ABANDONA O LOCAL','r'),('E RESPEITA OS','n'),('MEMBROS DA MESA','b')])]
V2=[dict(kick='ATENÇÃO',icons=['aviso'],lines=[('MEMBROS DAS MESAS','b'),('DAS ASSEMBLEIAS DE VOTO','n'),('15 DE NOVEMBRO','r')]),
    dict(kick='A FUNÇÃO É OBRIGATÓRIA',icons=['relogio'],lines=[('COMPARECE ÀS','n'),('7H','big'),('DA MANHÃ','b')]),
    dict(kick='COMPENSAÇÃO',items=[
        dict(icon='notas',lines=[('MEMBROS DAS MESAS','n'),('3.500$00','big'),('INCLUI 1.000$00 DE ALIMENTAÇÃO','s')]),
        dict(icon='tel',lines=[('PRESIDENTES','n'),('+ 500$00','big'),('SUBSÍDIO DE COMUNICAÇÃO','s')]),
        dict(icon='pessoas',lines=[('SUPLENTES','n'),('SÓ SE SUBSTITUÍREM','r'),('EFETIVAMENTE UM MEMBRO','s')])]),
    dict(kick='ATENÇÃO',icons=['banco'],lines=[('PAGAMENTO POSTERIOR','n'),('POR TRANSFERÊNCIA','b'),('BANCÁRIA','r'),('A TUA PRESENÇA FAZ A DIFERENÇA','s')])]
# no estilo B/A os números das listas ficam mais pequenos
SZB={'big':72}
# =================== BLUEPRINT ===================
STY=[('A','INSTITUCIONAL','Ícones de linha fina (traço do logo CNE). Caixas navy/vermelho. Ícone à esquerda, texto à direita. Fundo azul CNE.'),
     ('B','PICTOGRAMA SÓLIDO','Ícones cheios em círculos. Composição centrada. Destaques sublinhados, sem caixas. Fundo claro, logos a cores.'),
     ('C','INFOGRÁFICO','Ícones de traço grosso em hexágonos. Número do passo gigante (01, 02...). Linha do tempo nas listas. Fundo navy.')]
def board(title,sub,scenes,labels,out):
    tw,th=640,360; gap=24; lw=330; top=190
    BW=lw+4*tw+5*gap; BH=top+3*(th+90)+40
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((40,62),title,font=f(46),fill=WHITE,anchor='ls'); d.text((40,108),sub,font=f(24,7),fill=(190,205,240),anchor='ls')
    for c,lb in enumerate(labels): d.text((lw+gap+c*(tw+gap),top-14),lb,font=f(22),fill=NAVY,anchor='ls')
    for r,(s,nm,desc) in enumerate(STY):
        y=top+r*(th+90)
        d.text((30,y+60),f'ESTILO {s}',font=f(40),fill=RED,anchor='ls'); d.text((30,y+105),nm,font=f(26),fill=NAVY,anchor='ls')
        line=''; yy=y+150
        for wd in desc.split():
            if f(19,7).getlength(line+' '+wd)>280: d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls'); yy+=28; line=wd
            else: line=(line+' '+wd).strip()
        d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls')
        for c,sc in enumerate(scenes):
            if s in 'AB' and 'items' in sc:   # números grandes das listas: tamanho de lista
                sc=dict(sc,items=[dict(it,lines=[(t,'r' if ro=='big' else ro) for t,ro in it['lines']]) for it in sc['items']])
            im=render(s,sc,c+1).convert('RGB').resize((tw,th),Image.LANCZOS); x=lw+gap+c*(tw+gap)
            bd.paste(im,(x,y)); d.rectangle((x-1,y-1,x+tw,y+th),outline=(200,205,215))
    bd.save(out,quality=90); print('ok',out)
board('VÍDEO 1 · ACESSO E PERMANÊNCIA NAS ASSEMBLEIAS DE VOTO','Blueprint de estilos · só grafismo · 16:9 · ~1:29 · fundo, ícones, composição e tipografia mudam por estilo',
      V1,['1 · ATENÇÃO: ACESSO RESTRITO (6–10s)','2 · QUEM PODE ENTRAR (22–35s)','3 · OBSERVADORES / CREDENCIAIS (35–62s)','4 · ELEITOR: VOTA E SAI (75–82s)'],
      OUTD+'/Blueprint_V1_Acesso_estilos.jpg')
board('VÍDEO 2 · ATENÇÃO MEMBROS DAS ASSEMBLEIAS DE VOTO','Blueprint de estilos · só grafismo · 16:9 · ~1:04 · fundo, ícones, composição e tipografia mudam por estilo',
      V2,['1 · ATENÇÃO MEMBROS DAS MESAS (0–8s)','2 · OBRIGATÓRIO · 7H DA MANHÃ (16–29s)','3 · COMPENSAÇÃO (29–48s)','4 · TRANSFERÊNCIA BANCÁRIA (48–55s)'],
      OUTD+'/Blueprint_V2_Membros_estilos.jpg')

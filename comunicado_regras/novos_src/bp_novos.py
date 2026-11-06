# Blueprints de estilo para os 2 vídeos novos (só grafismo):
#  V1 "Acesso e permanência nas assembleias de voto"  |  V2 "Atenção membros das assembleias de voto"
# 3 estilos (linhas) x 4 momentos-chave (colunas). Uso: python3 bp_novos.py <pasta_logos> <saida>
import sys,os,math
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__))
F8=HERE+'/../realista_src/fonts/M800.ttf'; F7=HERE+'/../realista_src/fonts/M700.ttf'
LOGOS=sys.argv[1]; OUTD=sys.argv[2]
W,H=1920,1080
NAVY=(25,41,109); RED=(212,41,46); WHITE=(255,255,255); CBLUE=(22,75,140); SKY=(20,150,204)
def f(sz,b=8): return ImageFont.truetype(F8 if b==8 else F7,sz)
def L(i):
    im=Image.open(f'{LOGOS}/{i}.webp').convert('RGBA'); a=np.asarray(im).astype(np.float32)
    al=np.clip((255-a[...,:3].min(2))/60,0,1)*a[...,3]/255         # fundo branco -> transparente
    a[...,3]=al*255; im=Image.fromarray(a.astype('uint8')); return im.crop(im.getbbox())
LOGO_COR=L(1); LOGO_CNE=L(4)
def white(im):
    a=np.asarray(im).copy(); a[...,:3]=255; return Image.fromarray(a)
LOGO_COR_W,LOGO_CNE_W=white(LOGO_COR),white(LOGO_CNE)
def paste(b,im,x,y,h):
    r=im.resize((int(im.width*h/im.height),h),Image.LANCZOS); b.alpha_composite(r,(int(x),int(y))); return r.width
# ---------------- fundos ----------------
_yy,_xx=np.mgrid[0:H,0:W].astype(np.float32)
def bg_A():   # azul CNE com degradê radial (continuidade com o Apelo)
    r=np.sqrt(((_xx-960)/1100)**2+((_yy-540)/700)**2).clip(0,1)[...,None]
    a=np.array(SKY,np.float32)*(1-r)+np.array((11,90,160),np.float32)*r
    return Image.fromarray(a.astype('uint8')).convert('RGBA')
def bg_B():   # claro, institucional (branco + faixas)
    a=np.full((H,W,3),(246,248,252),np.float32); b=Image.fromarray(a.astype('uint8')).convert('RGBA')
    d=ImageDraw.Draw(b); d.rectangle((0,H-18,W,H),fill=NAVY); d.rectangle((0,H-28,W,H-18),fill=RED); return b
def bg_C():   # navy escuro, grelha subtil (infográfico)
    t=(_yy/H)[...,None]; a=np.array((14,24,70),np.float32)*(1-t)+np.array((6,12,40),np.float32)*t
    b=Image.fromarray(a.astype('uint8')).convert('RGBA'); d=ImageDraw.Draw(b)
    for x in range(0,W,80): d.line((x,0,x,H),fill=(255,255,255,10))
    for y in range(0,H,80): d.line((0,y,W,y),fill=(255,255,255,10))
    return b
# ---------------- elementos ----------------
def tag(b,x,y,text,sz,style,fg=None):
    d=ImageDraw.Draw(b); ft=f(sz); w=ft.getlength(text); cap=int(sz*.72); p=int(sz*.28)
    if style in('navy','red','white'):
        col={'navy':NAVY,'red':RED,'white':WHITE}[style]
        d.rectangle((x-p,y-cap-p,x+w+p,y+p*.8),fill=col)
        d.text((x,y),text,font=ft,fill=fg or (NAVY if style=='white' else WHITE),anchor='ls')
    else: d.text((x,y),text,font=ft,fill=fg or WHITE,anchor='ls')
    return w
def card(b,box,fill,r=26,outline=None,shadow=True):
    if shadow:
        s=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(s).rounded_rectangle((box[0],box[1]+10,box[2],box[3]+10),r,fill=(0,0,0,70))
        b.alpha_composite(s.filter(ImageFilter.GaussianBlur(14)))
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).rounded_rectangle(box,r,fill=fill,outline=outline,width=4 if outline else 0)
    b.alpha_composite(l)
# ícones de linha (estilo do logo CNE: traço redondo)
def icon(b,kind,cx,cy,s,col,acc=RED,w=None):
    d=ImageDraw.Draw(b); w=w or max(3,int(s*.07)); k=s/100
    P=lambda x,y:(cx+(x-50)*k,cy+(y-50)*k)
    def ln(*pts,c=col): d.line([P(*p) for p in pts],fill=c,width=w,joint='curve')
    def el(x0,y0,x1,y1,c=col,fill=None): d.ellipse((*P(x0,y0),*P(x1,y1)),outline=c,width=w,fill=fill)
    def rc(x0,y0,x1,y1,c=col): d.rounded_rectangle((*P(x0,y0),*P(x1,y1)),int(6*k),outline=c,width=w)
    if kind=='urna':
        ln((15,40),(50,22),(85,40),c=acc); ln((15,40),(50,58),(85,40),c=acc)
        ln((15,45),(15,80),(48,97),(48,62)); ln((52,62),(52,97),(85,80),(85,45))
        ln((38,48),(38,8),(60,0),(60,40)); ln((44,26),(54,14)); ln((44,14),(54,26))
    if kind=='porta':
        rc(25,8,75,95); ln((62,50),(62,58)); el(35,30,55,50,c=acc); ln((45,50),(45,62),c=acc)
    if kind=='mesa':
        el(38,8,62,32); ln((25,60),(30,42),(70,42),(75,60)); ln((5,62),(95,62)); ln((15,62),(15,95)); ln((85,62),(85,95))
    if kind=='pessoas':
        for ox in (-22,22): el(40+ox,12,60+ox,32); ln((32+ox,70),(32+ox,48),(68+ox,48),(68+ox,70))
        el(38,30,62,54,c=acc); ln((28,95),(28,72),(72,72),(72,95),c=acc)
    if kind=='cracha':
        rc(22,22,78,95); ln((40,22),(40,8),(60,8),(60,22)); el(38,36,62,60,c=acc); ln((34,74),(66,74)); ln((34,84),(58,84))
    if kind=='globo':
        el(10,10,90,90); d.arc((*P(32,10),*P(68,90)),0,360,fill=col,width=w); ln((10,50),(90,50)); ln((18,28),(82,28)); ln((18,72),(82,72))
    if kind=='saida':
        rc(10,8,58,95); ln((40,50),(92,50),c=acc); ln((78,36),(92,50),(78,64),c=acc)
    if kind=='relogio':
        el(8,8,92,92); ln((50,22),(50,50),(70,62),c=acc)
    if kind=='notas':
        rc(8,28,92,78); el(38,40,62,66,c=acc); ln((18,40),(18,40)); ln((82,66),(82,66))
    if kind=='banco':
        ln((8,36),(50,10),(92,36)); ln((8,36),(92,36)); ln((8,92),(92,92))
        for x in (22,42,58,78): ln((x,44),(x,84))
    if kind=='check':
        el(8,8,92,92); ln((28,52),(44,68),(74,36),c=acc)
    if kind=='aviso':
        ln((50,8),(94,90),(6,90),(50,8)); ln((50,38),(50,64),c=acc); ln((50,77),(50,79),c=acc)
    if kind=='tel':
        rc(28,6,72,94); ln((44,82),(56,82),c=acc)
# ---------------- frames por estilo ----------------
# cada cena: dict com título pequeno, linhas e ícones; desenhado de 3 maneiras
def frame(style,sc):
    b={'A':bg_A,'B':bg_B,'C':bg_C}[style]()
    on_dark=style!='B'; TXT=WHITE if on_dark else NAVY; ICO=WHITE if on_dark else CBLUE
    # logos
    if style=='B': paste(b,LOGO_COR,60,40,120); paste(b,LOGO_CNE,1560,60,80)
    else: paste(b,LOGO_COR_W,60,40,120); paste(b,LOGO_CNE_W,1560,60,80)
    sc(b,style,TXT,ICO); return b
def kicker(b,style,x,y,text):
    if style=='A': tag(b,x,y,text,46,'red')
    if style=='B':
        d=ImageDraw.Draw(b); d.rectangle((x,y-40,x+10,y+4),fill=RED); tag(b,x+30,y,text,42,'plain',RED)
    if style=='C':
        w=f(40).getlength(text); d=ImageDraw.Draw(b); d.rounded_rectangle((x-20,y-52,x+w+20,y+16),34,outline=RED,width=4); tag(b,x,y,text,40,'plain',(255,120,120))
def big(b,style,x,y,lines):
    prev=None
    for i,(t,sz,kind) in enumerate(lines):
        if prev: y+=int(prev*.30)+int(sz*.98)+14
        prev=sz
        if style=='A': tag(b,x,y,t,sz,kind if kind!='plain' else 'plain')
        if style=='B':
            col={'navy':NAVY,'red':RED,'plain':NAVY}[kind]; tag(b,x,y,t,sz,'plain',col)
        if style=='C':
            col={'navy':WHITE,'red':(255,95,95),'plain':(170,190,235)}[kind]; tag(b,x,y,t,sz,'plain',col)
# ===== V1 cenas =====
def v1_1(b,s,T,I):   # atenção: acesso restrito
    kicker(b,s,1000,330,'ATENÇÃO')
    big(b,s,1000,450,[('O ACESSO E A PERMANÊNCIA',52,'plain'),('NAS ASSEMBLEIAS DE VOTO',52,'plain'),('SÃO RESTRITOS',84,'red')])
    if s=='C': card(b,(260,300,760,800),(255,255,255,18),40)
    if s=='B': card(b,(260,300,760,800),WHITE,40)
    icon(b,'porta',510,550,380,I,RED,w=14)
def v1_2(b,s,T,I):   # quem pode entrar
    kicker(b,s,140,250,'SÓ PODEM ENTRAR E PERMANECER')
    items=[('mesa','MEMBROS','DA MESA'),('urna','REPRESENTANTES','DA CNE E APOIO'),('pessoas','CANDIDATOS','E MANDATÁRIOS'),('cracha','DELEGADOS','DAS CANDIDATURAS')]
    for k,(ic,a,c) in enumerate(items):
        x=140+k*420; y=330
        if s=='A': card(b,(x,y,x+380,y+520),(255,255,255,40),30,shadow=False)
        if s=='B': card(b,(x,y,x+380,y+520),WHITE,30)
        if s=='C': card(b,(x,y,x+380,y+520),(255,255,255,16),30,outline=(255,255,255,50),shadow=False)
        icon(b,ic,x+190,y+170,180,I,RED,w=9)
        tag(b,x+40,y+370,a,40,'plain',T if s!='C' else WHITE); tag(b,x+40,y+425,c,30,'plain',RED if s=='B' else ((255,120,120) if s=='C' else WHITE))
        if s=='A': ImageDraw.Draw(b).rectangle((x+40,y+460,x+120,y+468),fill=RED)
    tag(b,140,950,'NOS TERMOS DA LEI',32,'plain',T)
def v1_3(b,s,T,I):   # observadores + credenciais
    if s=='B': card(b,(160,260,900,880),WHITE,40)
    if s=='C': card(b,(160,260,900,880),(255,255,255,16),40,shadow=False)
    icon(b,'globo',380,520,300,I,RED,w=12); icon(b,'cracha',700,600,280,I,RED,w=12)
    kicker(b,s,1040,330,'OBSERVADORES INTERNACIONAIS')
    big(b,s,1040,450,[('DEVIDAMENTE',52,'plain'),('CREDENCIADOS',84,'navy'),('SÓ O TEMPO NECESSÁRIO',44,'plain'),('À OBSERVAÇÃO',44,'red')])
def v1_4(b,s,T,I):   # eleitor: votar e sair
    kicker(b,s,1000,330,'CARO ELEITOR')
    big(b,s,1000,450,[('APÓS VOTAR',60,'plain'),('ABANDONA O LOCAL',80,'red'),('E RESPEITA OS',44,'plain'),('MEMBROS DA MESA',60,'navy')])
    if s=='B': card(b,(260,300,760,800),WHITE,40)
    if s=='C': card(b,(260,300,760,800),(255,255,255,18),40,shadow=False)
    icon(b,'saida',510,550,360,I,RED,w=14)
# ===== V2 cenas =====
def v2_1(b,s,T,I):
    icon(b,'aviso',510,540,380,I,RED,w=14)
    if s=='B': pass
    kicker(b,s,1000,330,'ATENÇÃO')
    big(b,s,1000,450,[('MEMBROS DAS MESAS',66,'navy'),('DAS ASSEMBLEIAS DE VOTO',52,'plain'),('15 DE NOVEMBRO',60,'red')])
def v2_2(b,s,T,I):
    kicker(b,s,1000,300,'A FUNÇÃO É OBRIGATÓRIA')
    big(b,s,1000,420,[('COMPARECE ÀS',56,'plain')])
    if s=='A': tag(b,1000,700,'7H',260,'plain')
    if s=='B': tag(b,1000,700,'7H',260,'plain',RED)
    if s=='C': tag(b,1000,700,'7H',260,'plain',WHITE)
    big(b,s,1000,800,[('DA MANHÃ',56,'navy'),('INÍCIO PONTUAL DA VOTAÇÃO',38,'plain')])
    if s!='A': card(b,(260,300,760,800),WHITE if s=='B' else (255,255,255,18),40,shadow=s=='B')
    icon(b,'relogio',510,550,380,I,RED,w=14)
def v2_3(b,s,T,I):
    kicker(b,s,140,230,'COMPENSAÇÃO')
    rows=[('notas','MEMBROS DAS MESAS','3.500$00','inclui 1.000$00 de alimentação'),
          ('tel','PRESIDENTES DAS MESAS','+ 500$00','subsídio de comunicação'),
          ('pessoas','SUPLENTES','SÓ SE SUBSTITUÍREM','efetivamente um membro da mesa')]
    for k,(ic,a,v,n) in enumerate(rows):
        x=140+k*560; y=300
        if s=='A': card(b,(x,y,x+520,y+620),(255,255,255,40),30,shadow=False)
        if s=='B': card(b,(x,y,x+520,y+620),WHITE,30)
        if s=='C': card(b,(x,y,x+520,y+620),(255,255,255,16),30,outline=(255,255,255,50),shadow=False)
        icon(b,ic,x+260,y+130,150,I,RED,w=8)
        tag(b,x+40,y+290,a,30,'plain',T if s!='C' else (170,190,235))
        vs=78 if len(v)<10 else 40
        if s=='A': tag(b,x+40,y+410,v,vs,'navy' if k<2 else 'plain')
        else: tag(b,x+40,y+410,v,vs,'plain',RED if s=='B' else WHITE)
        tag(b,x+40,y+500,n.upper(),24,'plain',T if s!='C' else (170,190,235))
def v2_4(b,s,T,I):
    if s=='B': card(b,(260,300,760,800),WHITE,40)
    if s=='C': card(b,(260,300,760,800),(255,255,255,18),40,shadow=False)
    icon(b,'banco',510,550,360,I,RED,w=14)
    kicker(b,s,1000,330,'ATENÇÃO')
    big(b,s,1000,450,[('PAGAMENTO POSTERIOR',52,'plain'),('POR TRANSFERÊNCIA',70,'navy'),('BANCÁRIA',70,'red'),('A TUA PRESENÇA FAZ A DIFERENÇA',36,'plain')])
# ---------------- montagem do blueprint ----------------
STY=[('A','INSTITUCIONAL AZUL','continuidade com o Apelo: azul CNE, caixas navy/vermelho, ícones brancos'),
     ('B','CLARO OFICIAL','fundo claro, texto navy, acentos vermelhos, cartões brancos, logos a cores'),
     ('C','INFOGRÁFICO ESCURO','navy profundo com grelha, cartões translúcidos, números grandes')]
def board(title,sub,scenes,labels,out):
    tw,th=640,360; gap=24; lw=330; top=190
    BW=lw+4*tw+5*gap; BH=top+3*(th+90)+40
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((40,62),title,font=f(46),fill=WHITE,anchor='ls'); d.text((40,108),sub,font=f(24,7),fill=(190,205,240),anchor='ls')
    for c,lb in enumerate(labels):
        d.text((lw+gap+c*(tw+gap),top-14),lb,font=f(22),fill=NAVY,anchor='ls')
    for r,(s,nm,desc) in enumerate(STY):
        y=top+r*(th+90)
        d.text((30,y+60),f'ESTILO {s}',font=f(40),fill=RED,anchor='ls'); d.text((30,y+105),nm,font=f(26),fill=NAVY,anchor='ls')
        words=desc.split(); line=''; yy=y+150
        for wd in words:
            if f(19,7).getlength(line+' '+wd)>280: d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls'); yy+=28; line=wd
            else: line=(line+' '+wd).strip()
        d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls')
        for c,sc in enumerate(scenes):
            im=frame(s,sc).convert('RGB').resize((tw,th),Image.LANCZOS); x=lw+gap+c*(tw+gap)
            bd.paste(im,(x,y)); d.rectangle((x-1,y-1,x+tw,y+th),outline=(200,205,215))
    bd.save(out,quality=90); print('ok',out)
board('VÍDEO 1 · ACESSO E PERMANÊNCIA NAS ASSEMBLEIAS DE VOTO','Blueprint de estilos · só grafismo · 16:9 · ~1:29 · 4 momentos-chave da locução',
      [v1_1,v1_2,v1_3,v1_4],['1 · ATENÇÃO: ACESSO RESTRITO (6–10s)','2 · QUEM PODE ENTRAR (22–35s)','3 · OBSERVADORES / CREDENCIAIS (35–62s)','4 · ELEITOR: VOTA E SAI (75–82s)'],
      OUTD+'/Blueprint_V1_Acesso_estilos.jpg')
board('VÍDEO 2 · ATENÇÃO MEMBROS DAS ASSEMBLEIAS DE VOTO','Blueprint de estilos · só grafismo · 16:9 · ~1:04 · 4 momentos-chave da locução',
      [v2_1,v2_2,v2_3,v2_4],['1 · ATENÇÃO MEMBROS DAS MESAS (0–8s)','2 · OBRIGATÓRIO · 7H DA MANHÃ (16–29s)','3 · COMPENSAÇÃO (29–48s)','4 · TRANSFERÊNCIA BANCÁRIA (48–55s)'],
      OUTD+'/Blueprint_V2_Membros_estilos.jpg')

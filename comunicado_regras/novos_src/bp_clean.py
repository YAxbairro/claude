# Blueprint: 5 variações CLEAN com ilustrações 3D (three.js, motion/img3d). Uma só prancha.
import sys; OUT=sys.argv[1]; sys.argv=['x']
from PIL import Image,ImageDraw,ImageFilter
import numpy as np, bp_graf as g
W,H=1920,1080; NAVY,RED,WHITE=g.NAVY,g.RED,g.WHITE; f=g.f; D='motion/img3d/'
def obj(name,h):
    im=Image.open(D+name+'.png').convert('RGBA'); im=im.crop(im.getbbox()); return g.rs(im,h)
def grad(c0,c1,vert=True):
    t=np.linspace(0,1,H if vert else W); a=np.array(c0)[None]*(1-t[:,None])+np.array(c1)[None]*t[:,None]
    a=a[:,None,:].repeat(W,1) if vert else a[None].repeat(H,0); return Image.fromarray(a.astype('uint8')).convert('RGBA')
def logos(b,light=True):
    b.alpha_composite(g.rs(g.LE if light else g.LEw,78),(70,46)); b.alpha_composite(g.rs(g.LC if light else g.LCw,50),(1650,58))
def lgp(b,dark=False):
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).rounded_rectangle((1580,720,1880,1080),28,outline=(255,255,255,90) if dark else (25,41,109,45),width=3); b.alpha_composite(l)
def spaced(d,x,y,t,ft,col,anchor='l',sp=8):
    w=sum(ft.getlength(c)+sp for c in t)-sp; x=x-w/2 if anchor=='m' else x
    for c in t: d.text((x,y),c,font=ft,fill=col,anchor='ls'); x+=ft.getlength(c)+sp
def put(b,im,x,y,shadow=True):
    b.alpha_composite(im,(int(x),int(y)))
SC=[dict(o='clock',cap='COMPARECE ÀS',t1='7H',t2='DA MANHÃ',sub='Para o início pontual da votação',big='7H'),
    dict(o='mesa',cap='SÃO AUTORIZADOS',t1='MEMBROS',t2='DA MESA',sub='Cada mesa de voto tem 4 membros',big='4'),
    dict(o='urna',cap='CARO ELEITOR',t1='APÓS VOTAR',t2='ABANDONA O LOCAL',sub='E respeita as orientações da mesa',big='15/11')]
GREY=(92,104,140)
def V1(s):  # CLEAN BRANCO
    b=Image.new('RGBA',(W,H),(248,250,253,255)); d=ImageDraw.Draw(b); logos(b)
    spaced(d,180,430,s['cap'],f(30,7),RED); d.text((176,530),s['t1'],font=f(96),fill=NAVY,anchor='ls'); d.text((176,640),s['t2'],font=f(96),fill=NAVY,anchor='ls')
    d.rectangle((180,680,300,688),fill=RED); d.text((180,750),s['sub'],font=f(34,7),fill=GREY,anchor='ls')
    o=obj(s['o'],560 if s['o']!='mesa' else 420); put(b,o,1250-o.width/2,600-o.height/2); lgp(b); return b
def V2(s):  # CIANO SUAVE CENTRADO
    b=grad((226,244,252),(188,228,246)); d=ImageDraw.Draw(b); logos(b)
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).ellipse((660,140,1260,740),fill=(255,255,255,120)); b.alpha_composite(l.filter(ImageFilter.GaussianBlur(30)))
    o=obj(s['o'],440 if s['o']!='mesa' else 330); put(b,o,960-o.width/2,600-o.height)
    spaced(d,960,700,s['cap'],f(28,7),RED,'m'); ft=f(80); t=s['t1']+' '+s['t2']; w=ft.getlength(s['t1']+' ')
    x=960-ft.getlength(t)/2; d.text((x,800),s['t1'],font=ft,fill=NAVY,anchor='ls'); d.text((x+w,800),s['t2'],font=ft,fill=RED,anchor='ls')
    d.text((960,868),s['sub'],font=f(32,7),fill=GREY,anchor='ms'); lgp(b); return b
def V3(s):  # SPLIT NAVY / BRANCO
    b=Image.new('RGBA',(W,H),(246,248,252,255)); d=ImageDraw.Draw(b); d.rectangle((0,0,860,H),fill=NAVY); d.rectangle((860,0,872,H),fill=RED)
    logos(b,False); b.alpha_composite(g.rs(g.LC,50),(1650,58))
    spaced(d,120,420,s['cap'],f(28,7),(120,200,240)); d.text((116,515),s['t1'],font=f(84),fill=WHITE,anchor='ls'); d.text((116,612),s['t2'],font=f(84),fill=WHITE,anchor='ls')
    d.text((120,690),s['sub'],font=f(30,7),fill=(190,200,230),anchor='ls')
    o=obj(s['o'],560 if s['o']!='mesa' else 400); put(b,o,1290-o.width/2,580-o.height/2); lgp(b); return b
def V4(s):  # CARTÃO FLUTUANTE
    b=grad((233,238,246),(220,228,240)); d=ImageDraw.Draw(b); logos(b)
    sh=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(sh).rounded_rectangle((170,300,1300,820),48,fill=(20,40,90,70)); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(40)),(0,26))
    d.rounded_rectangle((150,270,1290,800),48,fill=WHITE); d.rounded_rectangle((150,270,166,800),8,fill=RED)
    spaced(d,240,410,s['cap'],f(28,7),RED); d.text((236,510),s['t1'],font=f(84),fill=NAVY,anchor='ls'); d.text((236,606),s['t2'],font=f(84),fill=NAVY,anchor='ls')
    d.text((240,690),s['sub'],font=f(30,7),fill=GREY,anchor='ls')
    o=obj(s['o'],560 if s['o']!='mesa' else 400); put(b,o,1300-o.width/2+(80 if s['o']=='mesa' else 0),560-o.height/2); lgp(b); return b
def V5(s):  # TIPOGRÁFICO NAVY
    b=grad((14,24,74),(28,44,116)); d=ImageDraw.Draw(b); logos(b,False)
    ft=f(560); l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).text((1010,820),s['big'],font=ft if len(s['big'])<4 else f(380),fill=(255,255,255,30),anchor='ms',stroke_width=0); b.alpha_composite(l)
    o=obj(s['o'],520 if s['o']!='mesa' else 380); put(b,o,1010-o.width/2,800-o.height)
    spaced(d,140,820,s['cap'],f(26,7),(120,200,240)); d.text((136,900),s['t1']+' '+s['t2'],font=f(64),fill=WHITE,anchor='ls'); d.rectangle((140,930,240,936),fill=RED)
    d.text((140,985),s['sub'],font=f(28,7),fill=(180,192,228),anchor='ls'); lgp(b,True); return b
ROWS=[('1','CLEAN BRANCO','Fundo branco, muito espaço, texto navy à esquerda, objeto 3D à direita.',V1),
      ('2','CIANO SUAVE','Degradê ciano claro, objeto 3D ao centro, texto centrado por baixo.',V2),
      ('3','SPLIT NAVY','Painel navy com texto branco à esquerda, objeto 3D no lado claro.',V3),
      ('4','CARTÃO FLUTUANTE','Cartão branco com sombra suave, objeto 3D a sair do cartão.',V4),
      ('5','TIPOGRÁFICO','Fundo navy, número/palavra gigante por trás, objeto 3D à frente, texto em baixo.',V5)]
tw,th=640,360; gap=24; lw=330; top=190; BW=lw+3*tw+4*gap; BH=top+5*(th+50)+20
bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd); d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
d.text((40,62),'5 VARIAÇÕES CLEAN · ilustrações 3D',font=f(46),fill=WHITE,anchor='ls'); d.text((40,108),'Mesmas 3 cenas em cada variação · escolhe uma · canto inferior direito livre para a intérprete',font=f(24,7),fill=(190,205,240),anchor='ls')
for c,lb in enumerate(['7H DA MANHÃ','MEMBROS DA MESA','APÓS VOTAR']): d.text((lw+gap+c*(tw+gap),top-14),lb,font=f(22),fill=NAVY,anchor='ls')
for r,(n,nm,desc,fn) in enumerate(ROWS):
    y=top+r*(th+50); d.text((30,y+60),f'VARIAÇÃO {n}',font=f(36),fill=RED,anchor='ls'); d.text((30,y+100),nm,font=f(22),fill=NAVY,anchor='ls')
    line='';yy=y+140
    for wd in desc.split():
        if f(19,7).getlength(line+' '+wd)>280: d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls'); yy+=28; line=wd
        else: line=(line+' '+wd).strip()
    d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls')
    for c,s in enumerate(SC): bd.paste(fn(s).convert('RGB').resize((tw,th),Image.LANCZOS),(lw+gap+c*(tw+gap),y))
bd.save(OUT,quality=90); print('ok')

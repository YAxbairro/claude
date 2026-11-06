# Variações só das cenas 1 (urna) e 2 (Palácio) — estilo A. Uso: python3 bp_s12.py <saida.jpg>
import sys,os; OUT=sys.argv[1]; HERE=os.path.dirname(os.path.abspath(__file__)); sys.argv=['x',HERE+'/logos','.']
exec(open(HERE+'/bp_ab.py',encoding='utf-8').read().split('# ---------------- montagem')[0])
URNA=Image.open(HERE+'/logos/urna_mao.png').convert('RGBA'); PAL=Image.open(HERE+'/logos/palacio.png').convert('RGBA')
def rsH(im,h): return im.resize((int(im.width*h/im.height),h),Image.LANCZOS)
def rsW(im,w): return im.resize((w,int(im.height*w/im.width)),Image.LANCZOS)
def base():
    b=bg_A(); paste(b,LOGO_COR_W,60,40,120); paste(b,LOGO_CNE_W,1560,60,80); return b
def shadow(b,box,a=110):
    s=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(s).ellipse(box,fill=(0,20,60,a)); b.alpha_composite(s.filter(ImageFilter.GaussianBlur(20)))
def circ(b,cx,cy,r,a=38):
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).ellipse((cx-r,cy-r,cx+r,cy+r),fill=(255,255,255,a)); b.alpha_composite(l)
def ctag(b,cx,y,t,sz,kind):
    w=f(sz).getlength(t); tag(b,cx-w/2,y,t,sz,kind)
def tint(im,col=(20,110,190),k=.55):
    a=np.asarray(im).astype(np.float32); g=(a[...,:3]@[.3,.59,.11])[...,None]; rgb=g/255*np.array((255,255,255))*(1-k)+np.array(col)*k*(g/255*1.3)
    return Image.fromarray(np.dstack([rgb.clip(0,255),a[...,3]]).astype('uint8'))
# ---------- CENA 1 ----------
def c1_A(b):  # urna ao centro, a subir do fundo; texto em cima centrado
    shadow(b,(560,690,1060,740)); u=rsH(URNA,720); b.alpha_composite(u,(800-u.width//2,-6))
    ctag(b,800,860,'15 DE NOVEMBRO',46,'red'); ctag(b,800,970,'CABO VERDE VAI ÀS URNAS',76,'navy')
def c1_B(b):  # urna grande à direita cortada pelo fundo; texto grande à esquerda
    circ(b,1180,700,470); u=rsH(URNA,1080); b.alpha_composite(u,(1180-u.width//2,-6))
    tag(b,140,420,'15 DE NOVEMBRO',46,'red'); tag(b,140,560,'CABO VERDE',120,'plain'); tag(b,140,690,'VAI ÀS URNAS',92,'navy')
def c1_C(b):  # "15" gigante translúcido por trás da urna; texto à direita
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).text((520,940),'15',font=f(900),fill=(255,255,255,40),anchor='ms'); b.alpha_composite(l)
    shadow(b,(270,830,780,890)); u=rsH(URNA,860); b.alpha_composite(u,(520-u.width//2,-6))
    tag(b,1000,430,'15 DE NOVEMBRO',50,'red'); tag(b,1000,560,'CABO VERDE',96,'plain'); tag(b,1000,680,'VAI ÀS URNAS',80,'navy')
def c1_D(b):  # círculo translúcido (referência V.A) com a urna a sair dele; data em bloco tipo calendário
    circ(b,520,600,420); u=rsH(URNA,840); shadow(b,(260,810,780,870)); b.alpha_composite(u,(520-u.width//2,-6))
    d=ImageDraw.Draw(b); d.rounded_rectangle((1000,300,1230,540),20,fill=WHITE); d.rectangle((1000,300,1230,370),fill=RED)
    d.text((1115,352),'NOV',font=f(46),fill=WHITE,anchor='ms'); d.text((1115,505),'15',font=f(130),fill=NAVY,anchor='ms')
    tag(b,1000,690,'CABO VERDE',96,'plain'); tag(b,1000,800,'VAI ÀS URNAS',80,'red')
# ---------- CENA 2 ----------
def c2_A(b):  # palácio em panorama na base, texto centrado em cima
    p=rsW(PAL,1500); shadow(b,(80,1040,1500,1100),90); b.alpha_composite(p,(40,1080-p.height+20))
    ctag(b,800,250,'ELEGER O PRESIDENTE',84,'navy'); ctag(b,800,360,'DA REPÚBLICA',84,'red')
def c2_B(b):  # palácio dentro de círculo (cor) à direita; texto à esquerda
    r=420; cx,cy=1160,580; p=rsH(PAL,640); m=Image.new('L',b.size,0); ImageDraw.Draw(m).ellipse((cx-r,cy-r,cx+r,cy+r),fill=255)
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).ellipse((cx-r,cy-r,cx+r,cy+r),fill=(140,200,240,255)); l.alpha_composite(p,(cx-p.width//2,cy-p.height//2+150))
    l.putalpha(Image.fromarray(np.minimum(np.asarray(l.split()[3]),np.asarray(m)))); b.alpha_composite(l)
    ImageDraw.Draw(b).ellipse((cx-r-8,cy-r-8,cx+r+8,cy+r+8),outline=WHITE,width=8)
    tag(b,140,470,'ELEGER O',76,'plain'); tag(b,140,590,'PRESIDENTE',100,'navy'); tag(b,140,710,'DA REPÚBLICA',84,'red')
def c2_C(b):  # palácio grande à direita, a sair do ecrã; texto à esquerda
    p=rsW(PAL,1350); b.alpha_composite(p,(760,1080-p.height-60))
    tag(b,140,420,'ELEGER O',76,'plain'); tag(b,140,540,'PRESIDENTE',100,'navy'); tag(b,140,660,'DA REPÚBLICA',84,'red')
def c2_D(b):  # palácio em azul (duotone) como cenário de fundo; texto centrado por cima
    p=tint(rsW(PAL,1920),k=.65); a=np.asarray(p).astype(np.float32); a[...,3]*=.55; b.alpha_composite(Image.fromarray(a.astype('uint8')),(0,1080-p.height+60))
    ctag(b,960,430,'ELEGER O',70,'plain'); ctag(b,960,560,'PRESIDENTE DA REPÚBLICA',96,'navy')
    d=ImageDraw.Draw(b); d.rectangle((760,610,1160,624),fill=WHITE); d.rectangle((760,624,1160,638),fill=RED); d.rectangle((760,638,1160,652),fill=WHITE)
def lgp(b):
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).rounded_rectangle((1580,720,1880,1080),28,outline=(255,255,255,90),width=3); b.alpha_composite(l)
ROWS=[('CENA 1 · 0–3,5s · URNA',[('A','URNA AO CENTRO, TEXTO EM BAIXO',c1_A),('B','URNA GRANDE À DIREITA',c1_B),('C','"15" GIGANTE POR TRÁS',c1_C),('D','CÍRCULO + CALENDÁRIO',c1_D)]),
      ('CENA 2 · 3,5–5,6s · PALÁCIO',[('A','PANORAMA NA BASE',c2_A),('B','PALÁCIO NUM CÍRCULO',c2_B),('C','PALÁCIO GRANDE À DIREITA',c2_C),('D','PALÁCIO EM AZUL NO FUNDO',c2_D)])]
tw,th=640,360; gap=26; top=200
BW=gap+4*(tw+gap); BH=top+2*(th+110)
bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
d.text((40,62),'VÍDEO 1 · VARIAÇÕES DAS CENAS 1 E 2 (estilo A)',font=f(44),fill=WHITE,anchor='ls')
d.text((40,108),'Escolhe uma variação para cada cena · ex.: "cena 1 = C, cena 2 = B" · canto inferior direito livre para a intérprete',font=f(22,7),fill=(190,205,240),anchor='ls')
for r,(title,vs) in enumerate(ROWS):
    y=top+r*(th+110)+40; d.text((gap,y-50),title,font=f(28),fill=RED,anchor='ls')
    for c,(k,nm,fn) in enumerate(vs):
        x=gap+c*(tw+gap); b=base(); fn(b); lgp(b)
        d.text((x,y-14),f'{k} · {nm}',font=f(20),fill=NAVY,anchor='ls'); bd.paste(b.convert('RGB').resize((tw,th),Image.LANCZOS),(x,y))
bd.save(OUT,quality=90); print('ok',bd.size)

# Blueprint no estilo da referência (V.A Profissionais / Doentes e Presos): fundo ciano, círculo translúcido,
# imagem recortada (GPT) a sair do círculo, texto branco à direita com caixas navy/vermelho, faixas navy/vermelho nas transições.
# As imagens ainda não existem: aparecem como "IMG xx" (placeholder) no sítio onde vão ficar.
import sys,os
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); OUTD=sys.argv[1]
F8=HERE+'/../realista_src/fonts/M800.ttf'; F7=HERE+'/../realista_src/fonts/M700.ttf'
W,H=1920,1080; CY=(20,157,208); NAVY=(25,41,109); RED=(212,41,46); WHITE=(255,255,255)
def f(sz,b=8): return ImageFont.truetype(F8 if b==8 else F7,sz)
def L(p):
    im=Image.open(p).convert('RGBA'); a=np.asarray(im).astype(np.float32)
    a[...,3]=np.clip((255-a[...,:3].min(2))/60,0,1)*a[...,3]; im=Image.fromarray(a.astype('uint8')); return im.crop(im.getbbox())
def white(im): a=np.asarray(im).copy(); a[...,:3]=255; return Image.fromarray(a)
LE=L(HERE+'/logos/1.webp'); LC=L(HERE+'/logos/4.webp'); LEw,LCw=white(LE),white(LC)
def rs(im,h): return im.resize((int(im.width*h/im.height),h),Image.LANCZOS)
_yy,_xx=np.mgrid[0:H,0:W].astype(np.float32)
def bg():
    r=np.sqrt(((_xx-1300)/1500)**2+((_yy-300)/1100)**2).clip(0,1)[...,None]
    a=np.array((40,170,220),np.float32)*(1-r)+np.array(CY,np.float32)*r
    b=Image.fromarray(a.astype('uint8')).convert('RGBA')
    b.alpha_composite(rs(LE,95),(60,40)); b.alpha_composite(rs(LCw,62),(1600,55)); return b
def circle(b,cx,cy,r):
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).ellipse((cx-r,cy-r,cx+r,cy+r),fill=(255,255,255,38)); b.alpha_composite(l)
def placeholder(b,box,label,kind='pessoa'):
    """silhueta cinzenta com etiqueta da imagem a gerar"""
    x0,y0,x1,y1=box; l=Image.new('RGBA',b.size,(0,0,0,0)); d=ImageDraw.Draw(l); c=(235,242,250,235); cx=(x0+x1)/2
    if kind=='pessoa':
        w=x1-x0; d.ellipse((cx-w*.16,y0,cx+w*.16,y0+w*.34),fill=c)
        d.rounded_rectangle((cx-w*.32,y0+w*.38,cx+w*.32,y0+(y1-y0)*.62),int(w*.12),fill=c)
        d.rectangle((cx-w*.25,y0+(y1-y0)*.58,cx-w*.04,y1),fill=c); d.rectangle((cx+w*.04,y0+(y1-y0)*.58,cx+w*.25,y1),fill=c)
    elif kind=='grupo':
        n=5; w=(x1-x0)/n
        for i in range(n):
            sx=x0+i*w; s=.82 if i!=2 else 1.0; yy0=y1-min(y1-y0,w*2.7)*s
            placeholder_one(d,sx+w*.08,yy0,sx+w*.92,y1,(235,242,250,170 if i!=2 else 240))
    else: d.rounded_rectangle(box,40,fill=c)
    sh=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(sh).ellipse((x0+20,y1-18,x1-20,y1+18),fill=(0,40,80,70)); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
    b.alpha_composite(l)
    d=ImageDraw.Draw(b); ft=f(34); tw=ft.getlength(label)
    d.rounded_rectangle((cx-tw/2-18,(y0+y1)/2-30,cx+tw/2+18,(y0+y1)/2+22),12,fill=NAVY); d.text((cx,(y0+y1)/2+10),label,font=ft,fill=WHITE,anchor='ms')
def placeholder_one(d,x0,y0,x1,y1,c):
    cx=(x0+x1)/2; w=x1-x0
    d.ellipse((cx-w*.16,y0,cx+w*.16,y0+w*.34),fill=c); d.rounded_rectangle((cx-w*.32,y0+w*.38,cx+w*.32,y0+(y1-y0)*.62),int(w*.12),fill=c)
    d.rectangle((cx-w*.25,y0+(y1-y0)*.58,cx-w*.04,y1),fill=c); d.rectangle((cx+w*.04,y0+(y1-y0)*.58,cx+w*.25,y1),fill=c)
def text(b,x,y,lines,anchor='l'):
    d=ImageDraw.Draw(b)
    for t,role in lines:
        if role=='cap':   # pequeno, espaçado
            ft=f(34,7); xx=x
            if anchor=='m': xx=x-sum(ft.getlength(c)+6 for c in t)/2
            for ch in t: d.text((xx,y),ch,font=ft,fill=WHITE,anchor='ls'); xx+=ft.getlength(ch)+6
            y+=82
        else:
            sz={'t':74,'n':74,'r':70}[role]; ft=f(sz); w=ft.getlength(t); xx=x-w/2 if anchor=='m' else x
            if role in('n','r'): d.rectangle((xx-14,y-sz*.78,xx+w+14,y+sz*.2),fill=NAVY if role=='n' else RED)
            d.text((xx,y),t,font=ft,fill=WHITE,anchor='ls'); y+=int(sz*1.18)
    return y
def interp(b):   # zona da intérprete de língua gestual (reservada)
    l=Image.new('RGBA',b.size,(0,0,0,0)); d=ImageDraw.Draw(l); d.rounded_rectangle((1580,720,1880,1080),30,outline=(255,255,255,120),width=4)
    b.alpha_composite(l); ImageDraw.Draw(b).text((1730,905),'INTÉRPRETE LGP',font=f(22),fill=(255,255,255,200),anchor='ms')
def stripes(b,k):  # faixas de transição
    d=ImageDraw.Draw(b); cols=[NAVY,RED,NAVY,NAVY,RED,NAVY]; w=W/len(cols)
    for i,c in enumerate(cols):
        h=H*min(1,max(0,k*1.6-i*.12)); d.rectangle((i*w,0,(i+1)*w+1,h),fill=c)
# ---------- variações ----------
def A(sc):   # fiel à referência: círculo à esquerda, imagem a sair, texto à direita
    b=bg(); circle(b,560,620,430); placeholder(b,(330,170,800,1000),sc['img'],sc.get('kind','pessoa'))
    text(b,1010,470,sc['txt']); interp(b); return b
def B(sc):   # espelho + faixa vertical navy/vermelho: imagem à direita, texto à esquerda
    b=bg(); d=ImageDraw.Draw(b); d.rectangle((110,330,124,720),fill=RED); d.rectangle((124,330,134,720),fill=NAVY)
    circle(b,1180,600,420); placeholder(b,(950,160,1410,990),sc['img'],sc.get('kind','pessoa'))
    text(b,180,450,sc['txt']); interp(b); return b
def C(sc):   # texto em cima ao centro, imagem grande em baixo (bom p/ grupos e listas)
    b=bg(); circle(b,960,1120,620)
    y=text(b,960,300,sc['txt'],'m'); placeholder(b,(560,max(y+20,560),1360,1060),sc['img'],sc.get('kind','grupo'))
    interp(b); return b
def T(sc):   # transição com faixas
    b=A(sc); stripes(b,.55); return b
V1=[dict(img='IMG 01',txt=[('ATENÇÃO','cap'),('ACESSO RESTRITO','t'),('ÀS ASSEMBLEIAS','n'),('DE VOTO','r')],kind='obj'),
    dict(img='IMG 02',txt=[('SÃO AUTORIZADOS','cap'),('MEMBROS','t'),('DA MESA','n')],kind='grupo'),
    dict(img='IMG 06',txt=[('OBSERVADORES','cap'),('INTERNACIONAIS','t'),('CREDENCIADOS','n')]),
    dict(img='IMG 09',txt=[('CARO ELEITOR','cap'),('APÓS VOTAR','t'),('ABANDONA O LOCAL','r')])]
V2=[dict(img='IMG 01',txt=[('ATENÇÃO','cap'),('MEMBROS','t'),('DAS MESAS','n')]),
    dict(img='IMG 03',txt=[('COMPARECE ÀS','cap'),('7H','t'),('DA MANHÃ','n')],kind='obj'),
    dict(img='IMG 04',txt=[('COMPENSAÇÃO','cap'),('3.500$00','t'),('INCLUI ALIMENTAÇÃO','n')],kind='obj'),
    dict(img='IMG 07',txt=[('PAGAMENTO POR','cap'),('TRANSFERÊNCIA','t'),('BANCÁRIA','r')],kind='obj')]
ROWS=[('A','FIEL À REFERÊNCIA','Círculo translúcido à esquerda, imagem recortada a sair dele, texto à direita. Igual aos vídeos V.A.'),
      ('B','ESPELHO + FAIXA','Imagem à direita, texto à esquerda com barra vermelha/navy. Alterna com A para dar ritmo.'),
      ('C','CENTRADO / GRUPO','Texto ao centro em cima, imagem grande em baixo. Ideal para listas e grupos de pessoas.')]
def board(title,scenes,labels,out):
    tw,th=640,360; gap=24; lw=330; top=190; BW=lw+4*tw+5*gap; BH=top+3*(th+90)+40
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((40,62),title,font=f(46),fill=WHITE,anchor='ls'); d.text((40,108),'Estilo da referência V.A · imagens IMG xx a gerar no GPT · canto inferior direito livre para a intérprete',font=f(24,7),fill=(190,205,240),anchor='ls')
    for c,lb in enumerate(labels): d.text((lw+gap+c*(tw+gap),top-14),lb,font=f(22),fill=NAVY,anchor='ls')
    for r,(s,nm,desc) in enumerate(ROWS):
        y=top+r*(th+90); fn={'A':A,'B':B,'C':C}[s]
        d.text((30,y+60),f'VARIAÇÃO {s}',font=f(36),fill=RED,anchor='ls'); d.text((30,y+105),nm,font=f(24),fill=NAVY,anchor='ls')
        line=''; yy=y+150
        for wd in desc.split():
            if f(19,7).getlength(line+' '+wd)>280: d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls'); yy+=28; line=wd
            else: line=(line+' '+wd).strip()
        d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls')
        for c,sc in enumerate(scenes):
            im=fn(sc)
            if r==0 and c==3: im=T(sc)
            im=im.convert('RGB').resize((tw,th),Image.LANCZOS); x=lw+gap+c*(tw+gap); bd.paste(im,(x,y))
    bd.save(out,quality=90); print('ok',out)
board('VÍDEO 1 · ACESSO E PERMANÊNCIA — estilo referência',V1,['1 · ACESSO RESTRITO','2 · QUEM PODE ENTRAR','3 · OBSERVADORES','4 · ELEITOR SAI  (A: com transição de faixas)'],OUTD+'/Blueprint_V1_estilo_referencia.jpg')
board('VÍDEO 2 · MEMBROS DAS MESAS — estilo referência',V2,['1 · ATENÇÃO MEMBROS','2 · 7H DA MANHÃ','3 · COMPENSAÇÃO','4 · TRANSFERÊNCIA BANCÁRIA'],OUTD+'/Blueprint_V2_estilo_referencia.jpg')

# Blueprint no estilo da referência (V.A Profissionais / Doentes e Presos): fundo ciano, círculo translúcido,
# imagem recortada (GPT) a sair do círculo, texto branco à direita com caixas navy/vermelho, faixas navy/vermelho nas transições.
# As imagens ainda não existem: aparecem como "IMG xx" (placeholder) no sítio onde vão ficar.
import sys,os
from PIL import Image,ImageDraw,ImageFont,ImageFilter
import numpy as np
HERE=os.path.dirname(os.path.abspath(__file__)); OUTD=sys.argv[1] if len(sys.argv)>1 else '.'
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
    b=bg(); circle(b,560,620,430); ILL(b,(330,170,800,1000),sc["img"])
    text(b,1010,470,sc['txt']); interp(b); return b
def B(sc):   # espelho + faixa vertical navy/vermelho: imagem à direita, texto à esquerda
    b=bg(); d=ImageDraw.Draw(b); d.rectangle((110,330,124,720),fill=RED); d.rectangle((124,330,134,720),fill=NAVY)
    circle(b,1260,600,400); ILL(b,(1020,200,1500,990),sc["img"])
    text(b,180,450,sc['txt']); interp(b); return b
def C(sc):   # texto em cima ao centro, ilustração grande em baixo (bom p/ grupos e listas)
    b=bg(); circle(b,960,1120,620)
    y=text(b,960,300,sc['txt'],'m'); ILL(b,(610,max(y+10,520),1310,1050),sc['img'])
    interp(b); return b
def T(sc):   # transição com faixas
    b=A(sc); stripes(b,.55); return b

# ---------- ilustrações vetoriais (flat, sombras suaves) ----------
SK=[(139,90,60),(107,65,40),(168,113,76),(92,58,38)]; INK=(24,26,32); INK2=(46,50,60); PAPER=(250,250,246)
def ILL(b,box,name):
    x0,y0,x1,y1=box; w,h=x1-x0,y1-y0; sz=min(h,w*1.3); out=ILL_img(name,int(sz),True)
    b.alpha_composite(out,(int(x0+(w-sz)/2),int(y1-sz)))
def ILL_img(name,sz,shadow=False):
    S=2
    L=Image.new('RGBA',(int(sz*S),int(sz*S)),(0,0,0,0)); d=ImageDraw.Draw(L); k=sz*S/100
    P=lambda x,y:(x*k,y*k)
    def R(a,b_,c,e,col,r=2): d.rounded_rectangle((*P(a,b_),*P(c,e)),int(r*k),fill=col)
    def E(a,b_,c,e,col): d.ellipse((*P(a,b_),*P(c,e)),fill=col)
    def G(pts,col): d.polygon([P(*p) for p in pts],fill=col)
    def Ln(pts,col,wd): d.line([P(*p) for p in pts],fill=col,width=max(1,int(wd*k)),joint='curve')
    def person(cx,top,sc,skin,shirt,cracha=True):
        E(cx-6*sc,top,cx+6*sc,top+12*sc,skin)                       # cabeça
        E(cx-6.4*sc,top-.6*sc,cx+6.4*sc,top+6*sc,INK)                # cabelo
        E(cx-6*sc,top+2.5*sc,cx+6*sc,top+12*sc,skin)
        d.pieslice((*P(cx-12*sc,top+13*sc),*P(cx+12*sc,top+41*sc)),180,360,fill=shirt)  # tronco
        R(cx-12*sc,top+26.5*sc,cx+12*sc,top+34*sc,shirt,0)
        if cracha: Ln([(cx-4*sc,top+13.5*sc),(cx,top+21*sc),(cx+4*sc,top+13.5*sc)],NAVY,1*sc); R(cx-2.6*sc,top+20*sc,cx+2.6*sc,top+25*sc,WHITE,.6)
    def urna(cx,base,wd,hand=True):
        G([(cx-wd*.46,base),(cx+wd*.46,base),(cx+wd*.5,base-wd*1.0),(cx-wd*.5,base-wd*1.0)],INK)
        G([(cx-wd*.5,base-wd*1.0),(cx-wd*.46,base),(cx-wd*.3,base),(cx-wd*.33,base-wd*1.0)],INK2)   # face lateral clara
        R(cx-wd*.6,base-wd*1.14,cx+wd*.6,base-wd*.98,INK2,1.2); R(cx-wd*.55,base-wd*1.2,cx+wd*.55,base-wd*1.12,INK,1)
        R(cx-wd*.22,base-wd*1.17,cx+wd*.22,base-wd*1.145,(5,6,8),.3)
        if hand:
            G([(cx-wd*.1,base-wd*1.16),(cx+wd*.14,base-wd*1.16),(cx+wd*.16,base-wd*1.52),(cx-wd*.08,base-wd*1.52)],PAPER)
            E(cx-wd*.06,base-wd*1.64,cx+wd*.3,base-wd*1.38,SK[1]); R(cx+wd*.18,base-wd*1.6,cx+wd*.7,base-wd*1.42,SK[1],3)
            R(cx+wd*.62,base-wd*1.66,cx+wd*1.0,base-wd*1.36,NAVY,1.5)
    if name=='mesa4':
        for i,(sk,sh) in enumerate(zip(SK,[RED,NAVY,(240,240,240),NAVY])): person(13+i*24.6,24,1.15,sk,sh)
        R(0,60,100,67,PAPER,1); G([(2,67),(98,67),(94,98),(6,98)],(232,236,242)); R(40,57,60,61,PAPER,.4); R(44,55.5,56,57.5,(200,205,215),.3)
        R(12,56,26,60,NAVY,.4); R(72,56,86,60,NAVY,.4)
    elif name=='urna': urna(40,98,52)
    elif name=='porta':
        R(18,8,72,92,(230,236,244),2); R(24,14,66,92,NAVY,1); R(28,18,62,88,(34,56,130),1); E(54,50,59,55,(250,200,60))
        R(2,66,98,72,RED,1.2); R(2,66,14,72,WHITE,0); R(26,66,38,72,WHITE,0); R(50,66,62,72,WHITE,0); R(74,66,86,72,WHITE,0)
        R(6,72,10,94,INK2,.5); R(90,72,94,94,INK2,.5)
        d.arc((*P(70,20),*P(90,40)),180,360,fill=(250,200,60),width=int(3*k)); R(67,30,93,50,(250,200,60),2); E(78,36,82,40,INK); R(79,38,81,45,INK,.3)
    elif name=='cracha':
        Ln([(30,0),(50,30),(70,0)],NAVY,6); Ln([(30,0),(50,30),(70,0)],RED,1.4)
        R(42,26,58,34,(170,180,195),1); R(24,32,76,98,WHITE,5); R(24,32,76,46,NAVY,5); R(24,40,76,46,NAVY,0)
        E(38,50,62,74,(214,226,240)); E(44,53,56,65,SK[0]); d.pieslice((*P(39,63),*P(61,85)),180,360,fill=SK[0])
        R(32,80,68,84,(60,70,100),1); R(36,88,64,91,(160,170,190),1); E(64,84,80,100,RED); Ln([(68,92),(71,95),(77,88)],WHITE,1.6)
    elif name=='relogio':
        E(18,4,30,16,RED); E(70,4,82,16,RED); R(18,88,26,98,INK2,1); R(74,88,82,98,INK2,1)
        E(8,8,92,92,NAVY); E(14,14,86,86,WHITE)
        import math
        for i in range(12):
            a=math.radians(i*30); r0,r1=(30,36) if i%3 else (27,36); Ln([(50+r0*math.sin(a),50-r0*math.cos(a)),(50+r1*math.sin(a),50-r1*math.cos(a))],NAVY,1.4 if i%3 else 2.6)
        Ln([(50,50),(50,24)],INK,3.4); a=math.radians(210); Ln([(50,50),(50+19*math.sin(a),50-19*math.cos(a))],RED,4.4); E(46,46,54,54,INK)
    elif name=='notas':
        for i,c in enumerate([(46,140,90),(60,160,105),(78,180,120)]):
            o=i*7; R(6+o,30+o*.4,82+o,72+o*.4,c,3); E(34+o,40+o*.4,54+o,62+o*.4,(255,255,255,90)); R(12+o,36+o*.4,76+o,66+o*.4,(255,255,255,0),2)
        for i,(x,y) in enumerate([(62,78),(76,82),(70,72)]): E(x,y,x+18,y+12,(180,140,40)); E(x+1.5,y+1,x+16.5,y+10,(230,190,70))
    elif name=='tel':
        R(26,2,74,98,INK,8); R(29,8,71,90,WHITE,4); R(42,4,58,6,INK2,1)
        R(32,14,68,24,NAVY,2); E(40,32,60,52,(46,170,100)); Ln([(44,42),(49,47),(57,37)],WHITE,2.4)
        R(34,58,66,62,(200,205,215),1); R(38,66,62,69,(220,224,232),1); R(34,76,66,84,RED,2); E(46,92,54,96,INK2)
    out=Image.new('RGBA',L.size,(0,0,0,0))
    if shadow:
        sh=Image.new('RGBA',L.size,(0,0,0,0)); sh.paste((0,30,70,90),mask=L.split()[3]); sh=sh.filter(ImageFilter.GaussianBlur(sz*S/60)); out.alpha_composite(sh,(int(sz*S*.015),int(sz*S*.03)))
    out.alpha_composite(L); return out.resize((int(sz),int(sz)),Image.LANCZOS)
V1=[dict(img='porta',txt=[('ATENÇÃO','cap'),('ACESSO RESTRITO','t'),('ÀS ASSEMBLEIAS','n'),('DE VOTO','r')]),
    dict(img='mesa4',txt=[('SÃO AUTORIZADOS','cap'),('MEMBROS','t'),('DA MESA','n')]),
    dict(img='cracha',txt=[('OBSERVADORES','cap'),('INTERNACIONAIS','t'),('CREDENCIADOS','n')]),
    dict(img='urna',txt=[('CARO ELEITOR','cap'),('APÓS VOTAR','t'),('ABANDONA O LOCAL','r')])]
V2=[dict(img='mesa4',txt=[('ATENÇÃO','cap'),('MEMBROS','t'),('DAS MESAS','n')]),
    dict(img='relogio',txt=[('COMPARECE ÀS','cap'),('7H','t'),('DA MANHÃ','n')]),
    dict(img='notas',txt=[('COMPENSAÇÃO','cap'),('3.500$00','t'),('INCLUI ALIMENTAÇÃO','n')]),
    dict(img='tel',txt=[('PAGAMENTO POR','cap'),('TRANSFERÊNCIA','t'),('BANCÁRIA','r')])]
ROWS=[('A','FIEL À REFERÊNCIA','Círculo translúcido à esquerda, ilustração gráfica a sair dele, texto à direita. Igual aos vídeos V.A.'),
      ('B','ESPELHO + FAIXA','Ilustração à direita, texto à esquerda com barra vermelha/navy. Alterna com A para dar ritmo.'),
      ('C','CENTRADO / GRUPO','Texto ao centro em cima, ilustração grande em baixo. Ideal para listas e números.')]
def board(title,scenes,labels,out):
    tw,th=640,360; gap=24; lw=330; top=190; BW=lw+4*tw+5*gap; BH=top+3*(th+90)+40
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((40,62),title,font=f(46),fill=WHITE,anchor='ls'); d.text((40,108),'Estilo da referência V.A · só grafismo, sem fotos · canto inferior direito livre para a intérprete',font=f(24,7),fill=(190,205,240),anchor='ls')
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
if __name__=='__main__':
  board('VÍDEO 1 · ACESSO E PERMANÊNCIA — só grafismo',V1,['1 · ACESSO RESTRITO','2 · MEMBROS DA MESA (4)','3 · OBSERVADORES','4 · ELEITOR SAI  (A: com transição de faixas)'],OUTD+'/Blueprint_V1_grafismo.jpg')
  board('VÍDEO 2 · MEMBROS DAS MESAS — só grafismo',V2,['1 · ATENÇÃO MEMBROS','2 · 7H DA MANHÃ','3 · COMPENSAÇÃO','4 · TRANSFERÊNCIA BANCÁRIA'],OUTD+'/Blueprint_V2_grafismo.jpg')

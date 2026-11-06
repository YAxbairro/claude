# Blueprint com 4 ESTILOS realmente diferentes (cor, grafismo, composição, tipografia). Só grafismo, sem fotos.
import sys; OUT=sys.argv[1]; sys.argv=['x']
import numpy as np, math
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import bp_graf as g
W,H=1920,1080; NAVY,RED,WHITE,CY=g.NAVY,g.RED,g.WHITE,g.CY; f=g.f
_yy,_xx=np.mgrid[0:H,0:W].astype(np.float32)
def grad(c0,c1,ang=0.6):
    t=((_xx/W)*math.cos(ang)+(_yy/H)*math.sin(ang)); t=(t-t.min())/(t.max()-t.min())
    a=np.array(c0,np.float32)*(1-t[...,None])+np.array(c1,np.float32)*t[...,None]
    return Image.fromarray(a.astype('uint8')).convert('RGBA')
def logos(b,dark=False):
    b.alpha_composite(g.rs(g.LEw if dark else g.LE,80),(60,40)); b.alpha_composite(g.rs(g.LCw,54),(1620,50))
def interp(b,col=(255,255,255,110)):
    l=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(l).rounded_rectangle((1580,720,1880,1080),30,outline=col,width=4); b.alpha_composite(l)
# ---- filtros de grafismo ----
def lineart(im,col=WHITE,acc=RED):
    a=np.asarray(im).astype(np.int16); al=a[...,3]>40
    lum=(a[...,:3]*[.3,.59,.11]).sum(2)*al
    e=np.zeros(al.shape,bool)
    for dx,dy in((1,0),(0,1),(1,1)):
        d=np.abs(lum-np.roll(np.roll(lum,dy,0),dx,1))>22; e|=d
        e|=al!=np.roll(np.roll(al,dy,0),dx,1)
    m=Image.fromarray((e*255).astype('uint8')).filter(ImageFilter.MaxFilter(5))
    red=(a[...,0]>170)&(a[...,1]<90)&al
    o=Image.new('RGBA',im.size,(0,0,0,0)); fill=Image.fromarray((al*28).astype('uint8')); o.paste(col+(255,),mask=fill)
    o.paste(col+(255,),mask=m); o.paste(acc+(255,),mask=Image.fromarray((red*255).astype('uint8')).filter(ImageFilter.MinFilter(5)))
    return o
def duotone(im,dark=NAVY,light=(120,200,235)):
    a=np.asarray(im).astype(np.float32); lum=(a[...,:3]@[.3,.59,.11])/255
    red=(a[...,0]>170)&(a[...,1]<90)
    t=np.clip((lum-.1)/.8,0,1)[...,None]; rgb=np.array(dark)*(1-t)+np.array(light)*t
    rgb[red]=RED; out=np.dstack([rgb,a[...,3]]).astype('uint8'); return Image.fromarray(out)
def extrude(b,im,x,y,depth=26,col=(10,20,60)):
    sil=Image.new('RGBA',im.size,col+(255,)); sil.putalpha(im.split()[3])
    ls=Image.new('RGBA',(im.width+400,im.height+400),(0,0,0,0)); s2=Image.new('RGBA',im.size,(0,20,60,22)); s2.putalpha(im.split()[3].point(lambda v:22 if v>40 else 0))
    for i in range(0,300,4): ls.alpha_composite(s2,(i,i))
    b.alpha_composite(ls,(x,y))
    for i in range(depth,0,-2): b.alpha_composite(sil,(x+i,y+i))
    b.alpha_composite(im,(x,y))
# ---- texto por estilo ----
def T_box(b,x,y,lines,cap=WHITE,tit=WHITE,nb=NAVY,rb=RED,anchor='l',sz=74,boxes=True,ul=None):
    d=ImageDraw.Draw(b)
    for t,role in lines:
        if role=='cap':
            ft=f(32,7); xx=x if anchor=='l' else x-sum(ft.getlength(c)+7 for c in t)/2
            for ch in t: d.text((xx,y),ch,font=ft,fill=cap,anchor='ls'); xx+=ft.getlength(ch)+7
            y+=sz*1.05
        else:
            ft=f(sz); w=ft.getlength(t); xx=x if anchor=='l' else x-w/2; c=tit
            if role in('n','r') and boxes: d.rectangle((xx-14,y-sz*.78,xx+w+14,y+sz*.2),fill=nb if role=='n' else rb); c=WHITE
            d.text((xx,y),t,font=ft,fill=c,anchor='ls')
            if role in('n','r') and ul: d.rectangle((xx,y+12,xx+w*.5,y+20),fill=ul if role=='n' else RED)
            y+=int(sz*1.2)
    return y
# ---- 4 estilos ----
def S1(sc):   # INSTITUCIONAL CIANO: flat colorido, círculo, caixas (fiel à referência)
    b=g.bg(); g.circle(b,560,620,430); g.ILL(b,(330,190,800,1000),sc['img']); T_box(b,1010,470,sc['txt']); interp(b); return b
def S2(sc):   # NAVY PREMIUM: line-art branco, anel fino, grelha, sublinhados vermelhos
    b=grad((8,14,48),(30,46,120),.9); d=ImageDraw.Draw(b)
    for x in range(0,W,96): d.line((x,0,x,H),fill=(255,255,255,10) if False else (40,56,110),width=1)
    l=Image.new('RGBA',b.size,(0,0,0,0)); dl=ImageDraw.Draw(l)
    dl.ellipse((1060,170,1840,950),outline=(255,255,255,70),width=3); dl.ellipse((1110,220,1790,900),outline=(230,60,60,160),width=2)
    dl.arc((1060,170,1840,950),200,260,fill=(255,255,255,255),width=8); b.alpha_composite(l)
    im=lineart(g.ILL_img(sc['img'],640)); b.alpha_composite(im,(1130,250))
    d.rectangle((130,330,138,700),fill=RED)
    T_box(b,180,440,sc['txt'],cap=(90,200,240),tit=WHITE,boxes=False,ul=(90,200,240),sz=78); logos(b,True); interp(b,(255,255,255,80)); return b
def S3(sc):   # BOLD GEOMÉTRICO CLARO: fundo branco, blocos diagonais, ilustração duotone, texto navy
    b=Image.new('RGBA',(W,H),(244,246,250,255)); d=ImageDraw.Draw(b)
    d.polygon([(1040,0),(W,0),(W,H),(760,H)],fill=NAVY); d.polygon([(1250,0),(1330,0),(1050,H),(970,H)],fill=RED)
    d.polygon([(1500,0),(W,0),(W,420)],fill=CY)
    for i in range(6):
        for j in range(4): d.ellipse((120+i*34,840+j*34,132+i*34,852+j*34),fill=(200,210,228))
    im=duotone(g.ILL_img(sc['img'],660),dark=(12,20,70),light=(180,225,245))
    sh=Image.new('RGBA',im.size,(0,0,0,0)); sh.paste((0,0,0,90),mask=im.split()[3]); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(18)),(1110,330))
    st=Image.new('RGBA',im.size,(255,255,255,0)); st.putalpha(im.split()[3].filter(ImageFilter.MaxFilter(13))); b.alpha_composite(st,(1090,300)); b.alpha_composite(im,(1090,300))
    T_box(b,120,420,sc['txt'],cap=RED,tit=NAVY,nb=CY,rb=RED,sz=70)
    b.alpha_composite(g.rs(g.LE,80),(60,40)); b.alpha_composite(g.rs(g.LCw,54),(1620,50)); interp(b); return b
def S4(sc):   # 3D EXTRUDIDO + VIDRO: gradiente ciano→navy, anéis luminosos, ilustração com profundidade, cartão de vidro
    b=grad((40,190,230),(20,40,120),.5)
    l=Image.new('RGBA',b.size,(0,0,0,0)); dl=ImageDraw.Draw(l)
    for r,a in((520,40),(400,60),(280,90)): dl.ellipse((560-r,560-r,560+r,560+r),outline=(255,255,255,a),width=2)
    dl.ellipse((300,300,820,820),fill=(255,255,255,28)); b.alpha_composite(l.filter(ImageFilter.GaussianBlur(1)))
    im=g.ILL_img(sc['img'],600); extrude(b,im,250,300,depth=22)
    cw=Image.new('RGBA',b.size,(0,0,0,0)); ImageDraw.Draw(cw).rounded_rectangle((960,300,1720,700),40,fill=(255,255,255,46),outline=(255,255,255,120),width=2)
    bl=b.crop((960,300,1720,700)).filter(ImageFilter.GaussianBlur(20)); b.paste(bl,(960,300)); b.alpha_composite(cw)
    T_box(b,1340,420,sc['txt'],anchor='m',sz=66,nb=NAVY,rb=RED); logos(b); interp(b); return b
STY=[('1','INSTITUCIONAL CIANO','Flat colorido, círculo translúcido, caixas navy/vermelho. A linha das tuas referências.',S1),
     ('2','NAVY PREMIUM · LINHA','Fundo escuro, ilustração em traço branco fino, anéis, sublinhados vermelhos. Elegante, tipo telejornal.',S2),
     ('3','BOLD GEOMÉTRICO','Fundo claro, blocos diagonais navy/vermelho/ciano, ilustração duotone, texto navy forte.',S3),
     ('4','3D + VIDRO','Gradiente ciano→navy, ilustração com profundidade 3D, cartão de vidro desfocado, anéis de luz.',S4)]
def board(title,scenes,labels,out):
    tw,th=640,360; gap=24; lw=330; top=190; BW=lw+4*tw+5*gap; BH=top+len(STY)*(th+60)+30
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((40,62),title,font=f(46),fill=WHITE,anchor='ls'); d.text((40,108),'4 estilos diferentes · só grafismo, sem fotos · canto inferior direito livre para a intérprete',font=f(24,7),fill=(190,205,240),anchor='ls')
    for c,lb in enumerate(labels): d.text((lw+gap+c*(tw+gap),top-14),lb,font=f(22),fill=NAVY,anchor='ls')
    for r,(n,nm,desc,fn) in enumerate(STY):
        y=top+r*(th+60); d.text((30,y+60),f'ESTILO {n}',font=f(38),fill=RED,anchor='ls'); d.text((30,y+100),nm,font=f(22),fill=NAVY,anchor='ls')
        line='';yy=y+140
        for wd in desc.split():
            if f(19,7).getlength(line+' '+wd)>280: d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls'); yy+=28; line=wd
            else: line=(line+' '+wd).strip()
        d.text((30,yy),line,font=f(19,7),fill=(60,70,100),anchor='ls')
        for c,sc in enumerate(scenes):
            bd.paste(fn(sc).convert('RGB').resize((tw,th),Image.LANCZOS),(lw+gap+c*(tw+gap),y))
    bd.save(out,quality=90); print('ok',out)
board('VÍDEO 1 · ACESSO E PERMANÊNCIA — 4 estilos',g.V1,['1 · ACESSO RESTRITO','2 · MEMBROS DA MESA (4)','3 · OBSERVADORES','4 · ELEITOR VOTA E SAI'],OUT+'/Blueprint_V1_estilos.jpg')
board('VÍDEO 2 · MEMBROS DAS MESAS — 4 estilos',g.V2,['1 · ATENÇÃO MEMBROS','2 · 7H DA MANHÃ','3 · COMPENSAÇÃO','4 · TRANSFERÊNCIA BANCÁRIA'],OUT+'/Blueprint_V2_estilos.jpg')

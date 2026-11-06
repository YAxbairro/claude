import sys,math,random,numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter,ImageOps,ImageChops
S=sys.argv[1]; FR=S+'/fr/'; DL=S+'/dl/'
W,H=1920,1080; NAVY=(20,35,90); RED=(214,40,48); BLUE=(16,125,190)
FB='/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'; FK='/usr/share/fonts/opentype/inter/Inter-Bold.otf'
def F(s,f=FB): return ImageFont.truetype(f,s)
def ld(f): return Image.open(f).convert('RGB')
city=ld(S+'/d_city.jpg'); down=ld(S+'/d_down.jpg'); bot=ld(DL+'botequim.png'); cab=ld(DL+'cabine.png'); fila=ld(DL+'fila.png')
top=ld(FR+'F67.png').crop((0,0,W,130))
def cover(im,w,h,fx=.5,fy=.5):
    r=max(w/im.width,h/im.height); im=im.resize((int(im.width*r)+1,int(im.height*r)+1),Image.LANCZOS)
    x=int((im.width-w)*fx); y=int((im.height-h)*fy); return im.crop((x,y,x+w,y+h))
def bg():
    y,x=np.mgrid[0:H,0:W]; r=np.sqrt(((x-960)/1100)**2+((y-540)/700)**2).clip(0,1)
    c0=np.array([20,150,204]);c1=np.array([11,113,179]); return Image.fromarray((c0*(1-r[...,None])+c1*r[...,None]).astype('uint8'))
def logos(b,on_photo=False):
    m=ImageChops.difference(top,Image.new('RGB',top.size,(15,123,184))).convert('L').point(lambda v:255 if v>60 else 0)
    b.paste((255,255,255),(0,0),m)
def tag(d,x,y,t,sz,fill=None,col='white'):
    f=F(sz); w=d.textlength(t,font=f)
    if fill: d.rectangle((x-12,y-8,x+w+12,y+sz+10),fill=fill)
    d.text((x,y),t,font=f,fill=col); return w
# ---------- A: tipografia-máscara ----------
def A(img,big,small,red=None,fx=.5,fy=.5,sz=330):
    b=bg(); d=ImageDraw.Draw(b)
    m=Image.new('L',(W,H),0); md=ImageDraw.Draw(m); f=F(sz)
    lines=big.split('\n'); y=230 if len(lines)>1 else 330
    for ln in lines:
        w=md.textlength(ln,font=f); md.text(((W-w)/2,y),ln,font=f,fill=255); y+=int(sz*0.95)
    ph=cover(img,W,H,fx,fy); b.paste(ph,(0,0),m)
    sh=m.filter(ImageFilter.GaussianBlur(18)); 
    d=ImageDraw.Draw(b)
    w=d.textlength(small,font=F(54)); 
    y+=60
    if red: tag(d,(W-d.textlength(red,font=F(60)))/2,y+10,red,60,RED); y+=100
    d.text(((W-w)/2,y+20),small,font=F(54),fill='white')
    logos(b); return b
# ---------- B: duotone azul + destaque a cores ----------
def duo(im):
    g=ImageOps.grayscale(im); return ImageOps.colorize(g,(6,30,80),(150,215,245))
def B(img,box,lines,fx=.5,fy=.5,shape='rect'):
    ph=cover(img,W,H,fx,fy); b=duo(ph)
    m=Image.new('L',(W,H),0); md=ImageDraw.Draw(m)
    (md.ellipse if shape=='ell' else md.rectangle)(box,fill=255); m=m.filter(ImageFilter.GaussianBlur(14))
    b.paste(ph,(0,0),m); d=ImageDraw.Draw(b)
    x0,y0,x1,y1=box; L=50
    for (cx,cy,sx,sy) in [(x0,y0,1,1),(x1,y0,-1,1),(x0,y1,1,-1),(x1,y1,-1,-1)]:
        d.line((cx,cy,cx+sx*L,cy),fill='white',width=8); d.line((cx,cy,cx,cy+sy*L),fill='white',width=8)
    y=lines[0][0]
    for (yy,t,sz,fl) in lines: tag(d,lines[0][1] if False else 120,yy,t,sz,fl)
    logos(b); return b
# ---------- C: drone AR ----------
def C1():
    b=cover(city,W,H,.5,.6); o=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(o)
    cx,cy,rx,ry=960,760,520,170
    d.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(214,40,48,55))
    for k in range(0,360,6):
        a1,a2=math.radians(k),math.radians(k+3)
        d.line((cx+rx*math.cos(a1),cy+ry*math.sin(a1),cx+rx*math.cos(a2),cy+ry*math.sin(a2)),fill=(255,255,255,255),width=7)
    d.line((cx,cy,cx,cy-260),fill=(255,255,255,255),width=5); d.ellipse((cx-16,cy-16,cx+16,cy+16),fill=RED+(255,),outline=(255,255,255,255),width=5)
    d.line((cx,cy,cx+rx,cy),fill=(255,255,255,230),width=4)
    b=b.convert('RGBA'); b.alpha_composite(o); b=b.convert('RGB'); d=ImageDraw.Draw(b)
    tag(d,cx+180,cy-60,'500 M',48,NAVY)
    tag(d,cx-200,cy-330,'ASSEMBLEIA DE VOTO',40,NAVY)
    tag(d,120,180,'É PROIBIDO',64,RED); tag(d,120,280,'BEBIDAS ALCOÓLICAS',52,NAVY)
    logos(b); return b
def C0():
    b=cover(city,W,H,.5,.6); d=ImageDraw.Draw(b)
    for (x,y) in [(500,700),(820,640),(1200,760),(1500,690),(300,860),(1050,900)]:
        d.line((x,y,x,y-90),fill='white',width=5); d.ellipse((x-22,y-130,x+22,y-86),fill=RED,outline='white',width=6)
    tag(d,120,170,'15 DE NOVEMBRO',90,NAVY); tag(d,120,300,'CABO VERDE VAI ÀS URNAS',46,None)
    logos(b); return b
def C2():
    b=cover(cab,W,H,.3,.5); d=ImageDraw.Draw(b)
    x0,y0,x1,y1=380,560,860,1040
    d.rectangle((x0,y0,x1,y1),outline='white',width=6)
    d.line((x1,y1-100,x1+200,y1-100),fill='white',width=5)
    tag(d,x1+215,y1-130,'TELEMÓVEL',48,RED)
    tag(d,1050,180,'É TAMBÉM PROIBIDO',50,NAVY); tag(d,1050,270,'ENTRAR NA CABINE',64,RED); tag(d,1050,370,'COM TELEMÓVEIS',50,NAVY)
    logos(b); return b
# ---------- D: colagem papel + carimbo ----------
def torn(im,w,h,seed):
    random.seed(seed); ph=cover(im,w,h); pts=[]
    n=40
    for i in range(n): pts.append((i*w/n,random.uniform(0,14)))
    for i in range(n): pts.append((w-random.uniform(0,14),i*h/n))
    for i in range(n): pts.append((w-i*w/n,h-random.uniform(0,14)))
    for i in range(n): pts.append((random.uniform(0,14),h-i*h/n))
    m=Image.new('L',(w,h),0); ImageDraw.Draw(m).polygon(pts,fill=255)
    pad=26; card=Image.new('RGBA',(w+2*pad,h+2*pad),(0,0,0,0))
    mb=Image.new('L',(w+2*pad,h+2*pad),0); mb.paste(m.resize((w+2*pad-20,h+2*pad-20)),(10,10))
    card.paste((250,247,240,255),(0,0),mb); card.paste(ph,(pad,pad),m); return card
def place(b,card,x,y,ang):
    c=card.rotate(ang,expand=True,resample=Image.BICUBIC)
    sh=Image.new('RGBA',c.size,(0,0,0,0)); sh.paste((0,20,60,120),(0,0),c.split()[3]); sh=sh.filter(ImageFilter.GaussianBlur(16))
    b.alpha_composite(sh,(x+14,y+20)); b.alpha_composite(c,(x,y))
def stamp(b,t,x,y,ang,sz=150):
    f=F(sz); tmp=Image.new('L',(int(len(t)*sz*0.75)+80,sz+80),0); td=ImageDraw.Draw(tmp)
    td.rounded_rectangle((8,8,tmp.width-8,tmp.height-8),18,outline=255,width=12); td.text((40,25),t,font=f,fill=255)
    nz=Image.fromarray((np.random.rand(tmp.height,tmp.width)>0.08).astype('uint8')*255); tmp=ImageChops.multiply(tmp,nz)
    tmp=tmp.rotate(ang,expand=True); col=Image.new('RGBA',tmp.size,RED+(255,)); col.putalpha(tmp.point(lambda v:int(v*0.95)))
    b.alpha_composite(col,(x,y))
def D(imgs,stampt,lines,seed=1):
    b=bg().convert('RGBA')
    for i,(im,w,h,x,y,a) in enumerate(imgs): place(b,torn(im,w,h,seed+i),x,y,a)
    if stampt: stamp(b,stampt,*stampt_pos[seed])
    b=b.convert('RGB'); d=ImageDraw.Draw(b)
    for (x,y,t,sz,fl) in lines: tag(d,x,y,t,sz,fl)
    logos(b); return b
stampt_pos={1:(620,560,12),2:(480,520,-10),3:(420,560,8)}
rows=[]
rows.append(('A · TIPOGRAFIA-MÁSCARA — a imagem real vive dentro das letras gigantes, que depois abrem para ecrã cheio',[
 A(city,'15 NOV','CABO VERDE VAI ÀS URNAS',None,.5,.6,380),
 A(bot,'500 M','VENDER E CONSUMIR BEBIDAS ALCOÓLICAS','É PROIBIDO',.5,.45,400),
 A(cab,'SEGREDO','ENTRAR NA CABINE COM TELEMÓVEIS','É PROIBIDO',.35,.6,300)]))
rows.append(('B · DUOTONE AZUL CNE — imagem em azul, só o que importa fica a cores (moldura que segue o objeto)',[
 B(city,(560,560,1400,980),[(170,'CABO VERDE VAI ÀS URNAS',64,NAVY),(270,'15 DE NOVEMBRO',50,None)],.5,.6),
 B(bot,(700,330,1240,1000),[(170,'É PROIBIDO',70,RED),(280,'BEBIDAS ALCOÓLICAS',54,NAVY),(370,'NUM RAIO DE 500 METROS',44,None)],.5,.5),
 B(cab,(250,520,900,1080),[(170,'É PROIBIDO',70,RED),(280,'ENTRAR NA CABINE',54,NAVY),(370,'COM TELEMÓVEIS',44,None)],.3,.5)]))
rows.append(('C · DRONE + REALIDADE AUMENTADA — grafismos colados ao chão real (pins, raio 500 m em perspetiva, etiquetas)',[C0(),C1(),C2()]))
rows.append(('D · COLAGEM / PAPEL DE BOLETIM — fotos recortadas em papel, carimbo vermelho “PROIBIDO” bate na imagem',[
 D([(city,820,520,140,260,-4),(fila,640,420,900,480,5)],None,[(1150,200,'15 DE NOVEMBRO',64,NAVY),(1150,300,'CABO VERDE VAI ÀS URNAS',40,None)],1),
 D([(bot,900,620,140,250,-3),(down,520,420,1180,560,6)],'PROIBIDO',[(1150,200,'BEBIDAS ALCOÓLICAS',54,NAVY),(1150,290,'NUM RAIO DE 500 METROS',40,None)],2),
 D([(cab,900,620,160,260,3)],'PROIBIDO',[(1150,200,'ENTRAR NA CABINE',54,NAVY),(1150,290,'COM TELEMÓVEIS',40,None)],3)]))
tw,th=640,360; sheet=Image.new('RGB',(tw*3+40,(th+70)*4+10),(235,235,235)); sd=ImageDraw.Draw(sheet)
for r,(cap,ims) in enumerate(rows):
    y=10+r*(th+70); sd.text((10,y),cap,font=F(24,FK),fill=(20,20,40))
    for i,im in enumerate(ims): sheet.paste(im.resize((tw,th),Image.LANCZOS),(10+i*(tw+10),y+40))
sheet.save(sys.argv[2],quality=88)

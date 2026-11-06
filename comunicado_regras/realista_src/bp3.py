import sys,math,numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
S=sys.argv[1]; FR=S+'/fr/'
W,H=1920,1080; NAVY=(20,35,90); RED=(214,40,48)
FB='/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf'; FK='/usr/share/fonts/opentype/inter/Inter-Bold.otf'
def F(s,f=FB): return ImageFont.truetype(f,s)
def ld(f): return Image.open(FR+f).convert('RGB')
# --- logos: unmix white from blue bg ---
src=np.asarray(ld('F67.png')).astype(float)
def logo(box):
    x0,y0,x1,y1=box; reg=src[y0:y1,x0:x1]
    ring=np.concatenate([src[y0-6:y0,x0:x1].reshape(-1,3),src[y1:y1+6,x0:x1].reshape(-1,3)])
    bgc=ring.mean(0); a=((reg-bgc)/(255-bgc)).max(2).clip(0,1)
    a=(a*1.08).clip(0,1); im=np.dstack([np.full(a.shape+(3,),255.0),a*255]).astype('uint8')
    return Image.fromarray(im,'RGBA')
LE=logo((14,14,250,140)); LC=logo((1640,24,1906,112))
def logos(b):
    b=b.convert('RGBA')
    tg=Image.new('RGBA',b.size,(0,0,0,0)); tg.putalpha(Image.linear_gradient('L').rotate(180).resize((W,220)).point(lambda v:int(v*0.55)).crop((0,0,W,220)).resize((W,220)) if False else None) if False else None
    g=np.zeros((H,W,4),'uint8'); g[...,0]=5;g[...,1]=30;g[...,2]=80; g[:220,:,3]=(np.linspace(150,0,220)[:,None]).astype('uint8'); b.alpha_composite(Image.fromarray(g,'RGBA'))
    sh=Image.new('RGBA',b.size,(0,0,0,0))
    for L,p in [(LE,(14,14)),(LC,(1640,24))]:
        s=Image.new('RGBA',L.size,(0,20,60,0)); s.putalpha(L.split()[3].point(lambda v:v*0.5)); sh.alpha_composite(s,p)
    b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(6)))
    b.alpha_composite(LE,(14,14)); b.alpha_composite(LC,(1640,24)); return b.convert('RGB')
def grad(im,k=.5):
    y,x=np.mgrid[0:H,0:W]; t=((x/W)*.45+(y/H)*.55)[...,None]
    c=np.array([40,160,215])*(1-t)+np.array([6,35,95])*t
    a=np.asarray(im).astype(float); g=a.mean(2,keepdims=True); a=a*.75+g*.25
    out=a*(1-k)+c*k; return Image.fromarray(out.clip(0,255).astype('uint8'))
def tag(d,x,y,t,sz,fill=NAVY):
    f=F(sz); w=d.textlength(t,font=f)
    if fill: d.rectangle((x-14,y-8,x+w+14,y+sz+12),fill=fill)
    d.text((x,y),t,font=f,fill='white'); return w
def pin(d,x,y,h=90):
    d.line((x,y,x,y-h),fill='white',width=5); d.ellipse((x-22,y-h-44,x+22,y-h),fill=RED,outline='white',width=6); d.ellipse((x-8,y-8,x+8,y+8),fill='white')
def bracket(d,box,L=50,w=7):
    x0,y0,x1,y1=box
    for (cx,cy,sx,sy) in [(x0,y0,1,1),(x1,y0,-1,1),(x0,y1,1,-1),(x1,y1,-1,-1)]:
        d.line((cx,cy,cx+sx*L,cy),fill='white',width=w); d.line((cx,cy,cx,cy+sy*L),fill='white',width=w)
def cover(im,w,h,fx=.5,fy=.5):
    r=max(w/im.width,h/im.height); im=im.resize((int(im.width*r)+1,int(im.height*r)+1),Image.LANCZOS)
    x=int((im.width-w)*fx); y=int((im.height-h)*fy); return im.crop((x,y,x+w,y+h))
fr=[]
# 1 abertura Plateau
b=cover(ld('d15.png'),W,H); d=ImageDraw.Draw(b); pin(d,880,700,120)
tag(d,120,190,'NO DIA 15 DE NOVEMBRO',72); tag(d,120,300,'CABO VERDE VAI ÀS URNAS',44,None)
fr.append(('0:00 Drone Plateau (imagem 1) — pin cai, texto entra',logos(b)))
# 2 mapa (do FINAL, curto)
fr.append(('0:05 Mapa CV (do FINAL) — encurtado para ~5 s',ld('G4.png')))
# 3 drone cidade + valores
b=cover(ld('d6.png'),W,H); d=ImageDraw.Draw(b)
tag(d,120,190,'A CNE APELA A TODOS OS CIDADÃOS',56); tag(d,120,300,'LIBERDADE · RESPONSABILIDADE',44,RED)
fr.append(('0:11 Drone cidade — apelo + valores',logos(b)))
# 4 senhora portátil + site
b=grad(ld('k379.png'),.38); site=ld('G24.png').crop((90,195,1245,965))
q=[(1092,392),(1657,398),(1638,767),(1065,713)]
xs=[p[0] for p in q]; ys=[p[1] for p in q]; bx=(min(xs),min(ys),max(xs),max(ys)); bw,bh=bx[2]-bx[0],bx[3]-bx[1]
# perspective coeffs
import numpy.linalg as la
dst=[(p[0]-bx[0],p[1]-bx[1]) for p in q]; srcp=[(0,0),(site.width,0),(site.width,site.height),(0,site.height)]
A=[];B=[]
for (x,y),(u,v) in zip(dst,srcp): A+=[[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]; B+=[u,v]
co=la.solve(np.array(A,float),np.array(B,float))
warp=site.transform((bw,bh),Image.PERSPECTIVE,tuple(co),Image.BICUBIC)
orig=np.asarray(ld('k379.png').crop(bx)).astype(float); wh=((orig.min(2)>185)&(orig.max(2)-orig.min(2)<40)).astype('uint8')*255
m=Image.fromarray(wh).filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(1.5))
pm=Image.new('L',(bw,bh),0); ImageDraw.Draw(pm).polygon(dst,fill=255); m=Image.fromarray(np.minimum(np.asarray(m),np.asarray(pm)))
b.paste(warp,bx[:2],m); d=ImageDraw.Draw(b)
tag(d,110,190,'CONFIRME O SEU',60); tag(d,110,290,'LOCAL DE VOTO',72,RED)
fr.append(('0:19 Senhora no portátil (Kling) + degradê — site CNE no ecrã',logos(b)))
fr.append(('0:23 Zoom no ecrã → parte CNE/DGAPE (do FINAL)',ld('G24.png')))
fr.append(('0:29 Linha Verde (do FINAL, igual)',ld('G29.png')))
# 7 drone recorda
dn=Image.open(S+'/d_down.jpg').convert('RGB'); b=cover(dn,W,H); d=ImageDraw.Draw(b)
tag(d,120,190,'A CNE RECORDA QUE',56); tag(d,120,290,'NO DIA DA VOTAÇÃO',72,RED)
fr.append(('0:32 Drone vertical — câmara desce/viaja',logos(b)))
# 8 bar
b=grad(ld('k420.png'),.42); d=ImageDraw.Draw(b); bracket(d,(560,330,1260,900))
tag(d,1330,560,'É PROIBIDO',60,RED); tag(d,1330,660,'VENDER E CONSUMIR',40,None); tag(d,1330,730,'BEBIDAS ALCOÓLICAS',48)
fr.append(('0:36 Bar (só 1º segundo, quase parado) + degradê',logos(b)))
# 9 raio 500m
city=Image.open(S+'/d_city.jpg').convert('RGB'); b=cover(city,W,H,.5,.6)
o=Image.new('RGBA',(W,H),(0,0,0,0)); od=ImageDraw.Draw(o); cx,cy,rx,ry=960,760,520,170
od.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(214,40,48,55))
for k in range(0,360,6):
    a1,a2=math.radians(k),math.radians(k+3); od.line((cx+rx*math.cos(a1),cy+ry*math.sin(a1),cx+rx*math.cos(a2),cy+ry*math.sin(a2)),fill=(255,255,255,255),width=7)
od.line((cx,cy,cx+rx,cy),fill=(255,255,255,230),width=4)
b=b.convert('RGBA'); b.alpha_composite(o); b=b.convert('RGB'); d=ImageDraw.Draw(b); pin(d,cx,cy,200)
tag(d,cx+180,cy-62,'500 M',48); tag(d,120,190,'NUM RAIO DE',52); tag(d,120,290,'500 METROS',72,RED)
fr.append(('0:39 Zoom out → raio 500 m no drone',logos(b)))
fr.append(('0:46 8H–18H (do FINAL, igual) → relógio passa para a escola real',ld('G42.png')))
# 11 estacionar
b=grad(ld('k517.png'),.42); d=ImageDraw.Draw(b)
d.ellipse((1600,700,1760,860),fill=(30,80,180),outline=RED,width=16); d.line((1626,726,1734,834),fill=RED,width=16); d.line((1626,834,1734,726),fill=RED,width=16)
tag(d,120,190,'É PROIBIDO',60,RED); tag(d,120,300,'ESTACIONAR',80)
fr.append(('0:47 Estacionar — fila na escola (Kling) + degradê',logos(b)))
# 12 telemovel
b=grad(ld('k446.png'),.38); d=ImageDraw.Draw(b); bracket(d,(380,560,900,1040))
d.line((900,940,1080,940),fill='white',width=5); tag(d,1095,910,'TELEMÓVEL',48,RED)
tag(d,1050,190,'É TAMBÉM PROIBIDO',50); tag(d,1050,290,'ENTRAR NA CABINE',64,RED); tag(d,1050,390,'COM TELEMÓVEIS',50)
fr.append(('0:54 Drone → imersão → telemóvel real + degradê',logos(b)))
# 13 tranquilidade
b=cover(ld('d6.png'),W,H,.5,.2); d=ImageDraw.Draw(b)
for k,w in enumerate(['TRANQUILIDADE','ORDEM','RESPEITO']): tag(d,120,200+k*120,w,64,NAVY if k%2==0 else RED)
fr.append(('1:05 Drone sobe — tranquilidade · ordem · respeito',logos(b)))
fr.append(('1:10 Participe + fim (do FINAL, igual)',ld('G84.png')))
tw,th=624,351; cols=3; rows=math.ceil(len(fr)/cols)
sheet=Image.new('RGB',(cols*(tw+12)+12,rows*(th+50)+12),(235,235,235)); sd=ImageDraw.Draw(sheet)
for i,(c,im) in enumerate(fr):
    x=12+(i%cols)*(tw+12); y=12+(i//cols)*(th+50)
    sheet.paste(im.resize((tw,th),Image.LANCZOS),(x,y)); sd.text((x,y+th+8),c,font=F(20,FK),fill=(20,20,40))
sheet.save(sys.argv[2],quality=86)

import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from eng import *
from eng import _xx,_yy
import segs as V1
OUT=S+'/seg2/'; os.makedirs(OUT,exist_ok=True)
def T(n): return n/FPS
fit=V1.fit
def lay(side):
    m=np.maximum(PAN_R if side=='r' else PAN_L,PAN_T)
    a=np.dstack([BLUEBG,m*255]).clip(0,255).astype('uint8'); return Image.fromarray(a,'RGBA')
DLR,DLL=lay('r'),lay('l')
def pm(im):
    a=np.asarray(im.convert('RGBA')).astype(np.float32)/255; a[...,:3]*=a[...,3:4]; return a
def blendA(a,b,k):
    x=pm(a)*(1-k)+pm(b)*k; al=x[...,3:4]; c=np.where(al>1e-4,x[...,:3]/np.maximum(al,1e-4),0)
    return Image.fromarray((np.dstack([c,al])*255).clip(0,255).astype('uint8'),'RGBA')
def writerA(path):
    return subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgba','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
        '-c:v','prores_ks','-profile:v','4','-pix_fmt','yuva444p10le','-vendor','apl0','-qscale:v','6',path],stdin=subprocess.PIPE)
def run(name,n0,n1,fn):
    p=writerA(OUT+name+'.mov')
    for n in range(n0,n1): p.stdin.write(np.asarray(fn(n,T(n)).convert('RGBA')).tobytes())
    p.stdin.close(); p.wait(); print('done',name,flush=True)
RGBA=lambda x:(Image.fromarray(x) if isinstance(x,np.ndarray) else x).convert('RGBA')
# ---------- S1 ----------
def S1():
    n0,n1=0,140; fin=final(122,140)
    def f(n,t):
        b=DLR.copy()
        tag(b,t,1106,288,'NO DIA',51,'plain',0.0,5.0)
        tag(b,t,1112,455,'15',221,'plain',0.35,5.0)
        tag(b,t,1114,558,'DE NOVEMBRO',73,'navy',1.0,5.0)
        tag(b,t,1104,633,'CABO VERDE VAI ÀS URNAS',fit('CABO VERDE VAI ÀS URNAS',593),'plain',2.1,5.0)
        tag(b,t,1110,700,'ELEGER O PRESIDENTE DA REPÚBLICA',34,'red',3.5,5.0)
        logos(b)
        if n>=122: k=eio((n-122)/17); return blendA(b,RGBA(cam(Image.fromarray(fin[n-122]),1.06-0.06*k)),k)
        return b
    run('S1',n0,n1,f)
# ---------- S2 (accelerated map, opaque) ----------
import cv2
def detext(fr):
    x0,y0,x1,y1=1060,215,1900,680; r=fr[y0:y1,x0:x1].astype(int)
    m=(r.min(2)>195)|(np.abs(r-np.array([25,41,109])).sum(2)<70)|(np.abs(r-np.array([212,41,46])).sum(2)<90)
    m=cv2.dilate(m.astype('uint8')*255,np.ones((13,13),np.uint8))
    out=fr.copy(); roi=np.ascontiguousarray(out[y0:y1,x0:x1])
    out[y0:y1,x0:x1]=cv2.inpaint(roi,m,9,cv2.INPAINT_TELEA); return out
def S2():
    n0,n1=140,322; src=final(140,469); N=len(src)
    def f(n,t):
        x=(n-n0)/(n1-n0-1)*(N-1); a=int(x); w=x-a; b2=min(a+1,N-1)
        fr=src[a].astype(np.float32)*(1-w)+src[b2].astype(np.float32)*w
        return Image.fromarray(fr.clip(0,255).astype('uint8')).convert('RGBA')
    run('S2',n0,n1,f)
# ---------- S3 (drone alpha, iris from map circle) ----------
TX0,TY0,TX1,TY1=1096,215,1910,640
def _matte():
    import cv2
    F=final(468,469)[0]; f=F[TY0:TY1,TX0:TX1].astype(np.float32)
    big=np.ascontiguousarray(F[TY0-150:TY1+150,TX0-150:].copy()); bgb=cv2.medianBlur(cv2.medianBlur(big,101),101).astype(np.float32); bg=bgb[150:150+(TY1-TY0),150:150+(TX1-TX0)]
    d=np.sqrt(((f-bg)**2).sum(2)); a=np.clip((d-28)/80,0,1)[...,None]
    c=np.where(a>0.01,(f-(1-a)*bg)/np.maximum(a,0.01),0).clip(0,255)
    return Image.fromarray(np.dstack([c,a*255]).astype('uint8'),'RGBA')
TXT=_matte()
def S3():
    n0,n1=322,478; fin=RGBA(final(468,469)[0])
    def f(n,t):
        i=n-n0; b=DLR.copy()
        if i<16:
            k=eio(i/15); cx,cy=598,538; R=lerp(482,1300,k)
            m=Image.new('L',(W,H),0); ImageDraw.Draw(m).ellipse((cx-R,cy-R,cx+R,cy+R),fill=255); m=m.filter(ImageFilter.GaussianBlur(2))
            b=Image.composite(b,fin,m); ImageDraw.Draw(b).ellipse((cx-R-7,cy-R-7,cx+R+7,cy+R+7),outline=(255,255,255,255),width=max(1,int(14*(1-k))))
        b.alpha_composite(TXT,(TX0,TY0))
        logos(b)
        if n==n1-1: b.save(S+'/fr/S3lastA.png')
        return b
    run('S3',n0,n1,f)
# ---------- S4 laptop (opaque) : start from S3 alpha ----------
def S4():
    V1.OUT=OUT
    import types
    orig=V1.writer; V1.writer=lambda p: writerA(p.replace('.mp4','.mov'))
    V1.put=lambda p,im: p.stdin.write(np.asarray(im.convert('RGBA')).tobytes())
    V1.blend=lambda a,b,k: blendA(a,b,k)
    Image_open=Image.open
    src=S+'/fr/S3last.png'
    Image.open(S+'/fr/S3lastA.png').save(src)   # S4 reads S3last.png
    V1.S4()
def S10():
    V1.OUT=OUT; V1.writer=lambda p: writerA(p.replace('.mp4','.mov'))
    V1.put=lambda p,im: p.stdin.write(np.asarray(im.convert('RGBA')).tobytes()); V1.S10()
# ---------- S678 ----------
def S678():
    n0,n1=814,1140
    barv=clip(DL+'k420.mp4',0.0,1.0,1030-903); phone=RGBA(final(813,814)[0]); clock=RGBA(final(1140,1141)[0])
    def barimg(i,t):
        z=1.04+0.06*ease((t-36.1)/4.6); return cam(grade(barv[min(i,len(barv)-1)],ai=True,side='l',i=i,blue=.36),z,1005,600)
    CX,CY=960,770
    def f(n,t):
        if n<903:
            b=DLR.copy()
            if n<824: b=blendA(phone,b,eio((n-814)/10))
            if t>35.82:
                k=ease((t-35.82)/0.3); b=blendA(b,RGBA(cam(barimg(0,36.1),1.35-0.27*k,1005,600)),k)
        elif n<1000:
            i=n-903; b=barimg(i,t)
            if t<36.6: b=cam(b,1+0.25*(1-eout((t-36.12)/.48)),960,540)
            b=RGBA(b); brackets(b,(740,300,1280,1000),t,36.5,40.0)
        else:
            i=n-1000; b=DLR.copy()
            kb=eout((t-40.0)/0.9)
            if kb<1:
                bi=RGBA(barimg(i+97,t)); s=lerp(1.0,0.35,kb)
                bi=cam(bi,s,960,540) if s<1 else bi
                if kb>0: bi=bi.filter(ImageFilter.GaussianBlur(3*kb))
                b=blendA(bi,b,ease((t-40.0)/0.9))
            ring(b,CX,CY,520,170,t,42.0,45.15); dot(b,CX,CY,t,41.9,45.15)
            tag(b,t,CX+520*0.42,CY-14,'500 M',46,'navy',42.8,45.15)
            labelline(b,CX,CY-24,CX-240,CY-170,t,44.1,'ASSEMBLEIA DE VOTO',34,'navy',45.15)
            if t>45.2:
                e=ease((t-45.2)/0.4); b=blendA(b,RGBA(cam(clock,1.25-0.25*e,560,560)),e)
                if e>=1: return clock
        tag(b,t,1106,288,'A CNE RECORDA QUE',51,'plain',33.15,35.9)
        tag(b,t,1112,375,'NO DIA DA VOTAÇÃO',62,'navy',34.55,35.9)
        tag(b,t,120,300,'É PROIBIDO',62,'red',36.05,40.1)
        tag(b,t,120,375,'O FORNECIMENTO E O CONSUMO',44,'plain',36.75,40.1)
        tag(b,t,126,460,'DE BEBIDAS ALCOÓLICAS',58,'navy',38.55,40.1)
        tag(b,t,1106,288,'NUM RAIO DE',51,'plain',42.0,45.15)
        tag(b,t,1112,375,'500 METROS',66,'red',42.75,45.15)
        tag(b,t,1106,440,'DAS ASSEMBLEIAS DE VOTO',40,'plain',43.65,45.15)
        logos(b); return b
    run('S678',n0,n1,f)
dot=V1.dot
# ---------- S1112 ----------
def S1112():
    n0,n1=1355,1633; ph=clip(DL+'k446.mp4',0.0,0.85,1633-1425)
    def phimg(i,t):
        z=1.0+0.07*ease((t-57)/8.3); return cam(grade(ph[i],ai=True,side='r',i=i,blue=.34),z,900,600)
    def f(n,t):
        if n<1425:
            b=DLR.copy()
            if t>56.72:
                k=ease((t-56.72)/0.28); b=blendA(b,RGBA(cam(phimg(0,57),1.3-0.3*k,900,600)),k)
        else:
            i=n-1425; b=phimg(i,t)
            if t<57.6: b=cam(b,1+0.3*(1-eout((t-57)/0.6)),900,600)
            b=RGBA(b); brackets(b,(600,560,1000,1000),t,57.35,60.6)
            labelline(b,1000,860,1080,940,t,57.55,'TELEMÓVEL',38,'red',60.6)
        tag(b,t,1106,288,'É TAMBÉM PROIBIDO',51,'plain',54.15,62.5)
        tag(b,t,1112,372,'ENTRAR NA CABINE DE VOTO',fit('ENTRAR NA CABINE DE VOTO',700),'red',55.65,62.5)
        tag(b,t,1112,450,'COM TELEMÓVEIS',50,'navy',57.35,62.5)
        tag(b,t,1106,512,'MÁQUINAS FOTOGRÁFICAS OU OUTROS',32,'plain',58.55,62.5)
        tag(b,t,1106,556,'DISPOSITIVOS DE CAPTAÇÃO DE IMAGEM',32,'plain',60.15,62.5)
        tag(b,t,1106,288,'PARA GARANTIR O',51,'plain',62.65,1e9)
        tag(b,t,1112,375,'SEGREDO DO VOTO',66,'red',63.95,1e9)
        logos(b); return b
    run('S1112',n0,n1,f)
# ---------- S13 ----------
def S13():
    n0,n1=1633,1775; fin=final(1765,1775)
    def f(n,t):
        b=DLL.copy()
        for k,(w,tt) in enumerate([('TRANQUILIDADE',65.5),('ORDEM',66.7),('RESPEITO',67.2)]):
            y=300+k*125
            if t>=tt:
                p=eback((t-tt)/.45); q=1-ease((t-70.1)/.3)
                ic=V1.ICONS[k].resize((max(1,int(84*p)),max(1,int(84*p)))); a=ic.split()[3].point(lambda v:int(v*q)); ic.putalpha(a)
                b.alpha_composite(ic,(int(166-42*p),int(y-42*p)))
            tag(b,t,240,y+22,w,62,'plain',tt+.1,70.4)
        tag(b,t,1150,330,'SÃO RESPONSABILIDADES',44,'plain',68.35,70.4)
        tag(b,t,1156,420,'DE TODOS',66,'red',69.75,70.4)
        logos(b)
        if n>=1765: b=blendA(b,RGBA(fin[n-1765]),eio((n-1765)/9))
        return b
    run('S13',n0,n1,f)
if __name__=='__main__':
    globals()[sys.argv[1]]()

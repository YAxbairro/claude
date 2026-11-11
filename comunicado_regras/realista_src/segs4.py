# Versão 4 (proibições): sobre a SÓ ALPHA (segs3) - sem logos (vão num ficheiro à parte), palácio no "eleger o
# Presidente da República", grafismos nas partes que no Premiere ficaram a preto e textos só de cada plano.
# Os grafismos/textos novos vêm de html/proib.html renderizado para hfr/ (ver build4.sh).
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import segs3 as M
from segs3 import *
M.OUT=S+'/seg4/'; os.makedirs(M.OUT,exist_ok=True)
M.logos=lambda b:None; logos=M.logos
def H(n):
    p=f'{S}/hfr/{n:05d}.png'
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None
def addH(b,n):
    h=H(n)
    if h is not None: b.alpha_composite(h)
    return b
def abertura(b,t):
    tag(b,t,1106,288,'NO DIA',51,'plain',0.0,3.45)
    tag(b,t,1112,455,'15',221,'plain',0.55,3.45)
    tag(b,t,1114,558,'DE NOVEMBRO',73,'navy',0.94,3.45)
    tag(b,t,1104,633,'CABO VERDE VAI ÀS URNAS',fit('CABO VERDE VAI ÀS URNAS',593),'plain',2.08,3.45)
    tag(b,t,1106,309,'A CNE APELA',fit('A CNE APELA',521),'plain',6.0,13.35)
    tag(b,t,1106,372,'A TODOS OS CIDADÃOS',fit('A TODOS OS CIDADÃOS',721),'plain',8.34,13.35)
    tag(b,t,1112,476,'PARA QUE PARTICIPEM',58,'navy',10.36,13.35)
    tag(b,t,1106,540,'NESTE IMPORTANTE MOMENTO',40,'plain',10.92,13.35)
    tag(b,t,1112,612,'DA DEMOCRACIA',50,'red',12.34,13.35)
    tag(b,t,1106,309,'EXERCENDO O SEU',51,'plain',13.46,19.0)
    tag(b,t,1112,396,'DIREITO DE VOTO',66,'navy',14.2,19.0)
    tag(b,t,1112,496,'LIBERDADE',66,'red',15.52,19.0)
    tag(b,t,1112,566,'RESPONSABILIDADE',39,'navy',16.58,19.0)
    tag(b,t,1112,629,'CONSCIÊNCIA CÍVICA',39,'red',17.84,19.0)
M.abertura=abertura
# mapa a partir de 5,0 s (ilhas entram durante a passagem do palácio) e final novo (html/end2.html -> endfr2/)
_mc2={}
def mapframe(n):
    a=min(max(n,125),M.S2B-1)
    if a not in _mc2: _mc2[a]=np.asarray(Image.open(f'{S}/mapfr/{a:05d}.png').convert('RGB'))
    return _mc2[a]
M.mapframe=mapframe
def endframe(n): return Image.open(f'{S}/endfr2/{n:05d}.png').convert('RGBA')
M.endframe=endframe

def S1():
    def f(n,t):
        b=EMPTY(); abertura(b,t); addH(b,n)
        if n>=125:
            k=eio((n-125)/14); m=RGBA(cam(Image.fromarray(mapframe(n)),1.06-0.06*k)); m.putalpha(int(255*k)); b.alpha_composite(m)
        return b
    run('S1',0,140,f)
def S4():
    n0,n1=478,585; site=RGBA(final(585,586)[0])
    def f(n,t):
        b=addH(EMPTY(),n)
        if n>=n1-12: b=blendA(b,RGBA(cam(site,1.08-0.08*eio((n-(n1-12))/11))),eio((n-(n1-12))/11))
        return b
    run('S4',n0,n1,f)
def S678():
    n0,n1=814,1140; phone=RGBA(final(813,814)[0]); clock=RGBA(final(1140,1141)[0]); CX,CY=960,770
    def f(n,t):
        b=EMPTY()
        if n<824: b=blendA(phone,b,eio((n-814)/10))
        if n>=1000:
            ring(b,CX,CY,520,170,t,42.0,45.15); V1.dot(b,CX,CY,t,41.9,45.15)
            tag(b,t,CX+520*0.42,CY-14,'500 M',46,'navy',42.8,45.15)
            labelline(b,CX,CY-24,CX-240,CY-170,t,44.1,'ASSEMBLEIA DE VOTO',34,'navy',45.15)
        tag(b,t,1106,288,'A CNE RECORDA QUE',51,'plain',33.15,35.9)
        tag(b,t,1112,375,'NO DIA DA VOTAÇÃO',62,'navy',34.55,35.9)
        tag(b,t,1106,288,'NUM RAIO DE',51,'plain',42.0,45.15)
        tag(b,t,1112,375,'500 METROS',66,'red',42.75,45.15)
        tag(b,t,1106,440,'DAS ASSEMBLEIAS DE VOTO',40,'plain',43.65,45.15)
        addH(b,n)
        if t>45.2:
            e=ease((t-45.2)/0.4); b=blendA(b,RGBA(cam(clock,1.25-0.25*e,560,560)),e)
        return b
    run('S678',n0,n1,f)
def S10():
    n0,n1=1180,1355; clk=RGBA(final(1180,1181)[0])
    def f(n,t):
        b=addH(EMPTY(),n); i=n-n0
        if i<12: b=blendA(RGBA(cam(clk,1+0.15*eio(i/11),560,560)),b,eio(i/11))
        return b
    run('S10',n0,n1,f)
def S1112():
    def f(n,t):
        b=EMPTY()
        tag(b,t,1106,288,'PARA GARANTIR O',51,'plain',62.65,1e9)
        tag(b,t,1112,375,'SEGREDO DO VOTO',66,'red',63.95,1e9)
        return addH(b,n)
    run('S1112',1355,1633,f)
S2,S3_,S13,F14=M.S2,M.S3,M.S13,M.F14
G={'S1':S1,'S2':S2,'S3':S3_,'S4':S4,'S678':S678,'S10':S10,'S1112':S1112,'S13':S13,'F14':F14}
# ---------- trechos do FINAL sem os logos gravados (os logos vão no PNG à parte) ----------
import cv2 as _cv
import eng as _E
def _lmask():
    m=np.zeros((1080,1920),np.uint8)
    for im,(x,y) in [(LES,(44,27)),(LE,(44,24)),(LCS,(1593,55)),(LC,(1593,52))]:
        a=np.asarray(im)[...,3]; h,w=a.shape; m[y:y+h,x:x+w]=np.maximum(m[y:y+h,x:x+w],(a>8).astype(np.uint8)*255)
    return _cv.dilate(m,np.ones((9,9),np.uint8))
_LM=_lmask(); _BOX=[(20,0,300,190),(1570,30,1900,170)]
def nologo(fr):
    out=np.ascontiguousarray(fr.copy())
    for x0,y0,x1,y1 in _BOX:
        roi=np.ascontiguousarray(out[y0:y1,x0:x1]); out[y0:y1,x0:x1]=_cv.inpaint(roi,_LM[y0:y1,x0:x1],7,_cv.INPAINT_TELEA)
    return out
_final0=_E.final
def final_clean(a,b): return [nologo(np.asarray(f)) for f in _final0(a,b)]
M.final=final_clean; final=final_clean
import segs as _V1; _V1.final=final_clean
def F9():
    fr=final_clean(1140,1180)
    run('F9',1140,1180,lambda n,t:RGBA(fr[n-1140]))
def F5():
    M.F5()
G['F9']=F9; G['F5']=F5
if __name__=='__main__': G[sys.argv[1]]()

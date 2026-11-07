# Versão "SÓ ALPHA": sem vídeo (drone/Kling) e sem degradê azul nos trechos que levam vídeo por baixo.
# Ficam só textos, logos e grafismos. Abertura (0-19 s) re-sincronizada com a voz (audio/words.json).
# Os segmentos F5, F9 e F14 continuam a vir do FINAL (são grafismo opaco) - ver build3.sh.
import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from eng import *
import segs as V1
import cv2
OUT=S+'/seg3/'; os.makedirs(OUT,exist_ok=True)
fit=V1.fit
def T(n): return n/FPS
def EMPTY(): return Image.new('RGBA',(W,H),(0,0,0,0))
RGBA=lambda x:(Image.fromarray(x) if isinstance(x,np.ndarray) else x).convert('RGBA')
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
# ---------- tira o texto do FINAL de cima do mapa ----------
def detext(fr):
    x0,y0,x1,y1=1060,215,1900,700; r=fr[y0:y1,x0:x1].astype(int)
    m=(r.min(2)>195)|(np.abs(r-np.array(NAVY)).sum(2)<70)|(np.abs(r-np.array(RED)).sum(2)<90)
    m=cv2.dilate(m.astype('uint8')*255,np.ones((13,13),np.uint8))
    out=fr.copy(); roi=np.ascontiguousarray(out[y0:y1,x0:x1])
    out[y0:y1,x0:x1]=cv2.inpaint(roi,m,9,cv2.INPAINT_TELEA); return out
MAP0,MAP1=140,469          # frames do mapa no FINAL
S2A,S2B=140,322            # posição no vídeo novo (acelerado 1.8x)
_mc={}
def mapframe(n):
    """frame do mapa (sem texto) correspondente ao frame n do vídeo novo"""
    a=min(max(n,S2A),S2B-1)   # mapa refeito (html/map.html -> mapfr/), sem o painel nem o texto antigo do FINAL
    if a not in _mc: _mc[a]=np.asarray(Image.open(f'{S}/mapfr/{a:05d}.png').convert('RGB'))
    return _mc[a]
# ---------- textos da abertura, no tempo da voz ----------
def abertura(b,t):
    # "No dia 15 de novembro, Cabo Verde vai às urnas para eleger o Presidente da República." 0.0-5.1
    tag(b,t,1106,288,'NO DIA',51,'plain',0.0,5.45)
    tag(b,t,1112,455,'15',221,'plain',0.55,5.45)
    tag(b,t,1114,558,'DE NOVEMBRO',73,'navy',0.94,5.45)
    tag(b,t,1104,633,'CABO VERDE VAI ÀS URNAS',fit('CABO VERDE VAI ÀS URNAS',593),'plain',2.08,5.45)
    tag(b,t,1110,700,'ELEGER O PRESIDENTE DA REPÚBLICA',34,'red',3.52,5.45)
    # "A Comissão Nacional de Eleições apela a todos os cidadãos para que participem neste importante momento da democracia" 6.0-13.1
    tag(b,t,1106,309,'A CNE APELA',fit('A CNE APELA',521),'plain',6.0,13.35)
    tag(b,t,1106,372,'A TODOS OS CIDADÃOS',fit('A TODOS OS CIDADÃOS',721),'plain',8.34,13.35)
    tag(b,t,1112,476,'PARA QUE PARTICIPEM',58,'navy',10.36,13.35)
    tag(b,t,1106,540,'NESTE IMPORTANTE MOMENTO',40,'plain',10.92,13.35)
    tag(b,t,1112,612,'DA DEMOCRACIA',50,'red',12.34,13.35)
    # "exercendo o seu direito de voto com liberdade, responsabilidade e consciência cívica." 13.46-18.9
    tag(b,t,1106,309,'EXERCENDO O SEU',51,'plain',13.46,19.0)
    tag(b,t,1112,396,'DIREITO DE VOTO',66,'navy',14.2,19.0)
    tag(b,t,1112,496,'LIBERDADE',66,'red',15.52,19.0)
    tag(b,t,1112,566,'RESPONSABILIDADE',39,'navy',16.58,19.0)
    tag(b,t,1112,629,'CONSCIÊNCIA CÍVICA',39,'red',17.84,19.0)
# ---------- S1 0-140: textos em alpha -> entra o mapa ----------
def S1():
    def f(n,t):
        b=EMPTY(); abertura(b,t); logos(b)
        if n>=125:   # 5.0 s: o mapa (limpo) aparece por baixo dos textos que estão a sair
            k=eio((n-125)/14); m=RGBA(cam(Image.fromarray(mapframe(S2A)),1.06-0.06*k)); m.putalpha(int(255*k))
            m.alpha_composite(b); b=m
        return b
    run('S1',0,140,f)
# ---------- S2 140-322: mapa acelerado, sem o texto antigo ----------
def S2():
    def f(n,t):
        b=RGBA(mapframe(n)); abertura(b,t); logos(b); return b
    run('S2',S2A,S2B,f)
# ---------- S3 322-478: íris do mapa -> alpha ----------
def S3():
    n0,n1=322,478; fin=RGBA(mapframe(S2B-1))
    def f(n,t):
        i=n-n0; b=EMPTY()
        if i<16:
            k=eio(i/15); cx,cy=560,600; R=lerp(0,1400,k)   # íris abre a partir de Cabo Verde
            m=Image.new('L',(W,H),0); ImageDraw.Draw(m).ellipse((cx-R,cy-R,cx+R,cy+R),fill=255); m=m.filter(ImageFilter.GaussianBlur(2))
            b=Image.composite(b,fin,m); ImageDraw.Draw(b).ellipse((cx-R-7,cy-R-7,cx+R+7,cy+R+7),outline=(255,255,255,255),width=max(1,int(14*(1-k))))
        abertura(b,t); logos(b); return b
    run('S3',n0,n1,f)
# ---------- S4 478-585: (era o portátil) só textos -> entra o site da CNE (F5) ----------
def S4():
    n0,n1=478,585; site=RGBA(final(585,586)[0])
    def f(n,t):
        b=EMPTY()
        tag(b,t,1106,200,'ANTES DE SAIR DE CASA',44,'navy',19.24,22.6)
        tag(b,t,1322,278,'CONFIRME O SEU',51,'plain',21.0,1e9)
        tag(b,t,1334,351,'LOCAL DE VOTO',57,'red',21.5,1e9)
        tag(b,t,1327,434,'WWW.CNE.CV',44,'plain',22.75,1e9)
        logos(b)
        if n>=n1-12: b=blendA(b,RGBA(cam(site,1.08-0.08*eio((n-(n1-12))/11))),eio((n-(n1-12))/11))
        return b
    run('S4',n0,n1,f)
# ---------- F5 585-814: site da CNE do FINAL, mas com o rato a clicar exatamente no botão CONSULTAR ----------
def _cursor():
    k=4; pts=[(0,0),(0,31),(7.5,24),(12.5,36),(18,33.5),(13,22),(23,22)]
    im=Image.new('RGBA',(40*k,46*k),(0,0,0,0)); d=ImageDraw.Draw(im)
    P=[((x+3)*k,(y+3)*k) for x,y in pts]; d.polygon(P,fill=(255,255,255,255),outline=(25,25,25,255),width=int(2.2*k))
    sh=Image.new('RGBA',im.size,(0,0,0,0)); ImageDraw.Draw(sh).polygon([(x+2*k,y+3*k) for x,y in P],fill=(0,0,0,90))
    sh=sh.filter(ImageFilter.GaussianBlur(3*k)); sh.alpha_composite(im); return sh.resize((54,62),Image.LANCZOS)
def F5():
    n0,n1=585,814; fr=final(n0,n1); plate=fr[0].copy(); BX=(60,560,1260,990)   # zona estática da página (sem rato)
    cur=_cursor(); BTN=(176,820,263,851); TIP=(214,834); P0=(600,660); P1=(800,760)
    def pos(n):
        if n<=603: k=eio((n-585)/18); return (lerp(P0[0],TIP[0],k),lerp(P0[1],TIP[1],k))
        if n<=615: return TIP
        k=eio(min(1,(n-615)/13)); return (lerp(TIP[0],P1[0],k),lerp(TIP[1],P1[1],k))
    def f(n,t):
        x=fr[n-n0]
        if n>=632: return RGBA(x)
        x=x.copy(); x0,y0,x1,y1=BX; x[y0:y1,x0:x1]=plate[y0:y1,x0:x1]; b=RGBA(x); ov=EMPTY(); d=ImageDraw.Draw(ov)
        i=n-604
        if 0<=i<6: d.rectangle(BTN,fill=(10,30,90,int(70*(1-i/6))))          # botão "carregado"
        if 0<=i<16:                                                             # onda do clique
            r=lerp(8,46,eout(i/15)); a=int(200*(1-i/16)); cx,cy=(BTN[0]+BTN[2])/2,(BTN[1]+BTN[3])/2
            d.ellipse((cx-r,cy-r,cx+r,cy+r),outline=(25,41,109,a),width=4)
        b.alpha_composite(ov); px,py=pos(n); c=cur
        if 0<=i<5: c=cur.resize((int(54*.86),int(62*.86)),Image.LANCZOS)
        b.alpha_composite(c,(int(px-4),int(py-4))); return b
    run('F5',n0,n1,f)
# ---------- S678 814-1140: recorda / bebidas / raio 500 m (sem bar) -> relógio ----------
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
        tag(b,t,120,300,'É PROIBIDO',62,'red',36.05,40.1)
        tag(b,t,120,375,'O FORNECIMENTO E O CONSUMO',44,'plain',36.75,40.1)
        tag(b,t,126,460,'DE BEBIDAS ALCOÓLICAS',58,'navy',38.55,40.1)
        tag(b,t,1106,288,'NUM RAIO DE',51,'plain',42.0,45.15)
        tag(b,t,1112,375,'500 METROS',66,'red',42.75,45.15)
        tag(b,t,1106,440,'DAS ASSEMBLEIAS DE VOTO',40,'plain',43.65,45.15)
        logos(b)
        if t>45.2:
            e=ease((t-45.2)/0.4); b=blendA(b,RGBA(cam(clock,1.25-0.25*e,560,560)),e)
        return b
    run('S678',n0,n1,f)
# ---------- S10 1180-1355: (era a escola) proibido estacionar ----------
def S10():
    n0,n1=1180,1355; clk=RGBA(final(1180,1181)[0])
    def f(n,t):
        b=EMPTY()
        tag(b,t,1120,232,'É PROIBIDO',62,'red',47.85,54.0)
        tag(b,t,1126,322,'ESTACIONAR VEÍCULOS',58,'navy',48.75,54.0)
        tag(b,t,1120,385,'EM FRENTE ÀS ASSEMBLEIAS DE VOTO',36,'plain',49.95,54.0)
        if t>53.7: b=blendA(b,EMPTY(),ease((t-53.7)/.3))   # o sinal sai com os textos
        logos(b)
        i=n-n0
        if i<12: b=blendA(RGBA(cam(clk,1+0.15*eio(i/11),560,560)),b,eio(i/11))
        return b
    run('S10',n0,n1,f)
# ---------- S1112 1355-1633: (era drone/telemóvel) só textos ----------
def S1112():
    def f(n,t):
        b=EMPTY()
        tag(b,t,1106,288,'É TAMBÉM PROIBIDO',51,'plain',54.15,62.5)
        tag(b,t,1112,372,'ENTRAR NA CABINE DE VOTO',fit('ENTRAR NA CABINE DE VOTO',700),'red',55.65,62.5)
        tag(b,t,1112,450,'COM TELEMÓVEIS',50,'navy',57.35,62.5)
        tag(b,t,1106,512,'MÁQUINAS FOTOGRÁFICAS OU OUTROS',32,'plain',58.55,62.5)
        tag(b,t,1106,556,'DISPOSITIVOS DE CAPTAÇÃO DE IMAGEM',32,'plain',60.15,62.5)
        tag(b,t,1106,288,'PARA GARANTIR O',51,'plain',62.65,1e9)
        tag(b,t,1112,375,'SEGREDO DO VOTO',66,'red',63.95,1e9)
        logos(b); return b
    run('S1112',1355,1633,f)
# ---------- S13 1633-1775: tranquilidade/ordem/respeito ----------
def S13():
    n0,n1=1633,1775
    def f(n,t):
        b=EMPTY()
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
        if n>=1765: b=blendA(b,endframe(n),eio((n-1765)/9))
        return b
    run('S13',n0,n1,f)
# ---------- F14 1775-2275: final refeito (html/end.html -> endfr/) ----------
def endframe(n): return Image.open(f'{S}/endfr/{n:05d}.png').convert('RGBA')
def F14():
    def f(n,t):
        b=endframe(n)
        if n<2211: logos(b)          # o cartão final (88,44 s) não leva os logos dos cantos
        return b
    run('F14',1775,2275,f)
# ---------- teste rápido: folha de frames sobre cinzento ----------
def TEST(*ts):
    fns={'S1':(0,140),'S2':(140,322),'S3':(322,478)}
    out=[]
    for tt in ts:
        n=int(float(tt)*FPS); b=EMPTY()
        if n<140: b=EMPTY(); abertura(b,n/FPS)
        if 125<=n<322 or n>=140 and n<322: b=RGBA(mapframe(n)); abertura(b,n/FPS)
        if n>=322: b=EMPTY(); abertura(b,n/FPS)
        logos(b); g=Image.new('RGBA',(W,H),(48,48,48,255)); g.alpha_composite(b)
        d=ImageDraw.Draw(g); d.text((20,1000),f'{tt}s',font=font(50),fill=(255,255,0))
        out.append(g.convert('RGB').resize((480,270)))
    sh=Image.new('RGB',(480*4,270*((len(out)+3)//4)))
    for k,im in enumerate(out): sh.paste(im,((k%4)*480,(k//4)*270))
    sh.save(sys.argv[-1] if sys.argv[-1].endswith('.jpg') else S+'/test.jpg')
if __name__=='__main__':
    if sys.argv[1]=='TEST': TEST(*[a for a in sys.argv[2:] if not a.endswith('.jpg')])
    else: globals()[sys.argv[1]]()

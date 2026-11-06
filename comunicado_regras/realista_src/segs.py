import sys,os
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from eng import *
from eng import _xx,_yy
DR=DL+'drone.mp4'
OUT=S+'/seg/'
def T(n): return n/FPS
def run(name,n0,n1,fn):
    p=writer(OUT+name+'.mp4')
    for n in range(n0,n1):
        im=fn(n,T(n)); put(p,im)
    p.stdin.close(); p.wait(); print('done',name,flush=True)
def fit(text,width):
    lo,hi=10,300
    while hi-lo>1:
        m=(lo+hi)//2
        if font(m).getlength(text)<=width: lo=m
        else: hi=m
    return lo
# ======================= S1 opening 0-140 =======================
def S1():
    n0,n1=0,140; fr=clip(DR,12.42,0.93,n1-n0); fin=final(122,140)
    P=[(520,330),(860,450),(300,520)]; tr=[track(fr,p) for p in P]
    def f(n,t):
        i=n-n0; z=1.0+0.05*ease(t/5.6)
        b=grade(fr[i],side='r',i=i).convert('RGBA')
        b=cam(b,z).convert('RGBA')
        for k,(tt) in enumerate([0.35,0.75,1.15]):
            x,y=campt(tr[k][i],z,W/2,H/2); pin(b,x,y,t,tt,0.9,tout=5.0)
        tag(b,t,1106,288,'NO DIA',51,'plain',0.0,5.0)
        tag(b,t,1112,455,'15',221,'plain',0.35,5.0)
        tag(b,t,1114,558,'DE NOVEMBRO',73,'navy',1.0,5.0)
        tag(b,t,1104,633,'CABO VERDE VAI ÀS URNAS',fit('CABO VERDE VAI ÀS URNAS',593),'plain',2.1,5.0)
        tag(b,t,1110,700,'ELEGER O PRESIDENTE DA REPÚBLICA',34,'red',3.5,5.0)
        logos(b)
        if n>=122:
            k=eio((n-122)/17); fb=Image.fromarray(fin[n-122]).convert('RGB')
            bz=cam(b,1-0.08*k); fz=cam(fb,1.06-0.06*k)
            return blend(bz,fz,k)
        return b
    run('S1',n0,n1,f)
# ======================= S3 apelo drone 283-478 =======================
def S3():
    n0,n1=283,478; fr=clip(DR,17.62,0.63,n1-n0); fin=final(283,299)
    def f(n,t):
        i=n-n0; z=1.0+0.07*ease((t-T(n0))/7.8)
        b=cam(grade(fr[i],side='r',i=i),z,W/2,H/2-30*ease((t-T(n0))/7.8)).convert('RGBA')
        tag(b,t,1106,309,'A CNE APELA',fit('A CNE APELA',521),'plain',T(n0)-1,19.0)
        tag(b,t,1106,372,'A TODOS OS CIDADÃOS',fit('A TODOS OS CIDADÃOS',721),'plain',T(n0)-1,19.0)
        tag(b,t,1112,486,'LIBERDADE',66,'navy',15.4,19.0)
        tag(b,t,1112,556,'RESPONSABILIDADE',39,'navy',16.5,19.0)
        tag(b,t,1112,619,'CONSCIÊNCIA CÍVICA',39,'red',17.7,19.0)
        logos(b); b=b.convert('RGB')
        if i<16:
            k=eio(i/15); fb=Image.fromarray(fin[i])
            R=lerp(0,1250,k); m=Image.new('L',(W,H),0); g=ImageDraw.Draw(m); cx,cy=560,560
            g.ellipse((cx-R,cy-R,cx+R,cy+R),fill=255); m=m.filter(ImageFilter.GaussianBlur(2))
            out=fb.copy(); out.paste(b,(0,0),m)
            rr=ImageDraw.Draw(out); rr.ellipse((cx-R-8,cy-R-8,cx+R+8,cy+R+8),outline=(255,255,255),width=int(14*(1-k))+1)
            return out
        return b
    run('S3',n0,n1,f)
# ======================= S4 laptop 478-585 =======================
def S4():
    n0,n1=478,585; fr=clip(DL+'k379.mp4',1.0,1.0,n1-n0,mirror=True)
    fin=final(585,586)[0]; site=Image.fromarray(fin).crop((90,192,1249,969))
    Q=[(262,398),(827,392),(854,713),(281,767)]  # ref at clip t=3.0 -> i=50
    ref=50; anc=(545,330)
    tr=track(fr,anc); off=[(p[0]-tr[ref][0],p[1]-tr[ref][1]) for p in tr]
    import numpy.linalg as la
    def coeffs(dst,sw,sh):
        src=[(0,0),(sw,0),(sw,sh),(0,sh)]; A=[];B=[]
        for (x,y),(u,v) in zip(dst,src): A+=[[x,y,1,0,0,0,-u*x,-u*y],[0,0,0,x,y,1,-v*x,-v*y]]; B+=[u,v]
        return tuple(la.solve(np.array(A,float),np.array(B,float)))
    TGT=(90,192,1249,969)
    def f(n,t):
        i=n-n0; base=fr[i]; q=[(x+off[i][0],y+off[i][1]) for x,y in Q]
        im=grade(base,ai=True,side='r',i=i,blue=.34)
        # screen insert
        xs=[p[0] for p in q]; ys=[p[1] for p in q]; bx=(int(min(xs))-2,int(min(ys))-2,int(max(xs))+3,int(max(ys))+3)
        bw,bh=bx[2]-bx[0],bx[3]-bx[1]; dst=[(x-bx[0],y-bx[1]) for x,y in q]
        warp=site.transform((bw,bh),Image.PERSPECTIVE,coeffs(dst,site.width,site.height),Image.BICUBIC)
        org=base[max(bx[1],0):bx[3],max(bx[0],0):bx[2]].astype(int)
        wh=((org.min(2)>170)&(org.max(2)-org.min(2)<45)).astype('uint8')*255
        mk=Image.fromarray(wh).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
        pm=Image.new('L',(bw,bh),0); ImageDraw.Draw(pm).polygon(dst,fill=255); pm=pm.filter(ImageFilter.GaussianBlur(.8))
        mk=Image.fromarray(np.minimum(np.asarray(mk),np.asarray(pm)))
        glow=Image.new('RGB',(bw,bh),(255,255,255)); im.paste(warp,bx[:2],mk)
        # camera zoom into screen 22.5 -> 23.4
        k=eio((t-22.45)/(23.4-22.45))
        sx0,sy0,sx1,sy1=min(xs),min(ys),max(xs),max(ys)
        zt=(TGT[2]-TGT[0])/(sx1-sx0); cxt=(sx0+sx1)/2-((TGT[0]+TGT[2])/2-W/2)/zt; cyt=(sy0+sy1)/2-((TGT[1]+TGT[3])/2-H/2)/zt
        z0=1+0.05*ease((t-T(n0))/4)
        z=math.exp(lerp(math.log(z0),math.log(zt),k)); cx=lerp(W/2,cxt,k); cy=lerp(H/2,cyt,k)
        b=cam(im,z,cx,cy).convert('RGBA')
        tg=1-k
        tag(b,t,1106,200,'ANTES DE SAIR DE CASA',44,'navy',19.2,22.6)
        tag(b,t,1322,278,'CONFIRME O SEU',51,'plain',21.0,1e9)
        tag(b,t,1334,351,'LOCAL DE VOTO',57,'red',21.5,1e9)
        tag(b,t,1327,434,'WWW.CNE.CV',44,'plain',22.75,1e9)
        logos(b); b=b.convert('RGB')
        if i<5: b=blend(Image.open(S+'/fr/S3last.png'),b,eio(i/4))
        if t>23.4-0.32:
            kk=eio((t-(23.4-0.32))/0.32); b=blend(b,Image.fromarray(fin),kk)
        return b
    run('S4',n0,n1,f)
# ======================= S6-S8 drone->bar->500m 823-1140 =======================
def S678():
    n0,n1=823,1140
    top=clip(DR,22.5,0.9,903-823+10); bar=Image.fromarray(clip(DL+'k420.mp4',0.08,1,1)[0])
    city=clip(DR,0.04,0.68,1140-1000+5); fin=final(813,833); clock=Image.fromarray(final(1140,1141)[0])
    PC=(930,760); trc=track(city,PC)
    barg=[grade(bar,ai=True,side='l',i=k,blue=.36) for k in range(6)]
    def barimg(t,i):
        z=1.08+0.06*ease((t-36.1)/4); return cam(barg[i%6],z,1005,690)
    def f(n,t):
        if n<903:   # top-down drone with travel
            i=n-n0; zc=1.0+0.18*ease((t-32.92)/3.0)
            kt=ein((t-35.55)/0.57); z=zc*math.exp(math.log(2.4)*kt)
            im=grade(top[i],side='r',i=i)
            if kt>0: im=im.filter(ImageFilter.GaussianBlur(4*kt))
            b=cam(im,z,960,560).convert('RGB')
            if t>35.82:
                k=ease((t-35.82)/0.3); b=blend(b,cam(barimg(t,i),1.35-0.27*k,1005,690),k)
            b=b.convert('RGBA')
            if n<833: b=Image.fromarray(np.asarray(b.convert('RGB'))); b=blend(Image.fromarray(fin[n-813]),b,eio((n-823)/10)).convert('RGBA')
        elif n<1000:
            i=n-n0; b=barimg(t,i).convert('RGBA')
            if t<36.6:
                k=eout((t-36.12)/.48); b=cam(b,1+0.25*(1-k),1005,690).convert('RGBA')
            brackets(b,(740,350,1280,1040),t,36.5,40.0)
        else:
            i=n-1000; c=grade(city[i],side='r',i=i); P=trc[i]
            # bar card shrinks into pin location
            zc=1.0+0.04*ease((t-40)/5.6)
            b=cam(c,zc).convert('RGBA'); Pp=campt(P,zc,W/2,H/2)
            k=eio((t-40.0)/1.5)
            if k<1:
                cw=lerp(W,300,k); ch=cw*9/16; cxp=lerp(W/2,Pp[0],k); cyp=lerp(H/2,Pp[1]-ch/2-40*k,k)
                card=barimg(t,i).resize((int(cw),int(ch)),Image.LANCZOS)
                fr_=Image.new('RGBA',(int(cw)+16,int(ch)+16),(255,255,255,255)); fr_.paste(card,(8,8))
                sh=Image.new('RGBA',(W,H),(0,0,0,0)); ImageDraw.Draw(sh).rectangle((cxp-cw/2,cyp-ch/2+14,cxp+cw/2,cyp+ch/2+14),fill=(0,10,40,int(120*k))); b.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)))
                b.alpha_composite(fr_,(int(cxp-cw/2-8),int(cyp-ch/2-8)))
                if k<1 and t<40.5: brackets(b,(740,350,1280,1040),t,36.5,40.6)
            else:
                k2=eio((t-41.5)/0.45)
                if k2<1:
                    cw=300*(1-k2); ch=cw*9/16
                    if cw>4:
                        card=barimg(t,i).resize((max(1,int(cw)),max(1,int(ch))),Image.LANCZOS); a=Image.new('L',card.size,int(255*(1-k2)))
                        card.putalpha(a); b.alpha_composite(card,(int(Pp[0]-cw/2),int(Pp[1]-40-ch)))
            rx,ry=520*zc,170*zc
            ring(b,Pp[0],Pp[1],rx,ry,t,42.0,45.15)
            pin(b,Pp[0],Pp[1],t,41.55,1.15)
            if t>42.8: tag(b,t,Pp[0]+rx*0.42,Pp[1]-14,'500 M',46,'navy',42.8,45.15)
            labelline(b,Pp[0],Pp[1]-190,Pp[0]-260,Pp[1]-300,t,44.1,'ASSEMBLEIA DE VOTO',34,'navy',45.15)
            # transition to clock 45.15-45.6 : push into pin head
            kc=eio((t-45.12)/0.48)
            if kc>0:
                hx,hy=Pp[0],Pp[1]-115*1.15-30
                zz=math.exp(math.log(4.0)*kc); b=cam(b,zz,lerp(W/2,hx,kc),lerp(H/2,hy,kc)).convert('RGBA')
                b=blend(b,clock,ease((t-45.3)/0.3)).convert('RGBA')
                if kc>=1: return clock
        # texts
        if n<1000 or t<45.3:
            pass
        tag(b,t,1106,288,'A CNE RECORDA QUE',51,'plain',33.15,35.9)
        tag(b,t,1112,375,'NO DIA DA VOTAÇÃO',62,'navy',34.55,35.9)
        tag(b,t,120,300,'É PROIBIDO',62,'red',36.05,40.1)
        tag(b,t,120,375,'O FORNECIMENTO E O CONSUMO',44,'plain',36.75,40.1)
        tag(b,t,126,460,'DE BEBIDAS ALCOÓLICAS',58,'navy',38.55,40.1)
        tag(b,t,1106,288,'NUM RAIO DE',51,'plain',42.0,45.15)
        tag(b,t,1112,375,'500 METROS',66,'red',42.75,45.15)
        tag(b,t,1106,440,'DAS ASSEMBLEIAS DE VOTO',40,'plain',43.65,45.15)
        if not (n>=1000 and t>45.12): logos(b)
        else: logos(b)
        return b
    run('S678',n0,n1,f)
# ======================= S10 school 1180-1355 =======================
def S10():
    n0,n1=1180,1355; fr=clip(DL+'k517.mp4',0.0,0.9,n1-n0); clk=Image.fromarray(final(1180,1181)[0])
    trs=track(fr,(1650,880))
    def f(n,t):
        i=n-n0; z=1.0+0.07*ease((t-47.2)/7)
        im=grade(fr[i],ai=True,side='r',i=i,blue=.36); b=cam(im,z,960,520).convert('RGBA')
        p=campt((trs[i][0],trs[i][1]+60),z,960,520)
        nopark(b,p[0],p[1],t,48.75,66)
        tag(b,t,1120,232,'É PROIBIDO',62,'red',47.85,54.0)
        tag(b,t,1126,322,'ESTACIONAR VEÍCULOS',58,'navy',48.75,54.0)
        tag(b,t,1120,385,'EM FRENTE ÀS ASSEMBLEIAS DE VOTO',36,'plain',49.95,54.0)
        logos(b); b=b.convert('RGB')
        if i<12:
            k=eio(i/11); b=blend(cam(clk,1+0.15*k,560,560),cam(b,1.08-0.08*k),k)
        return b
    run('S10',n0,n1,f)
# ======================= S11-12 drone -> phone 1355-1633 =======================
def S1112():
    n0,n1=1355,1633
    dr=clip(DR,24.0,0.75,1425-1355+5); ph=clip(DL+'k446.mp4',0.0,0.85,1633-1425)
    def phimg(i,t):
        z=1.0+0.07*ease((t-57)/8.3); return cam(grade(ph[i],ai=True,side='r',i=i,blue=.34),z,900,600)
    def f(n,t):
        if n<1425:
            i=n-n0; kt=ein((t-56.35)/0.65); z=(1.25+0.15*ease((t-54.2)/2.8))*math.exp(math.log(2.6)*kt)
            im=grade(dr[i],side='r',i=i)
            if kt>0: im=im.filter(ImageFilter.GaussianBlur(5*kt))
            b=cam(im,z,980,520)
            if n<1361: b=blend(Image.new('RGB',(W,H),(0,0,0)),b,1) 
            if t>56.72:
                k=ease((t-56.72)/0.28); b=blend(b,cam(phimg(0,57),1.3-0.3*k,900,600),k)
            b=b.convert('RGBA')
        else:
            i=n-1425; b=phimg(i,t)
            if t<57.6: b=cam(b,1+0.3*(1-eout((t-57)/0.6)),900,600)
            b=b.convert('RGBA')
            brackets(b,(600,560,1000,1000),t,57.35,60.6)
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
# ======================= S13 values 1633-1775 =======================
def icon(kind):
    im=Image.new('RGBA',(84,84),(0,0,0,0)); g=ImageDraw.Draw(im); g.ellipse((0,0,83,83),fill=(255,255,255)); c=NAVY
    if kind==0:
        for k in range(3):
            y=28+k*13; pts=[(22+x,y+4*math.sin(x/6)) for x in range(0,41,2)]; g.line(pts,fill=c,width=5)
    if kind==1:
        for k in range(3):
            y=27+k*15; g.ellipse((22,y-4,30,y+4),fill=c); g.line((35,y,62,y),fill=c,width=5)
    if kind==2:
        g.line((24,43,37,56,61,30),fill=c,width=7,joint='curve')
    return im
ICONS=[icon(k) for k in range(3)]
def S13():
    n0,n1=1633,1775; fr=clip(DR,3.82,0.88,n1-n0); fin=final(1765,1775)
    def f(n,t):
        i=n-n0; z=1.04+0.05*ease((t-65.32)/5.7)
        b=cam(grade(fr[i],side='l',i=i),z,960,560-60*ease((t-65.32)/5.7)).convert('RGBA')
        for k,(w,tt) in enumerate([('TRANQUILIDADE',65.5),('ORDEM',66.7),('RESPEITO',67.2)]):
            y=300+k*125
            if t>=tt:
                p=eback((t-tt)/.45); q=1-ease((t-70.1)/.3)
                ic=ICONS[k].resize((max(1,int(84*p)),max(1,int(84*p)))); a=ic.split()[3].point(lambda v:int(v*q)); ic.putalpha(a)
                b.alpha_composite(ic,(int(166-42*p),int(y-42*p)))
            tag(b,t,240,y+22,w,62,'plain',tt+.1,70.4)
        tag(b,t,1150,330,'SÃO RESPONSABILIDADES',44,'plain',68.35,70.4)
        tag(b,t,1156,420,'DE TODOS',66,'red',69.75,70.4)
        logos(b); b=b.convert('RGB')
        if n>=1765:
            k=eio((n-1765)/9); b=blend(b,Image.fromarray(fin[n-1765]),k)
        return b
    run('S13',n0,n1,f)

# ======================= v2 overrides =======================
def S1():
    n0,n1=0,140; fr=clip(DR,12.42,0.90,n1-n0); fin=final(122,140)
    def f(n,t):
        i=n-n0; z=1.0+0.05*ease(t/5.6)
        b=cam(grade(fr[i],side='r',i=i),z).convert('RGBA')
        tag(b,t,1106,288,'NO DIA',51,'plain',0.0,5.0)
        tag(b,t,1112,455,'15',221,'plain',0.35,5.0)
        tag(b,t,1114,558,'DE NOVEMBRO',73,'navy',1.0,5.0)
        tag(b,t,1104,633,'CABO VERDE VAI ÀS URNAS',fit('CABO VERDE VAI ÀS URNAS',593),'plain',2.1,5.0)
        tag(b,t,1110,700,'ELEGER O PRESIDENTE DA REPÚBLICA',34,'red',3.5,5.0)
        logos(b)
        if n>=122:
            k=eio((n-122)/17); fb=Image.fromarray(fin[n-122]).convert('RGB')
            return blend(cam(b,1-0.0*k),cam(fb,1.06-0.06*k),k)
        return b
    run('S1',n0,n1,f)
# accelerated map (FINAL 140..468 -> out 140..322), FINAL text masked, own synced text
_my=np.clip((_yy-150)/60,0,1)*np.clip((760-_yy)/60,0,1)
MASK2=(np.clip((_xx-900)/130,0,1)*_my)[...,None].astype(np.float32)
APELA=[('A CNE APELA',309,'plain',6.0),('A TODOS OS CIDADÃOS',372,'plain',8.6)]
def apela_text(b,t):
    tag(b,t,1106,309,'A CNE APELA',fit('A CNE APELA',521),'plain',6.0)
    tag(b,t,1106,372,'A TODOS OS CIDADÃOS',fit('A TODOS OS CIDADÃOS',721),'plain',8.6)
    tag(b,t,1112,486,'LIBERDADE',66,'navy',15.4)
    tag(b,t,1112,556,'RESPONSABILIDADE',39,'navy',16.5)
    tag(b,t,1112,619,'CONSCIÊNCIA CÍVICA',39,'red',17.7)
def S2():
    n0,n1=140,322; src=final(140,469); N=len(src)
    def f(n,t):
        x=(n-n0)/(n1-n0-1)*(N-1); a=int(x); w=x-a; b2=min(a+1,N-1)
        fr=src[a].astype(np.float32)*(1-w)+src[b2].astype(np.float32)*w
        fr=fr*(1-MASK2)+BLUEBG*MASK2
        b=Image.fromarray(fr.clip(0,255).astype('uint8')).convert('RGBA')
        apela_text(b,t); logos(b); return b
    run('S2',n0,n1,f)
def S3():
    n0,n1=322,478; fr=clip(DR,17.62,0.60,n1-n0); fin=final(468,469)[0]
    fin=(fin.astype(np.float32)*(1-MASK2)+BLUEBG*MASK2).astype('uint8')
    def f(n,t):
        i=n-n0; z=1.0+0.06*ease((t-T(n0))/6.2)
        b=cam(grade(fr[i],side='r',i=i),z,W/2,H/2-25*ease((t-T(n0))/6.2)).convert('RGB')
        if i<16:
            k=eio(i/15); fb=Image.fromarray(fin)
            cx,cy=598,538; R=lerp(482,1300,k)
            m=Image.new('L',(W,H),0); ImageDraw.Draw(m).ellipse((cx-R,cy-R,cx+R,cy+R),fill=255); m=m.filter(ImageFilter.GaussianBlur(2))
            out=fb.copy(); out.paste(b,(0,0),m); ImageDraw.Draw(out).ellipse((cx-R-7,cy-R-7,cx+R+7,cy+R+7),outline=(255,255,255),width=max(1,int(14*(1-k))))
            b=out
        b=b.convert('RGBA'); apela_text(b,t); logos(b)
        if n==n1-1: b.convert('RGB').save(S+'/fr/S3last.png')
        return b
    run('S3',n0,n1,f)

def dot(b,x,y,t,tin,tout=1e9):
    if t<tin or t>tout: return
    p=eback((t-tin)/.4); q=1-ease((t-(tout-.3))/.3); r=16*p
    d=ImageDraw.Draw(b); a=int(255*q)
    d.ellipse((x-r,y-r,x+r,y+r),fill=(255,255,255,a)); d.ellipse((x-r*.55,y-r*.55,x+r*.55,y+r*.55),fill=RED+(a,))
def S678():
    n0,n1=814,1140
    top=clip(DR,22.48,0.9,903-814); barv=clip(DL+'k420.mp4',0.0,1.0,1020-903)
    city=clip(DR,0.04,0.64,1140-1000); phone=Image.fromarray(final(813,814)[0]); clock=Image.fromarray(final(1140,1141)[0])
    PC=(930,760); trc=track(city,PC)
    def barimg(i,t):
        z=1.04+0.06*ease((t-36.1)/4.6); return cam(grade(barv[i],ai=True,side='l',i=i,blue=.36),z,1005,600)
    def f(n,t):
        if n<903:   # top-down drone + dolly-in to bar
            i=n-n0; zc=1.0+0.18*ease((t-32.56)/3.5)
            kt=ein((t-35.55)/0.57); z=zc*math.exp(math.log(2.4)*kt)
            im=grade(top[i],side='r',i=i)
            if kt>0: im=im.filter(ImageFilter.GaussianBlur(4*kt))
            b=cam(im,z,960,560)
            if t>35.82:
                k=ease((t-35.82)/0.3); b=blend(b,cam(barimg(0,36.1),1.35-0.27*k,1005,600),k)
            if n<824: b=blend(phone,b,eio((n-814)/10))
            b=b.convert('RGBA')
        elif n<1000:   # bar video
            i=n-903; b=barimg(i,t)
            if t<36.6: b=cam(b,1+0.25*(1-eout((t-36.12)/.48)),960,540)
            b=b.convert('RGBA'); brackets(b,(740,300,1280,1000),t,36.5,40.0)
        else:          # dolly-out: bar -> city drone with 500 m ring
            i=n-1000; c=grade(city[i],side='r',i=i); P=trc[i]
            ko=eout((t-40.0)/0.9)
            zc=math.exp(lerp(math.log(2.6),0,ko))*(1.0+0.04*ease((t-40.9)/4.7))
            cx=lerp(P[0],W/2,ko); cy=lerp(P[1],H/2,ko)
            b=cam(c,zc,cx,cy); Pp=campt(P,zc,cx,cy)
            if t<40.9:
                kb=ease((t-40.0)/0.9); bi=barimg(i+97,t)
                if kb<0.98:
                    if kb>0: bi=bi.filter(ImageFilter.GaussianBlur(3*kb))
                    b=blend(cam(bi,1/(1+1.6*kb) if False else 1+0*kb),b,kb) if False else blend(bi,b,kb)
            b=b.convert('RGBA')
            rx,ry=520*zc/ (zc if zc>1.05 else 1),170
            if t>41.9:
                ring(b,Pp[0],Pp[1],520,170,t,42.0,45.15)
                dot(b,Pp[0],Pp[1],t,41.9,45.15)
                if t>42.8: tag(b,t,Pp[0]+520*0.42,Pp[1]-14,'500 M',46,'navy',42.8,45.15)
                labelline(b,Pp[0],Pp[1]-24,Pp[0]-240,Pp[1]-170,t,44.1,'ASSEMBLEIA DE VOTO',34,'navy',45.15)
            kc=eio((t-45.12)/0.48)
            if kc>0:
                zz=math.exp(math.log(3.0)*kc); b=cam(b,zz,lerp(W/2,Pp[0],kc),lerp(H/2,Pp[1],kc))
                b=blend(b,cam(clock,1.25-0.25*ease((t-45.25)/0.35),560,560),ease((t-45.25)/0.35)).convert('RGBA')
                if kc>=1: return clock
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
if __name__=='__main__':
    {'S1':S1,'S2':S2,'S3':S3,'S4':S4,'S678':S678,'S10':S10,'S1112':S1112,'S13':S13}[sys.argv[1]]()

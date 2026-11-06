import sys,os,math,subprocess,json,numpy as np
from PIL import Image,ImageDraw,ImageFont,ImageFilter
S=os.path.dirname(os.path.abspath(__file__)); FR=S+'/fr/'; DL=S+'/dl/'
W,H,FPS=1920,1080,25
FINALV=os.path.join(S,'..','Apelo_Proibicoes_FINAL_16x9.mp4')
NAVY=(25,41,109); RED=(212,41,46); WHITE=(255,255,255)
FX=S+'/fonts/M800.ttf'
def ease(x): x=min(1,max(0,x)); return x*x*(3-2*x)
def eout(x): x=min(1,max(0,x)); return 1-(1-x)**3
def ein(x): x=min(1,max(0,x)); return x**3
def eio(x): x=min(1,max(0,x)); return 4*x**3 if x<.5 else 1-(-2*x+2)**3/2
def eback(x):
    x=min(1,max(0,x)); c1=1.70158; c3=c1+1; return 1+c3*(x-1)**3+c1*(x-1)**2
def lerp(a,b,t): return a+(b-a)*t
# ---------------- readers ----------------
def clip(path,start,speed,n,mirror=False):
    vf=f"setpts=(PTS-STARTPTS)/{speed},fps={FPS}"+(",hflip" if mirror else "")+f",scale={W}:{H}:flags=lanczos"
    cmd=['ffmpeg','-v','error','-ss',str(start),'-i',path,'-vf',vf,'-frames:v',str(n),'-f','rawvideo','-pix_fmt','rgb24','-']
    d=subprocess.run(cmd,capture_output=True).stdout; k=len(d)//(W*H*3)
    fr=[np.frombuffer(d[i*W*H*3:(i+1)*W*H*3],'uint8').reshape(H,W,3) for i in range(k)]
    while len(fr)<n: fr.append(fr[-1])
    return fr
def final(a,b):
    cmd=['ffmpeg','-v','error','-i',FINALV,'-vf',f"select='between(n\\,{a}\\,{b-1})'",'-vsync','0','-f','rawvideo','-pix_fmt','rgb24','-']
    d=subprocess.run(cmd,capture_output=True).stdout; k=len(d)//(W*H*3)
    return [np.frombuffer(d[i*W*H*3:(i+1)*W*H*3],'uint8').reshape(H,W,3) for i in range(k)]
# ---------------- tracking ----------------
def _pc(a,b):
    A=np.fft.fft2(a); B=np.fft.fft2(b); R=A*np.conj(B); R/=np.abs(R)+1e-9; r=np.fft.ifft2(R).real
    y,x=np.unravel_index(np.argmax(r),r.shape); h,w=r.shape
    def sub(c,m1,p1):
        d=(m1-p1)/(2*(m1-2*c+p1)+1e-9); return d
    dy=sub(r[y,x],r[(y-1)%h,x],r[(y+1)%h,x]); dx=sub(r[y,x],r[y,(x-1)%w],r[y,(x+1)%w])
    y=y+dy; x=x+dx
    if y>h/2: y-=h
    if x>w/2: x-=w
    return x,y
def track(frames,pt,ps=320):
    """returns list of point positions following image content around pt"""
    out=[pt]; x,y=pt; win=np.outer(np.hanning(ps),np.hanning(ps))
    def patch(f,x,y):
        g=f[...,1].astype(np.float32)
        x0=int(min(max(x-ps//2*2,0),W-ps*2)); y0=int(min(max(y-ps//2*2,0),H-ps*2))
        p=g[y0:y0+ps*2:2,x0:x0+ps*2:2]; return (p-p.mean())*win,x0,y0
    for i in range(1,len(frames)):
        if frames[i] is frames[i-1]: out.append((x,y)); continue
        a,x0,y0=patch(frames[i-1],x,y)
        g=frames[i][...,1].astype(np.float32); b=g[y0:y0+ps*2:2,x0:x0+ps*2:2]; b=(b-b.mean())*win
        dx,dy=_pc(b,a); x+=dx*2; y+=dy*2; out.append((x,y))
    return out
# ---------------- camera ----------------
def cam(arr,z=1.0,cx=W/2,cy=H/2,rot=0):
    im=Image.fromarray(arr) if isinstance(arr,np.ndarray) else arr
    # output pixel (u,v) -> source ((u-W/2)/z+cx, (v-H/2)/z+cy)
    if z>=1:
        cx=min(max(cx,W/2/z),W-W/2/z); cy=min(max(cy,H/2/z),H-H/2/z)
    a=1/z; return im.transform((W,H),Image.AFFINE,(a,0,cx-W/2*a,0,a,cy-H/2*a),Image.BICUBIC)
def campt(p,z,cx,cy): return ((p[0]-cx)*z+W/2,(p[1]-cy)*z+H/2)
# ---------------- grading ----------------
_yy,_xx=np.mgrid[0:H,0:W].astype(np.float32)
_t=(_xx/W*.45+_yy/H*.55)[...,None]
GRAD=(np.array([95,190,235],np.float32)*(1-_t)+np.array([6,38,105],np.float32)*_t)
VIG=(1-0.35*np.clip(((_xx-W/2)/(W*.62))**2+((_yy-H/2)/(H*.62))**2,0,1))[...,None]
def side_dark(side='r',k=.45):
    if side=='r': m=np.clip((_xx-W*.42)/(W*.4),0,1)
    else: m=np.clip((W*.58-_xx)/(W*.4),0,1)
    top=np.clip((H*.75-_yy)/(H*.5),0,1)*0+1
    return (1-k*ease_np(m))[...,None]
def ease_np(x): return x*x*(3-2*x)
SD_R=side_dark('r',.5); SD_L=side_dark('l',.5)
_ry=np.sqrt(((_xx-960)/1100)**2+((_yy-540)/700)**2).clip(0,1)[...,None]
BLUEBG=np.array([20,150,204],np.float32)*(1-_ry)+np.array([11,113,179],np.float32)*_ry
PAN_R=(.78*ease_np(np.clip((_xx-W*.40)/(W*.42),0,1)))[...,None]
PAN_L=(.78*ease_np(np.clip((W*.60-_xx)/(W*.42),0,1)))[...,None]
PAN_T=(.55*ease_np(np.clip((190-_yy)/190,0,1)))[...,None]
TOPD=(1-0.55*np.clip((200-_yy)/200,0,1))[...,None]
rng=np.random.default_rng(3); GRAIN=[rng.normal(0,1,(H//2,W//2)).astype(np.float32) for _ in range(6)]
def grade(im,ai=False,side='r',i=0,blue=.38):
    a=np.asarray(im).astype(np.float32)
    if ai:
        g=a.mean(2,keepdims=True); a=a*.8+g*.2
        a=a*(1-blue)+GRAD*blue
        a=a*VIG
    else:
        a=(a-128)*1.04+128; a=a*(.94+.06*VIG)
    if side in ('r','l'):
        m=PAN_R if side=='r' else PAN_L
        a=a*(1-m)+BLUEBG*m
    a=a*(1-PAN_T)+BLUEBG*PAN_T
    gr=np.asarray(Image.fromarray(GRAIN[i%6]).resize((W,H),Image.BILINEAR))[...,None]
    a+=gr*(4.5 if ai else 2.5)
    return Image.fromarray(np.clip(a,0,255).astype('uint8'))
# ---------------- logos ----------------
def _logo(src,box):
    x0,y0,x1,y1=box; reg=src[y0:y1,x0:x1]
    ring=np.concatenate([src[y0-6:y0,x0:x1].reshape(-1,3),src[y1:y1+6,x0:x1].reshape(-1,3),src[y0:y1,x0-6:x0].reshape(-1,3),src[y0:y1,x1:x1+6].reshape(-1,3)])
    bgc=np.median(ring,0); a=((reg-bgc)/(255-bgc+1e-6)).max(2).clip(0,1)
    a=((a-0.10)/0.85).clip(0,1)
    return Image.fromarray(np.dstack([np.full(a.shape+(3,),255.0),a*255]).astype('uint8'),'RGBA')
_src=np.asarray(Image.open(FR+'F67.png').convert('RGB')).astype(np.float32)
LE=_logo(_src,(44,24,268,154)); LC=_logo(_src,(1593,52,1862,142))
def _sh(L):
    s=Image.new('RGBA',L.size,(0,15,50,0)); s.putalpha(L.split()[3].point(lambda v:int(v*.55))); return s.filter(ImageFilter.GaussianBlur(5))
LES,LCS=_sh(LE),_sh(LC)
def logos(b):
    b.alpha_composite(LES,(44,27)); b.alpha_composite(LCS,(1593,55)); b.alpha_composite(LE,(44,24)); b.alpha_composite(LC,(1593,52))
# ---------------- text tags (FINAL style) ----------------
_fc={}
def font(sz):
    if sz not in _fc: _fc[sz]=ImageFont.truetype(FX,sz)
    return _fc[sz]
_tc={}
def tagimg(text,sz,style):
    k=(text,sz,style)
    if k in _tc: return _tc[k]
    f=font(sz); cap=int(sz*.70); s=sz/57
    w=int(f.getlength(text)); pl,pr,pt,pb=int(14*s),int(12*s),int(21*s),int(12*s)
    bw,bh=w+pl+pr,cap+pt+pb; pad=24
    im=Image.new('RGBA',(bw+2*pad,bh+2*pad),(0,0,0,0)); d=ImageDraw.Draw(im)
    if style in('navy','red'):
        sh=Image.new('RGBA',im.size,(0,0,0,0)); ImageDraw.Draw(sh).rectangle((pad,pad+5,pad+bw,pad+bh+5),fill=(0,10,40,90)); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(7)))
        d.rectangle((pad,pad,pad+bw,pad+bh),fill=NAVY if style=='navy' else RED)
    else:
        sh=Image.new('RGBA',im.size,(0,0,0,0)); ImageDraw.Draw(sh).text((pad+pl,pad+pt+cap+3),text,font=f,fill=(0,15,50,150),anchor='ls'); im.alpha_composite(sh.filter(ImageFilter.GaussianBlur(5)))
    d.text((pad+pl,pad+pt+cap),text,font=f,fill=WHITE,anchor='ls')
    r=(im,pad,pl,pt,cap,bw,bh); _tc[k]=r; return r
def tag(b,t,x,base,text,sz,style='plain',tin=0,tout=1e9,dur=.4):
    """x=text left, base=baseline. animated wipe-in from left + rise; fade out"""
    if t<tin or t>tout: return
    im,pad,pl,pt,cap,bw,bh=tagimg(text,sz,style)
    p=eout((t-tin)/dur); q=1-ease((t-(tout-.3))/.3)
    if p<=0 or q<=0: return
    wv=int((bw+2*pad)*min(1,p*1.15)) if style!='plain' else im.width
    tile=im.crop((0,0,max(1,wv),im.height)) if style!='plain' else im
    a=tile.split()[3].point(lambda v:int(v*min(1,p*1.6)*q)); tile=tile.copy(); tile.putalpha(a)
    dy=int((1-p)*26)
    b.alpha_composite(tile,(int(x-pl-pad),int(base-cap-pt-pad+dy)))
# ---------------- AR graphics ----------------
def pin(b,x,y,t,tin,sc=1.0,tout=1e9):
    if t<tin or t>tout: return
    p=(t-tin)/.55; drop=eback(p); a=min(1,p*3)*(1-ease((t-(tout-.3))/.3))
    d=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(d)
    hgt=110*sc; yy=y-(1-drop)*160*sc
    # ground ripple
    rp=ease((t-tin-.35)/.6)
    if rp>0 and rp<1:
        r=lerp(10,70,rp)*sc; g.ellipse((x-r,y-r*.38,x+r,y+r*.38),outline=(255,255,255,int(220*(1-rp)*a)),width=max(2,int(4*sc)))
    g.ellipse((x-9*sc,y-4*sc,x+9*sc,y+4*sc),fill=(0,0,0,int(90*a)))
    g.line((x,yy,x,yy-hgt),fill=(255,255,255,int(255*a)),width=max(2,int(6*sc)))
    R=26*sc; g.ellipse((x-R,yy-hgt-2*R,x+R,yy-hgt),fill=RED+(int(255*a),),outline=(255,255,255,int(255*a)),width=max(2,int(7*sc)))
    g.ellipse((x-R*.36,yy-hgt-R*1.36,x+R*.36,yy-hgt-R*.64),fill=(255,255,255,int(255*a)))
    b.alpha_composite(d)
def brackets(b,box,t,tin,tout=1e9,L=60,w=7):
    if t<tin or t>tout: return
    p=eout((t-tin)/.5); q=1-ease((t-(tout-.3))/.3); a=int(255*min(1,p*2)*q)
    x0,y0,x1,y1=box; cx,cy=(x0+x1)/2,(y0+y1)/2; s=lerp(1.25,1,p)
    x0,x1=cx+(x0-cx)*s,cx+(x1-cx)*s; y0,y1=cy+(y0-cy)*s,cy+(y1-cy)*s
    d=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(d)
    for (X,Y,sx,sy) in [(x0,y0,1,1),(x1,y0,-1,1),(x0,y1,1,-1),(x1,y1,-1,-1)]:
        g.line((X,Y,X+sx*L,Y),fill=(255,255,255,a),width=w); g.line((X,Y,X,Y+sy*L),fill=(255,255,255,a),width=w)
    b.alpha_composite(d)
def ring(b,cx,cy,rx,ry,t,tin,tout=1e9,lbl=None):
    if t<tin or t>tout: return
    p=eio((t-tin)/1.0); q=1-ease((t-(tout-.3))/.3)
    d=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(d)
    g.ellipse((cx-rx,cy-ry,cx+rx,cy+ry),fill=(212,41,46,int(70*ease((t-tin-.5)/.6)*q)))
    ang=360*p
    for k in np.arange(-90,-90+ang,6):
        a1,a2=math.radians(k),math.radians(min(k+3.2,-90+ang))
        g.line((cx+rx*math.cos(a1),cy+ry*math.sin(a1),cx+rx*math.cos(a2),cy+ry*math.sin(a2)),fill=(255,255,255,int(255*q)),width=7)
    rl=ease((t-tin-.6)/.5)
    if rl>0: g.line((cx,cy,cx+rx*rl,cy),fill=(255,255,255,int(235*q)),width=4)
    b.alpha_composite(d)
def nopark(b,x,y,t,tin,R=80):
    if t<tin: return
    p=eback((t-tin)/.5); a=min(1,(t-tin)*4)
    if p<=0: return
    r=R*p; d=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(d)
    g.rectangle((x-6,y-r*1.2,x+6,y+r*2.6),fill=(225,225,225,int(255*a)))
    g.ellipse((x-r,y-r*2.2,x+r,y),fill=(30,85,190,int(255*a)),outline=RED+(int(255*a),),width=max(2,int(r*.2)))
    cy=y-r; k=r*.62
    g.line((x-k,cy-k,x+k,cy+k),fill=RED+(int(255*a),),width=max(2,int(r*.2))); g.line((x-k,cy+k,x+k,cy-k),fill=RED+(int(255*a),),width=max(2,int(r*.2)))
    b.alpha_composite(d)
def labelline(b,x0,y0,x1,y1,t,tin,text,sz=40,style='red',tout=1e9):
    if t<tin or t>tout: return
    p=eout((t-tin)/.45); q=1-ease((t-(tout-.3))/.3)
    d=Image.new('RGBA',(W,H),(0,0,0,0)); g=ImageDraw.Draw(d)
    g.ellipse((x0-8,y0-8,x0+8,y0+8),fill=(255,255,255,int(255*q*min(1,p*3))))
    g.line((x0,y0,lerp(x0,x1,p),lerp(y0,y1,p)),fill=(255,255,255,int(255*q)),width=4); b.alpha_composite(d)
    if p>.6: tag(b,t,x1+20,y1+int(sz*.35),text,sz,style,tin+.27,tout)
# ---------------- writer ----------------
def writer(path):
    return subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-',
        '-c:v','libx264','-preset','slow','-crf','14','-pix_fmt','yuv420p',path],stdin=subprocess.PIPE)
def put(p,im): p.stdin.write(np.asarray(im.convert('RGB')).tobytes())
def blend(a,b,k):
    return Image.blend(a.convert('RGB'),b.convert('RGB'),float(k))

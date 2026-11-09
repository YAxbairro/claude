# Blueprint V2 · 2 opções por alteração (frames reais do motor: render.js TEST com ?o=...)
import subprocess,shutil
from PIL import Image,ImageDraw,ImageFont
S='/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad/'
def frames(o,ts):
    import os
    if all(os.path.exists(S+f'bv_{o}_{t}.jpg') for t in ts): return [S+f'bv_{o}_{t}.jpg' for t in ts]
    v='V2'+('&o='+o if o else '')
    subprocess.run(['node','render.js',v,'TEST',S+'_x.jpg',*map(str,ts)],cwd='motion',env={**__import__('os').environ,'PAGE':'v1anim.html'},check=True)
    out=[]
    for t in ts: f=S+f'bv_{o}_{t}.jpg'; shutil.copy(S+'_t'+('%g'%t)+'.jpg',f); out.append(f)
    return out
F=ImageFont.truetype('../realista_src/fonts/M800.ttf',30); F2=ImageFont.truetype('../realista_src/fonts/M700.ttf',22); FT=ImageFont.truetype('../realista_src/fonts/M800.ttf',48); FH=ImageFont.truetype('../realista_src/fonts/M800.ttf',36)
R=[('0:11–0:16 · MESMO TEXTO DO C · SÓ MUDA O TAMANHO E A POSIÇÃO',[
   ('1 · Centro, médio','como o C, um pouco maior','T1,M13',[12.4,15.6]),
   ('2 · Centro, grande','maior e um pouco mais acima','T1,M16',[12.4,15.6]),
   ('3 · Esquerda','alinhado à esquerda, tamanho médio-grande','T1,M17',[12.4,15.6]),
   ('4 · Direita','alinhado à direita, tamanho médio-grande','T1,M18',[12.4,15.6])])]
tw,th=1000,562; LW=400; G=24
rows=sum(len(r[1]) for r in R); H=150+len(R)*70+rows*(th+G)+40
W=Image.new('RGB',(LW+2*(tw+G)+40,H),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 2 · MESA DE VOTO · CENA 0:11 · TAMANHO E POSIÇÃO',font=FT,fill=(25,41,109))
y=140
for sec,items in R:
    d.text((36,y+14),sec,font=FH,fill=(212,41,46)); y+=70
    for name,desc,o,ts in items:
        p=name.split(' · '); d.text((36,y+20),p[0],font=F,fill=(212,41,46))
        if len(p)>1:
            fs=30
            while d.textlength(p[1],font=ImageFont.truetype('../realista_src/fonts/M800.ttf',fs))>LW-50: fs-=1
            d.text((36,y+60),p[1],font=ImageFont.truetype('../realista_src/fonts/M800.ttf',fs),fill=(25,41,109))
        yy=y+104
        for ln in [desc[i:i+26] for i in range(0,0)] or []: pass
        words=desc.split(); line=''
        for w in words:
            if d.textlength(line+' '+w,font=F2)>LW-50: d.text((36,yy),line.strip(),font=F2,fill=(70,80,110)); yy+=30; line=''
            line+=' '+w
        d.text((36,yy),line.strip(),font=F2,fill=(70,80,110))
        for i,f in enumerate(frames(o,ts)):
            x=LW+i*(tw+G); W.paste(Image.open(f).resize((tw,th)),(x,y)); d.text((x+10,y+th-34),f'{ts[i]:.2f}s',font=F2,fill=(255,255,255),stroke_width=2,stroke_fill=(0,0,0))
        y+=th+G
W.save('../Blueprint_V2_cena011_posicao.jpg',quality=88); print(W.size)

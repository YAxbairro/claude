# Blueprint V2 · 2 opções por alteração (frames reais do motor: render.js TEST com ?o=...)
import subprocess,shutil
from PIL import Image,ImageDraw,ImageFont
S='/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad/'
def frames(o,ts):
    import os
    if all(os.path.exists(S+f'bw_{o}_{t}.jpg') for t in ts): return [S+f'bw_{o}_{t}.jpg' for t in ts]
    v='V1'+('&o='+o if o else '')
    subprocess.run(['node','render.js',v,'TEST',S+'_x.jpg',*map(str,ts)],cwd='motion',env={**__import__('os').environ,'PAGE':'v1anim.html'},check=True)
    out=[]
    for t in ts: f=S+f'bw_{o}_{t}.jpg'; shutil.copy(S+'_t'+('%g'%t)+'.jpg',f); out.append(f)
    return out
F=ImageFont.truetype('../realista_src/fonts/M800.ttf',30); F2=ImageFont.truetype('../realista_src/fonts/M700.ttf',22); FT=ImageFont.truetype('../realista_src/fonts/M800.ttf',48); FH=ImageFont.truetype('../realista_src/fonts/M800.ttf',36)
R=[('1 · 0:05–0:10 · "SÃO RESTRITOS" · SUGESTÕES DE ÍCONE',[
   ('Atual · Porta com mão','(para comparar)','T1',[7.5,9.8]),
   ('Opção 1 · Cadeado','o fecho do cadeado fecha em "restritos"','T1,R1',[7.5,9.8]),
   ('Opção 2 · Acesso proibido','pessoa + sinal vermelho que se desenha em "restritos"','T1,R2',[7.5,9.8]),
   ('Opção 3 · Barreira','dois postes; a fita vermelha cai em "restritos"','T1,R3',[7.5,9.8])]),
 ('2 · 0:22–0:35 · "SÃO ELES" · SÓ TEXTO NA HORIZONTAL',[
   ('Opção 1 · Colunas','nome + função, separados por filetes vermelhos','T1,L1',[26.0,30.0,33.0,34.8]),
   ('Opção 2 · Numerado','01 · 02 · 03 · 04 grandes em vermelho','T1,L2',[26.0,30.0,33.0,34.8]),
   ('Opção 3 · Etiquetas','cada nome numa etiqueta azul que cai','T1,L3',[26.0,30.0,33.0,34.8])]),
 ('3 · FOTOS NOVAS · 0:42 SÓ O TEMPO · 0:48 PRESIDENTE · 0:53 CREDENCIAIS · 0:56 ANTES DE AUTORIZAR',[
   ('Opção 1 · Foto em moldura','a foto entra no lugar do ícone/ilustração; texto igual','T1,F1',[46.0,51.0,54.5,60.0]),
   ('Opção 2 · Foto de fundo','foto inteira, sem zoom; texto onde não tapa caras','T1,F2',[46.0,51.0,54.5,60.0])])]
tw,th=560,315; LW=400; G=24
rows=sum(len(r[1]) for r in R); H=150+len(R)*70+rows*(th+G)+40
W=Image.new('RGB',(LW+4*(tw+G)+40,H),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 1 · ACESSO E PERMANÊNCIA · ALTERAÇÕES',font=FT,fill=(25,41,109))
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
W.save('../Blueprint_V1_alteracoes.jpg',quality=88); print(W.size)

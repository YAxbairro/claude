# Blueprint V2 · 2 opções por alteração (frames reais do motor: render.js TEST com ?o=...)
import subprocess,shutil
from PIL import Image,ImageDraw,ImageFont
S='/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad/'
def frames(o,ts):
    import os
    if all(os.path.exists(S+f'bp_{o}_{t}.jpg') for t in ts): return [S+f'bp_{o}_{t}.jpg' for t in ts]
    v='V2'+('&o='+o if o else '')
    subprocess.run(['node','render.js',v,'TEST',S+'_x.jpg',*map(str,ts)],cwd='motion',env={**__import__('os').environ,'PAGE':'v1anim.html'},check=True)
    out=[]
    for t in ts: f=S+f'bp_{o}_{t}.jpg'; shutil.copy(S+'_t'+('%g'%t)+'.jpg',f); out.append(f)
    return out
F=ImageFont.truetype('../realista_src/fonts/M800.ttf',30); F2=ImageFont.truetype('../realista_src/fonts/M700.ttf',22); FT=ImageFont.truetype('../realista_src/fonts/M800.ttf',48); FH=ImageFont.truetype('../realista_src/fonts/M800.ttf',36)
R=[('1 · TRANSIÇÕES (todas as mudanças azul ↔ claro)',[
   ('Atual (a retirar)','faixas azul/vermelho',None,[7.86,7.98,8.1,8.3]),
   ('Opção 1 · Fundido','o fundo e o texto dissolvem-se (0,5 s)','T1',[7.95,8.05,8.15,8.4]),
   ('Opção 2 · Deslize','o fundo novo entra da direita com um fio vermelho','T2',[7.78,7.88,7.98,8.3])]),
 ('2 · 0:11–0:16 · BOM FUNCIONAMENTO DAS OPERAÇÕES (foto 1 ao fundo)',[
   ('Opção 1 · Engrenagens','giram sempre; visto vermelho em "operações eleitorais"','M1',[11.9,12.9,14.0,15.6]),
   ('Opção 2 · Lista de verificação','um visto por frase, ao ritmo da voz','M2',[11.9,12.3,13.0,15.6])]),
 ('3 · 0:36–0:41 · PRESIDENTES DAS MESAS (foto 2 + comunicação)',[
   ('Opção 1 · Telemóvel','vibra e emite ondas em "de comunicação"','P1',[37.3,38.5,39.6,41.1]),
   ('Opção 2 · Telefone + balão','telefone toca e abre balão de conversa','P2',[37.3,38.5,39.6,41.1])]),
 ('4 · 0:41–0:47 · SUPLENTES (foto 3, mantém o grafismo)',[
   ('Opção 1 · Foto inteira em azul','ícone e texto por cima, caras livres','S1',[42.2,43.6,45.2,46.9]),
   ('Opção 2 · Foto em painel','foto à esquerda, ícone e texto à direita','S2',[42.2,43.6,45.2,46.9])])]
tw,th=560,315; LW=400; G=24
rows=sum(len(r[1]) for r in R); H=150+len(R)*70+rows*(th+G)+40
W=Image.new('RGB',(LW+4*(tw+G)+40,H),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 2 · MESA DE VOTO · ALTERAÇÕES · 2 OPÇÕES',font=FT,fill=(25,41,109))
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
W.save('../Blueprint_V2_opcoes.jpg',quality=88); print(W.size)

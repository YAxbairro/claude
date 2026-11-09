exec(open('bp_v1_saoeles3.py').read().split("R=[")[0].replace("by_{o}","bh_{o}"))
R=[('0:06 · "O ACESSO E A PERMANÊNCIA ... SÃO RESTRITOS" · 3 NOVOS CONCEITOS DE ÍCONE (o texto fica igual)',[
   ('Opção 1 · Planta da sala de voto','vista de cima: mesa com os 4 membros, urna e cabine; pessoas chegam à entrada e no "são restritos" a entrada fecha a vermelho e ficam de fora','T1,R2,L9,F2,K1,C1,X1,H1',[7.4,8.6,9.4,10.0]),
   ('Opção 2 · Urna e mão de pare','o boletim entra na urna; uma pessoa aproxima-se e no "são restritos" surge a mão vermelha de pare entre ela e a urna','T1,R2,L9,F2,K1,C1,X1,H2',[7.4,8.6,9.4,10.0]),
   ('Opção 3 · Só entra quem tem credencial','quatro pessoas à porta da assembleia; no "são restritos" três ficam a cinzento de fora e só a credenciada entra, com visto','T1,R2,L9,F2,K1,C1,X1,H3',[7.4,8.6,9.4,10.0])])]
tw,th=560,315; LW=400; G=24
rows=sum(len(r[1]) for r in R); H=150+len(R)*70+rows*(th+G)+40
W=Image.new('RGB',(LW+4*(tw+G)+40,H),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 1 · ACESSO E PERMANÊNCIA · SÃO RESTRITOS',font=FT,fill=(25,41,109))
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
W.save('../Blueprint_V1_sao_restritos.jpg',quality=88); print(W.size)

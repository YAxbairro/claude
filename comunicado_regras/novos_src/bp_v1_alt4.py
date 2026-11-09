exec(open('bp_v1_saoeles3.py').read().split("R=[")[0])
R=[('ALTERAÇÕES PEDIDAS',[
   ('São elas · vermelho','"SÃO ELES" passa a "SÃO ELAS"; a parte vermelha fica vermelha (sem rosa)','T1,R2,L9,F2,K1,C1,X1',[24.2,29.4,33.0,34.8]),
   ('Fotos · faixas','0:51 "deve exigir e verificar" em faixas, sem tapar caras · 0:58 foto da observadora no "antes de autorizar" · 1:12 volta ao grafismo sem foto','T1,R2,L9,F2,K1,C1,X1',[50.2,51.5,59.5,73.6])]),
 ('0:46 · RELÓGIO JUNTO DO TEXTO',[
   ('Opção 1 · Por baixo','relógio debaixo do texto','T1,R2,L9,F2,K1,C1,X1',[43.5,46.5]),
   ('Opção 2 · Ao lado','relógio à esquerda do texto','T1,R2,L9,F2,K2,C1,X1',[43.5,46.5])]),
 ('0:53 · CREDENCIAIS E CRACHÁS EMITIDOS PELA CNE (sem foto nem nome reais)',[
   ('Opção 1 · Três crachás','observador, delegado e staff caem em leque; carimbo CNE no "emitidos pela CNE"','T1,R2,L9,F2,K1,C1,X1',[53.6,54.4,55.4,55.9]),
   ('Opção 2 · Um crachá','um crachá grande desce no cordão e balança; carimbo CNE no "emitidos pela CNE"','T1,R2,L9,F2,K1,C2,X1',[53.6,54.4,55.4,55.9])])]
tw,th=560,315; LW=400; G=24
rows=sum(len(r[1]) for r in R); H=150+len(R)*70+rows*(th+G)+40
W=Image.new('RGB',(LW+4*(tw+G)+40,H),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 1 · ACESSO E PERMANÊNCIA · ALTERAÇÕES (4)',font=FT,fill=(25,41,109))
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
W.save('../Blueprint_V1_alteracoes4.jpg',quality=88); print(W.size)

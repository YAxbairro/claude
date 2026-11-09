exec(open('bp_v1_saoeles3.py').read().split("R=[")[0])
R=[('0:18 · "PODEM ENTRAR E PERMANECER" · TEXTO NA PAREDE LIVRE + ANIMAÇÃO',[
   ('Opção 1 · Porta','ícone de porta desenha-se e a seta entra, ao lado do texto','T1,R2,L9,F2,K1,C1,X1,A1',[18.0,18.8,20.0,22.0]),
   ('Opção 2 · Selo','documento com selo de validação desenha-se ao lado do texto','T1,R2,L9,F2,K1,C1,X1,A2',[18.0,18.8,20.0,22.0]),
   ('Opção 3 · Câmara','a foto desliza devagar de um lado ao outro; sublinhado vermelho no fim','T1,R2,L9,F2,K1,C1,X1,A3',[18.0,18.8,20.0,22.0])]),
 ('CORREÇÕES',[('Urna e CNI','urna da sala sem a mancha (0:18) · cartão (CNI) desfocado só dentro do cartão, bordas nítidas (0:50)','T1,R2,L9,F2,K1,C1,X1,A1',[19.5,51.0])])]
tw,th=560,315; LW=400; G=24
rows=sum(len(r[1]) for r in R); H=150+len(R)*70+rows*(th+G)+40
W=Image.new('RGB',(LW+4*(tw+G)+40,H),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 1 · ACESSO E PERMANÊNCIA · PODEM ENTRAR',font=FT,fill=(25,41,109))
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
W.save('../Blueprint_V1_podem_entrar.jpg',quality=88); print(W.size)

from PIL import Image,ImageDraw,ImageFont
F='/home/user/claude/comunicado_regras/realista_src/fonts/'
f=lambda s,b=8:ImageFont.truetype(F+('M800.ttf' if b==8 else 'M700.ttf'),s)
R=[('1','EDITORIAL REVISTA','Papel creme, títulos com serifa elegante, imagem dentro de um arco, filetes finos e numeração tipo revista. Calmo e sofisticado.'),
   ('2','POP AUTOCOLANTE','Amarelo + ciano + vermelho, letra condensada gigante, imagem com contorno branco tipo autocolante, selo e meio-tom. Jovem e energético.'),
   ('3','BENTO GRID','Mosaico de cartões arredondados: título, número e frase em blocos separados. Moderno, tipo app. Muito limpo.'),
   ('4','NEON NOITE','Fundo escuro roxo, anel com degradê ciano→magenta, brilho à volta da imagem. Impactante, tipo evento.'),
   ('5','CABO VERDE','Azul da bandeira, faixas branca/vermelha, anel de 10 estrelas amarelas, letra grossa. Identidade nacional forte.')]
tw,th=760,428; gap=24; lw=360; top=190; BW=lw+2*tw+3*gap; BH=top+5*(th+44)+20
bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd); NAVY=(25,41,109); RED=(212,41,46)
d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
d.text((40,62),'5 DIREÇÕES DE ARTE · com imagens estilo Pixar',font=f(44),fill='white',anchor='ls')
d.text((40,108),'Cada linha muda tipografia, cores, grafismo e tratamento da imagem · silhueta = onde entra a imagem Pixar',font=f(22,7),fill=(190,205,240),anchor='ls')
for c,lb in enumerate(['7H DA MANHÃ  (imagem P2-03)','MEMBROS DA MESA  (imagem P1-03)']): d.text((lw+gap+c*(tw+gap),top-14),lb,font=f(22),fill=NAVY,anchor='ls')
for r,(n,nm,desc) in enumerate(R):
    y=top+r*(th+44); d.text((30,y+60),f'VARIAÇÃO {n}',font=f(36),fill=RED,anchor='ls'); d.text((30,y+100),nm,font=f(24),fill=NAVY,anchor='ls')
    line='';yy=y+145
    for wd in desc.split():
        if f(20,7).getlength(line+' '+wd)>310: d.text((30,yy),line,font=f(20,7),fill=(60,70,100),anchor='ls'); yy+=30; line=wd
        else: line=(line+' '+wd).strip()
    d.text((30,yy),line,font=f(20,7),fill=(60,70,100),anchor='ls')
    for c in range(2): bd.paste(Image.open(f'f{n}_{c}.jpg').resize((tw,th),Image.LANCZOS),(lw+gap+c*(tw+gap),y))
bd.save('../../Blueprint_5_direcoes_arte.jpg',quality=88)

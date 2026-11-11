import sys,os
R='/home/user/claude/comunicado_regras/realista_src'; sys.path.insert(0,R); os.chdir(R)
from eng import *
from PIL import Image,ImageDraw,ImageFont
SP='/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad'
F=lambda s:ImageFont.truetype(R+'/fonts/M800.ttf',s); F7=lambda s:ImageFont.truetype(R+'/fonts/M700.ttf',s)
def dep(n,bg=None):
    b=Image.open(f'{SP}/cl/{bg}').convert('RGBA') if bg else Image.new('RGBA',(1920,1080),(0,0,0,255))
    b.alpha_composite(Image.open(f'{SP}/hf/{n:05d}.png').convert('RGBA'))
    if bg is None or True: logos(b) if bg is None else None
    return b.convert('RGB'),f'{n/25:.2f}s'
def ant(t): return Image.open(f'{SP}/cl/ex_{t}.png').convert('RGB'),f'{float(t):.2f}s'
ROWS=[('0:03 · ELEGER O PRESIDENTE DA REPÚBLICA','Entra o Palácio Presidencial só com "O PRESIDENTE DA REPÚBLICA"; os textos anteriores saem antes do corte',[ant('4.4')],[dep(97),dep(125)]),
('0:19 · ANTES DE SAIR DE CASA (era preto)','Grafismo: casa → caminho → assembleia de voto com pin; texto só desta parte',[ant('22.0')],[dep(505),dep(530),dep(558)]),
('0:36 · FORNECIMENTO E CONSUMO (era preto)','Grafismo: garrafa serve o copo e o sinal de proibido risca; a foto do bar fica só com "DE BEBIDAS ALCOÓLICAS"',[ant('37.0'),ant('39.4')],[dep(915),dep(930),dep(950),dep(978,'clean_39.4.png')]),
('0:47 · ESTACIONAR VEÍCULOS (era preto)','Grafismo: o carro estaciona à frente da assembleia e é riscado; a foto da rua fica só com "EM FRENTE AOS EDIFÍCIOS ONDE FUNCIONAM AS ASSEMBLEIAS DE VOTO"',[ant('48.5'),ant('52.9')],[dep(1208),dep(1222),dep(1245),dep(1260,'clean_52.9.png'),dep(1300,'clean_52.9.png'),dep(1330,'clean_52.9.png')]),
('0:54 · CABINE DE VOTO + DISPOSITIVOS (era preto)','Azul e mochila: "É TAMBÉM PROIBIDO / ENTRAR NA CABINE DE VOTO / COM TELEMÓVEIS / MÁQUINAS FOTOGRÁFICAS"; grafismo: telemóvel, câmara e tablet riscados com "OU OUTROS DISPOSITIVOS DE CAPTAÇÃO DE IMAGEM"',[ant('58.5'),ant('61.0')],[dep(1380,'clean_55.8.png'),dep(1440,'clean_59.5.png'),dep(1478,'clean_59.5.png'),dep(1512),dep(1535),dep(1548)])]
tw,th=448,252;G=16;LW=440;MX=8
Wd=LW+MX*(tw+G)+30; Hd=200+len(ROWS)*(th+166)+20
B=Image.new('RGB',(Wd,Hd),(244,246,250)); d=ImageDraw.Draw(B)
d.text((30,40),'APELO / PROIBIÇÕES · O QUE VAI MUDAR',font=F(64),fill=(25,41,109))
d.text((30,120),'Canto inferior direito livre para a linguagem gestual  ·  textos novos: faixa cresce da esquerda e o texto sobe dentro dela',font=F7(30),fill=(212,41,46))
y=190
for title,desc,A,D in ROWS:
    d.text((30,y),title,font=F(38),fill=(212,41,46)); y+=56
    words=desc.split();line='';yy=y+70
    for w in words:
        if d.textlength(line+' '+w,font=F7(24))>LW-50: d.text((30,yy),line.strip(),font=F7(24),fill=(70,80,110)); yy+=32; line=''
        line+=' '+w
    d.text((30,yy),line.strip(),font=F7(24),fill=(70,80,110))
    x=LW; ty=y+60
    for k,(im,lb) in enumerate(A+D):
        B.paste(im.resize((tw,th)),(x,ty)); tag='ANTES' if k<len(A) else 'DEPOIS'
        col=(120,120,120) if k<len(A) else (25,41,109)
        d.rectangle((x,ty-34,x+tw,ty-4),fill=col); d.text((x+10,ty-32),f'{tag} · {lb}',font=F(22),fill=(255,255,255))
        x+=tw+G
    y+=th+110
B.save('/home/user/claude/comunicado_regras/Blueprint_Proibicoes_alteracoes.jpg',quality=88); print(B.size)

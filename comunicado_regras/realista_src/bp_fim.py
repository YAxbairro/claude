import sys,os
R='/home/user/claude/comunicado_regras/realista_src'; os.chdir(R); sys.path.insert(0,R)
from PIL import Image,ImageDraw,ImageFont
SP='/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad'
F=lambda s:ImageFont.truetype(R+'/fonts/M800.ttf',s); F7=lambda s:ImageFont.truetype(R+'/fonts/M700.ttf',s)
def fr(d,n,bgc=(60,60,60)):
    b=Image.new('RGBA',(1920,1080),bgc+(255,)); b.alpha_composite(Image.open(f'{SP}/{d}/{n:05d}.png').convert('RGBA')); return b.convert('RGB'),f'{n/25:.2f}s'
ROWS=[('CORREÇÃO · 0:05 ENTRADA DAS ILHAS','As ilhas entram no sítio, uma a uma, sem saltos nem piscar (antes cresciam soltas e apareciam em sítios errados)',[fr('mf',n) for n in (130,134,138,146)]),
('CORREÇÃO · 0:19 E 0:47 FLASH NAS TRANSIÇÕES','Saiu o frame azul cheio que aparecia antes da cortina; agora o painel entra limpo da direita',[fr('pf',n) for n in (478,479,482,485)]),
('1:11 · NO DIA 15 DE NOVEMBRO','Calendário cai e as folhas viram 13 → 14 → 15 com a voz',[fr('ef',n) for n in (1782,1798,1830)]),
('1:13 · PARTICIPE / VOTE LIVREMENTE / RESPEITE AS REGRAS','A câmara desliza; a urna do logo das Presidenciais desenha-se e o boletim do logo cai na ranhura',[fr('ef',n) for n in (1848,1895,1925)]),
('1:16 · PARA MAIS INFORMAÇÕES CONSULTE WWW.CNE.CV','Janela do browser: o rato clica, o endereço escreve-se ao ritmo da voz e o site da CNE carrega',[fr('ef',n) for n in (1968,2003,2040)]),
('1:21 · COMISSÃO NACIONAL DE ELEIÇÕES · CADA VOTO CONTA','Logo da CNE em círculo com ondas; boletins voam para dentro; no "o teu também" entra o boletim vermelho',[fr('ef',n) for n in (2060,2095,2122)]),
('1:26 · PELA DEMOCRACIA, PARTICIPA → CARTÃO FINAL','Íris abre para o cartão claro; o logo monta-se peça a peça (urna, boletim, texto) e entra a data',[fr('ef',n) for n in (2145,2200,2210,2265)])]
tw,th=560,315;G=18;LW=480;MX=4
Wd=LW+MX*(tw+G)+30;Hd=170+len(ROWS)*(th+130)
B=Image.new('RGB',(Wd,Hd),(244,246,250));d=ImageDraw.Draw(B)
d.text((30,40),'APELO / PROIBIÇÕES · FIM REFEITO E CORREÇÕES',font=F(60),fill=(25,41,109))
d.text((30,115),'Fundo azul vivo com partículas e anéis em movimento contínuo · câmara desliza entre cenas (sem cortes secos) · canto do intérprete livre',font=F7(28),fill=(212,41,46))
y=180
for title,desc,FR in ROWS:
    d.text((30,y),title,font=F(34),fill=(212,41,46)); y+=52
    words=desc.split();line='';yy=y+10
    for w in words:
        if d.textlength(line+' '+w,font=F7(24))>LW-50: d.text((30,yy),line.strip(),font=F7(24),fill=(70,80,110)); yy+=32; line=''
        line+=' '+w
    d.text((30,yy),line.strip(),font=F7(24),fill=(70,80,110))
    x=LW
    for im,lb in FR:
        B.paste(im.resize((tw,th)),(x,y)); d.text((x+10,y+th-34),lb,font=F(24),fill=(255,255,0),stroke_width=2,stroke_fill=(0,0,0)); x+=tw+G
    y+=th+78
B.save('/home/user/claude/comunicado_regras/Blueprint_Proibicoes_fim_refeito.jpg',quality=88);print(B.size)

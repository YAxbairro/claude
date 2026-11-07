# Blueprint do V2 a partir de frames do motor (render.js TEST)
from PIL import Image,ImageDraw,ImageFont
S='/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad/'
F=ImageFont.truetype('../realista_src/fonts/M800.ttf',28); F2=ImageFont.truetype('../realista_src/fonts/M700.ttf',21); FT=ImageFont.truetype('../realista_src/fonts/M800.ttf',46)
it=[(0.4,'1 · B · 0–3,6s','ATENÇÃO grande e encolhe · foto ao fundo'),(3.25,'1 · B','Texto animado sobre a foto (clara)'),(7.85,'2 · A · 3,6–8,2s','Palácio em azul no fundo'),
(10.85,'3a · B · 8,2–11,2s','Crachá sem quadro · nova foto ao fundo'),(16.15,'3b · B · 11,2–16,5s','Foto da mesa'),(19.55,'4a · A · 16,5–19,9s','Código Eleitoral (o teu livro)'),
(23.25,'4b · A · 19,9–23,6s','Documento + carimbo cai em "obrigatório"'),(28.75,'5 · B · 23,6–29,1s','Relógio até às 7h · escola ao fundo'),(32.55,'6a · A · 29,1–32,9s','Notas reais + 3.500$00 a contar'),
(36.15,'6b · A · 32,9–36,5s','Prato e talheres + 1.000$00 a contar'),(41.15,'7 · B · 36,5–41,5s','Presidente em destaque + 500$00'),(47.45,'8 · A · 41,5–47,8s','Suplentes: pessoas trocam de lugar'),
(52.85,'9 · B · 47,8–53,2s','Banco → cartão (transferência)'),(55.45,'10 · A · 53,2–55,8s','Texto animado (sem imagem)'),(63.91,'11 · B · 55,8–64,3s','Fecho')]
tw,th=640,360; c=3; W=Image.new('RGB',(c*tw+4*36,150+5*(th+92)),(244,246,250)); d=ImageDraw.Draw(W)
d.text((36,44),'VÍDEO 2 · MEMBROS DAS MESAS · BLUEPRINT',font=FT,fill=(25,41,109))
for i,(t,a,b) in enumerate(it):
    x=36+(i%c)*(tw+36); y=150+(i//c)*(th+92)
    W.paste(Image.open(f'{S}_t{t}.jpg').resize((tw,th)),(x,y+62)); d.text((x,y),a,font=F,fill=(212,41,46)); d.text((x,y+34),b,font=F2,fill=(25,41,109))
W.save('../Blueprint_V2_AB.jpg',quality=90)

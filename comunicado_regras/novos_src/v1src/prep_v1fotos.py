# Fotos novas do V1: rótulos de urna, crachás e coletes desfocados; versões moldura (cor) e fundo (A azul / B claro)
import sys; sys.path.insert(0,'v2src')
from PIL import Image, ImageFilter, ImageOps
from prep_fotos import blur, washB, tintA
D='motion/v2/'
B={'pres':[((64,827),(407,849),(424,1173),(83,1135)),(1750,830,1860,1010)],
   'extra':[(0,510,95,680)],
   'autoriza':[((728,853),(882,851),(878,960),(866,1060),(730,1060)),(1630,740,1730,840)],
   'exigir':[((826,930),(944,936),(938,1012),(820,1004)),(1595,845,1665,1000),(1530,670,1590,715)],
   'tempo':[((1149,769),(1474,788),(1479,1088),(1160,1057)),(1770,925,1835,1005)]}
import sys as _s
ONLY=_s.argv[1:]
for n,bx in B.items():
    if ONLY and n not in ONLY: continue
    f=blur(ImageOps.exif_transpose(Image.open(f'v1src/{n}.jpg')).convert('RGB'),bx)
    f.resize((1200,800),Image.LANCZOS).save(D+f'fr_{n}.jpg',quality=92)
    g=f.resize((1920,1280),Image.LANCZOS)
    (tintA(g) if n=='tempo' else washB(g)).save(D+f'bg_v1{n}.png')
print('ok')

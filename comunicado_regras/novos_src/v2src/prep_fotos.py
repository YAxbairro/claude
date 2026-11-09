# Fotos novas do V2 (s13, s38, suplentes): rótulos/crachás desfocados + tratamento A (azul) ou B (claro)
import numpy as np
from PIL import Image, ImageFilter
D='motion/v2/'
def blur(im,boxes):
    for b in boxes:
        r=im.crop(b).filter(ImageFilter.GaussianBlur(14)); im.paste(r,b[:2])
    return im
def washB(im):  # mesmo tratamento das fotos B do V2
    a=np.asarray(im.convert('RGB')).astype(np.float32); g=(a@[.3,.59,.11])[...,None].repeat(3,2)
    rgb=g*.55+a*.15+np.array((22,75,140))*.3
    return Image.fromarray(np.dstack([rgb.clip(0,255),np.full(a.shape[:2],.5*255)]).astype('uint8'),'RGBA')
def tintA(im,col=(20,110,190),k=.65):  # mesmo tratamento das fotos A do V1
    a=np.asarray(im.convert('RGB')).astype(np.float32); g=(a@[.3,.59,.11])[...,None]
    rgb=g/255*255*(1-k)+np.array(col)*k*(g/255*1.3)
    return Image.fromarray(np.dstack([rgb.clip(0,255),np.full(a.shape[:2],.55*255)]).astype('uint8'),'RGBA')
# s13: mesa de frente (urna e crachás desfocados); escala 1.25 -> caras em baixo, parede livre em cima
f=blur(Image.open('v2src/foto_13.jpg').convert('RGB'),[(235,810,380,1020),(785,795,865,860),(1155,925,1245,980),(1015,990,1130,1025),(1530,1005,1615,1050)])
f=f.resize((2500,1666),Image.LANCZOS).crop((290,0,2210,1280)); washB(f).save(D+'bg_13_foto1.png')
# s13 (nova foto, escolhida): sala inteira, urna e crachás desfocados; escala 1.25 -> mesa em baixo, texto livre em cima
f=blur(Image.open('v2src/foto_13b.jpg').convert('RGB'),[(808,685,898,745),(440,700,480,760),(580,700,620,760),(950,690,990,740)])
f=f.resize((2500,1666),Image.LANCZOS).crop((400,0,2320,1280)); washB(f).save(D+'bg_13.png')
# s38: mesa a trabalhar
f=Image.open('v2src/foto_38.jpg').convert('RGB').resize((1920,1280),Image.LANCZOS); washB(f).save(D+'bg_38.png')
# suplentes: sala (urna desfocada)
f=blur(Image.open('v2src/foto_suplentes.jpg').convert('RGB'),[(1262,668,1378,778)])
fs=f.resize((2400,1600),Image.LANCZOS).crop((240,320,2160,1600)); tintA(fs).save(D+'bg_sup.png')
f.crop((600,280,1575,1333)).resize((1000,1080),Image.LANCZOS).save(D+'panel_sup.jpg',quality=92)
# encaixe mínimo (foto inteira na largura, 1920x1280)
f=blur(Image.open('v2src/foto_13b.jpg').convert('RGB'),[(808,685,898,745),(440,700,480,760),(580,700,620,760),(950,690,990,740)])
washB(f.resize((1920,1280),Image.LANCZOS)).save(D+'bg_13m.png')
f=blur(Image.open('v2src/foto_suplentes.jpg').convert('RGB'),[(1262,668,1378,778)])
tintA(f.resize((1920,1280),Image.LANCZOS)).save(D+'bg_supm.png')
f=blur(Image.open('v2src/foto_13b.jpg').convert('RGB'),[(808,685,898,745),(440,700,480,760),(580,700,620,760),(950,690,990,740)])
tintA(f.resize((1920,1280),Image.LANCZOS)).save(D+'bg_13a.png')
f=blur(Image.open('v2src/foto_13b.jpg').convert('RGB'),[(808,685,898,745),(440,700,480,760),(580,700,620,760),(950,690,990,740)])
f.resize((1000,667),Image.LANCZOS).save(D+'panel_13.jpg',quality=92)
print('ok')

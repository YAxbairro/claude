# Fotos novas do V2 (s13, s38, suplentes): rótulos/crachás desfocados + tratamento A (azul) ou B (claro)
import numpy as np
from PIL import Image, ImageFilter
D='motion/v2/'
import sys as _s; _s.path.insert(0,'v1src')
from textblur import textblur, TB
def blur(im,boxes):
    # rótulo "em branco": pinta a área com a cor clara do próprio papel e suaviza a borda (sem texto legível, sem retângulo duro)
    import numpy as np
    from PIL import ImageDraw
    for b in boxes:
        Q=None
        if isinstance(b[0],tuple): Q=b; xs=[q[0] for q in Q]; ys=[q[1] for q in Q]; b=(min(xs),min(ys),max(xs),max(ys))
        x0,y0,x1,y1=b; a=np.asarray(im.crop(b)).reshape(-1,3); L=a.sum(1)
        if Q: a=a[L>=np.percentile(L,40)]; L=a.sum(1)
        col=tuple(int(v) for v in np.median(a[L>=np.percentile(L,70)],0))
        p=4; pat=Image.new('RGB',(x1-x0,y1-y0),col)
        g=im.crop(b).filter(ImageFilter.GaussianBlur(40)); pat=Image.blend(pat,g,.25)
        m=Image.new('L',pat.size,0); (ImageDraw.Draw(m).polygon([(q[0]-x0,q[1]-y0) for q in Q],fill=255) if Q else ImageDraw.Draw(m).rounded_rectangle((p,p,pat.width-p,pat.height-p),radius=6,fill=255)); m=m.filter(ImageFilter.GaussianBlur(3))
        im.paste(pat,(x0,y0),m)
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
f=textblur(Image.open('v2src/foto_13b.jpg'),TB['foto_13b'])
f=f.resize((2500,1666),Image.LANCZOS).crop((400,0,2320,1280)); washB(f).save(D+'bg_13.png')
# s38: mesa a trabalhar
f=Image.open('v2src/foto_38.jpg').convert('RGB').resize((1920,1280),Image.LANCZOS); washB(f).save(D+'bg_38.png')
# suplentes: sala (urna desfocada)
f=textblur(Image.open('v2src/foto_suplentes.jpg'),TB['foto_suplentes'])
fs=f.resize((2400,1600),Image.LANCZOS).crop((240,320,2160,1600)); tintA(fs).save(D+'bg_sup.png')
f.crop((600,280,1575,1333)).resize((1000,1080),Image.LANCZOS).save(D+'panel_sup.jpg',quality=92)
# encaixe mínimo (foto inteira na largura, 1920x1280)
f=textblur(Image.open('v2src/foto_13b.jpg'),TB['foto_13b'])
washB(f.resize((1920,1280),Image.LANCZOS)).save(D+'bg_13m.png')
f=textblur(Image.open('v2src/foto_suplentes.jpg'),TB['foto_suplentes'])
tintA(f.resize((1920,1280),Image.LANCZOS)).save(D+'bg_supm.png')
f=textblur(Image.open('v2src/foto_13b.jpg'),TB['foto_13b'])
tintA(f.resize((1920,1280),Image.LANCZOS)).save(D+'bg_13a.png')
f=textblur(Image.open('v2src/foto_13b.jpg'),TB['foto_13b'])
f.resize((1000,667),Image.LANCZOS).save(D+'panel_13.jpg',quality=92)
# abertura: foto já limpa enviada pelo cliente (sem qualquer desfoque)
f=Image.open('v2src/foto_1_clean.webp').convert('RGB').resize((1920,1280),Image.LANCZOS); washB(f).save(D+'bg_1a.png')
if __name__=="__main__": print("ok")

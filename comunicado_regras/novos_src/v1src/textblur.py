# Desfoca só as letras legíveis (código da urna), o objeto fica intacto: sem quadrados, sem manchas
from PIL import Image, ImageDraw, ImageFilter
def textblur(im,polys,r=7):
    im=im.convert('RGB')
    for P in polys:
        rr=r; ff=4
        if isinstance(P,dict): rr=P['r']; ff=P.get('f',4); P=P['p']
        if len(P)==4 and not isinstance(P[0],tuple): P=[(P[0],P[1]),(P[2],P[1]),(P[2],P[3]),(P[0],P[3])]
        m=Image.new('L',im.size,0); ImageDraw.Draw(m).polygon(P,fill=255)
        if ff<=1:  # desfoque só com píxeis de dentro (bordas do objeto ficam nítidas, nada de fora entra)
            import numpy as np
            a=np.asarray(im).astype(np.float32); mk=(np.asarray(m)>0).astype(np.float32)
            num=np.asarray(Image.fromarray(np.clip(a*mk[...,None],0,255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rr))).astype(np.float32)
            den=np.asarray(Image.fromarray((mk*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(rr))).astype(np.float32)[...,None]/255
            bl=np.clip(num/np.maximum(den,1e-3),0,255); al=np.asarray(m.filter(ImageFilter.GaussianBlur(.7))).astype(np.float32)[...,None]/255
            im=Image.fromarray((a*(1-al)+bl*al).astype(np.uint8)); continue
        bl=im.filter(ImageFilter.GaussianBlur(rr))
        im=Image.composite(bl,im,m.filter(ImageFilter.GaussianBlur(ff)))
    return im
TB={'exigir':[{'r':6,'f':1,'p':[(624,701),(711,719),(709,746),(683,749),(680,755),(620,747)]}],'foto_13b':[(820,716,890,740)],'foto_suplentes':[(1276,712,1367,743)],
    'pres':[{'r':16,'p':[(76,925),(410,962),(410,1082),(76,1048)]}],'tempo':[{'r':16,'p':(1152,870,1466,976)}],'extra':[(0,580,62,625)]}

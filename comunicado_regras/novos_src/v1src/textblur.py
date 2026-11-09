# Desfoca só as letras legíveis (código da urna), o objeto fica intacto: sem quadrados, sem manchas
from PIL import Image, ImageDraw, ImageFilter
def textblur(im,polys,r=7):
    im=im.convert('RGB')
    for P in polys:
        rr=r
        if isinstance(P,dict): rr=P['r']; P=P['p']
        if len(P)==4 and not isinstance(P[0],tuple): P=[(P[0],P[1]),(P[2],P[1]),(P[2],P[3]),(P[0],P[3])]
        bl=im.filter(ImageFilter.GaussianBlur(rr)); m=Image.new('L',im.size,0); ImageDraw.Draw(m).polygon(P,fill=255)
        im=Image.composite(bl,im,m.filter(ImageFilter.GaussianBlur(4)))
    return im
TB={'foto_13b':[(820,716,890,740)],'foto_suplentes':[(1276,712,1367,743)],
    'pres':[{'r':16,'p':[(76,925),(410,962),(410,1082),(76,1048)]}],'tempo':[{'r':16,'p':(1152,870,1466,976)}],'extra':[(0,580,62,625)]}

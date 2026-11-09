# Limpa cartões/etiquetas: cartão liso com o tom e a sombra do original (sem mancha nem desfoque)
from PIL import Image, ImageDraw, ImageFilter
import numpy as np
def clean(im,polys):
    im=im.convert('RGB'); a=np.asarray(im).astype(np.float32)
    big=np.asarray(im.filter(ImageFilter.GaussianBlur(14))).astype(np.float32)
    for P in polys:
        m=Image.new('L',im.size,0); ImageDraw.Draw(m).polygon(P,fill=255)
        mk=np.asarray(m)>0; med=np.median(a[mk],axis=0)
        lum=big.mean(2); dl=lum-lum[mk].mean()
        fill=np.clip(med[None,None,:]+0.5*dl[...,None],0,255)
        # grão fino para não parecer plástico
        fill=fill+np.random.default_rng(1).normal(0,1.6,fill.shape)
        al=np.asarray(m.filter(ImageFilter.GaussianBlur(.8))).astype(np.float32)[...,None]/255
        a=a*(1-al)+fill*al
    return Image.fromarray(np.clip(a,0,255).astype(np.uint8))

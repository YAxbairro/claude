import cv2, numpy as np, sys
from PIL import Image
base=cv2.imread('clean.jpg').astype(np.float32); H,W=base.shape[:2]
L=cv2.cvtColor(base.astype(np.uint8),cv2.COLOR_BGR2GRAY).astype(np.float32)
def place(out,png,cx,top,width):
    art=Image.open(png).convert('RGBA'); h=int(art.size[1]*width/art.size[0]); art=art.resize((width,h),Image.LANCZOS)
    a=np.array(art).astype(np.float32); rgb=a[:,:,2::-1]; al=a[:,:,3:4]/255
    x0=int(cx-width/2); y0=top; reg=out[y0:y0+h,x0:x0+width]
    sh=L[y0:y0+h,x0:x0+width]; white=np.percentile(sh,96)
    shade=np.clip(sh/white,0,1.05)[...,None]
    # warp: tiny displacement from fabric shading gradient for realism
    gx=cv2.Sobel(cv2.GaussianBlur(sh,(0,0),6),cv2.CV_32F,1,0); gy=cv2.Sobel(cv2.GaussianBlur(sh,(0,0),6),cv2.CV_32F,0,1)
    mx,my=np.meshgrid(np.arange(width,dtype=np.float32),np.arange(h,dtype=np.float32))
    k=0.06; rgbw=cv2.remap(rgb,mx+gx*k,my+gy*k,cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
    alw=cv2.remap(al,mx+gx*k,my+gy*k,cv2.INTER_LINEAR)[...,None]
    ink=rgbw*shade*0.97   # tinta absorve a luz como o tecido
    out[y0:y0+h,x0:x0+width]=reg*(1-alw*0.97)+ink*alw*0.97
    return out
front,back,dst=sys.argv[1:4]
out=base.copy()
out=place(out,front,cx=660,top=330,width=600)
out=place(out,back,cx=1812,top=300,width=600)
cv2.imwrite(dst,np.clip(out,0,255).astype(np.uint8),[cv2.IMWRITE_JPEG_QUALITY,93])

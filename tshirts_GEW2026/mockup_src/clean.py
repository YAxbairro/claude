import cv2, numpy as np
img=cv2.imread('base.jpg'); H,W=img.shape[:2]
gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY).astype(np.float32)
sat=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)[:,:,1].astype(np.float32)
s=4; gs=cv2.resize(gray,(W//s,H//s),interpolation=cv2.INTER_AREA)
bg=cv2.resize(cv2.medianBlur(gs.astype(np.uint8),51).astype(np.float32),(W,H))
m=(((bg-gray)>9)|(sat>22)).astype(np.uint8)
box=np.zeros_like(m); 
for x0,y0,x1,y1 in [(320,400,1030,1330),(1500,320,2110,1040)]: box[y0:y1,x0:x1]=1
m=m*box
m=cv2.dilate(m*255,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(25,25)))
cv2.imwrite('mask.png',m)
# inpaint at reduced scale for smooth fabric, then upsample
sm=cv2.resize(img,(W//2,H//2),interpolation=cv2.INTER_AREA); mm=cv2.resize(m,(W//2,H//2),interpolation=cv2.INTER_NEAREST)
ip=cv2.inpaint(sm,mm,21,cv2.INPAINT_TELEA)
ip=cv2.resize(ip,(W,H),interpolation=cv2.INTER_CUBIC).astype(np.float32)
# neutralize any tint in filled zones (fabric is white): use luminance with fabric's average tint
fab=img[(m==0)&(box==1)].reshape(-1,3).astype(np.float32); tint=fab.mean(0)/fab.mean()
L=cv2.cvtColor(ip.astype(np.uint8),cv2.COLOR_BGR2GRAY).astype(np.float32)
L=cv2.GaussianBlur(L,(0,0),3)
neutral=np.clip(L[...,None]*tint[None,None,:],0,255)
rng=np.random.default_rng(1); grain=cv2.GaussianBlur(rng.normal(0,2.2,(H,W)).astype(np.float32),(0,0),0.7)
neutral=np.clip(neutral+grain[...,None]*0.8,0,255)
a=cv2.GaussianBlur(m.astype(np.float32)/255,(0,0),5)[...,None]
out=img.astype(np.float32)*(1-a)+neutral*a
cv2.imwrite('clean.jpg',out.astype(np.uint8),[cv2.IMWRITE_JPEG_QUALITY,95])

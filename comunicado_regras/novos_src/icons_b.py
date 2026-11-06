from PIL import ImageDraw
def icon_solid(b,kind,cx,cy,s,fg,acc,cut):
    d=ImageDraw.Draw(b); k=s/100; P=lambda x,y:(cx+(x-50)*k,cy+(y-50)*k)
    def R(x0,y0,x1,y1,c=fg,r=6): d.rounded_rectangle((*P(x0,y0),*P(x1,y1)),int(r*k),fill=c)
    def E(x0,y0,x1,y1,c=fg): d.ellipse((*P(x0,y0),*P(x1,y1)),fill=c)
    def G(pts,c=fg): d.polygon([P(*p) for p in pts],fill=c)
    def Ln(pts,c=cut,w=7): d.line([P(*p) for p in pts],fill=c,width=int(w*k),joint='curve')
    if kind=='porta': R(24,6,76,96); E(38,30,56,48,cut); R(44,44,50,64,cut,1)
    if kind=='mesa': E(37,4,63,30); d.pieslice((*P(26,34),*P(74,82)),180,360,fill=fg); R(4,58,96,68,acc,2); R(12,66,20,96); R(80,66,88,96)
    if kind=='urna':
        G([(36,10),(62,4),(68,50),(42,56)],acc); Ln([(46,22),(58,36)]); Ln([(58,20),(47,38)])
        R(12,44,88,94); R(30,44,70,50,cut,1)
    if kind=='pessoas':
        for ox in (-26,26): E(38+ox,10,62+ox,34); d.pieslice((*P(28+ox,38),*P(72+ox,86)),180,360,fill=fg)
        E(36,26,64,54,acc); d.pieslice((*P(22,58),*P(78,114)),180,360,fill=acc)
    if kind=='cracha': R(20,20,80,96); R(40,6,60,26); E(36,32,64,60,cut); R(30,68,70,75,cut,2); R(30,81,60,88,cut,2); E(42,38,58,54,acc)
    if kind=='globo':
        E(6,6,94,94); Ln([(6,50),(94,50)],w=5); Ln([(14,28),(86,28)],w=5); Ln([(14,72),(86,72)],w=5)
        d.arc((*P(30,6),*P(70,94)),0,360,fill=cut,width=int(5*k)); E(60,60,96,96,acc); Ln([(70,78),(76,84),(88,70)],w=5)
    if kind=='saida': R(8,6,56,96); E(42,48,50,56,cut); R(48,44,82,56,acc,2); G([(78,30),(98,50),(78,70)],acc)
    if kind=='relogio': E(6,6,94,94); Ln([(50,20),(50,50),(70,62)],w=8); E(44,44,56,56,acc)
    if kind=='notas': R(4,24,96,80); E(36,34,64,70,cut); E(43,42,57,62,acc); E(10,30,20,40,cut); E(80,64,90,74,cut)
    if kind=='banco':
        G([(4,36),(50,6),(96,36)],acc); R(6,86,94,96,fg,2)
        for x in (14,34,56,76): R(x,40,x+10,82,fg,2)
    if kind=='aviso': G([(50,6),(98,92),(2,92)],acc); R(45,34,55,66,cut,3); E(44,72,56,84,cut)
    if kind=='tel': R(26,2,74,98,fg,10); R(32,12,68,80,cut,2); E(44,84,56,94,acc)

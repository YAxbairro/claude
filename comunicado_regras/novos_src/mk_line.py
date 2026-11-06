# Gera as ilustrações em traço (estilo 2) para o motor motion: motion/img2/<kind>.png (640x640) + logos brancos
import sys; sys.argv=['x']
import bp_graf as g, bp_var as v
from PIL import Image
import os; D=os.path.dirname(os.path.abspath(__file__))+'/motion/img2'; os.makedirs(D,exist_ok=True)
M={'urna':'urna','porta':'porta','cracha':'cracha','mesa':'mesa4','pessoas':'pessoas','globo':'globo','saida':'saida',
   'relogio':'relogio0','notas':'notas','tel':'tel','aviso':'aviso','banco':'banco'}
for k,n in M.items():
    im=v.lineart(g.ILL_img(n,1000)); im.resize((640,640),Image.LANCZOS).save(f'{D}/{k}.png')
g.rs(g.LEw,240).save(D+'/le_w.png'); g.rs(g.LCw,160).save(D+'/lc_w.png')
# folha de contacto
sh=Image.new('RGB',(6*320,2*320),(14,22,70))
for i,k in enumerate(M): sh.paste(Image.open(f'{D}/{k}.png').resize((320,320)),((i%6)*320,(i//6)*320),Image.open(f'{D}/{k}.png').resize((320,320)))
sh.save('/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad/la.jpg'); print('ok')

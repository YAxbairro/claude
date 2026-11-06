# Storyboard do VÍDEO 1 por "batidas" (2–5s cada), ao ritmo da locução: cenas longas divididas para não parecer PowerPoint.
import sys,os; OUT=sys.argv[1] if len(sys.argv)>1 else ''; HERE=os.path.dirname(os.path.abspath(__file__)); sys.argv=['x','']
sys.path.insert(0,HERE); import bp_v1all as V
from PIL import Image,ImageDraw
f=V.f; NAVY,RED=V.NAVY,V.RED
B=[ # (cena, estilo, tempo, ícones, kicker, linhas, movimento)
 ('1','A','0–3,5s',['FOTO'],None,None,'Urna sobe do fundo; mão desce e o boletim entra; texto palavra a palavra'),
 ('2','A','3,5–5,6s',['PALACIO'],None,None,'Palácio aparece com zoom lento (push-in); faixa da bandeira desenha-se'),
 ('3','B','5,6–10,5s',['porta'],'ATENÇÃO',[('O ACESSO E A PERMANÊNCIA','n'),('NAS ASSEMBLEIAS DE VOTO','n'),('SÃO RESTRITOS','h')],'Porta desenha-se em traço; "SÃO RESTRITOS" bate com escala + cadeado fecha'),
 ('4a','A','10,5–15s',['CODIGO'],'CÓDIGO ELEITORAL',[('A CNE','hn'),('RECORDA','r')],'Livro abre-se; logo CNE entra; texto grande'),
 ('4b','A','15–17,6s',['cracha'],None,[('APENAS PESSOAS','n'),('LEGALMENTE','hn'),('AUTORIZADAS','r')],'Livro desliza para fora, crachá entra a rodar; caixas crescem da esquerda'),
 ('4c','A','17,6–22,4s',['ASSEMBLEIA'],None,[('PODEM ENTRAR','b'),('E PERMANECER','r'),('NO LOCAL DE VOTO','n')],'Porta abre-se com visto vermelho; câmara aproxima'),
 ('5a','B','22,4–24,6s',('LISTA',0),'SÃO ELES',None,'Cartão 1 entra grande (foco) — "membros da mesa"'),
 ('5b','B','25–28,3s',('LISTA',1),'SÃO ELES',None,'Cartão 1 recua, cartão 2 entra em foco'),
 ('5c','B','28,3–29,9s',('LISTA',2),'SÃO ELES',None,'Cartão 3 em foco — candidatos e mandatários'),
 ('5d','B','29,9–33,8s',('LISTA',3),'SÃO ELES',None,'Cartão 4 em foco — delegados'),
 ('5e','B','34–35,4s',('LISTA',None),'SÃO ELES',None,'Os 4 alinham-se; "NOS TERMOS DA LEI" sublinha'),
 ('6a','A','35,4–39,5s',['OBS1'],'OBSERVADORES INTERNACIONAIS',[('DEVIDAMENTE','n'),('CREDENCIADOS','hn')],'Globo roda; crachá cai e encaixa'),
 ('6b','A','39,5–41,7s',['OBS2'],None,[('TAMBÉM PODERÃO','n'),('SER ADMITIDOS','hn')],'Transição rápida (slide); porta abre'),
 ('6c','A','41,7–48,2s',['OBS3'],None,[('SÓ O TEMPO','hn'),('ESTRITAMENTE NECESSÁRIO','b'),('À OBSERVAÇÃO','r')],'Ampulheta vira; areia cai durante a frase'),
 ('7a','B','48,2–53s',['mesa4pres'],'PRESIDENTE DA MESA',[('DEVE EXIGIR','b'),('E VERIFICAR','r')],'Mesa entra azul; presidente acende a vermelho'),
 ('7b','B','53–56s',['lupa'],None,[('CREDENCIAIS E CRACHÁS','b'),('EMITIDOS PELA CNE','h')],'Lupa passa sobre o crachá; visto aparece'),
 ('7c','B','56–62,6s',['porta','info'],'ANTES DE',[('AUTORIZAR A PERMANÊNCIA','b'),('OU PRESTAR INFORMAÇÕES','r')],'Dois ícones entram em sequência com cada frase'),
 ('8a','A','62,6–66,8s',['relogio'],'ELEITORES',[('SÓ PODEM PERMANECER','n'),('O TEMPO','hn'),('NECESSÁRIO','b')],'Ponteiros do relógio rodam rápido'),
 ('8b','A','66,8–69,3s',['FOTO2'],None,[('PARA EXERCER','n'),('O SEU DIREITO','b'),('DE VOTO','h')],'Relógio encolhe e dá lugar à urna (foto); boletim entra'),
 ('9','B','69,3–75s',['mesa4pres','saida'],'PRESIDENTE DA MESA',[('DETERMINA A SAÍDA','b'),('DE TODAS AS PESSOAS','n'),('NÃO AUTORIZADAS','h')],'Seta da saída empurra; "NÃO AUTORIZADAS" treme'),
 ('10a','A','75–79s',['saida'],'CARO ELEITOR',[('APÓS VOTAR','n'),('ABANDONA O LOCAL','h')],'Porta: seta sai do ecrã'),
 ('10b','A','79–82,2s',['mesa4row'],None,[('RESPEITA AS ORIENTAÇÕES','n'),('DOS MEMBROS','hn'),('DA MESA','r')],'Mesa entra; 4 membros acendem um a um'),
 ('11','B','82,2–88,7s','FIM',None,None,'Logos entram; frase final palavra a palavra')]
if __name__=='__main__':
    tw,th=560,315; gap=24; top=190; cols=4; rh=th+88
    rows=(len(B)+cols-1)//cols; BW=gap+cols*(tw+gap); BH=top+rows*rh+10
    bd=Image.new('RGB',(BW,BH),(236,239,245)); d=ImageDraw.Draw(bd)
    d.rectangle((0,0,BW,130),fill=NAVY); d.rectangle((0,130,BW,138),fill=RED)
    d.text((36,62),'VÍDEO 1 · STORYBOARD POR BATIDAS (ritmo da locução)',font=f(42),fill='white',anchor='ls')
    d.text((36,108),f'{len(B)} batidas de 2–6s em vez de 11 cenas paradas · cada batida muda ícone/texto/câmara · A = azul · B = claro · canto da intérprete livre',font=f(21,7),fill=(190,205,240),anchor='ls')
    def wrap(t,ft,mw):
        out=[];l=''
        for w in t.split():
            if ft.getlength(l+' '+w)>mw: out.append(l); l=w
            else: l=(l+' '+w).strip()
        return out+[l]
    for i,(n,st,tt,ics,kick,lines,mov) in enumerate(B):
        x=gap+(i%cols)*(tw+gap); y=top+(i//cols)*rh
        d.text((x,y-12),f'{n} · {tt} · {st}',font=f(21),fill=RED if st=='A' else NAVY,anchor='ls')
        im=V.scene((st,tt,ics,kick,lines or [])).convert('RGB').resize((tw,th),Image.LANCZOS); bd.paste(im,(x,y))
        for j,l in enumerate(wrap('▶ '+mov,f(17,7),tw)[:2]): d.text((x,y+th+24+j*22),l,font=f(17,7),fill=(60,70,100),anchor='ls')
    bd.save(OUT,quality=88); print('ok',bd.size)
    
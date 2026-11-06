# Exporta cada vídeo como sequência do Premiere Pro (FCP7 XML / xmeml v4):
# cada elemento = PNG transparente 1920x1080 já na posição final, numa faixa própria, com fades de opacidade.
# Uso: python3 xml_export.py <V1|V2> <pasta_saida>
import sys,os,shutil,unicodedata
from xml.sax.saxutils import escape
import novos as N
from PIL import Image
FPS=25
V=N.VIDS[sys.argv[1]]; OUT=sys.argv[2]; A=OUT+'/assets'; os.makedirs(A,exist_ok=True)
NAME={'V1':'CNE_Acesso_Permanencia','V2':'CNE_Membros_Mesas'}[sys.argv[1]]
DUR=int(round(V['dur']*FPS))
clips=[]   # (track_name, png, start_f, end_f, fade_in, fade_out)
def fr(t): return int(round(t*FPS))
def save(im,name):
    p=f'{A}/{name}.png'; im.save(p,optimize=True); return os.path.basename(p)
def empty(): return Image.new('RGBA',(N.W,N.H),(0,0,0,0))
# ---- base ----
bg=N.background(0); clips.append(('V01 Fundo',save(bg,'00_fundo'),0,DUR,0,0))
end_t=[s['t'][0] for s in V['scenes'] if s.get('end')][0]
lg=empty(); lg.alpha_composite(N.LC_S,(60,40)); lg.alpha_composite(N.LN_S,(1560,60))
clips.append(('V02 Logos cantos',save(lg,'01_logos_cantos'),0,fr(end_t+.4),0,10))
# ---- captura dos elementos de cada cena ----
orig=(N.put_circle,N.put_text,N.put_pill)
for si,sc in enumerate(V['scenes']):
    t0,t1=sc['t']; t1=min(t1,V['dur']); e1=fr(t1); cnt={'circ':0,'pill':0,'txt':0}
    def rec(kind,draw,tin,label):
        cnt[kind]+=1; im=empty(); draw(im)
        slug=''.join(c if c.isalnum() else '_' for c in unicodedata.normalize('NFKD',label).encode('ascii','ignore').decode())[:28]
        png=save(im,f'{si+1:02d}_{kind}{cnt[kind]}_{slug}')
        trk={'circ':'Ícone','pill':'Etiqueta','txt':'Texto'}[kind]
        clips.append((f'{trk} {cnt[kind]}',png,fr(max(tin,t0)),e1,10,0 if sc.get('end') else 9))
    N.put_circle=lambda b,k,cx,cy,r,t,tin,a=1: rec('circ',lambda im:orig[0](im,k,cx,cy,r,tin+9,tin),tin,k)
    N.put_text=lambda b,text,sz,col,cx,base,t,tin,a=1,bold=8,under=None: rec('txt',lambda im:orig[1](im,text,sz,col,cx,base,tin+9,tin,1,bold,under),tin,text)
    N.put_pill=lambda b,text,cx,y,t,tin,a=1: rec('pill',lambda im:orig[2](im,text,cx,y,tin+9,tin),tin,text)
    if sc.get('end'):
        im=empty(); im.alpha_composite(N.LC_B,(int(960-N.LC_B.width/2),130)); clips.append(('Logo final 1',save(im,f'{si+1:02d}_logo_eleicao'),fr(t0),DUR,15,0))
        im=empty(); im.alpha_composite(N.LN_B,(int(960-N.LN_B.width/2),540)); clips.append(('Logo final 2',save(im,f'{si+1:02d}_logo_cne'),fr(t0+.4),DUR,15,0))
        y=790
        for text,role,tin in sc['lines']:
            N.put_text(None,text,{'n':46,'r':58}[role],N.COL[role],960,y,0,tin,1,8 if role!='n' else 7,N.UND.get(role)); y+=78
    else:
        N.scene_draw(N.Image.new('RGBA',(N.W,N.H)),sc,t1-0.36 if t1-t0>1 else t0+.5)
N.put_circle,N.put_text,N.put_pill=orig
# ---- faixas: ordem de empilhamento ----
order=['V01 Fundo','V02 Logos cantos']+[f'Ícone {i}' for i in range(1,5)]+['Etiqueta 1']+[f'Texto {i}' for i in range(1,14)]+['Logo final 1','Logo final 2']
tracks=[o for o in order if any(c[0]==o for c in clips)]
shutil.copy(V['audio'],OUT+'/locucao.mp3')
# ---- XML ----
def rate(): return '<rate><timebase>25</timebase><ntsc>FALSE</ntsc></rate>'
def opacity(n,fi,fo):
    k=[]
    if fi: k+= [(0,0),(fi,100)]
    if fo: k+= [(n-fo,100),(n,0)]
    if not k: return ''
    kf=''.join(f'<keyframe><when>{w}</when><value>{v}</value></keyframe>' for w,v in k)
    return ('<filter><effect><name>Opacity</name><effectid>opacity</effectid><effectcategory>motion</effectcategory>'
            '<effecttype>motion</effecttype><mediatype>video</mediatype><parameter authoringApp="PremierePro"><parameterid>opacity</parameterid>'
            f'<name>Opacity</name><valuemin>0</valuemin><valuemax>100</valuemax><value>100</value>{kf}</parameter></effect></filter>')
vid=[]; cid=0
for tn in tracks:
    items=''
    for (trk,png,s,e,fi,fo) in sorted([c for c in clips if c[0]==tn],key=lambda c:c[2]):
        cid+=1; n=e-s
        items+=(f'<clipitem id="clipitem-{cid}"><name>{escape(png)}</name><enabled>TRUE</enabled><duration>{n}</duration>{rate()}'
                f'<start>{s}</start><end>{e}</end><in>0</in><out>{n}</out><alphatype>straight</alphatype>'
                f'<file id="file-{cid}"><name>{escape(png)}</name><pathurl>assets/{escape(png)}</pathurl>{rate()}<duration>{n}</duration>'
                f'<media><video><samplecharacteristics><width>1920</width><height>1080</height></samplecharacteristics></video></media></file>'
                f'{opacity(n,fi,fo)}</clipitem>')
    vid.append(f'<track><enabled>TRUE</enabled><locked>FALSE</locked>{items}</track>')
aud=(f'<track><clipitem id="clipitem-audio"><name>locucao.mp3</name><enabled>TRUE</enabled><duration>{DUR}</duration>{rate()}'
     f'<start>0</start><end>{DUR}</end><in>0</in><out>{DUR}</out><file id="file-audio"><name>locucao.mp3</name><pathurl>locucao.mp3</pathurl>{rate()}'
     f'<duration>{DUR}</duration><media><audio><samplecharacteristics><depth>16</depth><samplerate>48000</samplerate></samplecharacteristics><channelcount>2</channelcount></audio></media></file>'
     '<sourcetrack><mediatype>audio</mediatype><trackindex>1</trackindex></sourcetrack></clipitem></track>')
xml=('<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE xmeml>\n<xmeml version="4"><sequence id="seq-1">'
     f'<name>{NAME}</name><duration>{DUR}</duration>{rate()}<timecode>{rate()}<string>00:00:00:00</string><frame>0</frame><displayformat>NDF</displayformat></timecode>'
     '<media><video><format><samplecharacteristics>'+rate()+'<width>1920</width><height>1080</height><pixelaspectratio>square</pixelaspectratio>'
     '<fielddominance>none</fielddominance></samplecharacteristics></format>'+''.join(vid)+'</video>'
     '<audio><numOutputChannels>2</numOutputChannels>'+aud+'</audio></media></sequence></xmeml>\n')
open(f'{OUT}/{NAME}.xml','w',encoding='utf-8').write(xml)
print('ok',OUT,len(clips),'clips',len(tracks),'faixas')

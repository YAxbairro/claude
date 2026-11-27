import re,html,urllib.parse,subprocess
def search(q, year="", series="1", rows=40):
    url="https://boe.incv.cv/Bulletins?"+urllib.parse.urlencode({"Query":q,"Series":series,"Year":year,"rows":rows})
    t=subprocess.run(["curl","-s","-m","40",url],capture_output=True,text=True).stdout
    res=[];seen=set()
    for m in re.finditer(r'href="/Bulletins/View\?id=(\d+)"[^>]*>(.*?)</a>',t,re.S):
        i=m.group(1); tl=re.sub(r'\s+',' ',re.sub('<[^>]+>','',html.unescape(m.group(2)))).strip()
        if i not in seen: seen.add(i); res.append((i,tl))
    return res

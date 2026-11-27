import subprocess, sys, re
def pages(pdf):
    out=subprocess.run(["pdfinfo",pdf],capture_output=True,text=True).stdout
    n=int(re.search(r"Pages:\s+(\d+)",out).group(1)); m=re.search(r"Page size:\s+([\d.]+) x ([\d.]+)",out)
    return n,float(m.group(1)),float(m.group(2))
def extract(pdf, out):
    n,w,h=pages(pdf); parts=[]
    for p in range(1,n+1):
        for x0 in (0, w/2):
            r=subprocess.run(["pdftotext","-f",str(p),"-l",str(p),"-x",str(int(x0)),"-y","0","-W",str(int(w/2)),"-H",str(int(h)),pdf,"-"],capture_output=True,text=True)
            parts.append(r.stdout)
    open(out,"w",encoding="utf-8").write("\n".join(parts))
if __name__=="__main__":
    for pdf in sys.argv[1:]:
        o=pdf[:-4]+".2col.txt"; extract(pdf,o); print(o)

"""Copy search.js into index.html between the /*<search.js>*/ markers (the page must be self-contained)."""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
root = os.path.join(here, "..")
js = open(os.path.join(root, "search.js"), encoding="utf-8").read()
p = os.path.join(root, "index.html")
html = open(p, encoding="utf-8").read()
html = re.sub(r"/\*<search\.js>\*/.*?/\*</search\.js>\*/", lambda m: "/*<search.js>*/\n" + js + "/*</search.js>*/", html, flags=re.S)
open(p, "w", encoding="utf-8").write(html)
print("synced", len(js), "bytes")

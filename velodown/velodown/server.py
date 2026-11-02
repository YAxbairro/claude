"""Local web UI + JSON API (stdlib only). Listens on 127.0.0.1 by default."""
from __future__ import annotations

import json
import os
import re
import sys
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from .manager import Manager

STATIC = os.path.join(os.path.dirname(__file__), "static")


def make_handler(mgr: Manager):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *a):
            pass

        def _send(self, code: int, body, ctype="application/json"):
            data = body if isinstance(body, bytes) else json.dumps(body).encode()
            self.send_response(code)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(data)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(data)

        def _body(self) -> dict:
            n = int(self.headers.get("Content-Length") or 0)
            return json.loads(self.rfile.read(n) or b"{}") if n else {}

        def do_GET(self):
            if self.path in ("/", "/index.html"):
                with open(os.path.join(STATIC, "index.html"), "rb") as f:
                    return self._send(200, f.read(), "text/html; charset=utf-8")
            if self.path == "/api/ping":
                return self._send(200, {"app": "VeloDown", "ok": True})
            if self.path == "/api/state":
                return self._send(200, mgr.state())
            self._send(404, {"error": "not found"})

        def do_POST(self):
            # Reject cross-site requests: only same-origin pages may drive the API.
            origin = self.headers.get("Origin")
            if origin and not re.match(r"^(https?://(127\.0\.0\.1|localhost)(:\d+)?|(chrome|moz)-extension://[\w-]+)$", origin):
                return self._send(403, {"error": "forbidden origin"})
            try:
                b = self._body()
                if self.path == "/api/downloads":
                    urls = [u.strip() for u in str(b.get("url", "")).split() if u.strip()]
                    if not urls or not all(re.match(r"^(https?|ftp)://", u) for u in urls):
                        return self._send(400, {"error": "Enter one or more http(s) URLs"})
                    hdrs = b.get("headers") if isinstance(b.get("headers"), dict) else None
                    out = [mgr.add(u, int(b.get("connections", 8)), bool(b.get("start", True)),
                                   b.get("filename") or None, b.get("category") or None,
                                   hdrs, b.get("kind") or None) for u in urls]
                    return self._send(200, {"added": out})
                m = re.match(r"^/api/downloads/(\w+)/(pause|resume|delete)$", self.path)
                if m:
                    jid, action = m.groups()
                    if jid not in mgr.jobs:
                        return self._send(404, {"error": "unknown download"})
                    if action == "delete":
                        mgr.delete(jid, bool(b.get("remove_file")))
                    else:
                        getattr(mgr, action)(jid)
                    return self._send(200, {"ok": True})
                if self.path == "/api/quit":
                    self._send(200, {"ok": True})
                    mgr.stop_queue()
                    threading.Thread(target=self.server.shutdown, daemon=True).start()
                    return
                if self.path == "/api/queue/start":
                    mgr.start_queue()
                    return self._send(200, {"ok": True})
                if self.path == "/api/queue/stop":
                    mgr.stop_queue()
                    return self._send(200, {"ok": True})
                if self.path == "/api/settings":
                    kw = {k: b[k] for k in ("max_concurrent", "speed_limit") if k in b}
                    if "schedule_at" in b:
                        kw["schedule_at"] = b["schedule_at"]
                    return self._send(200, mgr.settings(**kw))
                self._send(404, {"error": "not found"})
            except Exception as e:
                self._send(500, {"error": f"{type(e).__name__}: {e}"})

    return Handler


def serve(root: str | None = None, host: str = "127.0.0.1", port: int = 8787,
          open_browser: bool = False) -> None:
    import webbrowser
    url = f"http://{host}:{port}"
    try:
        httpd = ThreadingHTTPServer((host, port), None)
    except OSError:
        # Already running (e.g. double-clicked twice): just show the open instance.
        if open_browser:
            webbrowser.open(url)
        return
    mgr = Manager(root)
    httpd.RequestHandlerClass = make_handler(mgr)
    if sys.stdout:  # windowless builds have no console
        print(f"VeloDown a correr em {url}  (ficheiros em {mgr.root})")
    if open_browser:
        threading.Timer(0.5, webbrowser.open, (url,)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        mgr.stop_queue()

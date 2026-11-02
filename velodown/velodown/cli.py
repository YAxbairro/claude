"""Command line: `python -m velodown get URL` or `python -m velodown serve`."""
from __future__ import annotations

import argparse
import os
import sys
import time

from .engine import Download, TokenBucket, probe


def human(n: float) -> str:
    for unit in ("B", "KB", "MB", "GB", "TB"):
        if abs(n) < 1024:
            return f"{n:.1f} {unit}"
        n /= 1024
    return f"{n:.1f} PB"


def cmd_get(a) -> int:
    dest = a.output
    if not dest or os.path.isdir(dest):
        dest = os.path.join(dest or ".", probe(a.url).filename)
    dl = Download(a.url, dest, a.connections, TokenBucket(a.limit * 1024))
    dl.start()
    try:
        while dl.status == "running":
            s = dl.snapshot()
            pct = f"{100 * s['downloaded'] / s['size']:5.1f}%" if s["size"] else "  ?  "
            sys.stdout.write(f"\r{pct}  {human(s['downloaded'])} / {human(s['size'] or 0)}  "
                             f"{human(s['speed'])}/s  [{s['connections']} conn]   ")
            sys.stdout.flush()
            time.sleep(0.3)
    except KeyboardInterrupt:
        dl.pause()
        print("\nPaused. Run the same command again to resume.")
        return 130
    dl.wait()
    print()
    if dl.status == "done":
        print(f"Saved {dest}")
        return 0
    print(f"Failed: {dl.error}")
    return 1


def main(argv=None) -> int:
    p = argparse.ArgumentParser(prog="velodown", description="Segmented download manager")
    sub = p.add_subparsers(dest="cmd", required=True)
    g = sub.add_parser("get", help="download one URL")
    g.add_argument("url")
    g.add_argument("-o", "--output", help="file or directory")
    g.add_argument("-n", "--connections", type=int, default=8)
    g.add_argument("--limit", type=int, default=0, help="speed limit in KB/s (0 = none)")
    s = sub.add_parser("serve", help="start the web interface")
    s.add_argument("--root", help="download folder (default ~/Downloads/VeloDown)")
    s.add_argument("--port", type=int, default=8787)
    a = p.parse_args(argv)
    if a.cmd == "get":
        return cmd_get(a)
    from .server import serve
    serve(a.root, port=a.port)
    return 0

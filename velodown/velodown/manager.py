"""Download queue: concurrency limit, categories, scheduler and persistence."""
from __future__ import annotations

import json
import os
import shutil
import re
import threading
import time
import uuid

from .engine import Download, TokenBucket, probe
from .hls import HlsDownload, is_hls

CATEGORIES = {
    "Compressed": {"zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso"},
    "Documents": {"pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "epub", "odt"},
    "Music": {"mp3", "flac", "wav", "aac", "ogg", "m4a", "opus"},
    "Programs": {"exe", "msi", "dmg", "pkg", "deb", "rpm", "appimage", "apk"},
    "Video": {"mp4", "mkv", "avi", "mov", "webm", "wmv", "flv", "m4v"},
}


def _safe_name(name: str) -> str:
    name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", os.path.basename(name)).strip(" .")
    return name[:180] or "download.bin"


def category_for(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return next((c for c, exts in CATEGORIES.items() if ext in exts), "General")


class Manager:
    def __init__(self, root: str | None = None, max_concurrent: int = 3):
        self.root = os.path.abspath(root or os.path.expanduser("~/Downloads/VeloDown"))
        self.db_path = os.path.join(self.root, ".velodown.json")
        self.max_concurrent = max_concurrent
        self.limiter = TokenBucket(0)
        self.jobs: dict[str, dict] = {}
        self.queue_running = False
        self.schedule_at: float | None = None
        self._lock = threading.RLock()
        os.makedirs(self.root, exist_ok=True)
        self._load()
        threading.Thread(target=self._loop, daemon=True).start()

    # ---- persistence ---------------------------------------------------
    def _load(self) -> None:
        if not os.path.exists(self.db_path):
            return
        with open(self.db_path) as f:
            data = json.load(f)
        self.max_concurrent = data.get("max_concurrent", self.max_concurrent)
        self.limiter.rate = data.get("speed_limit", 0)
        for j in data.get("jobs", []):
            j["dl"] = self._make_dl(j)
            if j["status"] in ("running", "queued"):
                j["status"] = "paused"
            j["dl"].status = j["status"]
            self.jobs[j["id"]] = j

    def save(self) -> None:
        with self._lock:
            jobs = [{k: v for k, v in j.items() if k != "dl"} | {"status": j["dl"].status}
                    for j in self.jobs.values()]
            data = {"max_concurrent": self.max_concurrent, "speed_limit": self.limiter.rate, "jobs": jobs}
        tmp = self.db_path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f, indent=1)
        os.replace(tmp, self.db_path)

    def _make_dl(self, j: dict):
        cls = HlsDownload if j.get("kind") == "hls" else Download
        return cls(j["url"], j["path"], j["connections"], self.limiter, headers=j.get("headers"))

    # ---- API -----------------------------------------------------------
    def add(self, url: str, connections: int = 8, start: bool = True,
            filename: str | None = None, category: str | None = None,
            headers: dict | None = None, kind: str | None = None) -> dict:
        headers = {k: v for k, v in (headers or {}).items()
                   if k.lower() in ("cookie", "referer", "user-agent", "authorization") and v}
        kind = kind or ("hls" if is_hls(url) else "file")
        size = None
        if kind == "hls":
            filename = _safe_name(filename or "video")
            if not os.path.splitext(filename)[1]:
                filename += ".mp4"
        elif not filename:
            try:
                info = probe(url, headers)
                filename, size = info.filename, info.size
            except Exception:
                filename = os.path.basename(url.split("?")[0]) or "download.bin"
        filename = _safe_name(filename)
        category = category or category_for(filename)
        folder = os.path.join(self.root, category)
        os.makedirs(folder, exist_ok=True)
        path = self._unique(os.path.join(folder, os.path.basename(filename)))
        j = {"id": uuid.uuid4().hex[:10], "url": url, "filename": os.path.basename(path), "path": path,
             "category": category, "connections": connections, "added": time.time(), "size": size,
             "status": "queued", "headers": headers, "kind": kind}
        j["dl"] = self._make_dl(j)
        j["dl"].size = size
        j["dl"].status = "queued" if start else "paused"
        with self._lock:
            self.jobs[j["id"]] = j
        self.save()
        if start:
            self._pump()
        return self.view(j)

    def _unique(self, path: str) -> str:
        base, ext = os.path.splitext(path)
        taken = {j["path"] for j in self.jobs.values()}
        i, p = 1, path
        while p in taken or os.path.exists(p):
            p, i = f"{base} ({i}){ext}", i + 1
        return p

    def pause(self, jid: str) -> None:
        self.jobs[jid]["dl"].pause()
        self.save()

    def resume(self, jid: str) -> None:
        dl = self.jobs[jid]["dl"]
        if dl.status in ("paused", "error"):
            dl.status = "queued"
            self._pump(force=jid)

    def delete(self, jid: str, remove_file: bool = False) -> None:
        with self._lock:
            j = self.jobs.pop(jid)
        j["dl"].pause()
        for p in ([j["path"]] if remove_file else []) + [j["path"] + ".part", j["path"] + ".part.json"]:
            if os.path.exists(p):
                os.remove(p)
        shutil.rmtree(j["path"] + ".parts", ignore_errors=True)
        self.save()

    def start_queue(self) -> None:
        self.queue_running = True
        for j in self.jobs.values():
            if j["dl"].status == "paused":
                j["dl"].status = "queued"
        self._pump()

    def stop_queue(self) -> None:
        self.queue_running = False
        for j in list(self.jobs.values()):
            if j["dl"].status == "running":
                j["dl"].pause()
            elif j["dl"].status == "queued":
                j["dl"].status = "paused"
        self.save()

    def settings(self, max_concurrent: int | None = None, speed_limit: int | None = None,
                 schedule_at: float | None | str = "keep") -> dict:
        if max_concurrent:
            self.max_concurrent = max(1, int(max_concurrent))
        if speed_limit is not None:
            self.limiter.rate = max(0, int(speed_limit))
        if schedule_at != "keep":
            self.schedule_at = schedule_at
        self.save()
        self._pump()
        return self.state()

    # ---- scheduling ----------------------------------------------------
    def _pump(self, force: str | None = None) -> None:
        with self._lock:
            running = [j for j in self.jobs.values() if j["dl"].status == "running"]
            if force:
                self.jobs[force]["dl"].start()
                running.append(self.jobs[force])
            for j in sorted(self.jobs.values(), key=lambda j: j["added"]):
                if len(running) >= self.max_concurrent:
                    break
                if j["dl"].status == "queued":
                    j["dl"].start()
                    running.append(j)

    def _loop(self) -> None:
        last = {}
        while True:
            time.sleep(0.5)
            if self.schedule_at and time.time() >= self.schedule_at:
                self.schedule_at = None
                self.start_queue()
            changed = False
            for jid, j in list(self.jobs.items()):
                st = j["dl"].status
                if last.get(jid) != st:
                    last[jid], changed = st, True
            if changed:
                self.save()
                self._pump()

    # ---- views ---------------------------------------------------------
    def view(self, j: dict) -> dict:
        if j["dl"].dest != j["path"]:  # HLS output may be renamed to .ts
            j["path"], j["filename"] = j["dl"].dest, os.path.basename(j["dl"].dest)
        snap = j["dl"].snapshot()
        size = snap["size"] or j.get("size")
        return {k: j[k] for k in ("id", "url", "filename", "path", "category", "added")} | snap | {
            "size": size, "kind": j.get("kind", "file")}

    def state(self) -> dict:
        with self._lock:
            jobs = [self.view(j) for j in sorted(self.jobs.values(), key=lambda j: j["added"])]
        return {"downloads": jobs, "max_concurrent": self.max_concurrent,
                "speed_limit": self.limiter.rate, "schedule_at": self.schedule_at,
                "queue_running": self.queue_running, "root": self.root,
                "categories": ["All", *CATEGORIES, "General"]}

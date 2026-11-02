"""HLS (.m3u8) stream downloader: picks the best quality, fetches pieces in
parallel, resumes from already-saved pieces, joins them and (if ffmpeg exists)
remuxes to MP4. AES-128 streams are decrypted when the `cryptography` package
is installed; DRM-protected streams (SAMPLE-AES, Widevine, FairPlay) are refused.
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import threading
import time
import urllib.parse

from .engine import CHUNK, TokenBucket, _request


def _attrs(line: str) -> dict:
    return {k: v.strip('"') for k, v in re.findall(r'([A-Z0-9-]+)=("[^"]*"|[^,]*)', line)}


def is_hls(url: str, content_type: str = "") -> bool:
    return ".m3u8" in urllib.parse.urlparse(url).path.lower() or "mpegurl" in content_type.lower()


class HlsDownload:
    def __init__(self, url: str, dest: str, connections: int = 8,
                 limiter: TokenBucket | None = None, retries: int = 5, headers: dict | None = None):
        self.url, self.dest = url, dest
        self.connections = max(1, connections)
        self.limiter = limiter or TokenBucket(0)
        self.retries, self.headers = retries, dict(headers or {})
        self.status, self.error, self.speed = "queued", None, 0.0
        self.size: int | None = None
        self.segments: list = []
        self.ranges = True
        self._pieces: list[dict] = []
        self._done_bytes = 0
        self._done_count = 0
        self._active = 0
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._samples: list[tuple[float, int]] = []

    @property
    def work_dir(self) -> str:
        return self.dest + ".parts"

    @property
    def downloaded(self) -> int:
        return self._done_bytes

    # ---- control (same interface as engine.Download) --------------------
    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self.error, self.status = None, "running"
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def pause(self) -> None:
        self._stop.set()
        if self._thread:
            self._thread.join()
        if self.status == "running":
            self.status = "paused"

    def wait(self, timeout: float | None = None) -> None:
        if self._thread:
            self._thread.join(timeout)

    def snapshot(self) -> dict:
        total = len(self._pieces)
        est = None
        if self.status == "done":
            est = self.size
        elif self._done_count and total:
            est = int(self._done_bytes / self._done_count * total)
        return {"size": est, "downloaded": self._done_bytes, "speed": round(self.speed),
                "status": self.status, "error": self.error, "connections": self._active,
                "segments": [], "pieces": [self._done_count, total]}

    # ---- playlist ------------------------------------------------------
    def _get(self, url: str) -> bytes:
        with _request(url, self.headers) as r:
            return r.read()

    def _resolve(self) -> None:
        url = self.url
        text = self._get(url).decode("utf-8", "replace")
        if "#EXT-X-STREAM-INF" in text:  # master playlist: take highest bandwidth
            best, bw, lines = None, -1, text.splitlines()
            for i, line in enumerate(lines):
                if line.startswith("#EXT-X-STREAM-INF"):
                    b = int(_attrs(line).get("BANDWIDTH", "0") or 0)
                    nxt = next((l for l in lines[i + 1:] if l.strip() and not l.startswith("#")), None)
                    if nxt and b > bw:
                        best, bw = urllib.parse.urljoin(url, nxt.strip()), b
            if not best:
                raise RuntimeError("playlist sem variantes")
            url = best
            text = self._get(url).decode("utf-8", "replace")
        key, seq, pieces, init = None, 0, [], None
        for line in text.splitlines():
            line = line.strip()
            if line.startswith("#EXT-X-MEDIA-SEQUENCE"):
                seq = int(line.split(":", 1)[1])
            elif line.startswith("#EXT-X-KEY"):
                a = _attrs(line)
                method = a.get("METHOD", "NONE")
                if method == "NONE":
                    key = None
                elif method == "AES-128":
                    key = {"uri": urllib.parse.urljoin(url, a["URI"]), "iv": a.get("IV")}
                else:
                    raise RuntimeError(f"stream protegido por DRM ({method}); não é possível descarregar")
            elif line.startswith("#EXT-X-MAP"):
                init = urllib.parse.urljoin(url, _attrs(line)["URI"])
            elif line and not line.startswith("#"):
                pieces.append({"url": urllib.parse.urljoin(url, line), "seq": seq, "key": key})
                seq += 1
        if not pieces:
            raise RuntimeError("playlist vazia")
        if init:
            pieces.insert(0, {"url": init, "seq": -1, "key": None})
        self._pieces = pieces

    # ---- work ----------------------------------------------------------
    def _run(self) -> None:
        try:
            os.makedirs(self.work_dir, exist_ok=True)
            self._resolve()
            self._keys: dict[str, bytes] = {}
            self._done_bytes = self._done_count = 0
            for i, _ in enumerate(self._pieces):
                p = self._piece_path(i)
                if os.path.exists(p):
                    self._done_bytes += os.path.getsize(p)
                    self._done_count += 1
            todo = [i for i in range(len(self._pieces)) if not os.path.exists(self._piece_path(i))]
            it = iter(todo)
            lock = threading.Lock()

            def worker():
                with self._lock:
                    self._active += 1
                try:
                    while not self._stop.is_set():
                        with lock:
                            i = next(it, None)
                        if i is None:
                            return
                        self._fetch(i)
                except Exception as e:
                    self.error = self.error or f"{type(e).__name__}: {e}"
                    self._stop.set()
                finally:
                    with self._lock:
                        self._active -= 1

            threads = [threading.Thread(target=worker, daemon=True) for _ in range(self.connections)]
            for t in threads:
                t.start()
            while any(t.is_alive() for t in threads):
                time.sleep(0.2)
                self._tick()
            if self.error:
                raise RuntimeError(self.error)
            if self._stop.is_set():
                self.status = "paused"
                return
            self._join()
            self.status, self.speed = "done", 0
        except Exception as e:
            self.status, self.error = "error", self.error or f"{type(e).__name__}: {e}"

    def _piece_path(self, i: int) -> str:
        return os.path.join(self.work_dir, f"{i:06d}.ts")

    def _key(self, uri: str) -> bytes:
        if uri not in self._keys:
            self._keys[uri] = self._get(uri)
        return self._keys[uri]

    def _fetch(self, i: int) -> None:
        piece = self._pieces[i]
        for attempt in range(self.retries + 1):
            try:
                buf = bytearray()
                with _request(piece["url"], self.headers) as r:
                    while not self._stop.is_set():
                        data = r.read(CHUNK)
                        if not data:
                            break
                        self.limiter.consume(len(data), self._stop)
                        buf += data
                        with self._lock:
                            self._done_bytes += len(data)
                if self._stop.is_set():
                    with self._lock:
                        self._done_bytes -= len(buf)
                    return
                data = bytes(buf)
                if piece["key"]:
                    data = self._decrypt(data, piece)
                tmp = self._piece_path(i) + ".tmp"
                with open(tmp, "wb") as f:
                    f.write(data)
                os.replace(tmp, self._piece_path(i))
                with self._lock:
                    self._done_count += 1
                return
            except OSError:
                with self._lock:
                    self._done_bytes -= len(buf)
                if attempt >= self.retries or self._stop.wait(min(2 ** (attempt + 1), 15)):
                    raise

    def _decrypt(self, data: bytes, piece: dict) -> bytes:
        try:
            from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
        except ImportError:
            raise RuntimeError("stream encriptado (AES-128): instala o pacote 'cryptography' (pip install cryptography)")
        k = piece["key"]
        iv = bytes.fromhex(k["iv"][2:].zfill(32)) if k.get("iv") else piece["seq"].to_bytes(16, "big")
        d = Cipher(algorithms.AES(self._key(k["uri"])), modes.CBC(iv)).decryptor()
        out = d.update(data) + d.finalize()
        return out[: -out[-1]] if out and 1 <= out[-1] <= 16 else out

    def _join(self) -> None:
        ts = self.dest + ".ts.part"
        with open(ts, "wb") as out:
            for i in range(len(self._pieces)):
                with open(self._piece_path(i), "rb") as f:
                    shutil.copyfileobj(f, out)
        final = self.dest
        ffmpeg = shutil.which("ffmpeg")
        if ffmpeg and final.lower().endswith(".mp4"):
            r = subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-i", ts, "-c", "copy", final + ".tmp.mp4"])
            if r.returncode == 0:
                os.replace(final + ".tmp.mp4", final)
                os.remove(ts)
            else:
                final = os.path.splitext(final)[0] + ".ts"
                os.replace(ts, final)
        else:
            if final.lower().endswith(".mp4"):
                final = os.path.splitext(final)[0] + ".ts"
            os.replace(ts, final)
        self.dest = final
        self.size = os.path.getsize(final)
        shutil.rmtree(self.work_dir, ignore_errors=True)

    def _tick(self) -> None:
        now = time.monotonic()
        self._samples.append((now, self._done_bytes))
        self._samples = [s for s in self._samples if now - s[0] <= 3]
        t0, d0 = self._samples[0]
        self.speed = max(0.0, (self._done_bytes - d0) / (now - t0)) if now > t0 else 0.0

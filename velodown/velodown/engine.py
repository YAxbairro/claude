"""Download engine with dynamic segmentation, resume and speed limiting.

Dynamic segmentation: the file is split into N byte ranges, each fetched by its
own connection. When a connection finishes its range, the largest remaining
range is split in half and the freed connection takes the second half, so all
connections stay busy until the very end. Progress is checkpointed to a JSON
sidecar so a paused or interrupted download resumes where it stopped.
"""
from __future__ import annotations

import json
import os
import re
import threading
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict

CHUNK = 64 * 1024
MIN_SPLIT = 512 * 1024  # don't split ranges smaller than this
USER_AGENT = "VeloDown/1.0"


class TokenBucket:
    """Shared bandwidth limiter (bytes/second). rate <= 0 means unlimited."""

    def __init__(self, rate: int = 0):
        self.rate = rate
        self._tokens = 0.0
        self._last = time.monotonic()
        self._lock = threading.Lock()

    def consume(self, n: int, stop: threading.Event | None = None) -> None:
        while self.rate > 0:
            with self._lock:
                now = time.monotonic()
                self._tokens = min(self.rate, self._tokens + (now - self._last) * self.rate)
                self._last = now
                if self._tokens >= n or self._tokens >= self.rate:
                    self._tokens -= n
                    return
                wait = (n - self._tokens) / self.rate
            if stop is not None and stop.wait(min(wait, 0.25)):
                return
            if stop is None:
                time.sleep(min(wait, 0.25))


@dataclass
class Segment:
    start: int
    end: int  # inclusive
    pos: int

    @property
    def remaining(self) -> int:
        return max(0, self.end + 1 - self.pos)


@dataclass
class ProbeResult:
    size: int | None
    ranges: bool
    filename: str
    final_url: str


def _request(url: str, headers: dict | None = None, method: str = "GET"):
    h = {"User-Agent": USER_AGENT}
    h.update(headers or {})
    return urllib.request.urlopen(urllib.request.Request(url, headers=h, method=method), timeout=30)


def _filename_from(url: str, disposition: str | None) -> str:
    if disposition:
        m = re.search(r"filename\*=(?:UTF-8'')?([^;]+)", disposition, re.I)
        if m:
            return os.path.basename(urllib.parse.unquote(m.group(1).strip().strip('"')))
        m = re.search(r'filename="?([^";]+)"?', disposition, re.I)
        if m:
            return os.path.basename(m.group(1).strip())
    name = os.path.basename(urllib.parse.unquote(urllib.parse.urlparse(url).path))
    return name or "download.bin"


def probe(url: str) -> ProbeResult:
    """Find size, range support and file name, using a 1-byte range request."""
    with _request(url, {"Range": "bytes=0-0"}) as r:
        disp = r.headers.get("Content-Disposition")
        final = r.geturl()
        if r.status == 206:
            m = re.search(r"/(\d+)$", r.headers.get("Content-Range", ""))
            size = int(m.group(1)) if m else None
            return ProbeResult(size, size is not None, _filename_from(final, disp), final)
        length = r.headers.get("Content-Length")
        return ProbeResult(int(length) if length else None, False, _filename_from(final, disp), final)


class Download:
    """One file transfer. Thread-safe; call start(), pause(), wait()."""

    def __init__(self, url: str, dest: str, connections: int = 8,
                 limiter: TokenBucket | None = None, retries: int = 5):
        self.url = url
        self.dest = dest
        self.connections = max(1, connections)
        self.limiter = limiter or TokenBucket(0)
        self.retries = retries
        self.size: int | None = None
        self.ranges = False
        self.segments: list[Segment] = []
        self.status = "queued"  # queued|running|paused|done|error
        self.error: str | None = None
        self.speed = 0.0
        self._lock = threading.Lock()
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._active = 0
        self._samples: list[tuple[float, int]] = []

    # ---- paths & state -------------------------------------------------
    @property
    def part_path(self) -> str:
        return self.dest + ".part"

    @property
    def state_path(self) -> str:
        return self.dest + ".part.json"

    @property
    def downloaded(self) -> int:
        with self._lock:
            return sum(s.pos - s.start for s in self.segments)

    def _save_state(self) -> None:
        with self._lock:
            data = {"url": self.url, "size": self.size, "ranges": self.ranges,
                    "segments": [asdict(s) for s in self.segments]}
        tmp = self.state_path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(data, f)
        os.replace(tmp, self.state_path)

    def _load_state(self) -> bool:
        if not (os.path.exists(self.state_path) and os.path.exists(self.part_path)):
            return False
        try:
            with open(self.state_path) as f:
                data = json.load(f)
        except (OSError, ValueError):
            return False
        if data.get("url") != self.url or not data.get("ranges"):
            return False
        self.size, self.ranges = data["size"], True
        self.segments = [Segment(**s) for s in data["segments"]]
        return True

    # ---- control -------------------------------------------------------
    def start(self) -> None:
        if self._thread and self._thread.is_alive():
            return
        self._stop.clear()
        self.error = None
        self.status = "running"
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
        done = self.downloaded if self.ranges else self._single_pos
        return {"size": self.size, "downloaded": done, "speed": round(self.speed),
                "status": self.status, "error": self.error, "connections": self._active,
                "segments": [[s.start, s.end, s.pos] for s in list(self.segments)]}

    _single_pos = 0

    # ---- work ----------------------------------------------------------
    def _run(self) -> None:
        try:
            os.makedirs(os.path.dirname(os.path.abspath(self.dest)), exist_ok=True)
            if not self._load_state():
                info = probe(self.url)
                self.size, self.ranges = info.size, info.ranges
                if self.ranges and self.size:
                    self._plan()
                    with open(self.part_path, "wb") as f:
                        f.truncate(self.size)
                    self._save_state()
            if self.ranges and self.size:
                self._run_segmented()
            else:
                self._run_single()
            if self._stop.is_set():
                self.status = "paused"
                return
            os.replace(self.part_path, self.dest)
            if os.path.exists(self.state_path):
                os.remove(self.state_path)
            self.status = "done"
            self.speed = 0
        except Exception as e:  # surfaced to UI
            self.status, self.error = "error", f"{type(e).__name__}: {e}"

    def _plan(self) -> None:
        n = max(1, min(self.connections, self.size // MIN_SPLIT or 1))
        step = self.size // n
        self.segments = []
        for i in range(n):
            a = i * step
            b = self.size - 1 if i == n - 1 else (i + 1) * step - 1
            self.segments.append(Segment(a, b, a))

    def _steal(self) -> Segment | None:
        """Dynamic segmentation: split the largest remaining range in half."""
        with self._lock:
            idle = [s for s in self.segments if s.remaining > 0 and not getattr(s, "_busy", False)]
            if idle:
                seg = max(idle, key=lambda s: s.remaining)
                seg._busy = True
                return seg
            big = max(self.segments, key=lambda s: s.remaining, default=None)
            if not big or big.remaining < 2 * MIN_SPLIT:
                return None
            mid = big.pos + big.remaining // 2
            new = Segment(mid, big.end, mid)
            big.end = mid - 1
            new._busy = True
            self.segments.append(new)
            self.segments.sort(key=lambda s: s.start)
            return new

    def _run_segmented(self) -> None:
        for s in self.segments:
            s._busy = False
        threads = [threading.Thread(target=self._worker, daemon=True) for _ in range(self.connections)]
        for t in threads:
            t.start()
        last_save = 0.0
        while any(t.is_alive() for t in threads):
            time.sleep(0.2)
            self._tick()
            if time.monotonic() - last_save > 1:
                self._save_state()
                last_save = time.monotonic()
        self._save_state()
        if self.error:
            raise RuntimeError(self.error)
        if not self._stop.is_set() and any(s.remaining for s in self.segments):
            raise RuntimeError("incomplete download")

    def _worker(self) -> None:
        with self._lock:
            self._active += 1
        try:
            with open(self.part_path, "r+b") as f:
                while not self._stop.is_set():
                    seg = self._steal()
                    if seg is None:
                        return
                    try:
                        self._fetch(seg, f)
                    finally:
                        seg._busy = False
        except Exception as e:
            self.error = self.error or f"{type(e).__name__}: {e}"
            self._stop.set()
        finally:
            with self._lock:
                self._active -= 1

    def _fetch(self, seg: Segment, f) -> None:
        attempt = 0
        while seg.remaining and not self._stop.is_set():
            try:
                with _request(self.url, {"Range": f"bytes={seg.pos}-{seg.end}"}) as r:
                    if r.status != 206:
                        raise RuntimeError(f"server ignored range (HTTP {r.status})")
                    while not self._stop.is_set():
                        data = r.read(CHUNK)
                        if not data:
                            break
                        self.limiter.consume(len(data), self._stop)
                        with self._lock:
                            n = min(len(data), seg.remaining)
                            if n:
                                f.seek(seg.pos)
                                f.write(data[:n])
                                seg.pos += n
                            if seg.remaining == 0:
                                return  # range shrank (split) or finished
                attempt = 0
            except (OSError, RuntimeError) as e:
                attempt += 1
                if attempt > self.retries:
                    raise
                if self._stop.wait(min(2 ** attempt, 15)):
                    return

    def _run_single(self) -> None:
        """Fallback for servers without range support: one stream, restart on resume."""
        self._active = 1
        self._single_pos = 0
        with _request(self.url) as r, open(self.part_path, "wb") as f:
            while not self._stop.is_set():
                data = r.read(CHUNK)
                if not data:
                    break
                self.limiter.consume(len(data), self._stop)
                f.write(data)
                self._single_pos += len(data)
                self._tick()
        self._active = 0
        if self.size is None and not self._stop.is_set():
            self.size = self._single_pos

    def _tick(self) -> None:
        now = time.monotonic()
        done = self.downloaded if self.ranges else self._single_pos
        self._samples.append((now, done))
        self._samples = [s for s in self._samples if now - s[0] <= 3]
        t0, d0 = self._samples[0]
        self.speed = (done - d0) / (now - t0) if now > t0 else 0.0

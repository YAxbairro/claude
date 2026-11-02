import hashlib
import os
import re
import tempfile
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from velodown.engine import Download, TokenBucket, probe
from velodown.hls import HlsDownload
from velodown.manager import Manager, category_for

DATA = os.urandom(6 * 1024 * 1024 + 12345)
SHA = hashlib.sha256(DATA).hexdigest()


class H(BaseHTTPRequestHandler):
    delay = 0.0  # per-chunk delay to make pause testable

    def log_message(self, *a):
        pass

    def do_GET(self):
        if self.path.startswith("/auth") and self.headers.get("Cookie") != "session=abc":
            self.send_response(403); self.send_header("Content-Length", "0"); self.end_headers(); return
        if self.path.startswith("/hls/"):
            return self.hls()
        ranges = not self.path.startswith("/norange")
        rng = self.headers.get("Range")
        start, end = 0, len(DATA) - 1
        if ranges and rng:
            m = re.match(r"bytes=(\d+)-(\d*)", rng)
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else end
            self.send_response(206)
            self.send_header("Content-Range", f"bytes {start}-{end}/{len(DATA)}")
        else:
            self.send_response(200)
        self.send_header("Content-Length", str(end - start + 1))
        if "/named" in self.path:
            self.send_header("Content-Disposition", 'attachment; filename="report.pdf"')
        self.end_headers()
        try:
            for i in range(start, end + 1, 65536):
                self.wfile.write(DATA[i:min(i + 65536, end + 1)])
                if H.delay:  # the first quarter is 5x slower, so other workers must split it
                    time.sleep(H.delay * (5 if start < len(DATA) // 4 else 1))
        except (BrokenPipeError, ConnectionResetError):
            pass


    def hls(self):
        n = 10
        step = len(DATA) // n
        if self.path == "/hls/master.m3u8":
            body = ("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=100000\nlow.m3u8\n"
                    "#EXT-X-STREAM-INF:BANDWIDTH=900000\nhi.m3u8\n").encode()
        elif self.path == "/hls/hi.m3u8":
            body = ("#EXTM3U\n#EXT-X-TARGETDURATION:4\n" + "".join(
                f"#EXTINF:4.0,\nseg{i}.ts\n" for i in range(n)) + "#EXT-X-ENDLIST\n").encode()
        elif self.path == "/hls/low.m3u8":
            body = b"#EXTM3U\n#EXTINF:4.0,\nwrong.ts\n#EXT-X-ENDLIST\n"
        elif self.path == "/hls/drm.m3u8":
            body = b'#EXTM3U\n#EXT-X-KEY:METHOD=SAMPLE-AES,URI="skd://x"\n#EXTINF:4,\nseg0.ts\n'
        elif m := re.match(r"/hls/seg(\d+)\.ts", self.path):
            i = int(m.group(1))
            body = DATA[i * step: len(DATA) if i == n - 1 else (i + 1) * step]
            if H.delay:
                time.sleep(H.delay * 10)
        else:
            self.send_response(404); self.send_header("Content-Length", "0"); self.end_headers(); return
        self.send_response(200)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


class Base(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), H)
        cls.srv.daemon_threads = True
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def setUp(self):
        H.delay = 0.0
        self.tmp = tempfile.mkdtemp()

    def sha(self, p):
        with open(p, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()


class EngineTests(Base):
    def test_probe(self):
        info = probe(self.base + "/named/x")
        self.assertEqual((info.size, info.ranges, info.filename), (len(DATA), True, "report.pdf"))
        self.assertFalse(probe(self.base + "/norange/f.bin").ranges)

    def test_segmented_download_is_byte_exact(self):
        dest = os.path.join(self.tmp, "a.bin")
        dl = Download(self.base + "/a.bin", dest, connections=8)
        dl.start(); dl.wait(30)
        self.assertEqual(dl.status, "done", dl.error)
        self.assertEqual(self.sha(dest), SHA)
        self.assertFalse(os.path.exists(dest + ".part.json"))

    def test_dynamic_segmentation_splits_ranges(self):
        H.delay = 0.01
        dest = os.path.join(self.tmp, "d.bin")
        dl = Download(self.base + "/d.bin", dest, connections=4)
        dl.start(); dl.wait(60)
        self.assertEqual(dl.status, "done", dl.error)
        self.assertGreater(len(dl.segments), 4)  # finished workers stole work
        self.assertEqual(self.sha(dest), SHA)

    def test_pause_and_resume_from_checkpoint(self):
        H.delay = 0.05
        dest = os.path.join(self.tmp, "p.bin")
        url = self.base + "/p.bin"
        dl = Download(url, dest, connections=4)
        dl.start(); time.sleep(0.6); dl.pause()
        self.assertEqual(dl.status, "paused")
        got = dl.downloaded
        self.assertTrue(0 < got < len(DATA))
        H.delay = 0.0
        dl2 = Download(url, dest, connections=4)  # fresh object: resumes from disk
        dl2.start(); time.sleep(0.05)
        self.assertGreaterEqual(dl2.downloaded, got)
        dl2.wait(30)
        self.assertEqual(dl2.status, "done", dl2.error)
        self.assertEqual(self.sha(dest), SHA)

    def test_server_without_ranges_falls_back(self):
        dest = os.path.join(self.tmp, "n.bin")
        dl = Download(self.base + "/norange/n.bin", dest, connections=8)
        dl.start(); dl.wait(30)
        self.assertEqual(dl.status, "done", dl.error)
        self.assertEqual(self.sha(dest), SHA)

    def test_speed_limit(self):
        dest = os.path.join(self.tmp, "s.bin")
        dl = Download(self.base + "/s.bin", dest, connections=4, limiter=TokenBucket(2 * 1024 * 1024))
        t = time.monotonic(); dl.start(); dl.wait(60)
        self.assertEqual(dl.status, "done", dl.error)
        self.assertGreater(time.monotonic() - t, 2.0)  # ~6 MB at 2 MB/s


class HlsAndHeaderTests(Base):
    def test_hls_best_quality_joined_exactly(self):
        dest = os.path.join(self.tmp, "video.ts")
        dl = HlsDownload(self.base + "/hls/master.m3u8", dest, connections=4)
        dl.start(); dl.wait(30)
        self.assertEqual(dl.status, "done", dl.error)
        self.assertEqual(self.sha(dl.dest), SHA)
        self.assertFalse(os.path.exists(dest + ".parts"))

    def test_hls_pause_resume(self):
        H.delay = 0.05
        dest = os.path.join(self.tmp, "v.ts")
        url = self.base + "/hls/hi.m3u8"
        dl = HlsDownload(url, dest, connections=2)
        dl.start(); time.sleep(1.2); dl.pause()
        self.assertEqual(dl.status, "paused")
        saved = len(os.listdir(dest + ".parts"))
        self.assertTrue(0 < saved < 10)
        H.delay = 0
        dl2 = HlsDownload(url, dest, connections=2)
        dl2.start(); dl2.wait(30)
        self.assertEqual(dl2.status, "done", dl2.error)
        self.assertEqual(self.sha(dl2.dest), SHA)

    def test_drm_is_refused(self):
        dl = HlsDownload(self.base + "/hls/drm.m3u8", os.path.join(self.tmp, "d.ts"))
        dl.start(); dl.wait(10)
        self.assertEqual(dl.status, "error")
        self.assertIn("DRM", dl.error)

    def test_cookies_are_sent(self):
        dest = os.path.join(self.tmp, "secret.bin")
        bad = Download(self.base + "/auth/secret.bin", dest)
        bad.start(); bad.wait(10)
        self.assertEqual(bad.status, "error")
        ok = Download(self.base + "/auth/secret.bin", dest, headers={"Cookie": "session=abc"})
        ok.start(); ok.wait(30)
        self.assertEqual(ok.status, "done", ok.error)
        self.assertEqual(self.sha(dest), SHA)


class ManagerTests(Base):
    def test_categories(self):
        self.assertEqual(category_for("a.MP4"), "Video")
        self.assertEqual(category_for("setup.exe"), "Programs")
        self.assertEqual(category_for("noext"), "General")

    def test_queue_concurrency_and_persistence(self):
        H.delay = 0.02
        m = Manager(self.tmp, max_concurrent=1)
        a = m.add(self.base + "/one.zip", 4)
        b = m.add(self.base + "/two.zip", 4)
        time.sleep(0.4)
        st = {d["id"]: d["status"] for d in m.state()["downloads"]}
        self.assertEqual((st[a["id"]], st[b["id"]]), ("running", "queued"))
        deadline = time.time() + 60
        while time.time() < deadline and not all(d["status"] == "done" for d in m.state()["downloads"]):
            time.sleep(0.2)
        for d in m.state()["downloads"]:
            self.assertEqual(d["status"], "done", d["error"])
            self.assertEqual(self.sha(d["path"]), SHA)
            self.assertIn(os.sep + "Compressed" + os.sep, d["path"])
        time.sleep(0.6)
        self.assertEqual(len(Manager(self.tmp).jobs), 2)  # reloaded from disk


if __name__ == "__main__":
    unittest.main()

"""Mix narration + ducked music + SFX into one track (48 kHz stereo), from timeline.json."""
import json, numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
SR = 48000
tl = json.load(open("timeline.json"))
N = int((tl["total"] + 1.5) * SR)
def load(p):
    sr, x = wavfile.read(p); x = x.astype(np.float32) / 32768.0
    if x.ndim > 1: x = x.mean(1)
    assert sr == SR, (p, sr); return x
def place(buf, x, t, g=1.0):
    s = int(t * SR); e = min(len(buf), s + len(x))
    if e > s: buf[s:e] += x[: e - s] * g
voice = np.zeros(N); sfx = np.zeros(N)
for l in tl["lines"]: place(voice, load(f"assets/voice/{l['id']}.wav"), l["start"])
cache = {}
for c in tl["sfx"]:
    if c["s"] not in cache: cache[c["s"]] = load(f"assets/sfx/{c['s']}.wav")
    place(sfx, cache[c["s"]], c["t"], c["g"])
music = load("assets/sfx/music.wav")[:N]; music = np.pad(music, (0, N - len(music)))
# ducking: smoothed voice envelope -> music gain 1.0 (no voice) .. 0.32 (voice)
env = np.abs(voice); env = sosfilt(butter(1, 6, "low", fs=SR, output="sos"), env)
env = np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1)
duck = 1.0 - 0.68 * env
fade = np.ones(N); fl = int(1.2 * SR); fade[-fl:] = np.linspace(1, 0, fl)
mix = voice * 1.0 + music * 0.42 * duck * fade + sfx * 0.55
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
stereo = np.stack([mix, mix], 1)
wavfile.write("mix.wav", SR, (np.clip(stereo, -1, 1) * 32767).astype(np.int16))
print("ok", N / SR)

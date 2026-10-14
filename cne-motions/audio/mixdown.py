"""Put the new music under the presenter's voice.

Usage: python3 mixdown.py <voice.wav> <music.wav> <cut_s> <ref_lufs> <out.wav>
  voice.wav – the dialogue on its own (stem from the edit, or separated)
  cut_s     – end of the logo intro; before it the jingle plays at full level
  ref_lufs  – integrated loudness to match (the episode as delivered before)

The music ducks under speech (with a gentle 1–4 kHz carve so consonants stay clear)
and swells back in the pauses.
"""
import sys, subprocess, json
import numpy as np
import soundfile as sf
from pedalboard import Pedalboard, PeakFilter, Compressor, Limiter, HighpassFilter, Gain

voice_p, music_p, CUT, REF, out_p = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
SR = 48000


def load(p):
    x, sr = sf.read(p, dtype="float32", always_2d=True)
    if sr != SR:
        import scipy.signal as ss
        x = ss.resample_poly(x, SR, sr, axis=0).astype(np.float32)
    if x.shape[1] == 1:
        x = np.repeat(x, 2, 1)
    return x.T


v = load(voice_p)
m = load(music_p)
N = max(v.shape[1], m.shape[1])
v = np.pad(v, ((0, 0), (0, N - v.shape[1])))
m = np.pad(m, ((0, 0), (0, N - m.shape[1])))
t = np.arange(N) / SR

# clean the dialogue a little: rumble cut + gentle levelling
v = Pedalboard([HighpassFilter(80), Compressor(-22, 2.5, 8, 120)])(v, SR)

# voice activity from a smoothed RMS envelope
hop = int(0.02 * SR)
mono = v.mean(0)
frames = len(mono) // hop
rms = np.sqrt(np.add.reduceat(mono[: frames * hop] ** 2, np.arange(0, frames * hop, hop)) / hop + 1e-12)
db = 20 * np.log10(rms + 1e-9)
thr = np.percentile(db[db > -80], 60) - 14
active = (db > thr).astype(float)
# hold 0.35 s so short gaps between words do not pump the music
hold = int(0.35 / 0.02)
act = np.convolve(active, np.ones(hold), "same") > 0
# smooth: fast attack (80 ms), slower release (450 ms)
g = np.zeros(frames)
a_att, a_rel = np.exp(-0.02 / 0.08), np.exp(-0.02 / 0.45)
cur = 0.0
for i in range(frames):
    tgt = 1.0 if act[i] else 0.0
    k = a_att if tgt > cur else a_rel
    cur = k * cur + (1 - k) * tgt
    g[i] = cur
duck = np.interp(np.arange(N), np.arange(frames) * hop, g)

# music level: full for the jingle, bed under speech, lifted in pauses
under, pause = 10 ** (-15 / 20), 10 ** (-8 / 20)
lvl = pause + (under - pause) * duck
intro = np.clip((CUT + 0.35 - t) / 0.35, 0, 1)  # jingle at full level, settles 0.35 s after the cut
lvl = intro * 1.0 + (1 - intro) * lvl
carved = Pedalboard([PeakFilter(2200, -5.0, 0.7)])(m, SR)
m_out = (m * (1 - duck) + carved * duck) * lvl

mix = v + m_out
mix = Pedalboard([Limiter(-1.0, 100)])(mix, SR)


def lufs(x):
    sf.write("/tmp/_l.wav", x.T, SR)
    r = subprocess.run(["ffmpeg", "-nostdin", "-hide_banner", "-i", "/tmp/_l.wav", "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    return float([l for l in r.splitlines() if l.strip().startswith("I:")][-1].split()[1])


# match the reference loudness; JUCE's limiter adds make-up gain, so iterate on the measured value
start_l = lufs(mix)
out = mix
gain_db = REF - start_l
for _ in range(4):
    out = Pedalboard([Gain(gain_db), Limiter(-1.0, 100)])(mix, SR)
    err = REF - lufs(out)
    if abs(err) < 0.15:
        break
    gain_db += err
out = np.clip(out, -0.98, 0.98)
sf.write(out_p, out.T, SR, subtype="PCM_24")
print("loudness", start_l, "->", lufs(out), "peak", float(np.abs(out).max()))

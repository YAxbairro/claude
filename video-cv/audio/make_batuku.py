"""Sintetiza a batida de batuku + efeitos sonoros, sincronizados com o vídeo.

Batuku: compasso 6/8, tchabeta (pano batido entre as pernas) com polirritmo
3 contra 2, palmas, e a "rapica" final que acelera e intensifica.
Gera public/trilha.wav (música + SFX, já com ducking sob a narração).
Uso: python3 audio/make_batuku.py
"""
import json
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
TOTAL = TL["durationSec"]
N = int(TOTAL * SR)
rng = np.random.default_rng(7)

BPM = TL["bpm"]  # semínima pontuada
EIGHTH = 60.0 / BPM / 3.0


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    mask = np.clip((f - lo * 0.7) / (lo * 0.3 + 1e-9), 0, 1) * np.clip((hi * 1.4 - f) / (hi * 0.4), 0, 1)
    return np.fft.irfft(X * mask, len(x))


def env(n, attack, decay):
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / decay)


def slap(bright=1.0):
    """Tchabeta: estalo de pano + corpo grave."""
    n = int(0.22 * SR)
    noise = rng.standard_normal(n)
    crack = bandpass(noise, 700 * bright, 3800 * bright) * env(n, 0.0008, 0.035)
    t = np.arange(n) / SR
    body = np.sin(2 * np.pi * (150 + 60 * np.exp(-t / 0.02)) * t) * env(n, 0.001, 0.06)
    s = crack * 1.6 + body * 0.9
    return s / np.max(np.abs(s))


def clap():
    n = int(0.25 * SR)
    noise = rng.standard_normal(n)
    s = np.zeros(n)
    for off in (0, 0.009, 0.018):
        o = int(off * SR)
        s[o:] += bandpass(noise, 1000, 5000)[: n - o] * env(n - o, 0.0005, 0.012)
    s += bandpass(noise, 900, 4000) * env(n, 0.002, 0.07) * 0.6
    return s / np.max(np.abs(s))


def kick():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    f = 48 + 90 * np.exp(-t / 0.04)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.18)
    return s / np.max(np.abs(s))


def shaker():
    n = int(0.08 * SR)
    s = bandpass(rng.standard_normal(n), 5000, 12000) * env(n, 0.004, 0.02)
    return s / np.max(np.abs(s))


def boom():
    """Impacto cinematográfico."""
    n = int(2.5 * SR)
    t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t / 0.08)
    sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.002, 0.7)
    nz = bandpass(rng.standard_normal(n), 60, 2500) * env(n, 0.001, 0.25)
    s = sub + nz * 0.5
    return s / np.max(np.abs(s))


def whoosh(dur, lo=300, hi=3000):
    n = int(dur * SR)
    noise = rng.standard_normal(n)
    out = np.zeros(n)
    chunks = 24
    for i in range(chunks):
        a, b = i * n // chunks, (i + 1) * n // chunks
        k = i / (chunks - 1)
        c = lo + (hi - lo) * np.sin(np.pi * k) ** 2
        out[a:b] = bandpass(noise, c * 0.6, c * 1.6)[a:b]
    shape = np.sin(np.linspace(0, np.pi, n)) ** 2
    s = out * shape
    return s / np.max(np.abs(s))


def splash(dur=0.9):
    n = int(dur * SR)
    s = bandpass(rng.standard_normal(n), 400, 6000) * env(n, 0.03, 0.25)
    s += bandpass(rng.standard_normal(n), 150, 900) * env(n, 0.05, 0.4) * 0.6
    return s / np.max(np.abs(s))


def pop():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    f = 500 + 900 * np.exp(-t / 0.015)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.001, 0.04)
    return s


def riser(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 120 * (2 ** (t / dur * 3))
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR)
    nz = rng.standard_normal(n)
    out = np.zeros(n)
    for i in range(16):
        a, b = i * n // 16, (i + 1) * n // 16
        c = 400 * 2 ** (i / 15 * 3.5)
        out[a:b] = bandpass(nz, c * 0.5, c * 1.5)[a:b]
    s = (tone * 0.4 + out) * (t / dur) ** 2
    return s / np.max(np.abs(s))


def pad_chord(freqs, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.zeros(n)
    for f in freqs:
        for det in (-0.25, 0, 0.25):
            ph = rng.uniform(0, 2 * np.pi)
            s += np.sin(2 * np.pi * (f + det) * t + ph) + 0.25 * np.sin(4 * np.pi * (f + det) * t + ph)
    a = np.clip(t / 0.4, 0, 1) * np.clip((dur - t) / 0.4, 0, 1)
    s = s * a
    return s / np.max(np.abs(s))


music = np.zeros(N + SR * 3)
sfx = np.zeros(N + SR * 3)


def place(buf, sample, at, gain=1.0, pitch=1.0):
    if pitch != 1.0:
        idx = np.arange(0, len(sample) - 1, pitch)
        sample = np.interp(idx, np.arange(len(sample)), sample)
    i = int(at * SR)
    if i < 0 or i >= len(buf):
        return
    j = min(len(buf), i + len(sample))
    buf[i:j] += sample[: j - i] * gain


SLAPS = [slap(b) for b in (0.8, 1.0, 1.25)]
CLAP, KICK, SHK, BOOM, POP = clap(), kick(), shaker(), boom(), pop()

S = TL["sections"]
groove_in = S["groove"]
rapica_start, rapica_end = S["rapica"]
break_start, break_end = S["break"]
drop = S["drop"]
final_hit = S["finalHit"]

# --- Intro: pulsação esparsa de tchabeta (respiração antes da aventura)
t = 0.15
while t < groove_in:
    k = round((t - 0.15) / EIGHTH)
    if k % 6 == 0:
        place(music, SLAPS[0], t, 0.55, 0.9)
    elif k % 6 == 3:
        place(music, SLAPS[1], t, 0.35)
    t += EIGHTH
place(music, riser(groove_in - 1.4), 1.4, 0.35)


def groove_bar(t0, density=1.0, gain=1.0, kicks=True):
    """Um compasso 6/8: camada em 2 (acentos 1 e 4) + camada em 3 (1,3,5)."""
    for k in range(6):
        tt = t0 + k * EIGHTH
        acc2 = k in (0, 3)
        acc3 = k in (0, 2, 4)
        v = 0.32 + 0.4 * acc2 + 0.18 * acc3
        place(music, SLAPS[1 if acc2 else (2 if acc3 else 0)], tt + rng.normal(0, 0.003), v * gain, rng.uniform(0.97, 1.03))
        if density > 1.0:  # rapica: semicolcheias
            place(music, SLAPS[2], tt + EIGHTH / 2, 0.22 * gain * min(1, density - 1), 1.05)
        if k == 3:
            place(music, CLAP, tt, 0.5 * gain)
        if kicks and k in (0, 3):
            place(music, KICK, tt, 0.75 * gain)
        place(music, SHK, tt, 0.12 * gain)


# --- Groove principal
t = groove_in
while t < rapica_start - 1e-6:
    groove_bar(t)
    t += 6 * EIGHTH

# --- Rapica: acelera e adensa até ao clímax
tt = rapica_start
step = EIGHTH
while tt < rapica_end:
    p = (tt - rapica_start) / (rapica_end - rapica_start)
    place(music, SLAPS[1 + (int(p * 40) % 2)], tt, 0.4 + 0.5 * p, 1 + 0.08 * p)
    if int((tt - rapica_start) / EIGHTH) % 3 == 0:
        place(music, KICK, tt, 0.6)
    step = EIGHTH * (1 - 0.7 * p)
    tt += step
place(music, riser(rapica_end - rapica_start), rapica_start, 0.5)
place(music, BOOM, rapica_end, 0.9)

# --- Break: só pulsação suave (o "sonho" vira "plano")
t = break_start
while t < break_end - 1e-6:
    place(music, SLAPS[0], t, 0.3, 0.9)
    place(music, SHK, t + 3 * EIGHTH, 0.1)
    t += 6 * EIGHTH
place(music, BOOM, S["stamp"], 0.8)

# --- Drop final: groove completo
place(music, BOOM, drop, 1.0)
t = drop
while t < final_hit - 1e-6:
    groove_bar(t, density=1.6, gain=1.05)
    t += 6 * EIGHTH
place(music, BOOM, final_hit, 1.0)
place(music, SLAPS[1], final_hit, 0.9)

# --- Pad harmónico (Lá menor - Fá - Dó - Sol) para o brilho de campanha
chords = [[220.0, 261.6, 329.6], [174.6, 220.0, 261.6], [261.6, 329.6, 392.0], [196.0, 246.9, 293.7]]
bar = 6 * EIGHTH
t, i = groove_in, 0
while t < TOTAL - 1:
    if not (break_start <= t < break_end):
        place(music, pad_chord(chords[i % 4], bar * 2 + 0.3), t, 0.08)
    t += bar * 2
    i += 1
place(music, pad_chord([220.0, 329.6, 440.0, 523.3], TOTAL - final_hit + 0.5), final_hit, 0.12)

# --- SFX das viagens
for leg in TL["legs"]:
    d = leg["end"] - leg["start"]
    if leg["mode"] == "plane":
        place(sfx, whoosh(d + 0.3, 250, 2600), leg["start"] - 0.1, 0.45)
    else:
        place(sfx, splash(min(0.9, d)), leg["start"], 0.25)
    place(sfx, POP, leg["end"], 0.35)
for k, ti in enumerate(TL["islandPops"]):
    place(sfx, POP, ti, 0.3, 1 + k * 0.06)
for ti in TL["whooshes"]:
    place(sfx, whoosh(0.5, 600, 5000), ti - 0.25, 0.4)

# --- Ducking sob a narração
with wave.open(str(ROOT / "audio" / "vo.wav")) as w:
    vo = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64) / 32768
off = int(TL["voOffset"] * SR)
vo_full = np.zeros(len(music))
vo_full[off : off + len(vo)] = vo[: len(music) - off]
win = int(0.05 * SR)
e = np.sqrt(np.convolve(vo_full**2, np.ones(win) / win, mode="same"))
active = (e > 0.02).astype(float)
smooth = int(0.25 * SR)
active = np.convolve(active, np.ones(smooth) / smooth, mode="same")
duck = 1 - 0.45 * np.clip(active, 0, 1)

def write(path, x):
    x = x[:N].copy()
    x /= max(1e-9, np.max(np.abs(x))) / 0.8
    pcm = (np.clip(np.stack([x, x], axis=1), -1, 1) * 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


hits = np.zeros_like(sfx)
for ti in (rapica_end, S["stamp"], drop, final_hit):
    place(hits, BOOM, ti, 0.9)
write(ROOT / "audio" / "sfx.wav", sfx + hits)

mix = music * duck * 0.55 + sfx * 0.5
mix = mix[: N]
fade = int(0.8 * SR)
mix[-fade:] *= np.linspace(1, 0, fade)
mix = np.tanh(mix * 1.2) / np.tanh(1.2)  # saturação suave
mix /= np.max(np.abs(mix)) / 0.8

stereo = np.stack([mix, mix], axis=1)
# leve abertura estéreo nos slaps
stereo[:, 0] = mix * 0.95 + np.roll(mix, 300) * 0.05
stereo[:, 1] = mix * 0.95 + np.roll(mix, -300) * 0.05
pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
with wave.open(str(ROOT / "public" / "trilha.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok", TOTAL, "s")

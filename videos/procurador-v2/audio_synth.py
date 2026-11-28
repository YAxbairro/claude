"""Procedural sound design: a tense news-documentary music bed and the sound effects, all synthesized (no samples)."""
import numpy as np, json, sys, os
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
rng = np.random.default_rng(7)
OUT = os.path.join(os.path.dirname(__file__), "assets", "sfx")
os.makedirs(OUT, exist_ok=True)


def t_(d): return np.arange(int(d * SR)) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, "low", fs=SR, output="sos"), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)
def norm(x, peak=0.9): m = np.max(np.abs(x)) or 1; return x / m * peak
def save(name, x): wavfile.write(os.path.join(OUT, name + ".wav"), SR, (np.clip(x, -1, 1) * 32767).astype(np.int16))


def reverb(x, dur=1.6, mix=0.3):
    ir = rng.standard_normal(int(dur * SR)) * np.exp(-t_(dur) * 4.5)
    ir = lp(ir, 6000)
    wet = fftconvolve(x, ir)[: len(x) + int(dur * SR)]
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + norm(wet, np.max(np.abs(x)) or 1) * mix


def sweep_filter(noise, f0, f1, block=256):
    """Band-pass noise whose centre frequency glides from f0 to f1 (exponential)."""
    out = np.zeros_like(noise); n = len(noise)
    for s in range(0, n, block):
        k = s / n; fc = f0 * (f1 / f0) ** k
        lo, hi = max(40, fc * 0.6), min(SR / 2 - 100, fc * 1.6)
        out[s:s + block] = bp(noise[max(0, s - 2048):s + block], lo, hi)[-len(noise[s:s + block]):]
    return out


# ---------- SFX ----------
def whoosh(d=0.9, up=True):
    n = rng.standard_normal(int(d * SR))
    x = sweep_filter(n, 300, 4000) if up else sweep_filter(n, 4000, 300)
    env = np.sin(np.pi * np.clip(t_(d) / d, 0, 1)) ** 2
    return norm(reverb(x * env, 0.6, 0.25), 0.8)


def boom(d=2.2):
    t = t_(d)
    f = 55 * np.exp(-t * 2.2) + 28
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    hit = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 18)
    sub = np.sin(2 * np.pi * 36 * t) * np.exp(-t * 1.6) * 0.6
    return norm(reverb(np.tanh((body + hit * 0.8 + sub) * 2.2), 2.0, 0.28), 0.95)


def riser(d=2.6):
    t = t_(d); k = t / d
    n = sweep_filter(rng.standard_normal(len(t)), 400, 7000)
    tone = np.sin(2 * np.pi * np.cumsum(180 * (6 ** k)) / SR) * 0.35
    env = k ** 2.2
    return norm((n + tone) * env, 0.75)


def glitch(d=0.45):
    t = t_(d); x = np.zeros(len(t))
    for _ in range(14):
        s = rng.integers(0, len(t) - 2000); l = rng.integers(300, 2400)
        f = rng.choice([220, 440, 880, 1760, 3520])
        seg = np.sign(np.sin(2 * np.pi * f * t[:l])) * rng.uniform(.3, 1)
        x[s:s + l] += seg[: len(x[s:s + l])]
    x = np.round(x * 6) / 6
    return norm(hp(x, 200) * np.exp(-t * 2), 0.6)


def pop(f=950, d=0.12):
    t = t_(d)
    return norm(np.sin(2 * np.pi * f * t * (1 + 0.6 * np.exp(-t * 40))) * np.exp(-t * 38), 0.55)


def tick(d=0.05):
    t = t_(d)
    return norm(hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 160), 0.45)


def shutter(d=0.35):
    t = t_(d); x = np.zeros(len(t))
    for s in (0, int(0.085 * SR)):
        b = hp(rng.standard_normal(1600), 1200) * np.exp(-np.arange(1600) / SR * 90)
        x[s:s + 1600] += b
    return norm(x, 0.7)


def stamp(d=0.6):
    t = t_(d)
    thud = np.sin(2 * np.pi * 85 * t) * np.exp(-t * 22)
    slap = lp(rng.standard_normal(len(t)), 3500) * np.exp(-t * 45)
    return norm(reverb(np.tanh((thud + slap * 0.9) * 2), 0.4, 0.2), 0.85)


def typewriter(n=10, gap=0.07):
    d = n * gap + 0.1; x = np.zeros(int(d * SR))
    for i in range(n):
        s = max(0, int((i * gap + rng.uniform(-.01, .01)) * SR)); c = tick(0.04) * rng.uniform(.6, 1)
        x[s:s + len(c)] += c
    return norm(x, 0.5)


# ---------- MUSIC ----------
def note(freq, d, kind="saw", detune=0.0):
    t = t_(d); f = freq * (1 + detune)
    if kind == "saw": return 2 * ((t * f) % 1) - 1
    if kind == "sine": return np.sin(2 * np.pi * f * t)
    if kind == "tri": return 2 * np.abs(2 * ((t * f) % 1) - 1) - 1


def mtof(m): return 440 * 2 ** ((m - 69) / 12)


def music(total, sections):
    """sections: list of (start, end, intensity 0..1). 100 bpm, A minor."""
    bpm = 100; beat = 60 / bpm; n = int(total * SR) + SR * 3
    mix = np.zeros(n)
    def add(sig, at, gain=1.0):
        s = int(at * SR); e = min(n, s + len(sig)); mix[s:e] += sig[: e - s] * gain
    def inten(at):
        v = 0
        for s, e, i in sections:
            if s <= at < e: v = i
        return v
    # chords: Am, F, Dm, E (two bars each)
    chords = [[57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]]
    bar = beat * 4
    t = 0.0; ci = 0
    while t < total:
        ch = chords[(ci // 2) % 4]; i = inten(t)
        if i > 0:
            d = bar
            pad = sum(note(mtof(m), d, "saw", dt) for m in ch for dt in (-0.004, 0.004))
            env = np.minimum(1, t_(d) / 0.6) * np.minimum(1, (d - t_(d)) / 0.4)
            add(lp(pad, 900 + 1400 * i) * env * 0.06, t, 0.6 + 0.6 * i)
            # sub drone on root
            add(note(mtof(ch[0] - 24), d, "sine") * env * 0.35, t, 0.5 + 0.5 * i)
        t += bar; ci += 1
    # rhythmic layer
    t = 0.0; k = 0
    while t < total:
        i = inten(t)
        if i > 0.15 and k % 2 == 0:  # pulse on quarters
            d = 0.45; tt = t_(d)
            kick = np.sin(2 * np.pi * np.cumsum(48 + 70 * np.exp(-tt * 35)) / SR) * np.exp(-tt * 9)
            add(kick, t, 0.55 * i)
        if i > 0.35:  # ticking hats on eighths
            h = hp(rng.standard_normal(int(0.05 * SR)), 7000) * np.exp(-t_(0.05) * 120)
            add(h, t, (0.05 if k % 2 else 0.09) * i)
        if i > 0.6 and k % 4 == 3:  # arp pluck
            m = [69, 72, 76, 81][(k // 4) % 4]
            pl = note(mtof(m), 0.35, "tri") * np.exp(-t_(0.35) * 9)
            add(lp(pl, 3000), t, 0.07 * i)
        t += beat / 2; k += 1
    mix = hp(mix, 30)
    return norm(np.tanh(mix * 1.6), 0.8)


if __name__ == "__main__":
    save("whoosh_up", whoosh(0.9, True)); save("whoosh_down", whoosh(0.7, False))
    save("boom", boom()); save("riser", riser()); save("glitch", glitch())
    save("pop", pop()); save("tick", tick()); save("shutter", shutter()); save("stamp", stamp()); save("typewriter", typewriter())
    if len(sys.argv) > 1:
        spec = json.load(open(sys.argv[1]))
        m = music(spec["total"], spec["sections"])
        save("music", m)
    print("ok")

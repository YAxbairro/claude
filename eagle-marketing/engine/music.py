"""Eagle Motion Engine — gerador de música própria (afro-house leve, 120 BPM).
Sem licenças: tudo sintetizado. Uso: python3 music.py out.wav [duracao_s] [--hits t1,t2,...]
"""
import sys, wave
import numpy as np

SR = 44100
BPM = 120
BEAT = 60 / BPM

def env(n, a=0.005, d=0.2):
    t = np.arange(n) / SR
    e = np.minimum(t / a, 1.0) * np.exp(-t / d)
    return e

def kick(n=int(SR * .45)):
    t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .001, .16)

def noise_hit(n, d, hp=True, seed=0):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(n)
    if hp:
        x = np.diff(x, prepend=0)
    return x * env(n, .001, d)

def clap(n=int(SR * .3)):
    x = noise_hit(n, .09, seed=3) * .6
    for k in (0.012, 0.024):
        s = int(k * SR); x[s:] += noise_hit(n - s, .05, seed=int(k * 1000)) * .4
    return x

def tone(freq, n, d=.25, shape='saw'):
    t = np.arange(n) / SR
    if shape == 'sine':
        w = np.sin(2 * np.pi * freq * t)
    else:
        w = sum(np.sin(2 * np.pi * freq * k * t) / k for k in range(1, 9))
    return w * env(n, .004, d)

def lowpass(x, a=.15):
    y = np.empty_like(x); acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc); y[i] = acc
    return y

def place(buf, snd, t, g=1.0):
    s = int(t * SR)
    if s >= len(buf): return
    e = min(len(buf), s + len(snd))
    buf[s:e] += snd[:e - s] * g

def main():
    out = sys.argv[1]
    dur = float(sys.argv[2]) if len(sys.argv) > 2 and not sys.argv[2].startswith('--') else 18.0
    hits = []
    if '--hits' in sys.argv:
        hits = [float(v) for v in sys.argv[sys.argv.index('--hits') + 1].split(',')]
    n = int(SR * dur)
    drums = np.zeros(n); bass = np.zeros(n); keys = np.zeros(n); fx = np.zeros(n)
    # progressão Am - F - C - G (vibe positiva)
    prog = [(220.0, [261.63, 329.63, 440.0]), (174.61, [261.63, 349.23, 440.0]),
            (130.81, [261.63, 329.63, 392.0]), (196.0, [246.94, 293.66, 392.0])]
    steps = int(dur / (BEAT / 4))
    for s in range(steps):
        t = s * BEAT / 4
        bar = int(t // (BEAT * 4))
        root, chord = prog[bar % 4]
        intro = t < 2.0
        if s % 4 == 0 and not intro: place(drums, kick(), t, 1.0)
        if s % 8 == 4 and t > 3.5: place(drums, clap(), t, .45)
        if s % 2 == 1: place(drums, noise_hit(int(SR * .05), .018, seed=s), t, .16 if s % 4 == 3 else .09)
        # tumba/afro percussão
        if s % 16 in (3, 6, 11, 14) and not intro: place(drums, tone(330 if s % 16 < 8 else 260, int(SR * .2), .07, 'sine'), t, .22)
        # baixo síncope
        if s % 16 in (0, 3, 6, 10, 12) and t > 1.0:
            place(bass, tone(root / 2, int(SR * .3), .18, 'sine') + tone(root, int(SR * .3), .12, 'sine') * .35, t, .55)
        # stabs de acordes
        if s % 8 in (2, 7):
            snd = sum(tone(f, int(SR * .35), .16) for f in chord) / 3
            place(keys, snd, t, .22)
    # whoosh/impacto nas transições
    for h in hits:
        w = int(SR * .6)
        rise = noise_hit(w, 10, hp=True, seed=9) * np.linspace(0, 1, w) ** 3
        place(fx, rise, max(0, h - .6), .25)
        place(fx, kick() * 1.2 + noise_hit(int(SR * .45), .35, hp=False, seed=11) * .3, h, .6)
    keys = lowpass(keys, .22)
    mix = drums * .9 + bass + keys + fx
    # fade in/out
    fi = int(SR * .4); fo = int(SR * 1.2)
    mix[:fi] *= np.linspace(0, 1, fi); mix[-fo:] *= np.linspace(1, 0, fo)
    mix = np.tanh(mix * 1.4)
    mix /= np.max(np.abs(mix)) * 1.12
    pcm = (mix * 32767).astype(np.int16)
    st = np.column_stack([pcm, pcm]).ravel()
    with wave.open(out, 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(SR); f.writeframes(st.tobytes())
    print('ok', out, dur)

if __name__ == '__main__':
    main()

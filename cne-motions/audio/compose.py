"""CNE Explica – original music bed + sonic logo (jingle), composed note by note.

Usage: python3 compose.py <out_dir> <total_s> <cut_s> <endcard_s> [seed]
  cut_s     – where the logo intro cuts to the presenter (bar 0 of the groove)
  endcard_s – where the closing card starts (gets the logo motif again)

Renders every instrument as its own stem with FluidSynth (FluidR3 GM), designs the sound
effects in numpy and mixes everything with pedalboard into music.wav (48 kHz stereo).
"""
import os, subprocess, sys
import numpy as np
import pretty_midi as pm
import soundfile as sf
from pedalboard import Pedalboard, Compressor, Gain, HighpassFilter, LowpassFilter, Reverb, Limiter, HighShelfFilter, LowShelfFilter, PeakFilter, Chorus

SR = 48000
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"

out_dir, TOTAL, CUT, END = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4])
SEED = int(sys.argv[5]) if len(sys.argv) > 5 else 7
rng = np.random.default_rng(SEED)
os.makedirs(out_dir, exist_ok=True)

# Tempo: the closing card lands exactly on a bar line, the intro impact lands 5 beats before the cut.
bars_body = max(8, round((END - CUT) / (4 * 60 / 115)))
BAR = (END - CUT) / bars_body
B = BAR / 4  # beat
print(f"bpm {60 / B:.2f}  bars {bars_body}")


def T(bar, beat=0.0):
    """absolute time of a grid position (bar 0 = the cut to the presenter)"""
    return CUT + bar * BAR + beat * B


# ---------------- harmony ----------------
# D major, I – V – vi – IV, one chord per bar
PROG = [("D", [50, 54, 57]), ("A", [45, 49, 52]), ("Bm", [47, 50, 54]), ("G", [43, 47, 50])]
ROOT = {"D": 38, "A": 33, "Bm": 35, "G": 31}


def chord(bar):
    return PROG[bar % 4]


# ---------------- MIDI building ----------------
INST = {
    "drums": dict(program=0, is_drum=True),
    "bass": dict(program=33),      # fingered bass
    "gtr": dict(program=28),       # muted electric guitar – coladeira-style chops
    "marimba": dict(program=12),
    "keys": dict(program=4),       # electric piano
    "piano": dict(program=0),
    "strings": dict(program=48),
    "pad": dict(program=89),       # warm pad
    "glock": dict(program=9),
    "celesta": dict(program=8),
    "kalimba": dict(program=108),
}
mids = {k: pm.PrettyMIDI(initial_tempo=60 / B) for k in INST}
tracks = {k: pm.Instrument(**v, name=k) for k, v in INST.items()}


def note(track, pitch, start, dur, vel, human=True):
    if human:
        start += rng.normal(0, 0.004)
        vel += int(rng.integers(-7, 8))
    vel = int(np.clip(vel, 1, 127))
    start = max(0.0, start)
    tracks[track].notes.append(pm.Note(velocity=vel, pitch=int(pitch), start=start, end=start + max(0.03, dur)))


# drum note numbers (GM)
KICK, SNARE, CLAP, CH, OH, CRASH, SHAKER, TAMB, TOM_L, TOM_M, TOM_H, RIDE = 36, 38, 39, 42, 46, 49, 70, 54, 45, 47, 50, 51

# ---------- intro sonic logo (0 → CUT) ----------
IMPACT = T(0, -5)          # red bar opens
NOTE2 = T(0, -4.5)         # EXPLICA
NOTE3 = T(0, -4)           # CNE rises
NOTE4 = T(0, -3.5)
SPARK = T(0, -2.75)        # golden underline

# soft pulse while the ballot is on screen (beats -9 … -6)
for k in range(8):
    t = T(0, -9 + k * 0.5)
    if t < 0.75:
        continue
    note("marimba", [74, 69][k % 2], t, B * 0.45, 70 + k * 4)
    note("kalimba", [86, 81][k % 2], t, B * 0.4, 50 + k * 3)
    note("drums", CH, t, 0.05, 50 + k * 5)
    note("drums", SHAKER, t + B * 0.25, 0.03, 40 + k * 3)
# airy pad swell under the ballot, resolving into the impact
for p in [50, 57, 62, 64, 69]:
    note("pad", p, 0.05, IMPACT - 0.1, 66)
# snare build into the impact (16ths, crescendo)
for k in range(8):
    t = T(0, -7 + k * 0.25)
    note("drums", SNARE, t, 0.05, 30 + k * 11)
# impact chord + logo motif D – F# – A – D
note("drums", CRASH, IMPACT, 1.5, 118, False)
note("drums", KICK, IMPACT, 0.2, 127, False)
for p in [50, 57, 62, 66]:
    note("piano", p, IMPACT, 2.6, 100)
for p in [50, 54, 57, 62]:
    note("strings", p, IMPACT, 2.4, 92)
note("bass", 38, IMPACT, 1.0, 100)
for t, p, v in [(IMPACT, 74, 112), (NOTE2, 78, 104), (NOTE3, 81, 118), (NOTE4, 86, 124)]:
    note("glock", p, t, 1.4, v, False)
    note("celesta", p, t, 1.2, v - 18, False)
    note("marimba", p - 12, t, 0.5, v - 20, False)
note("drums", KICK, NOTE3, 0.2, 110, False)
note("drums", CLAP, NOTE3, 0.1, 100, False)
for k, p in enumerate([86, 90, 93, 98]):
    note("celesta", p, SPARK + k * 0.045, 0.6, 78 - k * 8, False)
# pre-groove: kick + hats in the last beats of the intro, filter opens in the mix
for k in range(10):
    t = T(0, -2.5 + k * 0.25)
    note("drums", CH, t, 0.04, 50 + k * 4)
for bt in (-2, -1):
    note("drums", KICK, T(0, bt), 0.2, 96)
note("drums", SNARE, T(0, -0.5), 0.1, 90)
note("drums", SNARE, T(0, -0.25), 0.1, 105)

# ---------- groove under the presenter (bar 0 → END) ----------
def is_break(bar):
    # two-bar breakdown every 16 bars gives the bed some breathing room
    return bar % 16 in (14, 15) and bar < bars_body - 4


for bar in range(bars_body):
    name, tri = chord(bar)
    root = ROOT[name]
    section = (bar // 8) % 2  # A / B alternate every 8 bars
    brk = is_break(bar)
    last = bar == bars_body - 1
    t0 = T(bar)

    # drums
    if bar == 0 or (bar % 8 == 0 and not brk):
        note("drums", CRASH, t0, 1.2, 96)
    if not brk:
        kicks = [0, 6, 8] + ([14] if bar % 2 else [11])
        for s in kicks:
            note("drums", KICK, t0 + s * B / 4, 0.15, 112 if s in (0, 8) else 92)
        for s in (4, 12):
            note("drums", CLAP, t0 + s * B / 4, 0.1, 96)
            note("drums", SNARE, t0 + s * B / 4, 0.1, 70)
    for s in range(0, 16, 2):
        note("drums", CH, t0 + s * B / 4, 0.04, (78 if s % 4 == 0 else 60) - (25 if brk else 0))
    if not brk:
        note("drums", OH, t0 + 14 * B / 4, 0.2, 60)
    for s in range(16):  # shaker 16ths – the island lilt
        note("drums", SHAKER, t0 + s * B / 4 + (0.012 if s % 2 else 0), 0.03, 52 if s % 4 == 2 else 36)
    if section == 1 and not brk:
        for s in (2, 6, 10, 14):
            note("drums", TAMB, t0 + s * B / 4, 0.05, 46)
    # fills before every 8-bar line
    if bar % 8 == 7 and not last:
        for k, (dn, v) in enumerate([(TOM_H, 84), (TOM_H, 88), (TOM_M, 92), (TOM_M, 96), (TOM_L, 100), (TOM_L, 104), (SNARE, 108), (SNARE, 118)]):
            note("drums", dn, t0 + 2 * B + k * B / 4, 0.1, v)

    # bass: syncopated root/fifth
    if not brk:
        pat = [(0, 0, 0.7), (3, 0, 0.3), (6, 7, 0.4), (8, 0, 0.6), (11, 12, 0.3), (14, 7, 0.4)]
        for s, iv, d in pat:
            note("bass", root + iv, t0 + s * B / 4, d * B, 98 if s in (0, 8) else 84)
    else:
        note("bass", root, t0, BAR * 0.9, 70)

    # muted guitar chops on the off-beats (coladeira feel)
    if not brk:
        for s in (2, 3, 6, 10, 11, 14):
            for p in tri:
                note("gtr", p + 12, t0 + s * B / 4, 0.09, 74 if s in (2, 10) else 58)

    # keys: marimba arps in A, electric piano stabs in B
    if section == 0:
        arp = [tri[0] + 24, tri[1] + 24, tri[2] + 24, tri[1] + 24]
        for s in range(0, 16, 2):
            note("marimba", arp[(s // 2) % 4], t0 + s * B / 4, B * 0.4, 60 if not brk else 48)
    else:
        for s in (0, 3, 8, 11):
            for p in tri:
                note("keys", p + 12, t0 + s * B / 4, B * 0.6, 62)

    # pad / strings carry the harmony from the second 8 bars on
    if bar >= 8 or brk:
        for p in tri:
            note("pad", p + 12, t0, BAR * 0.98, 58 if not brk else 70)
    if section == 1 and not brk:
        for p in tri:
            note("strings", p + 12, t0, BAR * 0.98, 52)

    # sparse kalimba hook every 4 bars, high and quiet so it never fights the voice
    if bar % 4 == 0 and bar > 0 and not brk:
        for bt, p in [(0, 81), (0.75, 78), (1.5, 74), (2.5, 76)]:
            note("kalimba", p, t0 + bt * B, B * 0.8, 54)

# build into the closing card
for k in range(16):
    note("drums", SNARE, T(bars_body - 1, k * 0.25), 0.05, 40 + k * 5)

# ---------- closing card: the logo motif again ----------
note("drums", CRASH, END, 2.5, 120, False)
note("drums", KICK, END, 0.2, 127, False)
for p in [38, 50, 57, 62, 66, 69]:
    note("piano", p, END, TOTAL - END, 100)
for p in [50, 54, 57, 62, 66]:
    note("strings", p, END, TOTAL - END, 96)
    note("pad", p, END, TOTAL - END, 76)
note("bass", 26, END, TOTAL - END, 112)
for k, p in enumerate([74, 78, 81, 86]):
    t = END + k * B / 2
    note("glock", p, t, 1.6, 112 + 4 * (k == 3), False)
    note("celesta", p, t, 1.4, 92, False)
note("drums", KICK, END + 1.5 * B, 0.2, 110, False)
note("drums", CLAP, END + 1.5 * B, 0.1, 100, False)

# ---------------- render stems ----------------
stems = {}
for k, tr in tracks.items():
    if not tr.notes:
        continue
    m = pm.PrettyMIDI(initial_tempo=60 / B)
    m.instruments.append(tr)
    mp = os.path.join(out_dir, f"{k}.mid")
    wp = os.path.join(out_dir, f"{k}.wav")
    m.write(mp)
    subprocess.run(["fluidsynth", "-ni", "-g", "0.6", "-R", "0", "-C", "0", "-F", wp, "-r", str(SR), SF2, mp], check=True, capture_output=True)
    a, sr = sf.read(wp, dtype="float32")
    if a.ndim == 1:
        a = np.stack([a, a], 1)
    stems[k] = a.T  # (2, n)

N = int((TOTAL + 0.5) * SR)


def fit(x):
    y = np.zeros((2, N), np.float32)
    n = min(N, x.shape[1])
    y[:, :n] = x[:, :n]
    return y


stems = {k: fit(v) for k, v in stems.items()}

# ---------------- sound design ----------------
def env(n, a, d):
    e = np.ones(n)
    ai, di = int(a * SR), int(d * SR)
    if ai:
        e[:ai] = np.linspace(0, 1, ai)
    if di:
        e[-di:] *= np.linspace(1, 0, di) ** 2
    return e


def bandnoise(n, f0, f1, q=2.0):
    """noise through a band-pass whose centre sweeps f0 → f1 (done in short FFT blocks)"""
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blk = 1024
    for i in range(0, n, blk // 2):
        seg = x[i:i + blk]
        if len(seg) < 8:
            break
        w = np.hanning(len(seg))
        S = np.fft.rfft(seg * w)
        f = np.fft.rfftfreq(len(seg), 1 / SR)
        fc = f0 * (f1 / f0) ** (i / max(1, n))
        S *= np.exp(-0.5 * (np.log(np.maximum(f, 1) / fc) * q) ** 2)
        out[i:i + len(seg)] += np.fft.irfft(S, len(seg))
    return out / (np.abs(out).max() + 1e-9)


sfx = np.zeros((2, N), np.float32)


def place(sig, t, gain, pan=0.0):
    i = int(t * SR)
    if i >= N:
        return
    sig = sig[: N - i] * gain
    sfx[0, i:i + len(sig)] += sig * np.sqrt(0.5 * (1 - pan))
    sfx[1, i:i + len(sig)] += sig * np.sqrt(0.5 * (1 + pan))


# ballot slides in from the top: airy whoosh 0 → 0.8 s
n = int(0.85 * SR)
place(bandnoise(n, 6000, 900, 1.6) * env(n, 0.25, 0.35), 0.0, 0.35, -0.3)
# paper lands
n = int(0.12 * SR)
place(bandnoise(n, 2500, 1200, 1.2) * env(n, 0.003, 0.1), 0.74, 0.25)
# pen draws the X: two scratchy strokes
for t0, dur, pan in [(0.90, 0.13, -0.2), (1.07, 0.15, 0.2)]:
    n = int(dur * SR)
    scr = bandnoise(n, 3500, 5200, 2.5)
    grain = (rng.random(n) > 0.55).astype(float)
    grain = np.convolve(grain, np.ones(60) / 60, "same")
    place(scr * grain * env(n, 0.01, 0.04), t0, 0.32, pan)
# ballot dissolves: reverse swell into the impact
n = int((IMPACT - 1.75) * SR)
sw = bandnoise(n, 400, 9000, 1.3) * np.linspace(0, 1, n) ** 2.2
place(sw, 1.75, 0.42)
rise = np.sin(2 * np.pi * np.cumsum(np.linspace(180, 720, n)) / SR) * np.linspace(0, 1, n) ** 3
place(rise, 1.75, 0.08)
# impact: sub drop + crack
n = int(1.6 * SR)
tt = np.arange(n) / SR
sub = np.sin(2 * np.pi * np.cumsum(55 * np.exp(-tt * 2.2) + 32) / SR) * np.exp(-tt * 2.6)
crack = bandnoise(int(0.25 * SR), 3000, 800, 1.1) * env(int(0.25 * SR), 0.001, 0.22)
place(sub, IMPACT, 0.32)
place(crack, IMPACT, 0.35)
# red bar stretches open: quick whoosh left → right
n = int(0.35 * SR)
place(bandnoise(n, 1200, 5000, 1.5) * env(n, 0.04, 0.2), IMPACT + 0.02, 0.3, -0.5)
place(bandnoise(n, 1500, 6000, 1.5) * env(n, 0.04, 0.2), IMPACT + 0.12, 0.25, 0.5)
# CNE rises: soft upward swish
n = int(0.3 * SR)
place(bandnoise(n, 900, 4000, 1.5) * env(n, 0.05, 0.18), NOTE3 - 0.08, 0.22)
# riser into the groove
n = int((CUT - SPARK) * SR)
place(bandnoise(n, 700, 10000, 1.4) * np.linspace(0, 1, n) ** 2.5, SPARK, 0.3)
# closing card impact
place(sub, END, 0.3)
place(crack, END, 0.3)
n = int(1.2 * SR)
place(bandnoise(n, 1500, 7000, 1.3)[::-1] * np.linspace(0, 1, n) ** 3, END - 1.2, 0.3)

# layered synth kick for punch under the GM kit
kick = np.zeros(N)
kn = int(0.32 * SR)
kt = np.arange(kn) / SR
k1 = np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-kt * 30)) / SR) * np.exp(-kt * 9)
for nt in tracks["drums"].notes:
    if nt.pitch == KICK:
        i = int(nt.start * SR)
        if i < N:
            seg = k1[: N - i] * (nt.velocity / 127)
            kick[i:i + len(seg)] += seg
stems["kick2"] = np.stack([kick, kick]).astype(np.float32) * 0.5


# ---------------- mix ----------------
def fx(x, board):
    return board(x, SR)


def sidechain(x, depth=0.35, rel=0.18):
    e = np.zeros(N)
    for nt in tracks["drums"].notes:
        if nt.pitch == KICK and nt.start > CUT - 0.1:
            i = int(nt.start * SR)
            m = int(rel * SR)
            seg = np.linspace(1, 0, min(m, N - i)) ** 2
            e[i:i + len(seg)] = np.maximum(e[i:i + len(seg)], seg)
    return x * (1 - depth * e)


rev_room = Reverb(room_size=0.35, damping=0.5, wet_level=0.18, dry_level=0.82, width=0.9)
rev_hall = Reverb(room_size=0.82, damping=0.35, wet_level=0.35, dry_level=0.7, width=1.0)
chain = {
    "drums": (Pedalboard([HighpassFilter(30), Compressor(-16, 3, 5, 80), PeakFilter(4000, 2.0, 1.0), rev_room]), 1.0),
    "kick2": (Pedalboard([LowpassFilter(160)]), 0.45),
    "bass": (Pedalboard([HighpassFilter(40), Compressor(-18, 4, 10, 120), PeakFilter(800, 2.0, 0.8), LowpassFilter(2600)]), 0.6),
    "gtr": (Pedalboard([HighpassFilter(250), Chorus(rate_hz=0.6, depth=0.15, mix=0.25), rev_room]), 0.75),
    "marimba": (Pedalboard([HighpassFilter(200), rev_room]), 0.8),
    "keys": (Pedalboard([HighpassFilter(200), Chorus(rate_hz=0.8, depth=0.2, mix=0.3), rev_room]), 0.5),
    "piano": (Pedalboard([HighpassFilter(80), rev_hall]), 1.0),
    "strings": (Pedalboard([HighpassFilter(120), rev_hall]), 0.55),
    "pad": (Pedalboard([HighpassFilter(150), LowpassFilter(6000), rev_hall]), 0.38),
    "glock": (Pedalboard([HighpassFilter(400), rev_hall]), 1.1),
    "celesta": (Pedalboard([HighpassFilter(400), rev_hall]), 0.45),
    "kalimba": (Pedalboard([HighpassFilter(300), rev_hall]), 0.9),
}
mix = np.zeros((2, N), np.float32)
for k, x in stems.items():
    board, g = chain[k]
    y = fx(x, board) * g
    if k in ("bass", "pad", "keys", "gtr"):
        y = sidechain(y, 0.3 if k == "bass" else 0.22)
    mix += y[:, :N]

# the groove pre-roll after the logo opens from a filtered pulse to full range right on the cut
tsec = np.arange(N) / SR
lp_mix = fx(mix, Pedalboard([LowpassFilter(1100)]))
w = np.clip((tsec - (SPARK + 0.25)) / 0.35, 0, 1) * (1 - np.clip((tsec - (CUT - 1.3)) / 1.3, 0, 1) ** 1.5)
mix = mix * (1 - w) + lp_mix * w
mix += fx(sfx, Pedalboard([HighpassFilter(60), Reverb(room_size=0.6, wet_level=0.25, dry_level=0.85)]))

master = Pedalboard([HighpassFilter(32), LowShelfFilter(120, -3.0), PeakFilter(2500, 1.5, 0.8), HighShelfFilter(8000, 2.0), Compressor(-14, 2.5, 15, 150), Gain(3), Limiter(-1.0, 120)])
mix = fx(mix, master)
# fade the tail into the end of the video
fade_n = int(0.6 * SR)
endi = int(TOTAL * SR)
mix[:, endi - fade_n:endi] *= np.linspace(1, 0, fade_n) ** 2
mix[:, endi:] = 0
mix = mix[:, :endi]
sf.write(os.path.join(out_dir, "music.wav"), mix.T, SR, subtype="PCM_24")
# the sonic logo on its own (intro + one bar of groove, faded)
j = mix[:, : int((CUT + BAR) * SR)].copy()
fn = int(BAR * 0.8 * SR)
j[:, -fn:] *= np.linspace(1, 0, fn) ** 2
sf.write(os.path.join(out_dir, "jingle.wav"), j.T, SR, subtype="PCM_24")
print("done", mix.shape[1] / SR)

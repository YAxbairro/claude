"""Mistura final: narração à frente, batuku (ElevenLabs SFX) por baixo com ducking, efeitos discretos.

Entradas: public/narracao.mp3, audio/batuku.mp3, audio/sfx.wav (gerado por make_batuku.py)
Saída: public/trilha.wav (já inclui a narração)
"""
import json
import subprocess
import wave
from pathlib import Path

import numpy as np

SR = 44100
ROOT = Path(__file__).resolve().parent.parent
TL = json.loads((ROOT / "src" / "timeline.json").read_text())
N = int(TL["durationSec"] * SR)


def load(path, gain_db=0.0, filters=None):
    af = ["-af", filters] if filters else []
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), *af, "-ac", "1", "-ar", str(SR), "-f", "s16le", "-"],
        check=True, capture_output=True,
    ).stdout
    return np.frombuffer(raw, np.int16).astype(np.float64) / 32768 * 10 ** (gain_db / 20)


def fit(x, off=0.0):
    out = np.zeros(N)
    i = int(off * SR)
    n = min(len(x), N - i)
    out[i : i + n] = x[:n]
    return out


# Narração: limpa, comprimida e normalizada (-14 LUFS)
vo = fit(load(ROOT / "public" / "narracao.mp3", filters="highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,loudnorm=I=-14:TP=-1.5:LRA=7"), TL["voOffset"])

# Batuku: repete com crossfade até cobrir o vídeo
bat = load(ROOT / "audio" / "batuku.mp3", filters="loudnorm=I=-16:TP=-2")
xf = int(0.5 * SR)
loop = bat.copy()
while len(loop) < N + SR:
    ramp = np.linspace(0, 1, xf)
    head = loop[-xf:] * (1 - ramp) + bat[:xf] * ramp
    loop = np.concatenate([loop[:-xf], head, bat[xf:]])
music = loop[:N]

# Ducking: música baixa ~8 dB sob a voz, sobe nas pausas, intro e final
win = int(0.04 * SR)
env = np.sqrt(np.convolve(vo**2, np.ones(win) / win, mode="same"))
active = (env > 0.015).astype(float)
k = int(0.35 * SR)
active = np.convolve(active, np.ones(k) / k, mode="same")
duck = 10 ** (-8 * np.clip(active * 1.4, 0, 1) / 20)
t = np.arange(N) / SR
fade_in = np.clip(t / 0.6, 0, 1)
fade_out = np.clip((TL["durationSec"] - t) / 1.2, 0, 1)
music = music * duck * fade_in * fade_out * 0.7

sfx = fit(load(ROOT / "audio" / "sfx.wav")) * 0.22 * duck ** 0.5

mix = vo + music + sfx
peak = np.max(np.abs(mix))
mix = mix / peak * 0.95 if peak > 0.95 else mix
pcm = (np.clip(np.stack([mix, mix], axis=1), -1, 1) * 32767).astype(np.int16)
with wave.open(str(ROOT / "public" / "trilha.wav"), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print("ok")

"""Packs the individual narration clips into a few audio sprites.

core      ui, praise, encouragement, instructions, numbers, island names
names     every item name (+ English words) and clues not tied to an island
isl-<id>  story, reward, group labels and the clues of that island's items

Writes public/assets/voice/<sprite>.mp3 and src/data/voice-index.json
({ sprites: [...], clips: { key: [[spriteIdx, start, dur], ...] } }).
Source clips: art-cache/voice-hq/*.mp3 (falls back to public/assets/voice/<key>.mp3).
usage: python3 scripts/build-voice-sprites.py
"""
import json, os, subprocess, tempfile, wave, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = [os.path.join(ROOT, 'art-cache', 'voice-hq'), os.path.join(ROOT, 'public', 'assets', 'voice')]
OUT = os.path.join(ROOT, 'public', 'assets', 'voice')
RATE, GAP = 32000, 0.25

keys = json.loads(subprocess.check_output(['node', '--no-warnings', '--experimental-strip-types', '-e', """
const { allLines } = await import('./src/data/lines.ts');
const { ISLANDS } = await import('./src/data/islands.ts');
console.log(JSON.stringify({ keys: Object.keys(allLines()), islands: ISLANDS.map((i) => ({ id: i.id, items: i.items })) }));
"""], cwd=ROOT, input=b''))
all_keys, islands = keys['keys'], keys['islands']

def src(key):
    for d in SRC:
        p = os.path.join(d, key + '.mp3')
        if os.path.exists(p):
            return p
    return None

sprites = {'core': [], 'names': []}
for k in all_keys:
    if k.split('.')[0] in ('ui', 'p', 'e', 'i', 'num', 'isl'):
        sprites['core'].append(k)
    elif k.startswith('n.') or k.startswith('en.'):
        sprites['names'].append(k)
clue_owner = set()
for isl in islands:
    lst = [f's.{isl["id"]}', f'r.{isl["id"]}'] + [k for k in all_keys if k.startswith(f'g.{isl["id"]}.')]
    for it in isl['items']:
        for pre in ('n', 'c', 'en'):
            if f'{pre}.{it}' in all_keys:
                lst.append(f'{pre}.{it}')
        clue_owner.add(f'c.{it}')
    sprites[f'isl-{isl["id"]}'] = lst
sprites['names'] += [k for k in all_keys if k.startswith('c.') and k not in clue_owner]

def dur(k):
    p = src(k)
    return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p])) if p else 0

# Keep every sprite short (<= MAX seconds) so decoding stays light on phones.
MAX = 80
chunked = {}
for name, lst in sprites.items():
    part, acc, n = [], 0.0, 0
    for k in lst:
        d = dur(k) + GAP
        if part and acc + d > MAX:
            chunked[f'{name}-{n}' if n or len(lst) else name] = part
            part, acc, n = [], 0.0, n + 1
        part.append(k); acc += d
    if part:
        chunked[f'{name}-{n}' if n else name] = part
sprites = chunked

tmp = tempfile.mkdtemp()
index = {'sprites': [], 'clips': {}}
silence = b'\x00\x00' * int(RATE * GAP)
missing = []
for si, (name, lst) in enumerate(sprites.items()):
    index['sprites'].append(name)
    pcm = bytearray(silence)
    for k in lst:
        p = src(k)
        if not p:
            missing.append(k)
            continue
        wav = os.path.join(tmp, 'c.wav')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', p, '-ac', '1', '-ar', str(RATE), '-f', 'wav', wav], check=True)
        with wave.open(wav) as w:
            frames = w.readframes(w.getnframes())
        start = len(pcm) / 2 / RATE
        pcm += frames
        index['clips'].setdefault(k, []).append([si, round(start, 3), round(len(frames) / 2 / RATE, 3)])
        pcm += silence
    raw = os.path.join(tmp, name + '.wav')
    with wave.open(raw, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE); w.writeframes(bytes(pcm))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-ac', '1', '-ar', str(RATE), '-b:a', '56k', os.path.join(OUT, name + '.mp3')], check=True)
    print(name, len(lst), 'clips', round(len(pcm) / 2 / RATE), 's')

json.dump(index, open(os.path.join(ROOT, 'src', 'data', 'voice-index.json'), 'w'), separators=(',', ':'))
if missing:
    print('MISSING', missing, file=sys.stderr)

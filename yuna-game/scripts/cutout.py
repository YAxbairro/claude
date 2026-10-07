"""Background removal + trim + webp export for generated art.
usage: python3 scripts/cutout.py <model> <max_px> <out_dir> <in files...>"""
import sys, os
from PIL import Image
from rembg import remove, new_session
model, max_px, out_dir, files = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4:]
os.makedirs(out_dir, exist_ok=True)
session = new_session(model)
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    dest = os.path.join(out_dir, name + '.webp')
    if os.path.exists(dest):
        continue
    im = Image.open(f).convert('RGB')
    cut = remove(im, session=session, post_process_mask=True)
    bbox = cut.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox()
    if bbox:
        pad = 6
        bbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(cut.width, bbox[2]+pad), min(cut.height, bbox[3]+pad))
        cut = cut.crop(bbox)
    cut.thumbnail((max_px, max_px), Image.LANCZOS)
    cut.save(dest, 'WEBP', quality=86, method=6)
    print('cut', dest, cut.size, os.path.getsize(dest)//1024, 'KB')

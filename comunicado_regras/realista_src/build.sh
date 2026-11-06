#!/usr/bin/env bash
# Renderiza o Apelo_Proibicoes_REALISTA_ALPHA_drone_16x9.mov a partir do código-fonte.
# Requisitos: python3 (numpy, pillow, opencv-python-headless), ffmpeg.
set -e
cd "$(dirname "$0")"
V=../Apelo_Proibicoes_FINAL_16x9.mp4
mkdir -p seg seg2
for s in S1 S2 S3 S678; do python3 segs2.py $s & done; wait
for s in S4 S10 S1112 S13; do python3 segs2.py $s & done; wait
fx(){ ffmpeg -v error -y -i $V -vf "select='between(n\,$1\,$(($2-1)))',setpts=N/25/TB,format=yuva444p10le" -an -r 25 \
  -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -vendor apl0 -qscale:v 6 seg2/$3.mov; }
fx 585 814 F5 & fx 1140 1180 F9 & fx 1775 2275 F14 & wait
: > seg2/list.txt
for f in S1 S2 S3 S4 F5 S678 F9 S10 S1112 S13 F14; do echo "file '$PWD/seg2/$f.mov'" >> seg2/list.txt; done
O=../Apelo_Proibicoes_REALISTA_ALPHA_drone_16x9.mov
ffmpeg -v error -y -f concat -safe 0 -i seg2/list.txt -i xblack.png -i $V \
  -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuva444p10le[v]" -map "[v]" -map 2:a \
  -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -vendor apl0 -qscale:v 6 -c:a pcm_s16le -r 25 $O
ffmpeg -v error -y -f lavfi -i "color=c=0x303030:s=1920x1080:r=25:d=91" -i $O \
  -filter_complex "[0:v][1:v]overlay=0:0:shortest=1,scale=1280:-2[v]" -map "[v]" -map 1:a \
  -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k ../Apelo_Proibicoes_REALISTA_ALPHA_preview720.mp4
echo "ok: $O"

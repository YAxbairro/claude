#!/usr/bin/env bash
# Versão 4 das proibições: overlay em alpha SEM logos + logos num PNG à parte.
# Gera ../Apelo_Proibicoes_V4_OVERLAY_ALPHA_16x9.mov, ../Apelo_Proibicoes_LOGOS_1920x1080.png e a prévia 720p.
set -e
cd "$(dirname "$0")"
V=../Apelo_Proibicoes_FINAL_16x9.mp4
# grafismos e textos novos (html/proib.html) -> hfr/
for r in "82 145" "478 585" "893 1012" "1180 1633"; do node html/shot.js html/proib.html hfr $r 4; done
mkdir -p seg4
for s in S1 S2 S3 S4 S678 S10 S1112 S13 F14; do python3 segs4.py $s & done; wait
cp seg3/F5.mov seg3/F9.mov seg4/
: > seg4/list.txt
for f in S1 S2 S3 S4 F5 S678 F9 S10 S1112 S13 F14; do echo "file '$PWD/seg4/$f.mov'" >> seg4/list.txt; done
O=../Apelo_Proibicoes_V4_OVERLAY_ALPHA_16x9.mov
ffmpeg -v error -y -f concat -safe 0 -i seg4/list.txt -i $V -map 0:v -map 1:a \
  -c:v prores_ks -profile:v 4 -pix_fmt yuva444p10le -vendor apl0 -qscale:v 6 -c:a pcm_s16le -r 25 $O
python3 -c "
from eng import *
b=Image.new('RGBA',(W,H),(0,0,0,0)); logos(b); b.alpha_composite(Image.open('xblack.png').convert('RGBA')); b.save('../Apelo_Proibicoes_LOGOS_1920x1080.png')"
ffmpeg -v error -y -f lavfi -i "color=c=0x303030:s=1920x1080:r=25:d=91" -i $O -loop 1 -i ../Apelo_Proibicoes_LOGOS_1920x1080.png \
  -filter_complex "[0:v][1:v]overlay=0:0:shortest=1[a];[a][2:v]overlay=0:0:enable='lt(t,88.44)',scale=1280:-2[v]" -map "[v]" -map 1:a -t 91 \
  -c:v libx264 -crf 23 -preset fast -c:a aac -b:a 128k ../Apelo_Proibicoes_V4_preview720.mp4
echo "ok: $O"

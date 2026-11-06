#!/usr/bin/env bash
# Renderiza os 2 vídeos (estilo B) em MP4 1080p25 com a locução. Requisitos: python3 (numpy, pillow), ffmpeg.
set -e
cd "$(dirname "$0")"; mkdir -p tmp
r(){ python3 novos.py $1 $2 $3 tmp/$1_$4.mp4; }
r V1 0 1110 a & r V1 1110 2219 b & r V2 0 804 a & r V2 804 1607 c & wait
mux(){ printf "file '%s'\nfile '%s'\n" "$PWD/tmp/$1_$2.mp4" "$PWD/tmp/$1_$3.mp4" > tmp/$1.txt
  ffmpeg -v error -y -f concat -safe 0 -i tmp/$1.txt -i $4 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest ../$5; }
mux V1 a b audio/V1_acesso.mp3 CNE_Acesso_Permanencia_Assembleias_16x9.mp4
mux V2 a c audio/V2_membros.mp3 CNE_Membros_Assembleias_Voto_16x9.mp4
echo ok

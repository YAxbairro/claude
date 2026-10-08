# CNE Explica – Ep. 1 · Motions

Overlay com fundo transparente (1920x1080, 23.976 fps, 120.45 s) feito em Remotion.
Os tempos de cada motion estão em `src/Overlay.tsx`; cores e fontes em `src/theme.ts`.

```bash
npm install
npm run studio   # pré-visualizar e ajustar
npx remotion render src/index.ts CneExplicaEp1 out/seq --sequence --image-format=png
ffmpeg -framerate 24000/1001 -i out/seq/element-%04d.png -c:v qtrle -pix_fmt argb out/overlay.mov
```

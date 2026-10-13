// Controlo de qualidade: renderiza frames num intervalo (passo fixo) e monta folhas de contacto.
// Uso: node qc.mjs <composition.html> <pasta_saida> <de> <ate> [passo=0.1]
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const [comp, outDir, from, to, step = '0.1'] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--allow-file-access-from-files', '--disable-web-security', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
pg.on('pageerror', (e) => console.error('pageerror:', e.message));
await pg.goto(pathToFileURL(path.resolve(comp)).href);
await pg.waitForFunction(() => typeof window.renderFrame === 'function' && window.READY !== false, null, { timeout: 60000 });
await pg.evaluate(() => document.fonts.ready);
const files = [];
for (let t = Number(from); t <= Number(to) + 1e-6; t += Number(step)) {
  await pg.evaluate((tt) => window.renderFrame(tt), t);
  const f = path.join(outDir, `f_${t.toFixed(2)}.jpg`);
  await pg.screenshot({ path: f, type: 'jpeg', quality: 80 });
  files.push(f);
}
await b.close();
execFileSync('python3', ['-I', '-c', `
import sys
from PIL import Image, ImageDraw
fs=sys.argv[2:]; cols=8; w,h=270,480
rows=(len(fs)+cols-1)//cols
S=Image.new('RGB',(cols*w,rows*(h+22)),'white'); d=ImageDraw.Draw(S)
for i,f in enumerate(fs):
  im=Image.open(f).resize((w,h)); x,y=(i%cols)*w,(i//cols)*(h+22); S.paste(im,(x,y)); d.text((x+4,y+h+4),f.split('_')[-1][:-4],fill='black')
S.save(sys.argv[1],quality=85)`, path.join(outDir, 'sheet.jpg'), ...files]);
console.log('sheet', path.join(outDir, 'sheet.jpg'), files.length, 'frames');

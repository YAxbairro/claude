// Eagle Motion Engine — renders a composition HTML frame by frame.
// The composition must define window.COMP = { width, height, fps, duration }
// and window.renderFrame(t) which draws the frame at time t (seconds) deterministically.
//
// Usage: node render.mjs <composition.html> <out.mp4> [--audio file] [--from s] [--to s] [--still s out.png]
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const [compPath, outPath] = args;
if (!compPath || !outPath) {
  console.error('usage: node render.mjs <composition.html> <out.mp4> [--audio f] [--from s] [--to s] [--still s]');
  process.exit(1);
}

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--allow-file-access-from-files', '--disable-web-security', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.error('pageerror:', e.message));
page.on('console', (m) => m.type() === 'error' && console.error('console:', m.text()));
await page.goto(pathToFileURL(path.resolve(compPath)).href);
// composições com WebGL/texturas assinalam window.READY = true quando prontas
await page.waitForFunction(() => typeof window.renderFrame === 'function' && window.READY !== false, null, { timeout: 60000 });
await page.evaluate(() => document.fonts.ready);
const comp = await page.evaluate(() => window.COMP);
await page.setViewportSize({ width: comp.width, height: comp.height });
await page.evaluate(() => (window.prepare ? window.prepare() : null));

const still = opt('--still');
if (still !== undefined) {
  await page.evaluate((t) => window.renderFrame(t), Number(still));
  await page.screenshot({ path: outPath, type: 'png' });
  await browser.close();
  console.log(`still ${still}s -> ${outPath}`);
  process.exit(0);
}

const from = Number(opt('--from') ?? 0);
const to = Number(opt('--to') ?? comp.duration);
const audio = opt('--audio');
const total = Math.round((to - from) * comp.fps);

const ffArgs = ['-y', '-f', 'image2pipe', '-framerate', String(comp.fps), '-i', '-'];
// pós-produção: grão de filme + marca d'água (fora do browser, evita bugs de composição sobre WebGL)
const overlay = args.includes('--no-watermark') ? null : new URL('./watermark.png', import.meta.url).pathname;
const grain = Number(opt('--grain') ?? 3);
if (overlay) ffArgs.push('-i', overlay);
if (audio) ffArgs.push('-ss', String(from), '-i', audio);
const vf = `[0:v]${grain > 0 ? `noise=alls=${grain}:allf=t,` : ''}format=yuv420p[base]` + (overlay ? `;[base][1:v]overlay=0:0:format=auto,format=yuv420p[v]` : '');
ffArgs.push('-filter_complex', vf, '-map', overlay ? '[v]' : '[base]');
if (audio) ffArgs.push('-map', `${overlay ? 2 : 1}:a`);
ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-maxrate', '12M', '-bufsize', '24M', '-movflags', '+faststart');
if (audio) ffArgs.push('-c:a', 'aac', '-b:a', '192k', '-shortest');
ffArgs.push(outPath);
const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'ignore', 'inherit'] });

for (let f = 0; f < total; f++) {
  const t = from + f / comp.fps;
  await page.evaluate((tt) => window.renderFrame(tt), t);
  const buf = await page.screenshot({ type: 'jpeg', quality: 95 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  if (f % comp.fps === 0) process.stdout.write(`\r${f}/${total}`);
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
await browser.close();
console.log(`\ndone -> ${outPath}`);

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
  args: ['--allow-file-access-from-files', '--disable-web-security'],
});
const page = await browser.newPage();
await page.goto(pathToFileURL(path.resolve(compPath)).href);
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
if (audio) ffArgs.push('-ss', String(from), '-i', audio);
ffArgs.push('-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart');
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

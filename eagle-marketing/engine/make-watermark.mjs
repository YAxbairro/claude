// Gera a marca d'água Eagle (PNG transparente 1080x1920) aplicada em pós-produção pelo ffmpeg.
import { chromium } from 'playwright';
import { pathToFileURL } from 'node:url';
const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--allow-file-access-from-files'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(pathToFileURL(new URL('./watermark.html', import.meta.url).pathname).href);
await p.evaluate(() => document.fonts.ready);
await p.screenshot({ path: new URL('./watermark.png', import.meta.url).pathname, omitBackground: true });
await b.close();
console.log('watermark.png ok');

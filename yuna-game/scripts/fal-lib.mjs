// Minimal fal.ai client used by the asset scripts. Reads FAL_KEY from ../.env
// and keeps a running cost ledger in art-cache/ledger.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const CACHE = path.join(ROOT, 'art-cache');
export const PUBLIC = path.join(ROOT, 'public', 'assets');
fs.mkdirSync(CACHE, { recursive: true });

function loadKey() {
  if (process.env.FAL_KEY) return process.env.FAL_KEY;
  const env = fs.readFileSync(path.join(ROOT, '.env'), 'utf8');
  const m = env.match(/^FAL_KEY=(.+)$/m);
  if (!m) throw new Error('FAL_KEY missing in .env');
  return m[1].trim();
}
const KEY = loadKey();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function ledger(entry) {
  fs.appendFileSync(path.join(CACHE, 'ledger.jsonl'), JSON.stringify({ t: new Date().toISOString(), ...entry }) + '\n');
}

export function spent() {
  const f = path.join(CACHE, 'ledger.jsonl');
  if (!fs.existsSync(f)) return 0;
  return fs.readFileSync(f, 'utf8').trim().split('\n').filter(Boolean).reduce((s, l) => s + (JSON.parse(l).cost || 0), 0);
}

// Hard stop so a runaway script can never burn the whole balance.
const BUDGET = Number(process.env.FAL_BUDGET || 9.5);

export async function falRun(endpoint, input, { cost = 0, label = '' } = {}) {
  if (spent() + cost > BUDGET) throw new Error(`budget guard: spent ${spent().toFixed(2)} + ${cost} > ${BUDGET}`);
  // Queue API: submit, poll, fetch. Works for slow models without HTTP timeouts.
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const sub = await fetch(`https://queue.fal.run/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Key ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (sub.status === 429) { await sleep(4000 * (attempt + 1)); continue; }
      const s = await sub.json();
      if (!sub.ok) throw new Error(`${endpoint} submit ${sub.status}: ${JSON.stringify(s).slice(0, 400)}`);
      const { status_url, response_url } = s;
      for (let i = 0; i < 600; i++) {
        await sleep(i < 5 ? 1000 : 2000);
        const st = await (await fetch(status_url, { headers: { Authorization: `Key ${KEY}` } })).json();
        if (st.status === 'COMPLETED') break;
        if (st.status === 'FAILED' || st.error) throw new Error(`${endpoint} failed: ${JSON.stringify(st).slice(0, 400)}`);
      }
      const res = await fetch(response_url, { headers: { Authorization: `Key ${KEY}` } });
      const out = await res.json();
      if (!res.ok) throw new Error(`${endpoint} result ${res.status}: ${JSON.stringify(out).slice(0, 400)}`);
      ledger({ endpoint, label, cost });
      return out;
    } catch (e) {
      lastErr = e;
      await sleep(3000 * (attempt + 1));
    }
  }
  throw lastErr;
}

export async function download(url, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url);
    if (r.ok) { fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); return dest; }
    await sleep(2000 * (attempt + 1));
  }
  throw new Error('download failed ' + url);
}

export function dataUri(file) {
  const ext = path.extname(file).slice(1).replace('jpg', 'jpeg');
  return `data:image/${ext};base64,${fs.readFileSync(file).toString('base64')}`;
}

// Run async jobs with bounded concurrency; failures are logged, not fatal.
export async function pool(items, limit, fn) {
  const results = [];
  let i = 0;
  const workers = Array.from({ length: limit }, async () => {
    while (i < items.length) {
      const idx = i++;
      try { results[idx] = await fn(items[idx], idx); }
      catch (e) { console.error('FAIL', items[idx]?.id ?? idx, e.message); results[idx] = null; }
    }
  });
  await Promise.all(workers);
  return results;
}

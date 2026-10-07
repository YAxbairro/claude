// Builds artifact/index.html: the built game with CSS and JS inlined, for
// publishing as a claude.ai Artifact (assets are published next to it).
import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html', 'utf8');
const js = html.match(/src="\.\/(assets\/index-[^"]+\.js)"/)[1];
const css = html.match(/href="\.\/(assets\/index-[^"]+\.css)"/)[1];
const code = fs.readFileSync('dist/' + js, 'utf8').replace(/<\/script/gi, '<\\/script');
const style = fs.readFileSync('dist/' + css, 'utf8').replace(/<\/style/gi, '<\\/style');
const page = `<title>Ilhas da Yuna</title>
<meta name="theme-color" content="#1fb5d1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&display=swap">
<style>${style}</style>
<div id="app"></div>
<div id="boot"><div class="boot-spinner"></div></div>
<script>window.__MODEL_EXT = 'gltf.json';</script>
<script type="module">${code}</script>
`;
fs.mkdirSync('artifact', { recursive: true });
fs.writeFileSync('artifact/index.html', page);
// GLB → self-contained glTF JSON (binary chunk as a base64 data URI).
for (const f of fs.readdirSync('dist/assets/3d')) {
  if (!f.endsWith('.glb')) continue;
  const b = fs.readFileSync('dist/assets/3d/' + f);
  let o = 12, json = null, bin = null;
  while (o < b.length) {
    const len = b.readUInt32LE(o), type = b.readUInt32LE(o + 4);
    const chunk = b.subarray(o + 8, o + 8 + len);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8'));
    else if (type === 0x004e4942) bin = chunk;
    o += 8 + len;
  }
  if (bin) json.buffers[0].uri = 'data:application/octet-stream;base64,' + bin.toString('base64');
  fs.writeFileSync('dist/assets/3d/' + f.replace(/\.glb$/, '.gltf.json'), JSON.stringify(json));
}
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(d + '/' + e.name) : files.push((d + '/' + e.name).slice(5)));
walk('dist/assets');
const assets = files.filter((f) => !/assets\/index-/.test(f) && !f.endsWith('.glb'));
fs.writeFileSync('artifact/files.json', JSON.stringify(assets));
console.log('page KB', Math.round(page.length / 1024), 'assets', assets.length);

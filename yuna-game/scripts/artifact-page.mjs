// Builds artifact/index.html: the built game with CSS and JS inlined, for
// publishing as a claude.ai Artifact (assets are published next to it).
import fs from 'node:fs';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
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
<script>window.__MODEL_EXT = 'glb.json';</script>
<script type="module">${code}</script>
`;
fs.mkdirSync('artifact', { recursive: true });
fs.writeFileSync('artifact/index.html', page);
// GLB → JSON-wrapped GLB with plain (not meshopt) geometry: the artifact
// sandbox blocks WebAssembly, so the page can't run the meshopt decoder.
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
await MeshoptDecoder.ready;
for (const f of fs.readdirSync('dist/assets/3d')) {
  if (!f.endsWith('.glb')) continue;
  const doc = await io.read('dist/assets/3d/' + f);
  doc.getRoot().listExtensionsUsed().filter((e) => e.extensionName === 'EXT_meshopt_compression').forEach((e) => e.dispose());
  const glb = await io.writeBinary(doc);
  // The page decodes this itself: the sandbox refuses fetch() of data: URLs.
  fs.writeFileSync('dist/assets/3d/' + f.replace(/\.glb$/, '.glb.json'), JSON.stringify({ glb: Buffer.from(glb).toString('base64') }));
}
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(d + '/' + e.name) : files.push((d + '/' + e.name).slice(5)));
walk('dist/assets');
const assets = files.filter((f) => !/assets\/index-/.test(f) && !f.endsWith('.glb'));
fs.writeFileSync('artifact/files.json', JSON.stringify(assets));
console.log('page KB', Math.round(page.length / 1024), 'assets', assets.length);

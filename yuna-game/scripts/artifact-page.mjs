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
<script type="module">${code}</script>
`;
fs.mkdirSync('artifact', { recursive: true });
fs.writeFileSync('artifact/index.html', page);
const files = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => e.isDirectory() ? walk(d + '/' + e.name) : files.push((d + '/' + e.name).slice(5)));
walk('dist/assets');
const assets = files.filter((f) => !/assets\/index-/.test(f));
fs.writeFileSync('artifact/files.json', JSON.stringify(assets));
console.log('page KB', Math.round(page.length / 1024), 'assets', assets.length);

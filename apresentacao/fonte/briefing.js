const pptxgen = require('pptxgenjs');
const React = require('react');
const RDS = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa6');
const { applyTheme } = require('/root/.claude/skills/synced/697f35d2-71f8-488a-bf0b-d050bb861829_51ef8d69-e975-4c85-b071-ead1057c1bf2/pptx/scripts/apply_theme.js');
const OUT = process.argv[2];

const N = '#012776', B2 = '#0A3A9E', B3 = '#1E56C8', MB = '#36659E', SKY = '#6E98E8', L = '#ECFA4D', CR = '#FCF5E2';
const THEME = { name: 'Conecta Diaspora', headFontFace: 'Impact', bodyFontFace: 'Calibri',
  colors: { dk1: '0B1B4D', lt1: 'FFFFFF', dk2: '012776', lt2: 'FCF5E2', accent1: 'ECFA4D', accent2: '0A3A9E',
    accent3: '1E56C8', accent4: '36659E', accent5: '6E98E8', accent6: 'C9D3E8', hlink: '1E56C8', folHlink: '36659E' } };

// ---------- SVG art helpers (canvas 1920x1080, 144 px per inch) ----------
const band = (cx, cy, r, w, c, o = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" opacity="${o}"/>`;
const disc = (cx, cy, r, c, o = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="${o}"/>`;
function waves(x0, x1, y0, n, gap, amp, period, c, o, sw = 2) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const pts = [];
    for (let x = x0; x <= x1; x += 16) pts.push(`${x},${(y0 + i * gap + amp * Math.sin((x / period) * 2 * Math.PI + i * 0.35)).toFixed(1)}`);
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${c}" stroke-width="${sw}" opacity="${o}"/>`;
  }
  return s;
}
function ridge(x0, x1, base, peaks, c, o = 1) {
  // peaks: [[x, y], ...] smooth mountain silhouette closed to the bottom
  let d = `M${x0},1080 L${x0},${base}`;
  for (const p of [...peaks, [x1, base]]) d += ` L${p[0]},${p[1]}`;
  d += ` L${x1},1080 Z`;
  return `<path d="${d}" fill="${c}" opacity="${o}"/>`;
}
const ISL = [ // name, lon, lat, rx, ry, rot
  ['Santo Antão', -25.17, 17.05, .22, .13, -20], ['São Vicente', -24.97, 16.84, .1, .06, 0], ['Santa Luzia', -24.75, 16.76, .045, .03, 0],
  ['São Nicolau', -24.27, 16.6, .2, .06, -12], ['Sal', -22.93, 16.73, .06, .13, 0], ['Boa Vista', -22.82, 16.1, .16, .14, 10],
  ['Maio', -23.18, 15.22, .08, .1, 0], ['Santiago', -23.62, 15.08, .14, .23, 15], ['Fogo', -24.38, 14.93, .1, .1, 0], ['Brava', -24.7, 14.85, .05, .05, 0]];
function constellation(ox, oy, k, targets, opt = {}) {
  const P = ISL.map(([n, lon, lat, rx, ry, rot]) => ({ n, x: ox + (lon + 25.4) * k, y: oy + (17.3 - lat) * k, rx: rx * k, ry: ry * k, rot }));
  const by = Object.fromEntries(P.map(p => [p.n, p]));
  let s = '';
  // inter-island network
  const links = [['Santo Antão', 'São Nicolau'], ['São Vicente', 'Sal'], ['São Nicolau', 'Boa Vista'], ['Sal', 'Boa Vista'], ['Boa Vista', 'Maio'], ['Maio', 'Santiago'], ['Santiago', 'Fogo'], ['Fogo', 'Brava'], ['São Nicolau', 'Santiago']];
  for (const [a, b] of links) s += `<line x1="${by[a].x}" y1="${by[a].y}" x2="${by[b].x}" y2="${by[b].y}" stroke="${opt.net || SKY}" stroke-width="2" opacity=".7"/>`;
  // diaspora arcs from Praia
  const pr = { x: by['Santiago'].x + .03 * k, y: by['Santiago'].y + .17 * k };
  for (const [tx, ty, bend = 0.22] of targets) {
    const mx = (pr.x + tx) / 2, my = (pr.y + ty) / 2, dx = tx - pr.x, dy = ty - pr.y;
    const cx = mx - dy * bend, cy = my + dx * bend;
    s += `<path d="M${pr.x},${pr.y} Q${cx},${cy} ${tx},${ty}" fill="none" stroke="${L}" stroke-width="${opt.arc || 3}"/>`;
    s += disc(tx, ty, opt.dot || 8, L);
  }
  for (const p of P) s += `<ellipse cx="${p.x}" cy="${p.y}" rx="${p.rx}" ry="${p.ry}" transform="rotate(${p.rot} ${p.x} ${p.y})" fill="${opt.isl || CR}"/>`;
  for (const p of P) s += disc(p.x, p.y, 5, opt.node || '#FFFFFF');
  s += disc(pr.x, pr.y, 11, L) + band(pr.x, pr.y, 20, 3, L, .8);
  return s;
}
const svg = (bg, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080"><rect width="1920" height="1080" fill="${bg}"/>${body}</svg>`;
async function png(svgStr) { return 'image/png;base64,' + (await sharp(Buffer.from(svgStr)).png().toBuffer()).toString('base64'); }
async function icon(Comp, color) {
  const s = RDS.renderToStaticMarkup(React.createElement(Comp, { color, size: 256 }));
  return 'image/png;base64,' + (await sharp(Buffer.from(s)).resize(256, 256).png().toBuffer()).toString('base64');
}


(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'Conecta Diáspora 2027 — Briefing';
  pres.author = 'Equipa organizadora Conecta Diáspora';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  const foot = (c) => ({ text: { text: 'CONECTA DIÁSPORA  ·  2027', options: { x: 0.8, y: 7.0, w: 4, h: 0.25, fontSize: 9, bold: true, charSpacing: 4, color: c, margin: 0, fontFace: 'Calibri' } } });
  const titlePh = (c) => ({ placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 0.85, w: 11.5, h: 0.9, fontSize: 44, color: c, fontFace: 'Impact', align: 'left', valign: 'top', margin: 0 }, text: '' } });
  pres.defineSlideMaster({ title: 'ESCURO', background: { color: C.text2 }, objects: [foot(C.accent5), titlePh(C.background2)] });
  pres.defineSlideMaster({ title: 'CREME', background: { color: C.background2 }, objects: [foot(C.accent4), titlePh(C.text2)] });
  pres.defineSlideMaster({ title: 'IMPACTO', background: { color: C.text2 }, objects: [] });

  const T = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontFace: 'Calibri', ...o });
  const H = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontFace: 'Impact', ...o });
  const label = (s, text, x, y, color, w = 6) => T(s, text, { x, y, w, h: 0.3, fontSize: 13, bold: true, charSpacing: 5, color });
  const src = (s, text, color) => T(s, text, { x: 4.6, y: 6.97, w: 8.0, h: 0.3, fontSize: 9, italic: true, color, align: 'right' });
  const rect = (s, x, y, w, h, color, name, r = 0.12) => s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: r, fill: { color }, line: { color }, objectName: name });

  // ---------- 1. CAPA ----------
  pres.addSection({ title: 'Abertura' });
  let s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Abertura' });
  s.background = { data: await png(svg(N,
    band(1850, 1250, 760, 110, B3) + band(1850, 1250, 640, 80, L) + band(1850, 1250, 525, 100, CR) + band(1850, 1250, 400, 90, B2) + disc(1850, 1250, 330, MB, .55) +
    waves(0, 640, 1000, 4, 16, 9, 260, SKY, .28) +
    constellation(1180, 70, 185, [[1925, 60, -0.18], [1925, 420, 0.15], [1080, 20, 0.2]]))) };
  label(s, 'BRIEFING DO EVENTO', 0.8, 0.75, C.accent1);
  H(s, 'CONECTA', { x: 0.8, y: 1.2, w: 6.4, h: 1.45, fontSize: 104, color: C.background2 });
  H(s, 'DIÁSPORA', { x: 0.8, y: 2.72, w: 6.4, h: 1.45, fontSize: 104, color: C.accent1 });
  T(s, '2  0  2  7', { x: 0.8, y: 4.25, w: 4, h: 0.5, fontSize: 30, color: C.background1, charSpacing: 6 });
  T(s, 'Investimento, empreendedorismo e networking entre Cabo Verde e a sua diáspora', { x: 0.8, y: 4.95, w: 6.3, h: 0.85, fontSize: 22, bold: true, color: C.background1, valign: 'top' });
  T(s, '4 DE JANEIRO DE 2027  ·  CIDADE DA PRAIA', { x: 0.8, y: 6.3, w: 6.5, h: 0.35, fontSize: 15, bold: true, charSpacing: 3, color: C.accent1 });

  // ---------- 2. DIMENSÃO DA DIÁSPORA ----------
  pres.addSection({ title: 'Contexto' });
  s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Contexto' });
  s.background = { data: await png(svg(N,
    constellation(1250, 260, 175, [[1925, 120, -0.2], [1925, 560, 0.1], [1925, 980, 0.18], [1180, 1085, -0.2], [1120, 40, 0.22]], { arc: 3, dot: 9 }) +
    waves(1100, 1920, 1010, 3, 16, 8, 240, SKY, .22))) };
  label(s, 'CONTEXTO', 0.8, 0.75, C.accent1);
  H(s, 'CABO VERDE É MAIOR DO QUE AS SUAS ILHAS', { x: 0.8, y: 1.1, w: 7.2, h: 1.6, fontSize: 44, color: C.background2, valign: 'top' });
  H(s, '1,5 MILHÃO', { x: 0.8, y: 2.65, w: 6.6, h: 1.5, fontSize: 100, color: C.accent1 });
  T(s, 'de cabo-verdianos e descendentes vivem na diáspora, em mais de 40 países', { x: 0.8, y: 4.15, w: 6.2, h: 0.7, fontSize: 19, color: C.background1, valign: 'top' });
  // comparison bars
  const bw = 6.2;
  T(s, 'DIÁSPORA', { x: 0.8, y: 5.05, w: 2, h: 0.28, fontSize: 11, bold: true, charSpacing: 3, color: C.accent1 });
  rect(s, 0.8, 5.35, bw, 0.32, C.accent1, 'barra-diaspora', 0.05);
  T(s, '≈ 1 500 000', { x: 0.8, y: 5.35, w: bw - 0.15, h: 0.32, fontSize: 13, bold: true, color: C.text2, align: 'right', valign: 'middle' });
  T(s, 'RESIDENTES', { x: 0.8, y: 5.82, w: 2, h: 0.28, fontSize: 11, bold: true, charSpacing: 3, color: C.background2 });
  rect(s, 0.8, 6.12, bw * 511534 / 1500000, 0.32, C.background2, 'barra-residentes', 0.05);
  T(s, '511 534', { x: 0.8 + bw * 511534 / 1500000 + 0.15, y: 6.12, w: 2, h: 0.32, fontSize: 13, bold: true, color: C.background2, valign: 'middle' });
  T(s, 'O triplo da população residente.', { x: 3.6, y: 6.12, w: 3.5, h: 0.32, fontSize: 14, italic: true, color: C.accent6, valign: 'middle', align: 'right' });
  src(s, 'Fontes: Governo de Cabo Verde / Ministério das Comunidades (2023), via Lusa; INE Cabo Verde, estimativa 2024.', C.accent5);

  // ---------- 3. REMESSAS ----------
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'Contexto' });
  s.background = { data: await png(svg(CR, band(1920, 0, 260, 44, L) + band(1920, 0, 200, 26, B3) + disc(1920, 0, 160, N) + waves(0, 1920, 1000, 3, 16, 8, 320, MB, .2))) };
  s.addText('A DIÁSPORA JÁ SUSTENTA A ECONOMIA', { placeholder: 'title' });
  const st = [['30,6', 'mil milhões de escudos (≈ 278 M€) em remessas em 2024 — recorde histórico'], ['11,6%', 'do PIB de Cabo Verde vem das remessas dos emigrantes'], ['≈ 3×', 'o investimento direto estrangeiro, que ficou em 4,0% do PIB']];
  st.forEach(([n, d], i) => {
    const x = 0.8 + i * 4.0;
    H(s, n, { x, y: 1.9, w: 3.7, h: 1.35, fontSize: 84, color: i === 2 ? C.accent3 : C.text2 });
    T(s, d, { x, y: 3.3, w: 3.45, h: 0.85, fontSize: 16, color: C.text1, valign: 'top' });
  });
  label(s, 'DE ONDE VÊM AS REMESSAS', 0.8, 4.65, C.accent4);
  const orig = [['Portugal', 32, C.text2, C.background1], ['EUA', 29, C.accent3, C.background1], ['França', 19, C.accent5, C.text2], ['Outros', 20, C.accent6, C.text2]];
  let ox = 0.8; const tw = 11.7;
  orig.forEach(([n, p, c, tc]) => {
    const w = tw * p / 100;
    s.addShape(pres.shapes.RECTANGLE, { x: ox, y: 5.05, w: w - 0.04, h: 0.75, fill: { color: c }, line: { color: c }, objectName: 'origem-' + n });
    T(s, [{ text: p + '%  ', options: { bold: true, fontSize: 20 } }, { text: n, options: { fontSize: 14 } }], { x: ox + 0.2, y: 5.05, w: w - 0.3, h: 0.75, color: tc, valign: 'middle' });
    ox += w;
  });
  T(s, 'Portugal, EUA e França somam 80% das remessas: é aí que está a diáspora com capacidade de investir.', { x: 0.8, y: 6.0, w: 11.5, h: 0.4, fontSize: 15, bold: true, color: C.text2 });
  src(s, 'Fonte: Banco de Cabo Verde — Relatório do Estado da Economia 2024; dados de remessas 2024.', C.accent4);

  // ---------- 4. TURISMO ----------
  s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Contexto' });
  s.background = { data: await png(svg(N,
    disc(1500, 760, 210, L) + band(1500, 760, 265, 14, L, .5) + band(1500, 760, 320, 6, L, .25) +
    ridge(860, 1920, 1080, [[960, 960], [1080, 870], [1170, 910], [1290, 790], [1400, 860], [1520, 800], [1660, 700], [1780, 820], [1920, 760]], B3) +
    ridge(860, 1920, 1080, [[1000, 1020], [1140, 950], [1260, 990], [1420, 900], [1560, 960], [1700, 890], [1840, 950], [1920, 925]], B2) +
    waves(860, 1920, 1030, 3, 14, 6, 200, SKY, .35))) };
  label(s, 'TURISMO', 0.8, 0.75, C.accent1);
  H(s, 'O MOTOR DO PAÍS — E A DIÁSPORA TAMBÉM VISITA', { x: 0.8, y: 1.1, w: 11.5, h: 0.9, fontSize: 44, color: C.background2 });
  H(s, '25%', { x: 0.8, y: 2.25, w: 3.2, h: 1.4, fontSize: 92, color: C.accent1 });
  T(s, 'do PIB vem do turismo', { x: 0.8, y: 3.65, w: 3.0, h: 0.45, fontSize: 17, color: C.background1 });
  H(s, '981 MIL', { x: 4.3, y: 2.25, w: 4.0, h: 1.4, fontSize: 92, color: C.background2 });
  T(s, 'hóspedes em 2024, o máximo de sempre', { x: 4.3, y: 3.65, w: 3.6, h: 0.45, fontSize: 17, color: C.background1 });
  T(s, [{ text: 'Nas férias de verão e de fim de ano, milhares de emigrantes voltam a casa. ', options: { bold: true, color: C.background1 } },
        { text: 'Consomem, visitam, avaliam terrenos e negócios. Mas não existe um momento organizado para transformar essa visita em investimento.', options: { color: C.accent6 } }],
    { x: 0.8, y: 4.6, w: 6.6, h: 1.5, fontSize: 18, valign: 'top', lineSpacingMultiple: 1.1 });
  src(s, 'Fontes: Banco Mundial; INE Cabo Verde — estatísticas do turismo 2024.', C.accent5);

  // ---------- 5. O PROBLEMA ----------
  pres.addSection({ title: 'Problema e solução' });
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'Problema e solução' });
  s.background = { data: await png(svg(CR, `<rect x="0" y="0" width="640" height="1080" fill="${N}"/>` + waves(0, 640, 1000, 3, 16, 8, 240, SKY, .22) + waves(640, 1920, 1000, 3, 16, 8, 320, MB, .2))) };
  label(s, 'A VONTADE EXISTE', 0.6, 0.85, C.accent1, 3.6);
  H(s, '15% → 18,2%', { x: 0.6, y: 1.3, w: 3.8, h: 0.8, fontSize: 40, color: C.accent1 });
  T(s, 'peso da diáspora no PIB em três anos', { x: 0.6, y: 2.15, w: 3.5, h: 0.4, fontSize: 14, color: C.background1 });
  T(s, [{ text: 'Estatuto do Investidor da Diáspora', options: { bold: true, breakLine: true } }, { text: 'em vigor desde 2020', options: { color: C.accent6, breakLine: true } },
        { text: ' ', options: { fontSize: 8, breakLine: true } },
        { text: 'A diáspora quer ir além das remessas:', options: { bold: true, breakLine: true } }, { text: 'competências, formação e investimento', options: { color: C.accent6 } }],
    { x: 0.6, y: 2.95, w: 3.6, h: 2.2, fontSize: 15, color: C.background1, valign: 'top' });
  H(s, 'MAS O CAMINHO ESTÁ BLOQUEADO', { x: 5.0, y: 0.85, w: 7.8, h: 0.9, fontSize: 44, color: C.text2 });
  const bar = [[fa.FaFileCircleExclamation, 'BUROCRACIA', 'Processos lentos, pouco claros e difíceis de acompanhar à distância.'],
    [fa.FaCircleQuestion, 'INFORMAÇÃO DISPERSA', 'Não se sabe onde começar, que apoios existem nem a quem perguntar.'],
    [fa.FaLinkSlash, 'ELO DE COMUNICAÇÃO', 'As iniciativas do Estado com as comunidades estiveram interrompidas desde 2016.'],
    [fa.FaHandshakeSlash, 'FALTA DE CONFIANÇA', 'Sem parceiros conhecidos no terreno, o investimento fica adiado.']];
  for (let i = 0; i < 4; i++) {
    const [ic, h, d] = bar[i], col = i % 2, row = Math.floor(i / 2), x = 5.0 + col * 3.95, y = 2.0 + row * 1.85;
    rect(s, x, y, 3.7, 1.6, C.background1, 'travao');
    s.addShape(pres.shapes.OVAL, { x: x + 0.22, y: y + 0.22, w: 0.56, h: 0.56, fill: { color: C.text2 }, line: { color: C.text2 }, objectName: 'icone' });
    s.addImage({ data: await icon(ic, L), x: x + 0.36, y: y + 0.36, w: 0.28, h: 0.28, altText: h });
    H(s, h, { x: x + 0.95, y: y + 0.25, w: 2.6, h: 0.5, fontSize: 19, color: C.text2, valign: 'middle' });
    T(s, d, { x: x + 0.25, y: y + 0.88, w: 3.25, h: 0.65, fontSize: 13, color: C.text1, valign: 'top' });
  }
  T(s, [{ text: '“Redução da burocracia e criação de condições favoráveis ao investimento.”', options: { italic: true, bold: true, color: C.text2, breakLine: true } },
        { text: 'Primeiro-ministro de Cabo Verde, Lisboa, 2026', options: { fontSize: 12, color: C.accent4 } }],
    { x: 5.0, y: 5.8, w: 7.7, h: 0.7, fontSize: 16, valign: 'top' });
  src(s, 'Fontes: Ministério das Comunidades (2023), via Lusa; Forbes África Lusófona, nov. 2026.', C.accent4);

  // ---------- 6. A SOLUÇÃO ----------
  s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Problema e solução' });
  s.background = { data: await png(svg(N,
    waves(0, 900, 1010, 3, 16, 8, 240, SKY, .22) +
    band(1920, 1080, 300, 70, CR) + band(1920, 1080, 205, 55, L) + disc(1920, 1080, 150, B3) +
    constellation(1110, 140, 215, [[1925, 200, -0.18], [1925, 700, 0.12], [1150, 30, 0.22]], { arc: 4, dot: 10 }))) };
  label(s, 'A RESPOSTA', 0.8, 0.75, C.accent1);
  H(s, [{ text: 'UM EVENTO PARA', options: { color: C.background2, breakLine: true } }, { text: 'TRANSFORMAR', options: { color: C.background2, breakLine: true } },
    { text: 'LIGAÇÃO EM', options: { color: C.background2, breakLine: true } }, { text: 'INVESTIMENTO.', options: { color: C.accent1 } }],
    { x: 0.8, y: 1.2, w: 6.8, h: 4.2, fontSize: 66, lineSpacingMultiple: 0.95, valign: 'top' });
  T(s, 'Investidores e quadros da diáspora, empreendedores locais e as instituições que decidem, na mesma sala, no momento em que a diáspora está no país.',
    { x: 0.8, y: 5.5, w: 6.4, h: 1.2, fontSize: 18, color: C.accent6, lineSpacingMultiple: 1.1, valign: 'top' });

  // ---------- 7. O QUE O EVENTO ENTREGA ----------
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'Problema e solução' });
  s.background = { data: await png(svg(CR, waves(0, 1920, 1000, 3, 16, 8, 320, MB, .2) + band(1920, 0, 230, 36, L) + disc(1920, 0, 170, N))) };
  s.addText('O QUE O EVENTO ENTREGA', { placeholder: 'title' });
  const del = [[fa.FaLandmark, 'INFORMAÇÃO DIRETA', 'As entidades públicas explicam, sem intermediários, como investir, formalizar e aceder a apoios e ao Estatuto do Investidor da Diáspora.'],
    [fa.FaMicrophoneLines, 'CASOS REAIS', 'Quem regressou ou investiu conta o que funcionou, quanto tempo levou e o que evitaria.'],
    [fa.FaHandshake, 'NEGÓCIOS E PARCERIAS', 'Encontros entre investidores da diáspora e empreendedores locais com projetos concretos.'],
    [fa.FaPeopleGroup, 'UM ELO PERMANENTE', 'Uma rede que continua depois do evento e um encontro anual com a diáspora.']];
  for (let i = 0; i < 4; i++) {
    const [ic, h, d] = del[i], x = 0.8 + i * 2.97, dark = i % 2 === 0;
    rect(s, x, 2.0, 2.77, 4.35, dark ? C.text2 : C.background1, 'entrega');
    H(s, '0' + (i + 1), { x: x + 0.3, y: 2.25, w: 1.2, h: 0.7, fontSize: 40, color: dark ? C.accent1 : C.accent3 });
    s.addShape(pres.shapes.OVAL, { x: x + 1.85, y: 2.3, w: 0.62, h: 0.62, fill: { color: C.accent1 }, line: { color: C.accent1 }, objectName: 'icone' });
    s.addImage({ data: await icon(ic, N), x: x + 2.0, y: 2.45, w: 0.32, h: 0.32, altText: h });
    H(s, h, { x: x + 0.3, y: 3.25, w: 2.3, h: 0.95, fontSize: 24, color: dark ? C.background2 : C.text2, valign: 'top' });
    T(s, d, { x: x + 0.3, y: 4.3, w: 2.25, h: 1.9, fontSize: 14, color: dark ? C.accent6 : C.text1, valign: 'top', lineSpacingMultiple: 1.05 });
  }

  // ---------- 8. PARA QUEM ----------
  pres.addSection({ title: 'Público e edição' });
  s = pres.addSlide({ masterName: 'ESCURO', sectionTitle: 'Público e edição' });
  const lx = 700, rx = 1180, cy = 640, r = 330;
  s.background = { data: await png(svg(N,
    `<defs><clipPath id="cl"><circle cx="${lx}" cy="${cy}" r="${r}"/></clipPath></defs>` +
    disc(lx, cy, r, B2, .9) + disc(rx, cy, r, B3, .55) +
    `<circle cx="${rx}" cy="${cy}" r="${r}" fill="${L}" clip-path="url(#cl)"/>` +
    band(lx, cy, r, 5, CR) + band(rx, cy, r, 5, L) +
    waves(1550, 1920, 1000, 3, 16, 8, 240, SKY, .25) + disc(1700, 640, 58, L))) };
  s.addText('QUEM QUEREMOS NA SALA', { placeholder: 'title' });
  const vy = 3.3;
  H(s, 'DA DIÁSPORA', { x: 2.9, y: vy, w: 2.9, h: 0.45, fontSize: 24, color: C.background2 });
  T(s, [{ text: 'Quadros e profissionais', options: { breakLine: true } }, { text: 'Empresários e investidores', options: { breakLine: true } }, { text: 'Quem pondera regressar' }],
    { x: 2.9, y: vy + 0.55, w: 2.85, h: 1.2, fontSize: 15, color: C.background1, paraSpaceAfter: 4 });
  H(s, 'DE CABO VERDE', { x: 7.3, y: vy, w: 2.85, h: 0.45, fontSize: 24, color: C.accent1 });
  T(s, [{ text: 'Empreendedores e startups', options: { breakLine: true } }, { text: 'Empresas à procura de capital', options: { breakLine: true } }, { text: 'e de parceiros lá fora' }],
    { x: 7.3, y: vy + 0.55, w: 2.75, h: 1.2, fontSize: 15, color: C.background1, paraSpaceAfter: 4 });
  H(s, [{ text: 'CONECTA', options: { breakLine: true } }, { text: 'DIÁSPORA' }], { x: 5.9, y: 4.03, w: 1.3, h: 0.85, fontSize: 18, color: C.text2, align: 'center', valign: 'middle' });
  s.addImage({ data: await icon(fa.FaBuildingColumns, N), x: 11.57, y: 4.12, w: 0.5, h: 0.5, altText: 'instituições' });
  H(s, 'E AINDA', { x: 10.85, y: 4.85, w: 2.0, h: 0.45, fontSize: 22, color: C.accent1, align: 'center' });
  T(s, 'Instituições públicas, banca e setor privado', { x: 10.75, y: 5.3, w: 2.15, h: 0.8, fontSize: 14, color: C.background1, align: 'center' });

  // ---------- 9. PRIMEIRA EDIÇÃO ----------
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'Público e edição' });
  s.background = { data: await png(svg(CR,
    ridge(0, 1920, 1080, [[0, 1010], [160, 975], [260, 990], [420, 930], [520, 960], [700, 985], [880, 925], [1000, 960], [1180, 990], [1360, 945], [1480, 965], [1640, 920], [1800, 975], [1920, 955]], MB, .35) +
    `<rect x="1325" y="270" width="475" height="560" rx="26" fill="${N}"/>` + band(1920, 0, 230, 36, L) + disc(1920, 0, 170, B3))) };
  s.addText('A PRIMEIRA EDIÇÃO', { placeholder: 'title' });
  H(s, '04', { x: 0.8, y: 1.85, w: 3.6, h: 2.6, fontSize: 190, color: C.accent3 });
  H(s, 'JANEIRO 2027', { x: 0.8, y: 4.45, w: 3.8, h: 0.7, fontSize: 40, color: C.text2 });
  T(s, 'A diáspora ainda está no país, de férias.', { x: 0.8, y: 5.15, w: 3.6, h: 0.6, fontSize: 16, color: C.text1, valign: 'top' });
  const facts = [[fa.FaLocationDot, 'LOCAL', 'Cidade da Praia', 'Proposta: TechPark CV'], [fa.FaCalendarDay, 'FORMATO', 'Um dia: painéis, entidades e networking'], [fa.FaUsers, 'LUGARES', '80 participantes'], [fa.FaTicket, 'ACESSO', 'Por inscrição']];
  for (let i = 0; i < facts.length; i++) {
    const [ic, l, v, sub] = facts[i], y = 2.0 + i * 1.0;
    s.addImage({ data: await icon(ic, N), x: 5.0, y: y + 0.05, w: 0.42, h: 0.42, altText: l });
    T(s, l, { x: 5.65, y, w: 3.4, h: 0.28, fontSize: 12, bold: true, charSpacing: 4, color: C.accent4 });
    T(s, sub ? [{ text: v, options: { breakLine: true } }, { text: sub, options: { fontSize: 13, color: C.accent4 } }] : v, { x: 5.65, y: y + 0.28, w: 3.4, h: sub ? 0.62 : 0.4, fontSize: 18, color: C.text2, valign: 'top' });
  }
  T(s, 'PARCEIROS', { x: 9.45, y: 2.12, w: 3.0, h: 0.3, fontSize: 12, bold: true, charSpacing: 4, color: C.accent1 });
  const parc = ['Pró Empresa, Pró Garante e Pró Capital', 'Casa do Cidadão', 'Câmara Municipal da Praia', 'Associações da diáspora e consulados', 'Banca e setor privado', 'TechPark CV'];
  T(s, parc.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < parc.length - 1 } })), { x: 9.45, y: 2.55, w: 2.95, h: 3.0, fontSize: 15, color: C.background1, paraSpaceAfter: 8, valign: 'top' });

  // ---------- 10. FECHO ----------
  pres.addSection({ title: 'Fecho' });
  s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Fecho' });
  s.background = { data: await png(svg(N,
    band(1700, 1180, 640, 95, CR) + band(1700, 1180, 525, 75, L) + band(1700, 1180, 420, 85, B3) + disc(1700, 1180, 340, B2) +
    constellation(1230, 60, 165, [[1925, 80, -0.18], [1080, 30, 0.2]]) + waves(0, 700, 1000, 4, 16, 9, 260, SKY, .25))) };
  label(s, 'SEJA PARCEIRO DA PRIMEIRA EDIÇÃO', 0.8, 0.75, C.accent1, 7);
  H(s, [{ text: 'DA DIÁSPORA', options: { color: C.background2, breakLine: true } }, { text: 'A CABO VERDE.', options: { color: C.background2, breakLine: true } },
    { text: 'IDEIAS QUE', options: { color: C.accent1, breakLine: true } }, { text: 'NOS LIGAM.', options: { color: C.accent1 } }],
    { x: 0.8, y: 1.15, w: 6.6, h: 4.0, fontSize: 66, lineSpacingMultiple: 0.95, valign: 'top' });
  label(s, 'ORGANIZAÇÃO', 0.8, 5.4, C.accent1);
  T(s, 'Yanick Silva  ·  Álvaro  ·  Denílson Monteiro', { x: 0.8, y: 5.75, w: 6.5, h: 0.4, fontSize: 18, bold: true, color: C.background1 });
  T(s, '[Telefone]  ·  [E-mail]', { x: 0.8, y: 6.2, w: 6.5, h: 0.4, fontSize: 16, color: C.accent6 });

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
})();

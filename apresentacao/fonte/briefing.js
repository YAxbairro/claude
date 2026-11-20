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
  const titlePh = (c) => ({ placeholder: { options: { name: 'title', type: 'title', x: 0.8, y: 0.6, w: 10, h: 0.95, fontSize: 48, color: c, fontFace: 'Impact', align: 'left', valign: 'top', margin: 0 }, text: '' } });
  pres.defineSlideMaster({ title: 'ESCURO', background: { color: C.text2 }, objects: [foot(C.accent5), titlePh(C.background2)] });
  pres.defineSlideMaster({ title: 'CREME', background: { color: C.background2 }, objects: [foot(C.accent4), titlePh(C.text2)] });
  pres.defineSlideMaster({ title: 'IMPACTO', background: { color: C.text2 }, objects: [] });

  const T = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontFace: 'Calibri', ...o });
  const H = (s, text, o) => s.addText(text, { isTextBox: true, margin: 0, fontFace: 'Impact', ...o });
  const label = (s, text, x, y, color) => T(s, text, { x, y, w: 6, h: 0.3, fontSize: 13, bold: true, charSpacing: 5, color });

  // ---------- 1. CAPA ----------
  pres.addSection({ title: 'Abertura' });
  let s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Abertura' });
  s.background = { data: await png(svg(N,
    band(1850, 1250, 760, 110, B3) + band(1850, 1250, 640, 80, L) + band(1850, 1250, 525, 100, CR) + band(1850, 1250, 400, 90, B2) + disc(1850, 1250, 330, MB, .55) +
    waves(0, 640, 985, 5, 16, 9, 260, SKY, .28) +
    constellation(1180, 70, 185, [[1925, 60, -0.18], [1925, 420, 0.15], [1080, 20, 0.2]]))) };
  label(s, 'BRIEFING DO EVENTO', 0.8, 0.75, C.accent1);
  H(s, 'CONECTA', { x: 0.8, y: 1.2, w: 6.4, h: 1.45, fontSize: 104, color: C.background2 });
  H(s, 'DIÁSPORA', { x: 0.8, y: 2.72, w: 6.4, h: 1.45, fontSize: 104, color: C.accent1 });
  T(s, '2  0  2  7', { x: 0.8, y: 4.25, w: 4, h: 0.5, fontSize: 30, color: C.background1, charSpacing: 6 });
  T(s, 'Encontro de Jovens Cabo-verdianos', { x: 0.8, y: 4.98, w: 6.5, h: 0.5, fontSize: 28, bold: true, color: C.background1 });
  T(s, 'Da diáspora a Cabo Verde. Ideias que nos ligam.', { x: 0.8, y: 5.48, w: 6.5, h: 0.45, fontSize: 20, italic: true, color: C.accent6 });
  T(s, '4 DE JANEIRO DE 2027  ·  CIDADE DA PRAIA', { x: 0.8, y: 6.4, w: 6.5, h: 0.35, fontSize: 15, bold: true, charSpacing: 3, color: C.accent1 });
  s.addNotes('Conecta Diáspora: encontro de jovens cabo-verdianos residentes e da diáspora. 4 de janeiro de 2027, Cidade da Praia.');

  // ---------- 2. PORQUÊ ----------
  pres.addSection({ title: 'A ideia' });
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'A ideia' });
  s.background = { data: await png(svg(CR,
    band(1960, 1120, 500, 26, B3) + band(1960, 1120, 430, 44, L) + disc(1960, 1120, 360, N) +
    waves(1180, 1920, 70, 6, 18, 10, 300, MB, .25) + '')) };
  s.addText('PORQUÊ AGORA', { placeholder: 'title' });
  T(s, 'O talento cabo-verdiano está espalhado pelo mundo. Nas festas de fim de ano, muitos estão em casa ao mesmo tempo.', { x: 0.8, y: 1.65, w: 8.6, h: 0.9, fontSize: 20, color: C.text2 });
  const why = [['01', 'Estão cá', 'As festas juntam no país quem vive em Cabo Verde e quem vive fora. É o momento certo para nos encontrarmos.'],
    ['02', 'Querem começar', 'Muitos pensam regressar ou investir, mas não sabem por onde começar nem a quem pedir apoio.'],
    ['03', 'Falta a ligação', 'Quem está cá precisa de rede lá fora. Quem está fora precisa de rede cá dentro.']];
  why.forEach(([n, h, d], i) => {
    const x = 0.8 + i * 3.3;
    H(s, n, { x, y: 2.95, w: 1.5, h: 0.95, fontSize: 60, color: C.accent3 });
    H(s, h.toUpperCase(), { x, y: 3.95, w: 3.0, h: 0.5, fontSize: 26, color: C.text2 });
    T(s, d, { x, y: 4.5, w: 2.95, h: 1.4, fontSize: 15, color: C.text1, lineSpacingMultiple: 1.1, valign: 'top' });
  });

  // ---------- 3. A IDEIA ----------
  s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'A ideia' });
  s.background = { data: await png(svg(N,
    waves(0, 900, 1000, 4, 16, 8, 240, SKY, .22) +
    band(1920, 1080, 300, 70, CR) + band(1920, 1080, 205, 55, L) + disc(1920, 1080, 150, B3) +
    constellation(1110, 140, 215, [[1925, 200, -0.18], [1925, 700, 0.12], [1150, 30, 0.22]], { arc: 4, dot: 10 }))) };
  label(s, 'A IDEIA', 0.8, 0.75, C.accent1);
  H(s, [{ text: 'UM DIA', options: { color: C.background2, breakLine: true } }, { text: 'PARA LIGAR', options: { color: C.accent1, breakLine: true } },
    { text: 'QUEM SAIU', options: { color: C.background2, breakLine: true } }, { text: 'A QUEM FICOU.', options: { color: C.background2 } }],
    { x: 0.8, y: 1.2, w: 6.6, h: 4.2, fontSize: 66, lineSpacingMultiple: 0.95, valign: 'top' });
  T(s, 'Um encontro anual, presencial e gratuito, que junta jovens cabo-verdianos de cá e de fora para partilhar experiências, aprender a começar um negócio e criar ligações que continuam depois do evento.',
    { x: 0.8, y: 5.55, w: 6.4, h: 1.2, fontSize: 17, color: C.accent6, lineSpacingMultiple: 1.1, valign: 'top' });

  // ---------- 4. PILARES ----------
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'A ideia' });
  const pcx = [0.8, 4.95, 9.1].map(x => x * 144 + 82);
  s.background = { data: await png(svg(CR,
    band(1920, 0, 300, 50, L) + band(1920, 0, 235, 30, B3) + disc(1920, 0, 190, N) +
    pcx.map(cx => band(cx, 380, 80, 10, L) + disc(cx, 380, 68, N)).join('') +
    waves(0, 1920, 935, 5, 16, 10, 320, MB, .22))) };
  s.addText('TRÊS PILARES', { placeholder: 'title' });
  const pil = [[fa.FaRocket, 'EMPREENDEDORISMO', 'Histórias reais de jovens que regressaram e criaram o seu negócio em Cabo Verde.'],
    [fa.FaComments, 'PARTILHA', 'Conversa direta com as entidades que apoiam quem quer começar: formalizar, financiar, arrancar.'],
    [fa.FaPeopleArrows, 'CONEXÕES', 'Contactos entre jovens de cá e de fora, para colaborar muito para além do dia do encontro.']];
  for (let i = 0; i < 3; i++) {
    const [ic, h, d] = pil[i], x = [0.8, 4.95, 9.1][i];
    s.addImage({ data: await icon(ic, L), x: x + 0.33, y: 2.31, w: 0.48, h: 0.48, altText: h });
    H(s, h, { x, y: 3.45, w: 3.6, h: 0.6, fontSize: 30, color: C.text2 });
    T(s, d, { x, y: 4.15, w: 3.45, h: 1.4, fontSize: 16, color: C.text1, lineSpacingMultiple: 1.1, valign: 'top' });
  }

  // ---------- 5. PARA QUEM ----------
  pres.addSection({ title: 'Público e formato' });
  s = pres.addSlide({ masterName: 'ESCURO', sectionTitle: 'Público e formato' });
  const lx = 700, rx = 1180, cy = 610, r = 330;
  s.background = { data: await png(svg(N,
    `<defs><clipPath id="cl"><circle cx="${lx}" cy="${cy}" r="${r}"/></clipPath></defs>` +
    disc(lx, cy, r, B2, .9) + disc(rx, cy, r, B3, .55) +
    `<circle cx="${rx}" cy="${cy}" r="${r}" fill="${L}" clip-path="url(#cl)"/>` +
    band(lx, cy, r, 5, CR) + band(rx, cy, r, 5, L) +
    waves(1550, 1920, 980, 4, 16, 8, 240, SKY, .25) + disc(1700, 600, 58, L))) };
  s.addText('PARA QUEM', { placeholder: 'title' });
  H(s, 'JOVENS DA DIÁSPORA', { x: 2.9, y: 3.2, w: 2.9, h: 0.45, fontSize: 21, color: C.background2 });
  T(s, [{ text: 'Estudantes e jovens profissionais', options: { breakLine: true } }, { text: 'Quem pensa regressar', options: { breakLine: true } }, { text: 'Quem quer investir ou colaborar' }],
    { x: 2.9, y: 3.7, w: 2.9, h: 1.2, fontSize: 15, color: C.background1, paraSpaceAfter: 4 });
  H(s, 'JOVENS EM CABO VERDE', { x: 7.3, y: 3.2, w: 2.85, h: 0.45, fontSize: 21, color: C.accent1 });
  T(s, [{ text: 'Estudantes e jovens profissionais', options: { breakLine: true } }, { text: 'Empreendedores', options: { breakLine: true } }, { text: 'Quem procura parceiros lá fora' }],
    { x: 7.3, y: 3.7, w: 2.75, h: 1.2, fontSize: 15, color: C.background1, paraSpaceAfter: 4 });
  H(s, [{ text: 'CONECTA', options: { breakLine: true } }, { text: 'DIÁSPORA' }], { x: 5.9, y: 3.85, w: 1.3, h: 0.85, fontSize: 18, color: C.text2, align: 'center', valign: 'middle' });
  s.addImage({ data: await icon(fa.FaBuildingColumns, N), x: 11.57, y: 3.92, w: 0.5, h: 0.5, altText: 'instituições' });
  H(s, 'E AINDA', { x: 10.85, y: 4.65, w: 2.0, h: 0.45, fontSize: 22, color: C.accent1, align: 'center' });
  T(s, 'Instituições e empreendedores que orientam e inspiram', { x: 10.75, y: 5.1, w: 2.15, h: 0.9, fontSize: 14, color: C.background1, align: 'center' });

  // ---------- 6. O DIA ----------
  s = pres.addSlide({ masterName: 'CREME', sectionTitle: 'Público e formato' });
  const nx = [260, 720, 1180, 1640], ny = 430;
  let arcsSvg = '';
  for (let i = 0; i < 3; i++) arcsSvg += `<path d="M${nx[i] + 80},${ny} Q${(nx[i] + nx[i + 1]) / 2},${ny - 120} ${nx[i + 1] - 80},${ny}" fill="none" stroke="${B3}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>`;
  s.background = { data: await png(svg(CR,
    arcsSvg + nx.map(x => band(x, ny, 74, 9, L) + disc(x, ny, 62, N)).join('') +
    ridge(940, 1920, 1080, [[1060, 1010], [1170, 950], [1240, 985], [1380, 890], [1470, 950], [1560, 920], [1700, 870], [1800, 940], [1920, 905]], MB, .55) +
    ridge(1100, 1920, 1080, [[1240, 1020], [1350, 990], [1450, 1030], [1600, 960], [1720, 1010], [1830, 975], [1920, 995]], N))) };
  s.addText('COMO VAI SER O DIA', { placeholder: 'title' });
  T(s, 'Um dia, quatro momentos.', { x: 0.8, y: 1.6, w: 8, h: 0.5, fontSize: 20, color: C.text2 });
  const mom = [['OUVIR', 'Testemunhos de jovens que regressaram e criaram o seu projeto.'], ['PERCEBER', 'As entidades de apoio explicam como formalizar, financiar e arrancar.'],
    ['CRIAR', 'Grupos de trabalho para discutir ideias, obstáculos e colaborações.'], ['LIGAR', 'Tempo para conhecer pessoas e trocar contactos.']];
  mom.forEach(([h, d], i) => {
    const cx = nx[i] / 144;
    H(s, '0' + (i + 1), { x: cx - 0.5, y: ny / 144 - 0.3, w: 1.0, h: 0.6, fontSize: 30, color: C.accent1, align: 'center', valign: 'middle' });
    H(s, h, { x: cx - 1.5, y: 3.75, w: 3.0, h: 0.55, fontSize: 30, color: C.text2, align: 'center' });
    T(s, d, { x: cx - 1.45, y: 4.35, w: 2.9, h: 1.1, fontSize: 15, color: C.text1, align: 'center', valign: 'top' });
  });

  // ---------- 7. PRIMEIRA EDIÇÃO ----------
  s = pres.addSlide({ masterName: 'ESCURO', sectionTitle: 'Público e formato' });
  s.background = { data: await png(svg(N,
    band(1920, 0, 230, 40, L) + disc(1920, 0, 160, CR) +
    ridge(0, 1920, 1080, [[0, 1010], [160, 975], [260, 990], [420, 930], [520, 960], [700, 985], [880, 925], [1000, 960], [1180, 990], [1360, 945], [1480, 965], [1640, 920], [1800, 975], [1920, 955]], B2, .9) +
    ridge(0, 1920, 1080, [[0, 1045], [240, 1020], [420, 1040], [640, 1005], [820, 1035], [1060, 1010], [1300, 1040], [1520, 1000], [1760, 1035], [1920, 1020]], B3, .55) +
    `<rect x="1325" y="245" width="475" height="560" rx="26" fill="${B2}"/>`)) };
  s.addText('A PRIMEIRA EDIÇÃO', { placeholder: 'title' });
  H(s, '04', { x: 0.8, y: 1.75, w: 3.6, h: 2.6, fontSize: 190, color: C.accent1 });
  H(s, 'JANEIRO 2027', { x: 0.8, y: 4.35, w: 3.8, h: 0.7, fontSize: 40, color: C.background2 });
  T(s, 'Segunda-feira', { x: 0.8, y: 5.05, w: 3.5, h: 0.4, fontSize: 17, color: C.accent6 });
  const facts = [[fa.FaLocationDot, 'LOCAL', 'Cidade da Praia', 'Proposta: TechPark CV'], [fa.FaCalendarDay, 'FORMATO', 'Um dia, presencial'], [fa.FaUsers, 'LUGARES', '80 participantes'], [fa.FaTicket, 'ENTRADA', 'Gratuita, com inscrição']];
  for (let i = 0; i < facts.length; i++) {
    const [ic, l, v, sub] = facts[i], y = 1.85 + i * 1.0;
    s.addImage({ data: await icon(ic, L), x: 5.0, y: y + 0.05, w: 0.42, h: 0.42, altText: l });
    T(s, l, { x: 5.65, y, w: 3.4, h: 0.28, fontSize: 12, bold: true, charSpacing: 4, color: C.accent1 });
    T(s, sub ? [{ text: v, options: { breakLine: true } }, { text: sub, options: { fontSize: 13, color: C.accent6 } }] : v, { x: 5.65, y: y + 0.28, w: 3.4, h: sub ? 0.62 : 0.4, fontSize: 18, color: C.background1, valign: 'top' });
  }
  T(s, 'PARCEIROS', { x: 9.45, y: 1.95, w: 3.0, h: 0.3, fontSize: 12, bold: true, charSpacing: 4, color: C.accent1 });
  const parc = ['Instituições de apoio ao empreendedorismo', 'Câmara Municipal da Praia', 'Associações da diáspora e consulados', 'Setor privado e empreendedores', 'TechPark CV'];
  T(s, parc.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < parc.length - 1 } })), { x: 9.45, y: 2.4, w: 2.95, h: 3.0, fontSize: 15, color: C.background1, paraSpaceAfter: 9, valign: 'top' });

  // ---------- 8. FECHO ----------
  pres.addSection({ title: 'Fecho' });
  s = pres.addSlide({ masterName: 'IMPACTO', sectionTitle: 'Fecho' });
  s.background = { data: await png(svg(N,
    band(1700, 1180, 640, 95, CR) + band(1700, 1180, 525, 75, L) + band(1700, 1180, 420, 85, B3) + disc(1700, 1180, 340, B2) +
    constellation(1230, 60, 165, [[1925, 80, -0.18], [1080, 30, 0.2]]) + waves(0, 700, 985, 5, 16, 9, 260, SKY, .25))) };
  H(s, [{ text: 'DA DIÁSPORA', options: { color: C.background2, breakLine: true } }, { text: 'A CABO VERDE.', options: { color: C.background2, breakLine: true } },
    { text: 'IDEIAS QUE', options: { color: C.accent1, breakLine: true } }, { text: 'NOS LIGAM.', options: { color: C.accent1 } }],
    { x: 0.8, y: 0.85, w: 6.6, h: 4.2, fontSize: 66, lineSpacingMultiple: 0.95, valign: 'top' });
  label(s, 'ORGANIZAÇÃO', 0.8, 5.35, C.accent1);
  T(s, 'Yanick Silva  ·  Álvaro  ·  Denílson Monteiro', { x: 0.8, y: 5.7, w: 6.5, h: 0.4, fontSize: 18, bold: true, color: C.background1 });
  T(s, '[Telefone]  ·  [E-mail]', { x: 0.8, y: 6.15, w: 6.5, h: 0.4, fontSize: 16, color: C.accent6 });

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
})();

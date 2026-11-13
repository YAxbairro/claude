const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const D = __dirname;
  for (const [n, w, h] of JSON.parse(fs.readFileSync(D + '/banners.json'))) {
    // 1 px = 1 mm; escala 4 -> ~100 dpi no tamanho real (o PDF mantém texto e anel em vetor)
    const pg = await b.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 4});
    await pg.goto('file://' + path.join(D, n + '.html')); await pg.waitForLoadState('networkidle');
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({path: `${D}/out/${n}.png`});
    await pg.pdf({path: `${D}/out/${n}.pdf`, width: `${w}px`, height: `${h}px`, printBackground: true, pageRanges: '1', scale: 1});
    await pg.close();
  }
  await b.close();
})();

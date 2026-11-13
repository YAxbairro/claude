const {chromium} = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const D = __dirname; fs.mkdirSync(D + '/out', {recursive: true});
  const pages = JSON.parse(fs.readFileSync(D + '/pages.json'));
  for (const [n, w, h] of pages) {  // arte de impressão: 300 dpi em 30x40 cm, fundo transparente
    const pg = await b.newPage({viewport: {width: w, height: h}, deviceScaleFactor: 3});
    await pg.goto('file://' + path.join(D, n + '.html')); await pg.waitForLoadState('networkidle');
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({path: `${D}/out/${n}.png`, omitBackground: true}); await pg.close();
  }
  for (const n of ['mock_abertura', 'mock_encerramento']) {
    const pg = await b.newPage({viewport: {width: 1600, height: 1000}, deviceScaleFactor: 2});
    await pg.goto('file://' + path.join(D, n + '.html')); await pg.waitForLoadState('networkidle');
    await pg.evaluate(() => document.fonts.ready);
    await pg.screenshot({path: `${D}/out/${n}.png`}); await pg.close();
  }
  await b.close();
})();

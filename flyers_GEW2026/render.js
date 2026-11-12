const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
(async()=>{const b=await chromium.launch();const pages=JSON.parse(fs.readFileSync(__dirname+'/pages.json'));
for(const [n,w,h] of pages){const pg=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:2});
await pg.goto('file://'+path.join(__dirname,n+'.html'));await pg.waitForLoadState('networkidle');await pg.evaluate(()=>document.fonts.ready);
const o=await pg.evaluate(()=>{const b=document.querySelector('.body');return [b.scrollHeight,b.clientHeight,document.fonts.check('900 20px Montserrat')]});console.log(n,o);
await pg.screenshot({path:`${__dirname}/out/${n}.png`});await pg.pdf({path:`${__dirname}/out/${n}.pdf`,width:w+'px',height:h+'px',printBackground:true,pageRanges:'1'});await pg.close();}
await b.close();})();

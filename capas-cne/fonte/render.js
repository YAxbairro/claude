const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:794,height:1123}});
for(const k of ['pt','en','fr']){await p.goto('file://'+process.cwd()+`/cover_${k}.html`,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);await p.waitForSelector('body[data-ok]');
await p.pdf({path:`capa_${k}.pdf`,width:'210mm',height:'297mm',printBackground:true});
await p.screenshot({path:`prev_${k}.png`});}
await b.close();})();

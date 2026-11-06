const {chromium}=require('playwright'),path=require('path');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files']});const p=await b.newPage({viewport:{width:1920,height:1080}});
for(let v=1;v<=5;v++)for(let s=0;s<2;s++){await p.goto('file://'+path.join(__dirname,'page.html')+`?v=${v}&s=${s}`);await p.evaluate(()=>window.READY);
 await p.screenshot({path:path.join(__dirname,`f${v}_${s}.jpg`),type:'jpeg',quality:90})}await b.close()})();

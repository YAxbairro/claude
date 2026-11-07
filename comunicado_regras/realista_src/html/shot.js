// node shot.js pagina.html pasta n0 n1 [workers]  -> PNG por frame (25 fps), t=n/25
const {chromium}=require('playwright');const path=require('path');const fs=require('fs');
const [,,pg,dir,a,b,w='4']=process.argv;const n0=+a,n1=+b,W=+w;fs.mkdirSync(dir,{recursive:true});
(async()=>{const br=await chromium.launch();const per=Math.ceil((n1-n0)/W);
 await Promise.all([...Array(W)].map(async(_,k)=>{const p=await br.newPage({viewport:{width:1920,height:1080}});
  await p.goto('file://'+path.resolve(pg));await p.evaluate(()=>window.READY);
  for(let n=n0+k*per;n<Math.min(n1,n0+(k+1)*per);n++){await p.evaluate(t=>window.renderAt(t),n/25);
   await p.screenshot({path:`${dir}/${String(n).padStart(5,'0')}.png`,omitBackground:true})}}));
 await br.close();console.log('ok',n1-n0)})();

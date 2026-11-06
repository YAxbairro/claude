// node shot3d.js clock mesa urna -> img3d/<m>.png (transparente, recortado)
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch({args:['--allow-file-access-from-files','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 fs.mkdirSync(path.join(__dirname,'img3d'),{recursive:true});
 for(const m of process.argv.slice(2)){const p=await b.newPage({viewport:{width:1200,height:1200}});
  p.on('pageerror',e=>console.log('ERR',e.message));
  await p.goto('file://'+path.join(__dirname,'3d.html')+'?m='+m);await p.waitForFunction(()=>window.DONE,null,{timeout:60000});
  await p.screenshot({path:path.join(__dirname,'img3d',m+'.png'),omitBackground:true});console.log('ok',m)}
 await b.close()})();

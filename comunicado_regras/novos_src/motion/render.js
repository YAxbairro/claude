// Renderiza index.html?v=V1|V2 frame a frame no Chromium (Playwright) -> MP4 com a locução.
// Uso: node render.js V1 saida.mp4 [workers=4]   |   node render.js V1 TEST out.jpg t1 t2 ...
const {chromium}=require('playwright'), {spawn,execFileSync}=require('child_process'), path=require('path'), fs=require('fs');
const [,,vid,out,...rest]=process.argv, FPS=25, url='file://'+path.join(__dirname,'index.html')+'?v='+vid;
(async()=>{
  const b=await chromium.launch({args:['--disable-web-security','--allow-file-access-from-files']});
  const page=async()=>{const p=await b.newPage({viewport:{width:1920,height:1080}});await p.goto(url);await p.evaluate(()=>window.READY);return p};
  if(out==='TEST'){
    const p=await page(); const dst=rest[0], ts=rest.slice(1).map(Number); const tmp=[];
    for(const t of ts){await p.evaluate(t=>window.renderAt(t),t);const f=`/tmp/claude-0/-home-user-claude/6db99166-337f-5ef1-806e-773090ba29c3/scratchpad/_t${t}.jpg`;await p.screenshot({path:f,type:'jpeg',quality:85});tmp.push(f)}
    execFileSync('ffmpeg',['-v','error','-y',...tmp.flatMap(f=>['-i',f]),'-filter_complex',tmp.map((_,i)=>`[${i}:v]scale=480:270[s${i}]`).join(';')+';'+tmp.map((_,i)=>`[s${i}]`).join('')+`xstack=inputs=${tmp.length}:layout=${tmp.map((_,i)=>`${(i%4)*480}_${Math.floor(i/4)*270}`).join('|')}:fill=white`,'-frames:v','1',dst]);
    await b.close(); return}
  const dur=JSON.parse(fs.readFileSync(path.join(__dirname,'data.js'),'utf8').replace(/^window.VIDS=|;$/g,''))[vid].dur;
  const N=Math.round(dur*FPS), W=+(rest[0]||4), per=Math.ceil(N/W), dir=path.join(__dirname,'tmp'); fs.mkdirSync(dir,{recursive:true});
  await Promise.all([...Array(W)].map(async(_,k)=>{
    const p=await page(), n0=k*per, n1=Math.min(N,n0+per);
    const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-framerate','25','-c:v','mjpeg','-i','-','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p',`${dir}/${vid}_${k}.mp4`]);
    for(let n=n0;n<n1;n++){await p.evaluate(t=>window.renderAt(t),n/FPS);const buf=await p.screenshot({type:'jpeg',quality:94});
      if(!ff.stdin.write(buf))await new Promise(r=>ff.stdin.once('drain',r))}
    ff.stdin.end(); await new Promise(r=>ff.on('close',r)); console.log('chunk',k,'ok')}));
  await b.close();
  fs.writeFileSync(`${dir}/${vid}.txt`,[...Array(W)].map((_,k)=>`file '${dir}/${vid}_${k}.mp4'`).join('\n'));
  const audio=path.join(__dirname,'..',JSON.parse(fs.readFileSync(path.join(__dirname,'data.js'),'utf8').replace(/^window.VIDS=|;$/g,''))[vid].audio);
  execFileSync('ffmpeg',['-v','error','-y','-f','concat','-safe','0','-i',`${dir}/${vid}.txt`,'-i',audio,'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','192k','-shortest',out]);
  console.log('ok',out);
})();

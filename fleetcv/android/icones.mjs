import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const RES=process.argv[2];
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:800,height:800}}); let vp={w:800,h:800};
/* o alfinete da FleetCV: branco sobre o azul-petróleo, com o rabicho de um percurso */
const alfinete=(cx,cy,s)=>`
  <path d="M ${cx-44*s} ${cy+30*s} C ${cx-30*s} ${cy+14*s}, ${cx-18*s} ${cy+30*s}, ${cx-6*s} ${cy+10*s}" fill="none"
        stroke="#fff" stroke-opacity=".55" stroke-width="${5*s}" stroke-linecap="round" stroke-dasharray="${1*s} ${10*s}"/>
  <path transform="translate(${cx-24*s} ${cy-40*s}) scale(${2*s})"
        d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7,-7.75 7,-13c0,-3.87 -3.13,-7 -7,-7zM12,11.5c-1.38,0 -2.5,-1.12 -2.5,-2.5s1.12,-2.5 2.5,-2.5 2.5,1.12 2.5,2.5 -1.12,2.5 -2.5,2.5z"
        fill="#fff"/>`;
async function png(w,h,svg,destino){
  if(w>vp.w||h>vp.h){ vp={w:Math.max(w,vp.w),h:Math.max(h,vp.h)}; await p.setViewportSize({width:vp.w,height:vp.h}); }
  await p.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await p.screenshot({path:destino, omitBackground:true, clip:{x:0,y:0,width:w,height:h}});
}
const T='#0B7F8E';
/* ícone antigo (quadrado arredondado) e redondo */
for(const [d,n] of [['mdpi',48],['hdpi',72],['xhdpi',96],['xxhdpi',144],['xxxhdpi',192]]){
  const s=n/108;
  await png(n,n,`<svg width="${n}" height="${n}" viewBox="0 0 ${n} ${n}"><rect width="${n}" height="${n}" rx="${n*0.22}" fill="${T}"/>${alfinete(n/2,n/2+2*s,s*0.95)}</svg>`, path.join(RES,`mipmap-${d}/ic_launcher.png`));
  await png(n,n,`<svg width="${n}" height="${n}" viewBox="0 0 ${n} ${n}"><circle cx="${n/2}" cy="${n/2}" r="${n/2}" fill="${T}"/>${alfinete(n/2,n/2+2*s,s*0.9)}</svg>`, path.join(RES,`mipmap-${d}/ic_launcher_round.png`));
  const f=Math.round(n*108/48);
  const sf=f/108;
  await png(f,f,`<svg width="${f}" height="${f}" viewBox="0 0 ${f} ${f}">${alfinete(f/2,f/2+2*sf,sf*0.62)}</svg>`, path.join(RES,`mipmap-${d}/ic_launcher_foreground.png`));
}
/* o ecrã de arranque: a cor da marca, o alfinete e o nome */
const splash=[['drawable',480,320],['drawable-land-mdpi',480,320],['drawable-land-hdpi',800,480],['drawable-land-xhdpi',1280,720],
  ['drawable-land-xxhdpi',1600,960],['drawable-land-xxxhdpi',1920,1280],['drawable-port-mdpi',320,480],['drawable-port-hdpi',480,800],
  ['drawable-port-xhdpi',720,1280],['drawable-port-xxhdpi',960,1600],['drawable-port-xxxhdpi',1280,1920]];
for(const [d,w,h] of splash){
  const s=Math.min(w,h)/320;
  await png(w,h,`<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${T}"/>
    ${alfinete(w/2,h/2-18*s,s*0.9)}
    <text x="${w/2}" y="${h/2+62*s}" text-anchor="middle" font-family="Archivo, Arial, sans-serif" font-weight="700"
          font-size="${30*s}" fill="#fff" letter-spacing="${0.5*s}">FleetCV</text></svg>`, path.join(RES,`${d}/splash.png`));
}
await b.close();
console.log('ícones e arranque gerados');

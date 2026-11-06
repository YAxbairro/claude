// Ícones novos (referências do cliente) no mesmo traço dos existentes: 600px, conteúdo 440px, traço ~17px.
const {chromium}=require('playwright');const fs=require('fs');
const R='#D4292E';
const I={
porta3:C=>`<rect x="27" y="9" width="46" height="82" rx="5" fill="none" stroke="${C}"/>
 <path d="M43,78 L38,67 L33.5,59 A2.6,2.6 0 0 1 38,56.5 L41,61 L41,41 A2.5,2.5 0 0 1 46,41 L46,55 L46,37.5 A2.5,2.5 0 0 1 51,37.5 L51,55 L51,39.5 A2.5,2.5 0 0 1 56,39.5 L56,56 L56,45 A2.5,2.5 0 0 1 61,45 L61,66 C61,73 57,78 52,78 Z" fill="none" stroke="${R}" stroke-width="3.2"/>`,
cracha:C=>`<rect x="27" y="22" width="46" height="66" rx="5" fill="none" stroke="${C}"/>
 <rect x="45" y="12" width="10" height="18" rx="1.5" fill="none" stroke="${R}"/>
 <circle cx="50" cy="45" r="7" fill="none" stroke="${C}"/><path d="M37,64 C37,55 63,55 63,64 Z" fill="none" stroke="${C}"/>
 <path d="M37,72 L63,72 M42,79 L58,79" stroke="${C}"/>
 <circle cx="73" cy="25" r="9" fill="${R}" stroke="none"/><path d="M68.5,25 L71.8,28.3 L77.5,21.8" stroke="#fff" stroke-width="2.6"/>`,
portaentra:C=>`<path d="M47,12 L71,12 L71,88 L47,88" fill="none" stroke="${C}"/>
 <path d="M28,17 L47,10 L47,90 L28,83 Z" fill="none" stroke="${C}"/>
 <path d="M90,50 L57,50 M66,41 L57,50 L66,59" fill="none" stroke="${R}"/>`,
autoriza:C=>`<rect x="6" y="34" width="32" height="44" rx="4" fill="none" stroke="${C}"/>
 <rect x="18.5" y="27" width="7" height="12" rx="1" fill="none" stroke="${R}" stroke-width="3"/>
 <circle cx="22" cy="50" r="5" fill="none" stroke="${C}" stroke-width="3.2"/><path d="M13,64 C13,57 31,57 31,64 Z M12,71 L32,71" fill="none" stroke="${C}" stroke-width="3.2"/>
 <circle cx="55" cy="60" r="5.5" fill="none" stroke="${C}" stroke-width="3.4"/><path d="M45,86 L45,78 C45,71 65,71 65,78 L65,86" fill="none" stroke="${C}" stroke-width="3.4"/>
 <circle cx="80" cy="64" r="5.5" fill="none" stroke="${C}" stroke-width="3.4"/><path d="M70,90 L70,82 C70,75 90,75 90,82 L90,90" fill="none" stroke="${C}" stroke-width="3.4"/>
 <path d="M63,74 L70,68" stroke="${C}" stroke-width="3.4"/>
 <path d="M60,40 A14,14 0 1 1 66,46 L56,49 Z" fill="none" stroke="${R}" stroke-linejoin="round"/>
 <circle cx="70" cy="28" r="2" fill="${R}" stroke="none"/><path d="M70,33 L70,42" stroke="${R}"/>`
};
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:600,height:600}});
 for(const [k,f] of Object.entries(I)) for(const [st,C] of [['A','#FFFFFF'],['B','#164B8C']]){
  await p.setContent(`<html><body style="margin:0;background:transparent"><svg width="600" height="600" viewBox="-18.18 -18.18 136.36 136.36" fill="none" stroke-width="3.9" stroke-linecap="round" stroke-linejoin="round">${f(C)}</svg></body></html>`);
  await p.screenshot({path:`${process.argv[2]}/${k}_${st}.png`,omitBackground:true});
  if(st=='B')await p.screenshot({path:`icons_svg/${k}_ref.png`,omitBackground:false});}
 await b.close()})();

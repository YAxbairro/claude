// Gera geo.js: terra (50m) e ilhas de Cabo Verde (10m) já projetadas (Mercator), mais posições de ilhas e cidades.
const N=process.argv[2]; const tj=require(N+'/topojson-client'); const d3=require(N+'/d3-geo');
const land=tj.feature(require(N+'/world-atlas/land-50m.json'),require(N+'/world-atlas/land-50m.json').objects.land);
const c10=require(N+'/world-atlas/countries-10m.json'); const cv=tj.feature(c10,c10.objects.countries).features.find(f=>f.properties.name=='Cabo Verde'||f.id=='132');
const P=d3.geoMercator().scale(610).translate([0,0]); const o=P([-23.9,15.9]); P.translate([560-o[0],600-o[1]]);
const path=d3.geoPath(P).digits(2);
const isl={'SANTO ANTÃO':[-25.17,17.07],'SÃO VICENTE':[-24.97,16.85],'SÃO NICOLAU':[-24.25,16.6],'SAL':[-22.93,16.72],'BOA VISTA':[-22.82,16.1],'MAIO':[-23.18,15.22],'SANTIAGO':[-23.62,15.08],'FOGO':[-24.38,14.93],'BRAVA':[-24.7,14.85]};
const cities={'BOSTON':[-71.06,42.36],'LISBOA':[-9.14,38.72],'MADRID':[-3.7,40.42],'PARIS':[2.35,48.86],'ROTERDÃO':[4.48,51.92],'LUXEMBURGO':[6.13,49.61],'ROMA':[12.5,41.9],'DAKAR':[-17.45,14.69],'LUANDA':[13.23,-8.84],'SÃO PAULO':[-46.63,-23.55]};
const pj=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,P(v).map(x=>+x.toFixed(2))]));
// cada ilha como path separado (para desenhar uma a uma)
const polys=cv.geometry.type=='MultiPolygon'?cv.geometry.coordinates:[cv.geometry.coordinates];
const ips=polys.map(c=>{const f={type:'Polygon',coordinates:c};return {d:path(f),c:P(d3.geoCentroid(f)),a:d3.geoArea(f)}}).sort((a,b)=>b.a-a.a);
require('fs').writeFileSync('geo.js','window.GEO='+JSON.stringify({land:path(land),isl:ips.map(x=>({d:x.d,c:x.c.map(v=>+v.toFixed(1))})),names:pj(isl),cities:pj(cities),cv:P([-23.9,15.9])})+';');
console.log('ilhas',ips.length,'land',path(land).length);

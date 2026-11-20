'use strict';
// Creates original procedural promotional CONCEPTS. These are not gameplay screenshots.
// Native game screenshots are captured separately from a local authoritative server.
// No remote assets, purchased fonts, images or user-submitted content are loaded.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');

const FORMATS=Object.freeze([
 {id:'store-header',w:920,h:430,ext:'png'},
 {id:'store-small',w:462,h:174,ext:'png'},
 {id:'store-main',w:1232,h:706,ext:'png'},
 {id:'store-vertical',w:748,h:896,ext:'png'},
 {id:'library-capsule',w:600,h:900,ext:'png'},
 {id:'library-hero',w:3840,h:1240,ext:'png',noTitle:true},
 {id:'library-logo',w:1280,h:720,ext:'png',transparent:true,logoOnly:true},
 {id:'library-header',w:920,h:430,ext:'png'},
 {id:'shortcut-icon',w:256,h:256,ext:'png',icon:true},
 {id:'app-icon',w:184,h:184,ext:'jpg',icon:true}
]);
function escapeXml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));}
function scene(d){
 const {w,h}=d,wide=w>=h*1.4,vertical=h>w;
 const f=n=>Math.round(n*100)/100;
 const seed=()=>{let x=521341;return ()=>{x=(x*1664525+1013904223)>>>0;return x/4294967296;};};
 const rnd=seed();
 const stars=Array.from({length:d.logoOnly?0:75},()=>{
  const x=f(rnd()*w),y=f(rnd()*h*.8),r=f(0.5+rnd()*Math.max(1,w/850));
  return '<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="#b9d7ff" opacity="'+f(.17+rnd()*.48)+'"/>';
 }).join('');
 const y=h*(vertical?.70:.74),left=w*(wide?.32:.30),right=w*(wide?.69:.70);
 const r=Math.min(w,h)*(d.icon?.135:wide?.056:.074);
 const logoSize=d.icon?0:Math.round(Math.min(w*(vertical?.117:.065),h*(vertical?.057:.105)));
 const centeredText=d.logoOnly||!d.noTitle;
 const titleY=d.logoOnly?h*.55:(vertical?h*.18:h*.21);
 const sky='<rect width="'+w+'" height="'+h+'" fill="url(#sky)"/>';
 const terrain=d.logoOnly?'':[
 '<path d="M0 '+f(h*.81)+' L'+f(w*.16)+' '+f(h*.59)+' L'+f(w*.33)+' '+f(h*.77)+' L'+f(w*.54)+' '+f(h*.54)+' L'+f(w*.75)+' '+f(h*.73)+' L'+w+' '+f(h*.53)+' V'+h+' H0 Z" fill="#101e39" opacity=".87"/>',
 '<path d="M0 '+f(h*.88)+' Q'+f(w*.21)+' '+f(h*.76)+' '+f(w*.44)+' '+f(h*.91)+' T'+w+' '+f(h*.82)+' V'+h+' H0 Z" fill="#071629" opacity=".93"/>',
 '<path d="M0 '+f(h*.92)+' H'+w+'" stroke="#69b7ed" stroke-opacity=".22" stroke-width="'+Math.max(1,w/500)+'"/>'
 ].join('');
 const tether=d.logoOnly?'':('<path d="M'+f(left)+' '+f(y)+' Q'+f(w*.51)+' '+f(h*.45)+' '+f(right)+' '+f(y)+'" fill="none" stroke="#c6ebff" stroke-width="'+f(r*.15)+'" stroke-linecap="round" opacity=".85" filter="url(#glow)"/>');
 const circle=(cx,cy,fill,stroke)=>[
 '<circle cx="'+f(cx)+'" cy="'+f(cy)+'" r="'+f(r*1.7)+'" fill="'+fill+'" opacity=".17" filter="url(#bloom)"/>',
 '<path d="M'+f(cx-r*.62)+' '+f(cy+r*.45)+' Q'+f(cx)+' '+f(cy+r*1.5)+' '+f(cx+r*.62)+' '+f(cy+r*.45)+'" fill="'+fill+'" opacity=".75"/>',
 '<circle cx="'+f(cx)+'" cy="'+f(cy)+'" r="'+f(r)+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+f(r*.12)+'" filter="url(#glow)"/>'
 ].join('');
 const duo=d.logoOnly?'':circle(left,y,'#ffd184','#fff1c5')+circle(right,y,'#8ccfff','#f0f9ff');
 const title=centeredText?[
 '<text x="'+f(w*.5)+'" y="'+f(titleY)+'" text-anchor="middle" dominant-baseline="middle" font-family="Arial,system-ui,sans-serif" font-weight="900" letter-spacing="'+Math.max(1,Math.round(logoSize*.04))+'" font-size="'+logoSize+'" fill="#f8f5ff" stroke="#15243f" stroke-width="'+Math.max(1,logoSize*.018)+'" paint-order="stroke">LINKED BY LIGHT</text>',
 ].join(''):'';
 const icon=d.icon?[
 '<path d="M'+f(w*.19)+' '+f(h*.58)+' Q'+f(w*.51)+' '+f(h*.18)+' '+f(w*.81)+' '+f(h*.58)+'" fill="none" stroke="#e1e9ff" stroke-width="'+f(w*.04)+'"/>',
 '<circle cx="'+f(w*.26)+'" cy="'+f(h*.67)+'" r="'+f(w*.16)+'" fill="#ffc778" filter="url(#glow)"/>',
 '<circle cx="'+f(w*.74)+'" cy="'+f(h*.67)+'" r="'+f(w*.16)+'" fill="#89caff" filter="url(#glow)"/>'
 ].join(''):'';
 const background=d.logoOnly?'':sky;
 const all='<svg xmlns="http://www.w3.org/2000/svg" width="'+w+'" height="'+h+'" viewBox="0 0 '+w+' '+h+'">'+
 '<defs>'+
 '<linearGradient id="sky" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#080d24"/><stop offset=".52" stop-color="#1c2850"/><stop offset="1" stop-color="#0a142c"/></linearGradient>'+
 '<filter id="glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="'+f(Math.max(1,w/1500))+'" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>'+
 '<filter id="bloom" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="'+f(Math.max(2,w/80))+'"/></filter>'+
 '</defs>'+background+stars+terrain+tether+duo+title+icon+'</svg>';
 return all;
}
async function generate(dest=path.join(process.cwd(),'artifacts','steam-prepayment','concepts')){
 const browser=await chromium.launch({headless:true});
 fs.mkdirSync(dest,{recursive:true});
 const outputs=[];
 try{
  for(const format of FORMATS){
   const page=await browser.newPage({viewport:{width:format.w,height:format.h},deviceScaleFactor:1});
   const markup=scene(format);
   await page.setContent('<html><head><style>html,body{margin:0;background:transparent;overflow:hidden}svg{display:block}</style></head><body>'+markup+'</body></html>');
   const filename=format.id+'.'+format.ext,output=path.join(dest,filename);
   await page.locator('svg').screenshot({path:output,type:format.ext==='jpg'?'jpeg':'png',omitBackground:format.transparent===true});
   outputs.push({file:filename,width:format.w,height:format.h,kind:'ORIGINAL_CONCEPT_NOT_GAMEPLAY',sizeBytes:fs.statSync(output).size});
   await page.close();
  }
  fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({status:'DRAFT_FOR_RIGHTS_AND_ART_REVIEW',outputs},null,2)+'\n');
  console.log(JSON.stringify({count:outputs.length,dest,status:'DRAFT_ONLY'}));
 }finally{await browser.close();}
}
if(require.main===module)generate().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={FORMATS,scene,generate,escapeXml};

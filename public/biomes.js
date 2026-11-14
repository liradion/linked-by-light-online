/* Linked by Light — eleven distinct biomes / 99 stage motifs. Visual-only. */
(function(root){
'use strict';
const TAU=Math.PI*2,G=544;
const P=[
 {sky:['#10233f','#4e5c75','#c2828b'],mist:'#ffdd9c',halo:'#fbc3ac',moon:'#ffe3ac',stone:'#565b6f',grass:'#bceba8',far:'#424f65',near:'#38435a',gold:'#ffdb86'},
 {sky:['#031c24','#164b4a','#47715a'],mist:'#89efd0',halo:'#ffe3a0',moon:'#b8f5d2',stone:'#244951',grass:'#9af9bd',far:'#123a3b',near:'#0d3536',gold:'#fdcf90'},
 {sky:['#101b47','#324a79','#706d9f'],mist:'#bed2ff',halo:'#b9f1f9',moon:'#f6f8ff',stone:'#434f77',grass:'#b1e7ef',far:'#28366a',near:'#26305e',gold:'#e6ddff'},
 {sky:['#174e7b','#7ca6cb','#e3b6bd'],mist:'#f5fbff',halo:'#f7efff',moon:'#fff8e2',stone:'#677e99',grass:'#f1f9ff',far:'#6d9cb7',near:'#6395b7',gold:'#fff6cd'},
 {sky:['#0e0b33','#2a225f','#695298'],mist:'#c3a6ff',halo:'#a9f9ff',moon:'#d5c4ff',stone:'#453f79',grass:'#beb7fc',far:'#211c53',near:'#322859',gold:'#ffe3bb'},
 {sky:['#061d36','#15536b','#378e93'],mist:'#81ffff',halo:'#b3ddff',moon:'#d5ffff',stone:'#2d6575',grass:'#95fff1',far:'#16596a',near:'#103f51',gold:'#cafff6'},
 {sky:['#120e35','#2b2257','#773658'],mist:'#f0a9f7',halo:'#7df7fa',moon:'#ffa2e3',stone:'#3f345e',grass:'#a1e6ff',far:'#291a4e',near:'#1c193c',gold:'#ffd6a1'},
 {sky:['#041a39','#124873','#456d9b'],mist:'#8bcfff',halo:'#ebdeff',moon:'#c8e8ff',stone:'#35587f',grass:'#9ff5ff',far:'#173a5f',near:'#164970',gold:'#c2edff'},
 {sky:['#201330','#4c2a4c','#a36b63'],mist:'#ffd5aa',halo:'#cca7eb',moon:'#fff1d4',stone:'#58445b',grass:'#e3c3b6',far:'#392544',near:'#2e253b',gold:'#ffe3b5'},
 {sky:['#281323','#9d4e5a','#e69d80'],mist:'#ffe1ad',halo:'#fdd5cb',moon:'#fff0b6',stone:'#84606b',grass:'#ffd3ad',far:'#703f59',near:'#52344c',gold:'#ffebb6'},
 {sky:['#0b0a2b','#38245e','#8d5f92'],mist:'#ffe7d7',halo:'#a9faff',moon:'#fff1ef',stone:'#4b4370',grass:'#d1bafe',far:'#37265f',near:'#29204d',gold:'#fff2c3'}
];
const rgba=(c,a)=>{const h=c.replace('#','');if(h.length!==6)return c;const n=parseInt(h,16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`;};
const color=(n,role)=>role===0?'#ffd09a':role===1?'#91f8ff':'#e5c5ff';
const pill=(c,x,y,w,h,r=9)=>{c.beginPath();c.roundRect(x,y,w,h,r);};
const circle=(c,x,y,r)=>{c.beginPath();c.arc(x,y,r,0,TAU);};
function glow(c,x,y,r,col,alpha=.28){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,alpha));g.addColorStop(1,rgba(col,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function text(c,x,y,label,col='#fff',size=12){c.save();c.font=`900 ${size}px system-ui`;c.textAlign='center';c.strokeStyle='#0b1534d9';c.lineWidth=3.5;c.strokeText(label,x,y);c.fillStyle=col;c.fillText(label,x,y);c.restore();}
function puffs(c,x,y,r,col,a=.7){c.save();c.globalAlpha=a;c.fillStyle=col;for(let i=0;i<5;i++){circle(c,x+(i-2)*r*.35,y+((i%2)-.5)*r*.1,r*(.55+i%3*.1));c.fill();}c.restore();}
function petals(c,x,y,r,col,angle=0){c.save();c.translate(x,y);c.rotate(angle);for(let i=0;i<6;i++){c.rotate(TAU/6);c.fillStyle=col;c.beginPath();c.ellipse(0,-r*.65,r*.3,r*.56,0,0,TAU);c.fill();}circle(c,0,0,r*.30);c.fillStyle='#ffefbd';c.fill();c.restore();}
function cog(c,x,y,r,rot,col){c.save();c.translate(x,y);c.rotate(rot);c.strokeStyle=col;c.lineWidth=7;circle(c,0,0,r);c.stroke();for(let i=0;i<12;i++){const a=i*TAU/12;c.save();c.rotate(a);c.fillStyle=col;c.fillRect(r-5,-8,20,16);c.restore();}c.strokeStyle=rgba(col,.55);c.lineWidth=4;circle(c,0,0,r*.42);c.stroke();for(let i=0;i<6;i++){let a=i*TAU/6;c.beginPath();c.moveTo(Math.cos(a)*r*.45,Math.sin(a)*r*.45);c.lineTo(Math.cos(a)*r*.85,Math.sin(a)*r*.85);c.stroke();}c.restore();}
function bkg(c,level,index,t,cam){
 const act=Math.floor(index/9),v=index%9,sc=P[act],w=1200;
 c.save();
 switch(act){
 case 0: // giant warm sunlight, flowering meadow
  glow(c,240-cam*.035,202,245,'#ffe0a3',.23);
  for(let i=0;i<12;i++){const x=(i*143+v*43-cam*.22)%1450-90,y=390+Math.sin(i*2.4)*35;c.globalAlpha=.15+(i%3)*.07;petals(c,x,y,14+i%3*6,i%2?'#fbc8df':'#ffe4b6',Math.sin(t*.4+i)*.18);}break;
 case 1: // luminous forest, trunks, canopy and insects
  for(let i=0;i<12;i++){const x=((i*153+v*19-cam*.25)%1600+1600)%1600-140;
    c.globalAlpha=.34;c.fillStyle='#0d3c40';pill(c,x,130,26+(i%4)*6,450,18);c.fill();
    c.fillStyle='#2b766d';puffs(c,x+20,143,58,'#245a50',.32);
    c.strokeStyle='#7feec88c';c.lineWidth=2;c.beginPath();c.moveTo(x+20,220);c.bezierCurveTo(x+40,270,x+12,310,x+32,360);c.stroke();}
  for(let i=0;i<32;i++){const x=(i*117+Math.sin(t*.6+i)*20)%1260,y=160+i*41%380;glow(c,x,y,13,i%2?'#fff8c8':'#9bffdf',.2);}break;
 case 2: // moon port and wave reflections
  c.fillStyle='#9bdcf015';c.fillRect(0,474,1200,75);
  for(let i=0;i<15;i++){const y=482+i*5;c.strokeStyle=`rgba(171,226,255,${.08+i*.006})`;c.lineWidth=2;c.beginPath();
   for(let x=0;x<=1210;x+=18)c.lineTo(x,y+Math.sin(x*.017+t*1.4+i*.3)*3);c.stroke();}
  for(let i=0;i<9;i++){let x=i*190-cam*.28;c.fillStyle='#9ca7d8aa';c.fillRect(x,400,8,145);c.fillRect(x-17,400,43,7);glow(c,x,397,30,'#c1d4ff',.17);}break;
 case 3: // drifting cloud islands
  for(let i=0;i<14;i++){const x=((i*205-cam*.24+t*(i%2?-3:4))%1700+1700)%1700-120,y=156+i*43%300;
   puffs(c,x,y,52+i%3*16,i%2?'#fcfbff':'#c6e8fb',.25+(i%3)*.05);}
  for(let i=0;i<6;i++){const x=i*260-cam*.19,y=420+i%2*30;c.fillStyle='#ffffff23';pill(c,x,y,170,14,7);c.fill();}break;
 case 4: // celestial navigation graph
  for(let i=0;i<25;i++){const x=(i*181+v*51)%1270,y=96+(i*67)%315;
    if(i<24){const x2=((i+1)*181+v*51)%1270,y2=96+((i+1)*67)%315;c.strokeStyle='#dcbbff43';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
    glow(c,x,y,13,'#decfff',.21);circle(c,x,y,2.5);c.fillStyle='#fff0ff';c.fill();}
  c.strokeStyle='#f0caff36';c.lineWidth=3;circle(c,920,235,147);c.stroke();break;
 case 5: // crystalline rock formations
  for(let i=0;i<22;i++){const x=i*68-cam*.32,y=532,h=55+i%5*30;
    c.globalAlpha=.42;c.fillStyle=i%2?'#77d5ec':'#b0f5ff';c.beginPath();c.moveTo(x-23,y);c.lineTo(x,y-h);c.lineTo(x+31,y);c.closePath();c.fill();}
  glow(c,690,380,305,'#78faff',.09);break;
 case 6: // vertical cyber-city towers and signage
  for(let i=0;i<15;i++){const x=(i*105-cam*.25)%1510,y=270+i%4*31,h=300+i%4*23;
    c.fillStyle=i%2?'#191b41':'#272148';c.fillRect(x,y,77,h);
    c.strokeStyle=i%2?'#63e9ff88':'#e29dfb88';c.lineWidth=2;c.strokeRect(x+6,y+8,63,39);
    c.fillStyle=i%2?'#70f4ff33':'#ffa5f633';for(let k=0;k<7;k++)c.fillRect(x+15,y+62+k*28,43,6);}
  break;
 case 7: // vast waterfalls of luminous sky-river
  for(let i=0;i<9;i++){const x=i*177-cam*.27;c.save();c.globalAlpha=.15+i%3*.05;c.fillStyle='#94e4ff';
    c.beginPath();c.moveTo(x,48);c.bezierCurveTo(x+43,180,x-55,350,x+25,600);c.lineTo(x+79,600);c.bezierCurveTo(x+13,360,x+108,165,x+40,48);c.fill();c.restore();}
  for(let i=0;i<18;i++){const x=i*82,y=480+Math.sin(t*.8+i)*8;glow(c,x,y,19,'#baf8ff',.13);}break;
 case 8: // clockworks
  for(let i=0;i<7;i++){const x=i*227-cam*.3,y=245+(i%2)*68;c.globalAlpha=.20;cog(c,x,y,69+i%3*21,(i%2?-1:1)*t*.27+i,'#f3d4b4');}
  c.globalAlpha=1;c.strokeStyle='#ffc6b330';c.lineWidth=6;circle(c,960,216,142);c.stroke();break;
 case 9: // majestic horizon and radiating sunset
  glow(c,600,265,340,'#ffca9b',.2);
  for(let i=0;i<13;i++){c.save();c.translate(645,260);c.rotate(i*TAU/13+t*.006);c.fillStyle='#ffe4b010';c.beginPath();c.moveTo(0,0);c.lineTo(800,-23);c.lineTo(800,23);c.closePath();c.fill();c.restore();}
  for(let i=0;i<9;i++){const x=i*173-cam*.19;c.fillStyle='#8a54605a';c.beginPath();c.moveTo(x-95,540);c.lineTo(x,350+i%3*20);c.lineTo(x+122,540);c.fill();}break;
 case 10: // heart of constellations, sacred moving mandala
  glow(c,680,230,320,'#e6bafa',.17);glow(c,680,230,185,'#b0f5ff',.1);
  for(let i=0;i<4;i++){c.strokeStyle=i%2?'#f7d9fc66':'#a5fff666';c.lineWidth=2;c.beginPath();c.ellipse(665,242,103+i*27,59+i*24,t*.13*(i%2?1:-1),0,TAU);c.stroke();}
  for(let i=0;i<10;i++){const a=i*TAU/10+t*.13,x=665+Math.cos(a)*205,y=242+Math.sin(a)*113;glow(c,x,y,20,'#ffe3e2',.2);}
  break;
 }
 c.globalAlpha=1;
 // Every mission has a tiny independent sky motif, also visible in level thumbnails.
 for(let i=0;i<3+v%4;i++){
   const x=(208+i*229+v*33-cam*.08+1200)%1200,y=74+(i*29+v*13)%153;
   c.globalAlpha=.34+.22*Math.sin(t*.9+i+v);
   c.strokeStyle=sc.gold;c.lineWidth=1.6;c.beginPath();c.moveTo(x-4,y);c.lineTo(x+4,y);c.moveTo(x,y-4);c.lineTo(x,y+4);c.stroke();
 }c.restore();
}
function platform(c,p,index,t){
 const act=Math.floor(index/9),sc=P[act],{x,y,w}=p;c.save();c.strokeStyle=sc.gold;c.fillStyle=sc.grass;c.lineWidth=1.3;
 switch(act){
 case 0:for(let q=x+18;q<x+w-10;q+=55)petals(c,q,y-8,5,'#ffd1d6',t*.3);break;
 case 1:for(let q=x+24;q<x+w-10;q+=35){c.beginPath();c.moveTo(q,y);c.lineTo(q-8,y-17);c.lineTo(q+6,y-13);c.stroke();}break;
 case 2:c.globalAlpha=.7;c.fillStyle='#e5f7ff';for(let q=x+14;q<x+w-10;q+=25)circle(c,q,y+8,2),c.fill();break;
 case 3:puffs(c,x+w*.5,y+8,12,'#fafbff',.15);break;
 case 4:c.setLineDash([5,8]);c.beginPath();c.moveTo(x+5,y+10);c.lineTo(x+w-5,y+10);c.stroke();c.setLineDash([]);break;
 case 5:for(let q=x+22;q<x+w;q+=38){c.beginPath();c.moveTo(q-8,y);c.lineTo(q,y-11);c.lineTo(q+6,y);c.stroke();}break;
 case 6:for(let q=x+8;q<x+w-8;q+=21){c.fillStyle=q%2?'#e898ff':'#7efcff';c.fillRect(q,y+3,9,2);}break;
 case 7:for(let q=x+15;q<x+w-14;q+=28){c.beginPath();c.moveTo(q,y-4+Math.sin(t*2+q)*3);c.quadraticCurveTo(q+7,y-11,q+14,y-4);c.stroke();}break;
 case 8:for(let q=x+15;q<x+w-15;q+=23)c.fillRect(q,y+17,6,4);break;
 case 9:for(let q=x+15;q<x+w-5;q+=45){c.beginPath();c.moveTo(q,y+5);c.lineTo(q+6,y+11);c.lineTo(q+12,y+5);c.stroke();}break;
 case 10:for(let q=x+15;q<x+w-10;q+=31){c.beginPath();c.moveTo(q,y-8);c.lineTo(q+5,y-2);c.lineTo(q,y+4);c.lineTo(q-5,y-2);c.closePath();c.stroke();}break;
 }
 c.restore();
}
function node(c,x,y,mode,role,active,t,index=0,number=null){
 const col=role===0?'#ffca88':role===1?'#96faff':'#d4b5ff';
 const pulse=.5+.5*Math.sin(t*2.8+index);
 glow(c,x,y-8,active?57:43,col,active?.32:.12);
 c.save();c.translate(x,y-14+Math.sin(t*1.8+index)*2);
 c.strokeStyle=active?'#ffffff':rgba(col,.8);c.lineWidth=2.5;
 if(['flower','seed'].includes(mode)){
  c.strokeStyle='#b1f7c6';c.lineWidth=3;c.beginPath();c.moveTo(0,31);c.quadraticCurveTo(-6,10,0,-11);c.stroke();
  petals(c,0,-13,active?21:13,active?'#fdcbde':'#c2d5ec',t*.08); 
 }else if(mode==='feather'){
  c.fillStyle=active?'#e5ffff':'#b3eafa';c.beginPath();c.ellipse(0,0,9,23,.6,0,TAU);c.fill();c.strokeStyle='#618eb9';c.beginPath();c.moveTo(-13,17);c.lineTo(13,-17);c.stroke();
 }else if(['prism','star','duo','spark','echo'].includes(mode)){
  const r=mode==='star'?19:21;c.rotate(t*.11);c.beginPath();c.moveTo(0,-r);c.lineTo(r*.73,0);c.lineTo(0,r);c.lineTo(-r*.73,0);c.closePath();
  c.fillStyle=active?rgba(col,.85):rgba(col,.26);c.fill();c.stroke();
 }else if(mode==='moon'||mode==='clock'){
  circle(c,0,0,21);c.fillStyle=active?rgba(col,.72):'#141c43';c.fill();c.stroke();
  c.lineWidth=2;c.beginPath();c.moveTo(0,0);c.lineTo(0,-12);c.moveTo(0,0);c.lineTo(11,6);c.stroke();
 }else if(mode==='power'){
  pill(c,-19,-23,38,46,7);c.fillStyle=active?'#a0f7ff':'#192a4d';c.fill();c.stroke();c.fillStyle='#e4e5ff';c.fillRect(-6,-4,12,5);
 }
 c.restore();
 if(number!=null)text(c,x,y-47,String(number),col,13);
 if(!active&&mode!=='star'&&mode!=='feather')text(c,x,y+36,role===0?'✦':role===1?'◈':'◆',col,13);
 if(active&&pulse>.7)glow(c,x,y-16,25,'#ffffff',.18);
}
function signature(c,level,t){
 const s=level.signature;if(!s)return;
 const act=level.act-1,sc=P[act],v=s.variant;
 c.save();
 for(let i=0;i<s.zones.length;i++){
   const z=s.zones[i];c.save();c.globalAlpha=.1;c.fillStyle=act===3?'#c4eeff':'#77cbe8';pill(c,z.x,z.y,z.w,z.h,28);c.fill();c.restore();
   for(let n=0;n<7;n++){const y=z.y+((n*42+t*(act===3?-37:28))%z.h+z.h)%z.h;
     c.strokeStyle=act===3?'#d4f8ff8a':'#76d7f680';c.lineWidth=1.5;c.beginPath();c.moveTo(z.x+16+n*17,y);c.quadraticCurveTo(z.x+23+n*17,y-8,z.x+14+n*17,y-14);c.stroke();}
 }
 for(const [i,p] of s.platforms.entries()){
   if(p.linked>=0&&!s.nodes[p.linked]?.active)continue;
   let y=p.y;
   if(p.move==='tide')y+=Math.sin((s.elapsed/s.period)*TAU+p.offset*.5)*27;
   if(p.move==='lift')y-=30+Math.sin(s.elapsed*.85+p.offset)*26;
   glow(c,p.x+p.w/2,y,50,sc.mist,.12);
   c.fillStyle=act===1?'#397965':act===2?'#8fb9dc':'#40538a';pill(c,p.x,y,p.w,p.h,6);c.fill();
   c.fillStyle=sc.grass;pill(c,p.x+3,y,p.w-6,4,2);c.fill();
   if(act===6){c.strokeStyle='#97e7ff';c.strokeRect(p.x+3,y+4,p.w-6,p.h-6);}
 }
 if(s.kind==='tide'){
   const status=s.phase>.65?'ПРИЛИВ':'ОЖИДАНИЕ';text(c,620,210,status,s.phase>.65?'#c3faff':'#c1c0e3',15);
 }
 if(s.kind==='constellation'){
   const sequence=s.nodes.slice().sort((a,b)=>a.order-b.order);
   c.strokeStyle='#d6c5ff60';c.lineWidth=2;c.beginPath();sequence.forEach((n,i)=>i===0?c.moveTo(n.x,n.y-14):c.lineTo(n.x,n.y-14));c.stroke();
   text(c,600,214,`УЗОР: ${s.progress} / ${s.nodes.length}`,'#d5c6ff',16);
 }
 if(s.kind==='prism')for(let i=1;i<s.nodes.length;i++){
   const a=s.nodes[i-1],b=s.nodes[i];c.strokeStyle=a.active&&b.active?'#c1fffa9c':'#83d9e74c';c.lineWidth=4;c.beginPath();c.moveTo(a.x,a.y-15);c.lineTo(b.x,b.y-15);c.stroke();
 }
 if(s.kind==='city')for(const n of s.nodes)if(n.active){
   c.strokeStyle='#8deffff0';c.lineWidth=1.4;c.beginPath();c.moveTo(n.x,n.y-32);c.lineTo(n.x,n.y-125);c.stroke();}
 if(s.kind==='clock'&&s.barrier){
   const opened=s.done||s.window>0;
   if(!opened){const b=s.barrier;glow(c,b.x,b.y+b.h/2,71,'#ffabac',.19);
     c.fillStyle='#633c58';pill(c,b.x,b.y,b.w,b.h,5);c.fill();c.strokeStyle='#ffd5aa';c.lineWidth=3;
     for(let y=b.y+12;y<b.y+b.h;y+=23){c.beginPath();c.moveTo(b.x,y);c.lineTo(b.x+b.w,y+13);c.stroke();}}
   const remaining=s.done?'СИГНАЛ СОХРАНЁН':s.window>0?`⏳ ${Math.ceil(s.window)} СЕК.`:'НАЖМИТЕ ◈';
   text(c,s.barrier.x-40,315,remaining,s.window>0?'#b5fff5':'#ffd7b6',13);
 }
 if(s.kind==='river'||s.kind==='relay')for(const [i,p] of s.pairs.entries()){
   const col=p.active?'#d7fefa':'#a4d9ff';
   c.strokeStyle=p.active?'#9cfaeeb0':'#b2d6ff43';c.lineWidth=3;c.setLineDash(p.active?[]:[7,10]);
   c.beginPath();c.moveTo(p.x0,G-51);c.quadraticCurveTo((p.x0+p.x1)/2,G-170,p.x1,G-51);c.stroke();c.setLineDash([]);
   node(c,p.x0,G-27,'star',0,p.active,t,i,i+1);
   node(c,p.x1,G-27,'star',1,p.active,t,i,i+1);
   if(!p.active)text(c,(p.x0+p.x1)/2,G-146,s.kind==='river'?'ВМЕСТЕ':'СИГНАЛ',col,12);
 }
 for(const [i,n] of s.nodes.entries())node(c,n.x,n.y,n.mode,n.role,n.active,t,i,n.order);
 if(s.finale){const x=level.portal;
   glow(c,x,G-180,112,sc.gold,.14+.05*Math.sin(t*2.2));
   c.strokeStyle=rgba(sc.gold,.5);c.lineWidth=2;c.beginPath();c.arc(x,G-66,92+Math.sin(t*2)*7,Math.PI*1.1,Math.PI*1.9);c.stroke();
   text(c,x,G-181,'ФИНАЛ АКТА',sc.gold,15);
 }
 if(s.kind==='heart'){
   const x=level.portal-130,y=G-210;glow(c,x,y,152,'#fcd1fb',.18);
   c.save();c.translate(x,y);c.rotate(t*.13);c.strokeStyle='#d9c2ff';c.lineWidth=2.5;
   for(let k=0;k<3;k++){c.beginPath();c.ellipse(0,0,55+k*22,20+k*16,k*.46,0,TAU);c.stroke();}c.restore();
 }
 c.restore();
}
root.GameBiomes={PALETTES:P,background:bkg,platform,signature};
})(typeof window!=='undefined'?window:globalThis);
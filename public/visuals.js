/* Linked by Light — visual engine v4.0. Pure canvas graphics, zero external assets. */
(function (root) {
'use strict';
const TAU = Math.PI * 2;
const SCENES = [
  {sky:['#080b25','#18234c','#55415f'],mist:'#a28fef',halo:'#f3abca',moon:'#f1defc',stone:'#39375e',grass:'#a9f3d2',far:'#1b274b',near:'#1b1d3a',gold:'#f4c69d'},
  {sky:['#041626','#123953','#31747c'],mist:'#86e6d5',halo:'#83d8db',moon:'#b5f9ed',stone:'#284b61',grass:'#b6eac3',far:'#14344d',near:'#102c42',gold:'#d5e5a5'},
  {sky:['#170e29','#3d234f','#8c5268'],mist:'#e2a6df',halo:'#ffb99a',moon:'#fff0c7',stone:'#67445f',grass:'#e7bdd4',far:'#3b244a',near:'#2b203e',gold:'#ffd19e'}
];
const mix=(a,b,t)=>a+(b-a)*t;
function hash(n){const q=Math.sin(n*127.1+11.73)*43758.5453;return q-Math.floor(q);}
function rr(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
function linear(c,x,y,x2,y2,a,b){const g=c.createLinearGradient(x,y,x2,y2);g.addColorStop(0,a);g.addColorStop(1,b);return g;}
function glow(c,x,y,r,col,a=1){if(r<=0)return;c.save();c.globalAlpha*=a;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(.2,col);g.addColorStop(1,'transparent');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill();c.restore();}
function star(c,x,y,sz,alpha){c.save();c.globalAlpha*=alpha;c.strokeStyle='#f6eeff';c.lineWidth=sz*.32;c.lineCap='round';c.beginPath();c.moveTo(x-sz,y);c.lineTo(x+sz,y);c.moveTo(x,y-sz);c.lineTo(x,y+sz);c.stroke();c.fillStyle='#fff';c.beginPath();c.arc(x,y,Math.max(.45,sz*.17),0,TAU);c.fill();c.restore();}
function hills(c,W,H,cam,stage,layer,color,base,height,par){
  c.save();c.translate(-cam*par,0);c.fillStyle=color;c.beginPath();c.moveTo(-500,H);c.lineTo(-500,base);
  for(let x=-500;x<W+2200;x+=23){const v=Math.sin((x+stage*270)*.008+layer*.82)*.51+Math.sin(x*.019+layer*2.67)*.26+Math.sin(x*.0035+layer*.91)*.39;
   c.lineTo(x,base-height*(.32+Math.abs(v)));}
  c.lineTo(W+2200,H);c.closePath();c.fill();c.restore();
}
function background(c,s){
 const {W,H,camera:cam=0,clock:t=0,levelIndex:i=0}=s;const sc=SCENES[i]||SCENES[0];
 const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,sc.sky[0]);sky.addColorStop(.56,sc.sky[1]);sky.addColorStop(1,sc.sky[2]);c.fillStyle=sky;c.fillRect(0,0,W,H);
 glow(c,W*.18-cam*.035,100,330,sc.mist,.17);glow(c,W*.83-cam*.035,330,340,sc.halo,.16);
 // Wide, gently flowing celestial ribbons.
 c.save();c.globalAlpha=.11;c.lineWidth=54;c.strokeStyle=sc.mist;c.beginPath();
 c.moveTo(-120,85);c.bezierCurveTo(300+Math.sin(t*.12)*23,190,670,-18,1290,98);c.stroke();
 c.lineWidth=19;c.globalAlpha=.09;c.strokeStyle=sc.halo;c.beginPath();c.moveTo(-50,120);c.bezierCurveTo(350,230,800,12,1270,148);c.stroke();c.restore();
 // Background stars are world-anchored and twinkle without blinking suddenly.
 for(let n=0;n<132;n++){
  const x=(hash(n+12)*1450-cam*.07+1600)%1450-125;
  const y=19+hash(n+467)*376;
  const a=(.18+Math.sin(t*.75+n*1.34)*.11+hash(n+45)*.28);
  c.globalAlpha=a;c.fillStyle='#eff2ff';c.beginPath();c.arc(x,y,n%11===0?1.5:.75,0,TAU);c.fill();
  if(n%21===0)star(c,x,y,3.8,a);
 }c.globalAlpha=1;
 // Luminous moon and nested orbital rings.
 const mx=878-cam*.058,my=148;
 glow(c,mx,my,156,sc.moon,.16);
 c.save();c.translate(mx,my);c.rotate(-.21);c.strokeStyle=sc.moon;c.globalAlpha=.15;c.lineWidth=1.5;
 c.beginPath();c.ellipse(0,0,105,48,.27,0,TAU);c.stroke();
 c.beginPath();c.ellipse(0,0,126,60,-.36,0,TAU);c.stroke();c.restore();
 c.save();c.shadowColor=sc.moon;c.shadowBlur=26;c.fillStyle=sc.moon;c.beginPath();c.arc(mx,my,39,0,TAU);c.fill();c.restore();
 c.save();c.globalAlpha=.20;c.fillStyle=sc.sky[1];c.beginPath();c.arc(mx+16,my-9,37,0,TAU);c.fill();c.restore();
 // Three separated layers establish depth without any image loading.
 hills(c,W,H,cam,i,1,sc.far,510,155,.12);
 hills(c,W,H,cam,i,2,'#1b284cb8',535,126,.25);
 hills(c,W,H,cam,i,3,sc.near,562,110,.39);
 // Village silhouettes, arched windows and suspended lanterns.
 c.save();c.translate(-cam*.40,0);
 for(let n=-1;n<22;n++){
  const x=n*105+hash(n+500)*38;const h=57+hash(n+23)*93;const y=544-h;
  c.fillStyle=n%2?sc.far:sc.near;c.fillRect(x,y,63,h+34);
  c.beginPath();c.moveTo(x-7,y);c.lineTo(x+31,y-36);c.lineTo(x+70,y);c.closePath();c.fill();
  for(let w=0;w<3;w++){
   const wx=x+13+w*17,wy=y+20+(w%2)*22;
   c.fillStyle=(n+w)%4===0?'#ffe3b33a':'#b8d9ec20';rr(c,wx,wy,8,13,3);c.fill();
  }
 }
 c.restore();
 c.save();c.translate(-cam*.27,0);
 for(let n=0;n<10;n++){
  const x=150+n*194,y=-7,h=72+hash(n+222)*89;
  c.strokeStyle='#b0c5e133';c.lineWidth=1.1;c.beginPath();c.moveTo(x,y);c.lineTo(x,h+Math.sin(t*.9+n)*3);c.stroke();
  glow(c,x,h+8,21,n%2?sc.halo:sc.mist,.30);
  c.fillStyle=n%2?sc.halo:sc.mist;c.beginPath();c.moveTo(x-5,h);c.lineTo(x+5,h);c.lineTo(x+2,h+15);c.lineTo(x-2,h+15);c.closePath();c.fill();
 }c.restore();
 // Motes are drawn with simple shapes to stay cheap on mobile.
 for(let n=0;n<37;n++){
  const x=((hash(n+345)*1390+Math.sin(t*(.13+hash(n+69)*.12)+n)*23-cam*.065)%1390+1390)%1390-70;
  const y=135+hash(n+321)*395+Math.cos(t*.8+n)*6;
  c.globalAlpha=.26+hash(n+89)*.37;c.fillStyle=n%3===0?sc.gold:sc.mist;c.beginPath();c.arc(x,y,1+hash(n+9)*1.6,0,TAU);c.fill();
 }c.globalAlpha=1;
 const fog=c.createLinearGradient(0,420,0,H);fog.addColorStop(0,'#ffffff00');fog.addColorStop(1,sc.sky[0]+'99');c.fillStyle=fog;c.fillRect(0,420,W,H-420);
}
function terrain(c,level,index,clock,ground=544){
 const sc=SCENES[index]||SCENES[0];for(const [a,b] of level.floor){let w=b-a;
  c.fillStyle=linear(c,a,ground,a,650,sc.stone,'#0b1127');c.fillRect(a,ground,w,650-ground);
  c.fillStyle=linear(c,a,ground,a,ground+13,sc.grass,sc.stone);rr(c,a,ground-5,w,12,3);c.fill();
  c.fillStyle='#fff8';c.fillRect(a,ground-6,w,1.5);
  c.fillStyle='#191f38a6';
  for(let x=a+17;x<b-10;x+=47){rr(c,x,ground+18,31,5,2);c.fill();rr(c,x+13,ground+58,24,4,2);c.fill();}
  c.strokeStyle='#a0a4d324';c.lineWidth=1;
  for(let x=a+25;x<b;x+=63){c.beginPath();c.moveTo(x,ground+12);c.lineTo(x-7,ground+35);c.lineTo(x+6,ground+51);c.stroke();}
  // Small tufts and luminous sprouts along upper ledge.
  for(let x=a+18;x<b-15;x+=85){const v=Math.sin(x*15.7);c.strokeStyle=sc.grass+'94';c.lineWidth=1.8;c.beginPath();c.moveTo(x,ground-5);c.quadraticCurveTo(x-7,ground-13-v*4,x-12,ground-16);c.moveTo(x,ground-5);c.quadraticCurveTo(x+9,ground-17,x+13,ground-18);c.stroke();
   if(Math.floor(x/85)%3===0){glow(c,x+9,ground-18,11,sc.gold,.25);c.fillStyle=sc.gold;c.beginPath();c.arc(x+9,ground-18,2,0,TAU);c.fill();}}
 }
}
function scenery(c,level,index,clock){
 const sc=SCENES[index]||SCENES[0];
 // Floating temple fragments at fixed places. Only scenery; they do not collide.
 for(let n=0;n<8;n++){
  const x=180+n*250, y=275+Math.sin(n*3.31)*53+Math.sin(clock*.55+n)*4;
  if(x>level.width+100)continue;
  c.save();c.globalAlpha=.65;
  c.fillStyle=sc.stone;c.beginPath();c.moveTo(x-18,y);c.lineTo(x+14,y-9);c.lineTo(x+29,y+8);c.lineTo(x+4,y+16);c.lineTo(x-24,y+9);c.closePath();c.fill();
  c.strokeStyle=sc.grass+'77';c.lineWidth=2;c.beginPath();c.moveTo(x-15,y);c.lineTo(x+13,y-9);c.stroke();
  glow(c,x,y-9,23,sc.halo,.24);c.restore();
 }
 // Four crystal-branch lantern posts hint at a magical world.
 for(let n=0;n<7;n++){
  const x=140+n*293;if(x>level.width)continue;
  const onGround=level.floor.some(([a,b])=>x>a+30&&x<b-35);if(!onGround)continue;
  c.save();c.globalAlpha=.53;c.lineCap='round';c.strokeStyle=sc.grass;c.lineWidth=4;
  c.beginPath();c.moveTo(x,544);c.quadraticCurveTo(x-4,490,x+7,470);c.stroke();
  c.lineWidth=2.3;c.beginPath();c.moveTo(x+4,493);c.quadraticCurveTo(x+24,483,x+26,471);c.moveTo(x+2,507);c.quadraticCurveTo(x-16,495,x-19,483);c.stroke();
  glow(c,x+7,467,27,sc.halo,.2);
  c.fillStyle=sc.halo;c.beginPath();c.arc(x+7,467,4+Math.sin(clock*2+n)*.3,0,TAU);c.fill();c.restore();
 }
}
function platform(c,s,index,clock){const {x,y,w}=s;const sc=SCENES[index]||SCENES[0],bridge=s.kind==='bridge';
 c.save();if(bridge){
  glow(c,x+w/2,y+6,Math.min(w*.6,120),sc.mist,.16);
  c.fillStyle='#23485f';rr(c,x,y,w,19,6);c.fill();c.fillStyle='#9cecf6';rr(c,x,y,w,6,3);c.fill();
  c.strokeStyle='#b4faffbb';c.lineWidth=1.4;for(let q=x+12;q<x+w;q+=35){c.beginPath();c.moveTo(q,y+11);c.lineTo(Math.min(q+18,x+w-6),y+11);c.stroke();}
  for(let q=x+20;q<x+w;q+=43){star(c,q,y+2+Math.sin(clock*2+q)*2,2.5,.66);}
 }else{
  c.fillStyle='#1a2039';rr(c,x+5,y+7,w-10,22,6);c.fill();
  c.fillStyle=linear(c,x,y,x,y+21,sc.stone,'#252844');rr(c,x,y,w,20,5);c.fill();
  c.fillStyle=sc.grass;rr(c,x,y,w,5,2);c.fill();
  c.fillStyle='#fff7';c.fillRect(x+4,y,w-8,1.4);
  c.strokeStyle='#8e9dc150';c.lineWidth=1.5;
  for(let q=x+22;q<x+w-14;q+=38){c.beginPath();c.moveTo(q,y+11);c.lineTo(q+12,y+11);c.stroke();}
  for(let q=x+27;q<x+w-10;q+=92){c.strokeStyle=sc.grass+'9e';c.lineWidth=1.3;c.beginPath();c.moveTo(q,y);c.lineTo(q-6,y-9);c.moveTo(q,y);c.lineTo(q+6,y-11);c.stroke();}
 }c.restore();}
function player(c,p,clock){
 const type=p.type||0,col=type?'#86eff4':'#ffc084',outline=type?'#1c526c':'#743d67';
 const anim=p.anim||{},run=anim.run||0,land=anim.land||0;
 const bob=p.grounded?(Math.sin(clock*2.4+(p.breathe||0))*1.1+Math.abs(Math.sin(anim.stride||0))*run*2):0;
 const x=p.x+(p.w||30)/2,y=p.y+(p.h||43)+bob;
 c.save();glow(c,x,y-23,76,col,(p.abilityFx>0?.24:.085)+.016*Math.sin(clock*2.5));
 c.globalAlpha=p.grounded?.22:.10;c.fillStyle='#000';c.beginPath();c.ellipse(x,y+3,p.grounded?25:18,5,0,0,TAU);c.fill();c.globalAlpha=1;
 c.translate(x,y);const face=p.face||1;
 // Squash on landing, stretch when airborne, lean slightly when running.
 const stretch=anim.airborne?(anim.takeoff?.09:anim.fall?.055:.015):0;
 c.rotate((anim.lean||0)+Math.sin(clock*1.7+(p.breathe||0))*.012);
 c.scale(1+land*.12-stretch*.4,1-land*.13+stretch);
 // Sky-colored scarf floats behind the body.
 c.save();c.scale(face,1);c.fillStyle=type?'#43c8d1':'#ef747d';
 const flutter=Math.sin(clock*(6+run*7))*(4+run*7);
 c.beginPath();c.moveTo(-5,-36);c.quadraticCurveTo(-25,-38+flutter,-37-run*6,-28+flutter*.7);c.lineTo(-25,-24+flutter*.55);c.quadraticCurveTo(-11,-26,-4,-26);c.closePath();c.fill();c.restore();
 // Simple readable feet animated only while moving.
 c.fillStyle=outline;const stride=anim.airborne?0:Math.sin(anim.stride||0)*7*run;
 rr(c,-16,-10+Math.max(-5,stride),12,14,5);c.fill();
 rr(c,5,-10+Math.max(-5,-stride),12,14,5);c.fill();
 // Animated arms (behind the coat).
 const arm=anim.airborne?-4:Math.sin(anim.stride||0)*run*5;
 rr(c,-24,-38+arm,10,25,5);c.fill();rr(c,14,-38-arm,10,25,5);c.fill();
 // Outer coat / body silhouette.
 c.strokeStyle=outline;c.lineWidth=3;c.fillStyle=linear(c,0,-52,0,0,type?'#46b6dc':'#f3a26c',type?'#227d9e':'#b76178');
 rr(c,-19,-48,38,45,15);c.fill();c.stroke();
 c.fillStyle=type?'#8feef4':'#ffe0a7';rr(c,-14,-45,28,28,12);c.fill();
 // Hood/hair crown with small distinctive horn/antenna.
 c.fillStyle=type?'#287f9c':'#a34d66';c.beginPath();c.ellipse(0,-47,19,13,0,Math.PI,TAU);c.fill();
 c.fillRect(-19,-47,38,5);c.beginPath();c.moveTo(-14,-55);c.lineTo(-18,-66);c.lineTo(-6,-58);c.closePath();c.fill();
 c.beginPath();c.moveTo(14,-55);c.lineTo(18,-66);c.lineTo(6,-58);c.closePath();c.fill();
 // A small gemstone crown.
 c.shadowColor=col;c.shadowBlur=12;c.fillStyle='#f9fcff';c.beginPath();c.moveTo(0,-63);c.lineTo(5,-58);c.lineTo(0,-53);c.lineTo(-5,-58);c.closePath();c.fill();c.shadowBlur=0;
 // Eyes are dark and remain readable at small phone resolution.
 c.fillStyle='#1f2d45';
 if(anim.blink){rr(c,-8,-34,5.5,2,1);c.fill();rr(c,4,-34,5.5,2,1);c.fill();}
 else{rr(c,-8,-37,5.5,8,3);c.fill();rr(c,4,-37,5.5,8,3);c.fill();}
 if(!anim.blink){c.fillStyle='#fff';c.beginPath();c.arc(-6,-35.5,1.45,0,TAU);c.arc(6,-35.5,1.45,0,TAU);c.fill();}
 c.globalAlpha=.5;c.fillStyle=type?'#428da0':'#dd8193';c.beginPath();c.ellipse(-12,-29,3.2,1.9,0,0,TAU);c.ellipse(12,-29,3.2,1.9,0,0,TAU);c.fill();c.globalAlpha=1;
 c.strokeStyle='#26324b';c.lineWidth=1.3;c.beginPath();
 if(run>.55)c.arc(0,-27,3.5,-.15,Math.PI+.15);
 else if(anim.airborne)c.arc(0,-28,2.6,0,TAU);
 else c.arc(0,-27,3,.16,Math.PI-.16);
 c.stroke();
 // Character identity halo and cooldown ring.
 c.save();c.globalAlpha=.8;c.strokeStyle=col;c.lineWidth=2;
 c.beginPath();c.ellipse(0,-59,23,9,0,0,TAU);c.stroke();c.restore();
 if(p.cool>0){const total=type?1.05:1;c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.arc(0,-28,30,-Math.PI/2,-Math.PI/2+TAU*(1-p.cool/total));c.stroke();}
 if(p.dash>0){c.save();c.globalAlpha=.2;c.fillStyle=col;rr(c,-46*face-14,-47,46,32,13);c.fill();c.restore();}
 c.restore();
 // Floating name plates make characters easy to distinguish on mobile.
 c.save();c.textAlign='center';c.font='800 12px system-ui';c.strokeStyle='#080e22d9';c.lineWidth=4;c.fillStyle=col;
 const label=type?'ЭХО':'ИСКРА';c.strokeText(label,x,y-78);c.fillText(label,x,y-78);c.restore();
}
function portal(c,x,y,active,clock){
 const pulse=1+Math.sin(clock*2.4)*.035;glow(c,x,y,active?144:98,active?'#b5a8ff':'#7259ac',active?.26:.12);
 c.save();c.translate(x,y);c.scale(pulse,pulse);
 // Pedestal and carved frame.
 c.fillStyle='#29284d';rr(c,-43,51,86,16,7);c.fill();
 c.strokeStyle='#b39ed0';c.lineWidth=10;c.shadowBlur=active?19:0;c.shadowColor='#cbb8ff';c.beginPath();c.ellipse(0,0,37,61,0,0,TAU);c.stroke();c.shadowBlur=0;
 c.strokeStyle=active?'#ffe7cd':'#9685be';c.lineWidth=2.4;c.beginPath();c.ellipse(0,0,32,56,0,0,TAU);c.stroke();
 c.save();c.beginPath();c.ellipse(0,0,29,53,0,0,TAU);c.clip();
 c.fillStyle=linear(c,-35,-60,33,65,active?'#7b77f3':'#453d76',active?'#5ee2e0':'#252747');c.fillRect(-40,-68,80,140);
 for(let n=0;n<17;n++){const xx=Math.sin(n*18.5+clock*(n%2?.2:-.3))*26,yy=((n*27-clock*12)%136+136)%136-68;c.fillStyle=active?'#fdf1ffaf':'#b7a6d150';c.beginPath();c.arc(xx,yy,n%5===0?2:1,0,TAU);c.fill();}
 c.restore();
 for(let n=0;n<9;n++){let a=clock*.28+n*TAU/9;c.fillStyle=n%2?'#fff0d6':'#a8f0fd';c.globalAlpha=active?.87:.33;c.beginPath();c.arc(Math.cos(a)*42,Math.sin(a)*65,2.3,0,TAU);c.fill();}c.globalAlpha=1;
 c.textAlign='center';c.font='800 12px system-ui';c.fillStyle='#f2e8ff';c.strokeStyle='#070d22';c.lineWidth=4;
 const title=active?'ОБА СЮДА':'ЗАКРЫТО';c.strokeText(title,0,-84);c.fillText(title,0,-84);c.restore();
}
function vignette(c,W,H){
 // Small shader-like corner shading makes every level feel composed.
 const g=c.createRadialGradient(W*.5,H*.47,H*.18,W*.5,H*.47,W*.78);
 g.addColorStop(0,'#02051800');g.addColorStop(.77,'#02051808');g.addColorStop(1,'#02051884');
 c.fillStyle=g;c.fillRect(0,0,W,H);
}
root.GameVisuals={background,terrain,scenery,platform,player,portal,vignette};
})(typeof window!=='undefined'?window:globalThis);
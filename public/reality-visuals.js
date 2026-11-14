/* v15 reality portals: client visualizer; physics/locks come only from the server. */
(function(root){'use strict';
const G=544;
const warm='#ffd49c',cold='#9cecff';
function halo(c,x,y,r,color,opacity=.2){
 c.save();c.globalAlpha=opacity;
 const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#0000');
 c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);c.restore();
}
function label(c,x,y,t,color,size=13){
 c.save();c.textAlign='center';c.font='800 '+size+'px system-ui';
 c.lineWidth=4;c.strokeStyle='#081226dd';c.strokeText(t,x,y);
 c.fillStyle=color;c.fillText(t,x,y);c.restore();
}
function background(c,level,role,clock){
 if(!level?.reality)return;
 c.save();
 c.fillStyle=role===0?'rgba(242,165,86,.055)':role===1?'rgba(97,177,250,.065)':'rgba(175,133,245,.04)';
 c.fillRect(0,0,1200,650);
 halo(c,role===1?920:300,126,280,role===1?cold:warm,.07+.015*Math.sin(clock));
 label(c,1000,55,role===0?'МИР СВЕТА':role===1?'МИР ТЕНЕЙ':'ДВЕ РЕАЛЬНОСТИ',role===0?warm:cold,11);
 c.restore();
}
function anchor(c,anchor,active,kind,t){
 const x=anchor.x,y=G-25,col=anchor.role===0?warm:cold;
 halo(c,x,y,active?87:56,col,active?.23:.12);
 c.save();c.translate(x,y-11+Math.sin(t*1.8+anchor.role)*3);
 c.strokeStyle=active?'#fbffff':col;c.lineWidth=3;
 c.fillStyle=active?col:'#151c38';
 c.beginPath();c.moveTo(0,-26);c.lineTo(20,-3);c.lineTo(0,19);c.lineTo(-20,-3);c.closePath();c.fill();c.stroke();
 c.restore();
 label(c,x,G+24,kind==='gravity'?'СТОЙ ЗДЕСЬ':anchor.role===0?'ИСКРА · F':'ЭХО · ИМПУЛЬС',col,11);
}
function draw(c,level,players,world,clock,role){
 const r=level?.reality;
 if(!r)return;
 const active=world?.anchors||r.anchors.map(a=>!!a.active),done=!!world?.done;
 c.save();
 // Two different physical pathways, shown clearly only in their owner's dimension.
 if(r.kind==='mirror')for(const p of r.platforms){
  const visible=active[p.role],mine=role===p.role;
  const col=p.role===0?warm:cold;
  c.save();c.globalAlpha=visible?(mine?.92:.28):.11;
  c.strokeStyle=col;c.lineWidth=2.5;c.setLineDash(visible?[]:[7,9]);
  c.fillStyle=visible?(p.role===0?'#8a553b':'#285674'):'#343653';
  c.beginPath();c.roundRect(p.x,p.y,p.w,p.h,6);c.fill();c.stroke();
  c.setLineDash([]);c.restore();
 }
 for(const [i,a] of r.anchors.entries())anchor(c,a,active[i],r.kind,clock);
 if(r.kind==='chronicle'){
  const w=world?.window||0;
  label(c,r.anchors[0].x,G-102,'ПРОШЛОЕ',warm,13);
  label(c,r.anchors[1].x,G-102,'БУДУЩЕЕ',cold,13);
  if(w>0&&!done)label(c,(r.anchors[0].x+r.anchors[1].x)/2,G-165,'ВРЕМЕННОЕ ОКНО: '+Math.ceil(w)+' С','#f3dcff',15);
 }
 if(r.kind==='mirror')label(c,(r.anchors[0].x+r.anchors[1].x)/2,G-196,
  done?'МИРЫ СОЕДИНЕНЫ':'ДВЕ ПЕЧАТИ — ДВА МИРА',done?'#b8ffda':'#e9dcff',14);
 if(r.kind==='gravity'&&r.core){
  const cx=r.core.x,cy=r.core.y,activeField=(world?.gravityTimer||0)>0;
  halo(c,cx,cy,activeField?112:76,'#b8e9ff',activeField?.37:.16);
  c.save();c.translate(cx,cy+Math.sin(clock*2)*5);
  c.rotate(clock*.2);c.strokeStyle=activeField?'#f1fcff':'#9db9d8';c.lineWidth=3;
  c.fillStyle=activeField?'#96e9ff75':'#57709866';
  c.beginPath();c.moveTo(0,-28);c.lineTo(28,0);c.lineTo(0,28);c.lineTo(-28,0);c.closePath();
  c.fill();c.stroke();c.restore();
  label(c,cx,cy-60,done?'ЯДРО АКТИВИРОВАНО':activeField?'ПРИКОСНИТЕСЬ ОБА':'ГРАВИТАЦИОННОЕ ЯДРО','#d1f6ff',12);
  if(activeField&&!done)label(c,cx,cy+74,'АНТИГРАВИТАЦИЯ · '+Math.ceil(world.gravityTimer)+' С','#c9ffff',12);
  if(activeField&&!done){
   for(let n=0;n<16;n++){
    const x=cx-135+n*18,dy=(clock*34+n*47)%240;
    c.fillStyle=n%2?'#9fe7ff88':'#d0baff88';c.fillRect(x,G-20-dy,2,9);
   }
  }
 }
 if(done)label(c,(r.anchors[0].x+r.anchors[1].x)/2,G-240,'✦ СВЯЗЬ ВОССТАНОВЛЕНА ✦','#d4ffec',13);
 c.restore();
}
root.GameReality={background,draw};
})(typeof window!=='undefined'?window:globalThis);
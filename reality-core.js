'use strict';
// v15: shared, authoritative puzzles spanning two complementary dimensions.
// Browser clients only render snapshots. All unlocks are determined here.
const {GROUND}=require('./shared/stages');
const DT=1/60;
const distance=(p,x,y)=>Math.hypot(p.x+15-x,p.y+21.5-y);
const atPad=(p,a)=>p.grounded&&Math.abs(p.x+15-a.x)<65&&Math.abs(p.y+p.h-GROUND)<18;

function init(g){
 const r=g.level.reality;
 if(!r)return;
 r.done=false;r.window=0;r.charge=0;r.gravityTimer=0;
 r.touched=[false,false];
 for(const a of r.anchors)a.active=false;
}

function onAbility(g,p){
 const r=g.level.reality;
 if(!r||r.done)return;
 if(r.kind==='mirror'){
  const a=r.anchors[p.type];
  if(!a.active&&distance(p,a.x,GROUND-40)<132)a.active=true;
  r.done=r.anchors.every(v=>v.active);
 }
 if(r.kind==='chronicle'){
  if(p.type===0){
   if(distance(p,r.anchors[0].x,GROUND-40)<132){
    r.window=12;r.anchors[0].active=true;r.anchors[1].active=false;
   }
  }else if(r.window>0&&r.anchors[0].active&&!r.anchors[1].active
    &&distance(p,r.anchors[1].x,GROUND-40)<148){
   r.anchors[1].active=true;r.done=true;
  }
 }
}

function platforms(g,role){
 const r=g.level.reality;
 if(!r||r.kind!=='mirror')return [];
 return r.platforms.filter(p=>p.role===role&&r.anchors[role].active)
  .map(p=>({x:p.x,y:p.y,w:p.w,h:p.h,kind:'reality-platform'}));
}

function forces(g,p,dt){
 const r=g.level.reality;
 // These forces offset only part of the normal 1300 px/s² gravity.
 if(r?.kind==='gravity'&&r.gravityTimer>0&&!r.done){
  p.vy=Math.max(-620,p.vy-820*dt);
 }
}

function afterStep(g,p){
 const r=g.level.reality;
 if(!r||r.kind!=='gravity'||r.done||r.gravityTimer<=0)return;
 // Both partners must touch the elevated core while the antigravity field lives.
 if(distance(p,r.core.x,r.core.y)<71)r.touched[p.type]=true;
 if(r.touched.every(Boolean)){
  r.done=true;r.gravityTimer=0;
  for(const a of r.anchors)a.active=true;
 }
}

function advance(g,dt){
 const r=g.level.reality;
 if(!r||r.done)return;
 if(r.kind==='chronicle'&&r.window>0){
  r.window=Math.max(0,r.window-dt);
  if(r.window===0){r.anchors[0].active=false;r.anchors[1].active=false;}
 }
 if(r.kind==='gravity'&&r.gravityTimer>0){
  r.gravityTimer=Math.max(0,r.gravityTimer-dt);
  if(r.gravityTimer===0){r.touched=[false,false];r.charge=0;for(const a of r.anchors)a.active=false;}
 }
}

function update(g,dt){
 const r=g.level.reality;
 if(!r||r.done||r.kind!=='gravity'||r.gravityTimer>0)return;
 const both=r.anchors.every((a,i)=>atPad(g.players[i],a));
 r.charge=both?r.charge+dt:0;
 if(both&&r.charge>=.45){
  r.charge=0;r.gravityTimer=14;r.touched=[false,false];
  for(const a of r.anchors)a.active=true;
 }
}

function complete(g){return g.level.reality?.done!==false;}
function snapshot(g){
 const r=g.level.reality;
 if(!r)return null;
 return {
  kind:r.kind,done:!!r.done,
  anchors:r.anchors.map(a=>!!a.active),
  window:Math.ceil(r.window*10)/10,
  charge:Math.min(1,r.charge/.45),
  gravityTimer:Math.ceil(r.gravityTimer*10)/10,
  touched:r.touched.slice()
 };
}
module.exports={init,onAbility,platforms,forces,afterStep,advance,update,complete,snapshot};

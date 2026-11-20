'use strict';
// Server-owned, co-operative checkpoints for the curated first act only.
// They are only earned when BOTH players reach safe walkable ground.
// Never teleport across an uncleared wall, gate, pressure bridge or boss.
const {GROUND}=require('./shared/stages');
const START=3,END=8;
const finite=x=>Number.isFinite(x);
const eligible=g=>g&&!g.customChallenge&&g.stage>=START&&g.stage<=END&&
  Array.isArray(g.level?.checkpoints)&&g.level.checkpoints.length>0;
function safeGround(level,x){
 return finite(x)&&level.floor.some(([a,b])=>x>=a+35&&x<=b-35)&&
  !level.hazards.some(h=>x>=h.x-55&&x<=h.x+h.w+55)&&
  !level.walls.some(w=>!w.broken&&x>=w.x-45&&x<=w.x+w.w+45)&&
  !level.gates.some(q=>!level.gateOpen&&x>=q.x-45&&x<=q.x+q.w+45);
}
function accessible(g,x){
 return safeGround(g.level,x)&&
  !g.level.walls.some(w=>!w.broken&&w.x<x)&&
  !g.level.bridges.some(b=>b.x+b.w<x&&
   ['pad','pad-crystal','crystal'].includes(g.level.bridgeTrigger)&&!g.level.bridgeLatched);
}
function init(g){
 if(eligible(g))g.quality={stage:g.stage,active:-1,recoveries:[0,0]};
 else g.quality=null;
}
function clean(g){
 if(!eligible(g)){g.quality=null;return;}
 const c=g.quality;
 if(!c||c.stage!==g.stage){init(g);return;}
 c.active=Number.isInteger(c.active)?Math.max(-1,Math.min(g.level.checkpoints.length-1,c.active)):-1;
 c.recoveries=Array.isArray(c.recoveries)&&c.recoveries.length===2?
  c.recoveries.map(n=>Number.isSafeInteger(n)?Math.max(0,Math.min(9999,n)):0):[0,0];
 // Only restore checkpoint indices located on currently valid safe ground.
 while(c.active>=0&&!accessible(g,g.level.checkpoints[c.active]))c.active--;
}
function advance(g){
 if(!eligible(g))return;
 clean(g);
 const cps=g.level.checkpoints,active=g.quality.active,next=active+1;
 if(next>=cps.length)return;
 const x=cps[next];
 if(!accessible(g,x))return;
 if(!g.players.every(p=>p.grounded&&p.x+15>x+24&&p.y+p.h>=GROUND-2))return;
 g.quality.active=next;
}
function recover(g,p){
 if(!eligible(g))return false;
 clean(g);
 const i=g.quality.active;
 if(i<0)return false;
 const x=g.level.checkpoints[i]+(p.type===0?-18:18);
 if(!safeGround(g.level,x))return false;
 p.x=x-15;p.y=GROUND-p.h;p.vx=0;p.vy=0;p.dash=0;p.grounded=true;
 p.coyote=0;p.jumpBuffer=0;
 g.quality.recoveries[p.type]++;
 return true;
}
function snapshot(g){
 if(!eligible(g))return null;
 clean(g);
 return {index:g.quality.active,x:g.quality.active>=0?g.level.checkpoints[g.quality.active]:null,
  available:g.level.checkpoints.length,recoveries:g.quality.recoveries.slice()};
}
module.exports={START,END,eligible,safeGround,init,clean,advance,recover,snapshot};

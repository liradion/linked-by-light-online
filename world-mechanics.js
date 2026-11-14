'use strict';
// Server-authoritative unique interactions of 11 worlds. All timings are
// evaluated on the fixed server tick, never on an individual player's browser.
const {GROUND}=require('./shared/stages');
const TAU=Math.PI*2;
const near=(p,x,y,dist)=>Math.hypot(p.x+15-x,p.y+21.5-y)<=dist;
const feetNear=(p,x,range=74)=>p.grounded&&Math.abs(p.x+15-x)<range&&Math.abs(p.y+p.h-GROUND)<18;
const bothNear=(g,x,distance=94)=>g.players.every(p=>near(p,x,GROUND-34,distance)&&p.grounded);
function initWorld(g){
 const s=g.level.signature;if(!s)return;
 s.elapsed=0;s.progress=0;s.hold=0;s.window=0;s.done=false;s.phase=0;s.flash=0;
 for(const n of s.nodes){n.active=false;n.hold=0;}
 for(const pair of s.pairs){pair.active=false;pair.hold=0;}
}
function activateNearest(g,p,mode,radius=116){
 const s=g.level.signature;
 let best=null,min=radius;
 for(const n of s.nodes){
  if(n.active||n.mode!==mode)continue;
  const dist=Math.hypot(p.x+15-n.x,p.y+21.5-n.y);
  if(dist<min){min=dist;best=n;}
 }
 if(best){best.active=true;return true;}return false;
}
function onAbility(g,p){
 const s=g.level.signature;if(!s)return;
 switch(s.kind){
  case 'forest':if(p.type===1)activateNearest(g,p,'seed',135);break;
  case 'constellation':if(p.type===1){
   let best=null,min=116;
   for(const n of s.nodes){const d=Math.hypot(p.x+15-n.x,p.y+21.5-n.y);if(d<min){best=n;min=d;}}
   if(best){if(best.order===s.progress+1&&!best.active){best.active=true;s.progress++;}
     else if(!best.active){s.progress=0;s.flash=.8;s.nodes.forEach(n=>n.active=false);}}
  }break;
  case 'prism':break;
  case 'city':break;
  case 'clock':if(p.type===1&&s.nodes.some(n=>near(p,n.x,n.y,143))){s.window=s.period;s.flash=.4;}break;
  case 'heart':break;
 }
 // Role-specific ability receivers for prism, city and the endgame core.
 if(['prism','city','heart'].includes(s.kind)){
  const pool=s.nodes.filter(n=>!n.active&&n.role===p.type&&
    (s.kind!=='heart'||n.mode!=='duo'));
  let target=null,dist=p.type===0?118:137;
  for(const n of pool){const d=Math.hypot(p.x+15-n.x,p.y+21.5-n.y);if(d<dist){target=n;dist=d;}}
  if(target){target.active=true;s.flash=.2;}
 }
}
function extraPlatforms(g){
 const s=g.level.signature;
 if(!s||!s.platforms?.length)return [];
 return s.platforms.filter(pl=>pl.linked<0||s.nodes[pl.linked]?.active).map(pl=>{
   let y=pl.y;
   if(pl.move==='tide')y+=Math.sin((s.elapsed/s.period)*TAU+pl.offset*.5)*27;
   if(pl.move==='lift')y-=30+Math.sin(s.elapsed*.85+pl.offset)*26;
   return {...pl,y,kind:'platform'};
 });
}
function extraBarriers(g){
 const s=g.level.signature;
 if(s?.kind==='clock'&&!s.done&&s.window<=0&&s.barrier)return [{...s.barrier,kind:'barrier'}];
 return [];
}
function worldForces(g,p,dt){
 const s=g.level.signature;if(!s)return;
 if(s.kind==='wind')for(const z of s.zones){
  if(p.x+p.w>z.x&&p.x<z.x+z.w&&p.y+p.h>z.y&&p.y<z.y+z.h){
   if(!p.grounded){p.vy=Math.max(-420,p.vy-z.force*dt*(p.type===1?1:.52));p.vx+=z.dir*115*dt;}
  }
 }
 if(s.kind==='river')for(const z of s.zones){
  if(p.x+p.w>z.x&&p.x<z.x+z.w&&p.y+p.h>z.y&&p.y<z.y+z.h)
   p.vx+=z.dir*(p.grounded?z.force*.34:z.force*.14)*dt;
 }
}
function advanceWorld(g,dt){
 const s=g.level.signature;if(!s||s.done)return;
 s.elapsed+=dt;s.flash=Math.max(0,s.flash-dt);
 if(s.kind==='tide')s.phase=(Math.sin(TAU*s.elapsed/s.period)+1)/2;
 if(s.kind==='clock')s.window=Math.max(0,s.window-dt);
}
function updateWorld(g,dt){
 const s=g.level.signature;if(!s||s.done)return;
 switch(s.kind){
  case 'flowers':
   for(const n of s.nodes)if(!n.active&&g.players.some(p=>p.type===n.role&&feetNear(p,n.x,68)))n.active=true;
   break;
  case 'tide':
   if(s.phase>.65)for(const n of s.nodes)if(!n.active&&g.players.some(p=>p.type===n.role&&feetNear(p,n.x,73)))n.active=true;
   break;
  case 'wind':
   for(const n of s.nodes)if(!n.active&&g.players.some(p=>near(p,n.x,n.y,57)))n.active=true;
   break;
  case 'river':
   for(const pair of s.pairs){
    if(pair.active)continue;
    if(feetNear(g.players[0],pair.x0,70)&&feetNear(g.players[1],pair.x1,70)){
      pair.hold+=dt;if(pair.hold>.38)pair.active=true;
    }else pair.hold=0;
   }break;
  case 'relay':{
    const pair=s.pairs.find(p=>!p.active);
    if(pair){const p0=g.players[0],p1=g.players[1];
      if(feetNear(p0,pair.x0,68)&&feetNear(p1,pair.x1,68)){
        pair.hold+=dt;if(pair.hold>.45)pair.active=true;
      }else pair.hold=0;
    }break;
   }
  case 'clock':
   if(s.window>0&&g.players.every(p=>p.x+15>s.barrier.x+65))s.done=true;
   break;
  case 'heart':
   for(const n of s.nodes)if(n.mode==='duo'&&!n.active){
     if(bothNear(g,n.x,91)){n.hold+=dt;if(n.hold>.35)n.active=true;}
     else n.hold=0;
   }break;
 }
 if(s.kind==='constellation')s.done=s.progress===s.nodes.length;
 else if(s.kind==='river'||s.kind==='relay')s.done=s.pairs.every(p=>p.active);
 else if(s.kind!=='clock')s.done=s.nodes.every(n=>n.active);
 if(s.done)s.flash=.8;
}
function complete(g){return g.level.signature?.done!==false;}
function worldSnapshot(g){
 const s=g.level.signature;if(!s)return null;
 return {nodes:s.nodes.map(n=>n.active),pairs:s.pairs.map(p=>p.active),progress:s.progress,
   done:s.done,phase:s.phase,window:Math.ceil(s.window*10)/10,elapsed:Math.round(s.elapsed*10)/10,flash:s.flash};
}
module.exports={initWorld,onAbility,extraPlatforms,extraBarriers,worldForces,advanceWorld,updateWorld,complete,worldSnapshot};
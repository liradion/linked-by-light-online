'use strict';
// Server-authoritative cooperative bonus. Both characters must actually use their
// distinct abilities near each other. The client cannot submit or grant resonance.
// Additive bond fields remain compatible with v11 persisted room snapshots.
const WINDOW=1.25,COOLDOWN=2.5,ACTIVE=4.5;
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function ensure(bond){
 if(!bond||typeof bond!=='object')return false;
 if(!Array.isArray(bond.syncWindow)||bond.syncWindow.length!==2)bond.syncWindow=[0,0];
 bond.syncWindow=bond.syncWindow.map(v=>Number.isFinite(v)?clamp(v,0,WINDOW):0);
 bond.syncCooldown=Number.isFinite(bond.syncCooldown)?clamp(bond.syncCooldown,0,COOLDOWN):0;
 bond.resonance=Number.isFinite(bond.resonance)?clamp(bond.resonance,0,ACTIVE):0;
 bond.syncs=Number.isSafeInteger(bond.syncs)&&bond.syncs>=0?Math.min(9999,bond.syncs):0;
 return true;
}
function ability(bond,role,players,solo=false){
 if(!ensure(bond)||solo||![0,1].includes(role)||!Array.isArray(players)||players.length<2)return false;
 const [a,b]=players;
 if(!a||!b||!Number.isFinite(a.x)||!Number.isFinite(b.x)||!Number.isFinite(a.y)||!Number.isFinite(b.y))return false;
 if(Math.abs(a.x-b.x)>225||Math.abs(a.y-b.y)>125)return false;
 const other=1-role;
 if(bond.syncCooldown<=0&&bond.syncWindow[other]>0){
  bond.syncWindow=[0,0];
  bond.syncCooldown=COOLDOWN;
  bond.resonance=ACTIVE;
  bond.syncs=Math.min(9999,bond.syncs+1);
  bond.power=clamp((Number.isFinite(bond.power)?bond.power:0)+.23,0,1);
  bond.shield=Math.max(Number.isFinite(bond.shield)?bond.shield:0,.72);
  return true;
 }
 if(bond.syncCooldown<=0)bond.syncWindow[role]=WINDOW;
 return false;
}
function advance(bond,dt){
 if(!ensure(bond)||!Number.isFinite(dt)||dt<=0)return;
 const step=Math.min(dt,.1);
 bond.syncWindow[0]=Math.max(0,bond.syncWindow[0]-step);
 bond.syncWindow[1]=Math.max(0,bond.syncWindow[1]-step);
 bond.syncCooldown=Math.max(0,bond.syncCooldown-step);
 bond.resonance=Math.max(0,bond.resonance-step);
}
module.exports={WINDOW,COOLDOWN,ACTIVE,ensure,ability,advance};

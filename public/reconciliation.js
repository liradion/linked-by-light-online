/* Client prediction with server-tick acknowledgements and collision-aware replay.
   This is visual prediction only: the server remains authoritative for gameplay. */
(function(root){'use strict';
const DT=1/60;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
function geometry(level,world){
 const r=(level.platforms||[]).map(x=>({...x}));
 for(const [a,b] of level.floor||[])r.push({x:a,y:544,w:b-a,h:180});
 const bridge=!!world?.bridgeLatched||level.bridgeTrigger==='always'||
 (level.bridgeTrigger==='crystal'&&world?.crystals?.length&&world.crystals.every(Boolean))||
 (level.bridgeTrigger==='pad'&&world?.padLatched)||
 (level.bridgeTrigger==='pad-crystal'&&world?.pads?.some(Boolean));
 if(bridge)r.push(...(level.bridges||[]).map(x=>({...x})));
 (level.walls||[]).forEach((w,i)=>{if(!world?.walls?.[i])r.push({...w});});
 if(!world?.gateOpen)r.push(...(level.gates||[]).map(x=>({...x})));
 return r;
}
function integrate(p,input,solids,width,dt=DT){
 const q={...p},axis=Number(!!input.right)-Number(!!input.left);
 if(axis)q.face=axis;
 q.cool=Math.max(0,(q.cool||0)-dt);q.abilityFx=Math.max(0,(q.abilityFx||0)-dt);
 if(input.jump&&((q.grounded||false)||(q.coyote||0)>0)){q.vy=-486;q.grounded=false;q.coyote=0;}
 if(input.ability&&q.cool<=0){if(q.type===0){q.dash=.22;q.cool=1;q.vy*=.2;}else{q.cool=1.05;q.abilityFx=.55;}}
 if(q.grounded)q.coyote=.11;else q.coyote=Math.max(0,(q.coyote||0)-dt);
 if(q.dash>0){q.dash=Math.max(0,q.dash-dt);q.vx=(q.face||1)*760;}
 else q.vx+=clamp(axis*273-q.vx,-2450*dt,2450*dt);
 q.vy=Math.min(950,q.vy+1300*dt);
 q.x+=q.vx*dt;
 for(const s of solids)if(overlaps(q,s)){
  if(q.vx>0)q.x=s.x-q.w;else if(q.vx<0)q.x=s.x+s.w;
  q.vx=0;q.dash=0;
 }
 q.x=clamp(q.x,5,width-q.w-5);
 q.y+=q.vy*dt;q.grounded=false;
 for(const s of solids)if(overlaps(q,s)){
  if(q.vy>=0&&q.y+q.h-s.y<Math.max(30,q.vy*dt+14)){q.y=s.y-q.h;q.vy=0;q.grounded=true;}
  else if(q.vy<0){q.y=s.y+s.h;q.vy=0;}
  else if(q.x+q.w/2<s.x+s.w/2)q.x=s.x-q.w;else q.x=s.x+s.w;
 }
 return q;
}
function createPredictor(){
 let history=[],baseline=null,state=null,stage=-1,appliedJump=0,appliedAbility=0,ackSeq=0,lastSent=null,renderJump=0,renderAbility=0;
 function reset(){history=[];baseline=null;state=null;stage=-1;appliedJump=0;appliedAbility=0;ackSeq=0;lastSent=null;renderJump=0;renderAbility=0;}
 function send(packet,at){
  if(!Number.isSafeInteger(packet.inputSeq))return;
  lastSent={seq:packet.inputSeq,at:Number(at)||0,left:!!packet.left,right:!!packet.right,
   jumpSeq:packet.jumpSeq||0,abilitySeq:packet.abilitySeq||0};
  history.push({seq:packet.inputSeq,at:Number(at)||0,left:!!packet.left,right:!!packet.right,
   jumpSeq:packet.jumpSeq||0,abilitySeq:packet.abilitySeq||0});
  if(history.length>96)history=history.slice(-96);
 }
 function reconcile(authoritative,ack,level,world,levelId,now,processed={},estimatedDelay=.10){
  if(!authoritative||!level)return null;
  if(levelId!==stage){if(stage!==-1)reset();stage=levelId;}
  ackSeq=Math.max(ackSeq,Number(ack)||0);
  appliedJump=Math.max(appliedJump,Number(processed.jumpSeq)||0);
  appliedAbility=Math.max(appliedAbility,Number(processed.abilitySeq)||0);
  history=history.filter(h=>h.seq>ackSeq);
  const solids=geometry(level,world);
  let p={...authoritative,type:authoritative.type??0,w:30,h:43};
  const horizon=clamp(estimatedDelay,0,.25);
  // Replay unacknowledged samples, each for a conservative maximum number of fixed steps.
  if(history.length){
   const first=history[0];let prev=first,used=0;
   for(const item of history){
    const elapsed=clamp((item.at-prev.at)/1000,0,.08);
    const steps=Math.min(5,Math.round(elapsed/DT));
    for(let n=0;n<steps&&used<24;n++,used++)p=integrate(p,{left:prev.left,right:prev.right},solids,level.width);
    const jump=item.jumpSeq>appliedJump,ability=item.abilitySeq>appliedAbility;
    if(jump||ability)p=integrate(p,{left:item.left,right:item.right,jump,ability},solids,level.width);
    appliedJump=Math.max(appliedJump,item.jumpSeq);appliedAbility=Math.max(appliedAbility,item.abilitySeq);
    prev=item;
   }
   const steps=Math.min(15,Math.round(horizon/DT));
   for(let n=0;n<steps&&used<24;n++,used++)p=integrate(p,{left:prev.left,right:prev.right},solids,level.width);
  }else if(lastSent){
   const steps=Math.round(horizon/DT);for(let n=0;n<steps;n++)p=integrate(p,{left:lastSent.left,right:lastSent.right},solids,level.width);
  }
  baseline=p;
  if(!state||Math.hypot(state.x-p.x,state.y-p.y)>170)state={...p};
  return p;
 }
 function display(dt,live={},level,world,estimatedDelay=.1){
  if(!baseline)return null;
  if(!state)state={...baseline};
  dt=clamp(Number(dt)||0,0,.05);
  if(level&&dt>0){
   const jump=(live.jumpSeq||0)>renderJump,ability=(live.abilitySeq||0)>renderAbility;
   renderJump=Math.max(renderJump,live.jumpSeq||0);renderAbility=Math.max(renderAbility,live.abilitySeq||0);
   state=integrate(state,{left:live.left,right:live.right,jump,ability},geometry(level,world),level.width,dt);
   // Never run too far ahead of the authoritative state if packets stall.
   const bound=clamp(273*estimatedDelay+45,45,160);
   state.x=clamp(state.x,baseline.x-bound,baseline.x+bound);
   state.y=clamp(state.y,baseline.y-125,baseline.y+125);
  }
  const gain=1-Math.exp(-dt*(live.left||live.right?6:14));
  state.x+=(baseline.x-state.x)*gain;
  state.y+=(baseline.y-state.y)*gain;
  return {...state};
 }
 return {send,reconcile,display,reset,pending:()=>history.length,ack:()=>ackSeq};
}
root.GameReconciliation={createPredictor,integrate,geometry,DT};
if(typeof module!=='undefined'&&module.exports)module.exports=root.GameReconciliation;
})(typeof window!=='undefined'?window:globalThis);
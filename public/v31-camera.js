/* Linked by Light v31 — camera and navigation feedback, client-only.
 * Rendered positions are visual hints. Physics/room ownership stay on server. */
(function(root,factory){
 'use strict';
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.GameV31Camera=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 let partner=null,goal=null;
 const english=()=>root.GameI18n?.isEnglish?.()===true;
 function targetCamera(players,role,worldWidth,viewport=1200){
  if(!Array.isArray(players)||!players[0]||!players[1]||!Number.isFinite(worldWidth))return 0;
  const a=players[0],b=players[1],separation=Math.abs(a.x-b.x);
  const own=[0,1].includes(role)?players[role]:null;
  const center=own&&separation>viewport*.66?own.x+15+(own.vx||0)*.075+
    (b.x>own.x?Math.min(120,(separation-viewport*.66)*.35):-Math.min(120,(separation-viewport*.66)*.35)):
    (a.x+b.x)/2+15+((a.vx||0)+(b.vx||0))*.04;
  return clamp(center-viewport*.5+65,0,Math.max(0,worldWidth-viewport));
 }
 function integrate(current,players,role,worldWidth,dt,options={}){
  const t=targetCamera(players,role,worldWidth);
  if(!Number.isFinite(current)||!Number.isFinite(dt)||dt<=0)return t;
  const gain=1-Math.exp(-clamp(dt,0,.1)*(options.reducedMotion?8:5.8));
  return current+(t-current)*gain;
 }
 function objective(level,world,role){
  if(!level||!world||![0,1].includes(role)||!Number.isInteger(level.challenge)||level.act!==1)return null;
  if(world.gateOpen)return {x:level.portal,kind:'portal'};
  const arcade=world.adventure?.arcade;
  const boss=world.adventure?.boss;
  if(boss?.active&&boss.hp>0)return {x:boss.x,kind:'boss'};
  if(arcade?.started&&!arcade.done){
   const x=arcade.kind==='sail'?arcade.boat:
    arcade.kind==='rhythm'?arcade.ringX+role*125:arcade.ringX;
   return {x,kind:arcade.kind};
  }
  const wall=level.walls?.find((w,i)=>!world.walls?.[i]);
  if(wall)return {x:wall.x,kind:'wall'};
  const crystal=level.crystals?.find((c,i)=>!world.crystals?.[i]);
  if(crystal)return {x:crystal.x,kind:'crystal'};
  if(level.puzzle?.pads&&!world.padLatched){
   const pad=level.pads?.find(p=>p.type===role&&!world.pads?.[level.pads.indexOf(p)]);
   if(pad)return {x:pad.x+pad.w/2,kind:'pad'};
  }
  if(!world.signature?.done){
   const node=level.signature?.nodes?.find((n,i)=>!world.signature.nodes?.[i]&&n.role===role);
   if(node)return {x:node.x,kind:'flower'};
  }
  return {x:level.gates?.[0]?.x||level.portal,kind:'gate'};
 }
 function init(){
  if(partner||!root.document)return;
  const frame=root.document.getElementById('frame');if(!frame)return;
  partner=root.document.createElement('div');partner.id='v31PartnerMarker';partner.className='v31-edge-marker';partner.hidden=true;
  partner.setAttribute('aria-hidden','true');
  goal=root.document.createElement('div');goal.id='v31ObjectiveMarker';goal.className='v31-edge-marker v31-edge-goal';goal.hidden=true;
  goal.setAttribute('aria-hidden','true');
  frame.append(partner,goal);
 }
 function directionMarker(el,x,camera,width,label){
  if(!el)return;
  const delta=x-camera;
  if(!Number.isFinite(delta)||delta>=38&&delta<=width-38){el.hidden=true;return;}
  const left=delta<38;
  el.hidden=false;el.classList.toggle('v31-left',left);el.classList.toggle('v31-right',!left);
  el.textContent=(left?'← ':'→ ')+label+' · '+Math.round(Math.max(0,left?-delta:delta-width))+'';
 }
 function frame(players,role,camera,width,level,world,solo=false){
  if(!partner)return;
  if(solo||![0,1].includes(role)||!Array.isArray(players)||!players[1-role]||!level){
   partner.hidden=true;goal.hidden=true;return;
  }
  const other=players[1-role];
  directionMarker(partner,other.x+15,camera,width,role===0?
    (english()?'Echo':'Эхо'):(english()?'Spark':'Искра'));
  const next=objective(level,world,role);
  directionMarker(goal,next?.x,camera,width,english()?'Goal':'Цель');
 }
 function draw(ctx,level,world,role,clock,settings={}){
  if(!ctx||!level||!world||!level.onboarding)return;
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  const checkpoint=world.checkpoint;
  for(let i=0;i<(level.checkpoints?.length||0);i++){
   const x=level.checkpoints[i],active=checkpoint?.index>=i;
   ctx.globalAlpha=active?.85:.33;
   ctx.fillStyle=active?'#a6ffe0':'#a9d5ff';
   ctx.font='bold 20px system-ui';
   ctx.fillText(active?'✦':'◇',x,510);
  }
  const next=objective(level,world,role);
  if(next){
   ctx.globalAlpha=.8;
   ctx.fillStyle='#ffefa7';
   ctx.shadowColor='#ffd788';ctx.shadowBlur=9;
   ctx.font='bold 22px system-ui';
   ctx.fillText('⌄',next.x,Math.max(375,420+(settings.reducedMotion?0:Math.sin(clock*3)*5)));
  }
  ctx.restore();
 }
 return Object.freeze({targetCamera,integrate,objective,init,frame,draw});
});

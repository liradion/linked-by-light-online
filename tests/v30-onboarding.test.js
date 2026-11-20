'use strict';
// Level Repair v30: test real server physics, not only puzzle flag manipulation.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createGame,initStage,tick,snapshot,updateInput}=require('../game-core');
const {stages,GROUND}=require('../shared/stages');
const GameHints=require('../public/game-hints');
const Predictor=require('../public/reconciliation.js');
const connected=[true,true];
const DT=1/60;
function frames(g,n){for(let i=0;i<n;i++)tick(g,connected);}
function inputController(){
 const counters={input:[0,0],jump:[0,0],ability:[0,0]};
 return (g,targets,{jumpGap=false,dash=false,pulse=false}={})=>{
  for(let role=0;role<2;role++){
   const p=g.players[role],target=targets[role];
   const distance=Number.isFinite(target)?target-(p.x+15):0;
   const right=distance>11,left=distance< -11;
   let jump=false;
   if(jumpGap&&g.stage===2&&p.grounded&&right&&p.x+p.w>=423&&p.x+p.w<477){
    jump=true;
   }
   let ability=false;
   if(dash&&role===0&&g.level.walls.some(w=>!w.broken)&&p.x+15>g.level.walls[0].x-62&&p.x+15<g.level.walls[0].x){
    ability=true;
   }
   if(pulse&&role===1&&g.level.crystals.some(c=>!c.on)&&
      Math.abs(p.x+15-g.level.crystals[0].x)<100&&p.cool<=0)ability=true;
   if(jump)counters.jump[role]++;
   if(ability)counters.ability[role]++;
   updateInput(g,role,{inputSeq:++counters.input[role],left,right,
     jumpSeq:counters.jump[role],abilitySeq:counters.ability[role]});
  }
  tick(g,connected);
 };
}
function travel(g,to,condition,maxTicks=1000,options={}){
 const input=options.input;
 for(let t=0;t<maxTicks;t++){
  input(g,to,options);
  if(condition(g))return t;
 }
 throw Error('Real-physics route stalled on stage '+g.stage+' after '+maxTicks+
  ' ticks: x='+g.players.map(p=>Math.round(p.x)).join(',')+
  ', gates='+g.level.gateOpen+', puzzle='+JSON.stringify({
   pads:g.level.pads.map(p=>p.pressed),wall:g.level.walls.map(w=>w.broken),
   crystals:g.level.crystals.map(c=>c.on)}));
}
test('v30: jump peak empirically exceeds redesigned basic ledges with a >= 20 unit margin',()=>{
 const g=createGame();g.phase='playing';const p=g.players[0];
 p.grounded=true;
 updateInput(g,0,{jumpSeq:1,inputSeq:1});
 let maxHeight=0;
 for(let i=0;i<50;i++){tick(g,connected);maxHeight=Math.max(maxHeight,GROUND-(p.y+p.h));}
 assert.ok(maxHeight>86&&maxHeight<88,'Jump physics accidentally changed: '+maxHeight);
 for(const [idx,l] of stages.entries()){
  for(const pl of l.platforms){
   assert.equal(pl.oneWay,true,'Stage '+idx+' static ledge must be one-way');
   const elevation=GROUND-pl.y;
   assert.ok(maxHeight-elevation>=20,'Stage '+idx+' ledge has insufficient jump margin: '+elevation);
   assert.ok(pl.y+pl.h<=GROUND-43,'Stage '+idx+' ledge overlaps a walking character at ground');
  }
 }
});
test('v30: all 99 base stages have geometrically usable static ledges and bridged or jumpable gaps',()=>{
 assert.equal(stages.length,99);
 for(const [index,l] of stages.entries()){
  assert.ok(l.floor.length>0,'Stage '+index+' has no ground');
  for(const pl of l.platforms){
   const usableGround=l.floor.some(([a,b])=>Math.min(pl.x+pl.w,b)-Math.max(pl.x,a)>=45);
   assert.ok(usableGround,'Stage '+index+' ledge lacks a valid ground approach: x='+pl.x);
  }
  for(let i=0;i<l.floor.length-1;i++){
   const [_,end]=l.floor[i],start=l.floor[i+1][0],gap=start-end;
   const bridge=l.bridges.some(b=>b.x<=end+1&&b.x+b.w>=start-1);
   assert.ok(gap>0,'Stage '+index+' broken floor segments');
   assert.ok(gap<=130||bridge,'Stage '+index+' has an unjumpable, unbridged gap: '+gap);
   if(gap>130)assert.equal(l.bridgeTrigger,'pad-crystal','Large gap must have an explicit enabling task');
  }
 }
});
test('v30: first three levels have no hidden flower completion gates',()=>{
 for(let stage=0;stage<3;stage++){
  const g=createGame();initStage(g,stage);
  assert.equal(g.level.signature.kind,'flowers');
  assert.equal(g.level.signature.tutorialOnly,true);
  assert.deepEqual(g.level.signature.nodes,[]);
  assert.equal(g.level.signature.done,true);
  assert.equal(g.level.signature.platforms.length,0);
  assert.ok(!g.level.signature.hint?.includes('обязательн'));
 }
 assert.equal(stages[2].walls.length,0);
 assert.equal(stages[2].crystals.length,0);
 assert.equal(stages[2].hazards.length,0);
 assert.equal(stages[2].floor[1][0]-stages[2].floor[0][1],95);
 assert.equal(stages[2].bridgeTrigger,'always');
 assert.equal(stages[3].signature.tutorialOnly,undefined,'Flower mechanics must become available in stage 4');
});
test('v30: server and client predictor agree that a character can jump through a basic ledge from directly below',()=>{
 const g=createGame();g.phase='playing';
 const ledge=g.level.platforms[0],p=g.players[0];
 p.x=ledge.x+ledge.w/2-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;
 let landed=false,minY=Infinity;
 let predicted={...p},geom=Predictor.geometry(g.level,snapshot(g,connected).world,0);
 for(let i=0;i<62;i++){
  if(i===0)updateInput(g,0,{jumpSeq:1,inputSeq:1});
  tick(g,connected);
  predicted=Predictor.integrate(predicted,{jump:i===0,left:false,right:false},geom,g.level.width,DT);
  minY=Math.min(minY,p.y);
  if(i>30&&p.grounded&&Math.abs(p.y-(ledge.y-p.h))<.5){landed=true;break;}
 }
 assert.ok(minY<ledge.y-43,'Player never passed through platform underside');
 assert.ok(landed,'Player could not land on the ledge after a valid jump');
 assert.ok(Math.abs(predicted.y-p.y)<1.1,'Client predictor diverged from server one-way geometry');
});
test('v30: both roles complete entire stage 1 by moving from actual spawn, not teleporting',()=>{
 const g=createGame();g.phase='playing';const input=inputController();
 const centers=g.level.pads.map(p=>p.x+p.w/2);
 travel(g,centers,x=>x.level.padLatched,800,{input});
 assert.equal(g.level.signature.done,true);
 assert.equal(g.level.gateOpen,true);
 travel(g,[g.level.portal,g.level.portal],x=>x.transition>0,750,{input});
 assert.ok(g.stats.elapsed<27,'Intro should not require prolonged exploration after mastering controls');
});
test('v30: stage 2 bridge can be crossed without a teleport or a stuck disappearing platform',()=>{
 const g=createGame();initStage(g,1);g.phase='playing';const input=inputController();
 const wall=g.level.walls[0],plate=g.level.pads[0],crystal=g.level.crystals[0];
 travel(g,[wall.x+150,320],x=>x.level.walls[0].broken,650,{input,dash:true});
 travel(g,[plate.x+plate.w/2,320],x=>x.level.pads[0].pressed,400,{input});
 travel(g,[plate.x+plate.w/2,crystal.x],x=>x.level.crystals[0].on,1000,{input,pulse:true});
 assert.equal(g.level.bridgeLatched,true,'Bridge must remain activated after Echo solves the crystal');
 assert.equal(g.level.gateOpen,true);
 travel(g,[g.level.portal,g.level.portal],x=>x.transition>0,900,{input});
});
test('v30: stage 3 short jump and co-op plate completion use real server movement',()=>{
 const g=createGame();initStage(g,2);g.phase='playing';const input=inputController();
 const pads=g.level.pads;
 travel(g,[pads[0].x+pads[0].w/2,pads[1].x+pads[1].w/2],
  x=>x.level.padLatched,1100,{input,jumpGap:true});
 assert.equal(g.level.gateOpen,true);
 assert.equal(g.stats.deaths,0,'Introductory gap should be safely traversable with normal jump timing');
 travel(g,[g.level.portal,g.level.portal],x=>x.transition>0,450,{input,jumpGap:true});
});
test('v30: adaptive assistance responds to no progress or repeated deaths, not active gameplay',()=>{
 const l=stages[0],role=0,world={gateOpen:false,pads:[false,false]};
 assert.equal(GameHints.adaptivePrompt(l,world,role,[],10,0),null);
 assert.match(GameHints.adaptivePrompt(l,world,role,[],25,0),/Искра/);
 assert.match(GameHints.adaptivePrompt(l,world,role,[],2,2),/Эхо/);
 assert.match(GameHints.adaptivePrompt(stages[1],world,role,[],30,0),/мост/);
 assert.match(GameHints.adaptivePrompt(stages[2],world,role,[{x:400},{x:500}],28,0),/прыжок|Прыг/);
 assert.equal(GameHints.adaptivePrompt(l,{gateOpen:true},role,[],200,5),null);
 assert.match(GameHints.adaptivePrompt(l,world,role,[],25,0,true),/Spark/);
 assert.equal(GameHints.progress(world),0);
 assert.equal(GameHints.progress({...world,padLatched:true}),4);
});

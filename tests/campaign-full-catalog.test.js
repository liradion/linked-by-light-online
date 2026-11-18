'use strict';
// Structural/runtime smoke over ALL official stages. Not an automated proof
// that an unassisted human can physically navigate every platform.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../game-core');
const main=require('../shared/stages');
const v20=require('../shared/v20-stages');
const v21=require('../shared/v21-stages');
const v23=require('../shared/v23-stages');
const connected=[true,true];
const registry=[...main.stages,main.BONUS_STAGE,...v20.stages,...v21.stages,...v23.stages];
function support(stage,x) {
 const onFloor=stage.floor.some(([a,b])=>x>=a+15&&x<=b-15);
 const onBridge=stage.bridges.some(b=>x>=b.x+15&&x<=b.x+b.w-15);
 return onFloor||onBridge;
}
function checkPositions(stage,index) {
 const groups=[
  ['spawn',stage.spawn],
  ['portal',[stage.portal]],
  ['pad',stage.pads.map(x=>x.x+x.w/2)],
  ['crystal',stage.crystals.map(x=>x.x)],
  ['signature',stage.signature?.nodes?.map(x=>x.x)||[]],
  ['reality',stage.reality?.anchors?.map(x=>x.x)||[]],
 ];
 for(const [type,points] of groups)
  for(const [i,x] of points.entries())
   assert.ok(support(stage,x),'Unsupported '+type+'['+i+'] at stage '+index+' / '+x);
}
test('137 authored stage layouts contain supported spawn, portal and interactable positions',()=>{
 assert.equal(registry.length,137);
 for(const [index,stage] of registry.entries()){
  checkPositions(stage,index);
  assert.ok(stage.portal>stage.gates[0].x,'Portal must be after gate at stage '+index);
  assert.ok(stage.spawn.every(x=>x<stage.gates[0].x),'Players must start before gate at stage '+index);
 }
});
test('every stage simulates live physics and snapshots for two connected players',()=>{
 for(let index=0;index<registry.length;index++){
  const game=core.createGame();core.initStage(game,index);game.phase='playing';
  for(let n=0;n<120;n++){
   if(n===45){core.updateInput(game,0,{right:true,inputSeq:1});core.updateInput(game,1,{right:true,inputSeq:1});}
   if(n===90){core.updateInput(game,0,{right:false,inputSeq:2});core.updateInput(game,1,{right:false,inputSeq:2});}
   assert.doesNotThrow(()=>core.tick(game,connected),'Physics failure stage '+index+' tick '+n);
  }
  const snap=core.snapshot(game,connected);
  assert.equal(snap.stage,index);
  assert.equal(snap.players.length,2);
  assert.ok(snap.players.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.vx)&&Number.isFinite(p.vy)),
    'NaN / Infinity in stage '+index);
  assert.ok(snap.world&&Array.isArray(snap.world.walls)&&Array.isArray(snap.world.pads));
  const elapsed=game.stats.elapsed;
  for(let i=0;i<30;i++)core.tick(game,[true,false]);
  assert.equal(game.stats.elapsed,elapsed,'Simulated time drift during guest disconnect at stage '+index);
 }
});
test('stage transition topology does not access missing levels or skip platform chapter boundaries',()=>{
 const expectedEnd=new Set([98,99,111,121,136]);
 for(let index=0;index<137;index++){
  const game=core.createGame();core.initStage(game,index);game.phase='playing';
  game.transition=1/120;core.tick(game,connected);
  if(expectedEnd.has(index)){assert.equal(game.phase,'win','Expected chapter end at '+index);assert.equal(game.stage,index);}
  else{assert.equal(game.stage,index+1,'Expected successive stage from '+index);assert.equal(game.phase,'playing');}
 }
});

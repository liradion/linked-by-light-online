'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createGame,initStage,tick,snapshot}=require('../game-core');
const v20=require('../v20-core'),v21=require('../v21-core');
test('all 122 story stage indices initialize, advance 60 Hz simulation and serialize safely',()=>{
 const failures=[],last=121;
 for(let stage=0;stage<=last;stage++){
  try{
   const game=createGame();initStage(game,stage);game.phase='playing';
   for(let i=0;i<15;i++)tick(game,[true,true]);
   const state=snapshot(game,[true,true]);
   assert.equal(state.stage,stage);
   assert.equal(game.players.length,2);
   assert.equal(state.players.length,2);
   assert.ok(game.level.width>700);
   assert.ok(Number.isFinite(game.level.portal));
   for(const p of state.players){
    assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
    assert.ok(p.x>=0&&p.x<=game.level.width);
   }
   const raw=JSON.stringify(state);
   assert.ok(raw.length<65000);
   assert.ok(!raw.includes('undefined'));
   if(v21.hasStage(stage))assert.ok(state.world.v21);
   else if(v20.hasStage(stage))assert.ok(state.world.v20);
  }catch(e){failures.push({stage:stage+1,error:String(e)});}
 }
 assert.deepEqual(failures,[]);
});
test('all 122 levels can restart deterministically and preserve stage bounds',()=>{
 for(let stage=0;stage<122;stage++){
  const game=createGame();initStage(game,stage);game.phase='playing';
  tick(game,[true,true]);initStage(game,stage);game.phase='playing';
  assert.equal(game.stage,stage);
  assert.equal(game.players.length,2);
  assert.equal(game.level.gateOpen,false);
 }
});

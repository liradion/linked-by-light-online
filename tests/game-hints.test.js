'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const GameHints=require('../public/game-hints');
const {stages,BONUS_STAGE}=require('../shared/stages');
const v20=require('../shared/v20-stages');
const v21=require('../shared/v21-stages');
const v23=require('../shared/v23-stages');
const {createGame,initStage,snapshot}=require('../game-core');
const all=[...stages,BONUS_STAGE,...v20.stages,...v21.stages,...v23.stages];
const connected=[true,true];

test('all 137 levels have readable non-empty hints for both hero roles',()=>{
 assert.equal(all.length,137);
 for(let index=0;index<all.length;index++){
  const g=createGame();initStage(g,index);
  const world=snapshot(g,connected).world;
  for(const role of [0,1]){
   for(const depth of [1,2]){
    const result=GameHints.hint(g.level,world,role,depth);
    assert.equal(typeof result,'string','Stage '+index+' role '+role);
    assert.ok(result.trim().length>=15,'Insufficient hint for stage '+index);
    assert.ok(!result.includes('undefined')&&!result.includes('null'),
      'Broken interpolation in stage '+index+' / role '+role);
   }
  }
 }
});
test('initial hint reveals stage objective; second hint explains role-specific next action',()=>{
 const g=createGame();initStage(g,0);
 const world=snapshot(g,connected).world;
 assert.equal(GameHints.hint(g.level,world,0,1),g.level.objective);
 assert.match(GameHints.hint(g.level,world,0,2),/оранжевую плиту/);
 assert.match(GameHints.hint(g.level,world,1,2),/голубую плиту/);
 initStage(g,1);
 const wall=snapshot(g,connected).world;
 assert.match(GameHints.hint(g.level,wall,0,2),/светящейся стене/);
 assert.match(GameHints.hint(g.level,wall,1,2),/Искра должна/);
});
test('specific boss attack turn and each arcade variant are described without spoilers to one role',()=>{
 const g=createGame();initStage(g,8);
 const world=snapshot(g,connected).world;
 world.adventure.boss.active=true;
 world.adventure.boss.next=0;
 assert.match(GameHints.hint(g.level,world,0,2),/ваша очередь атаковать/);
 assert.match(GameHints.hint(g.level,world,1,2),/Искра/);
 for(const kind of ['chase','flight','rhythm','sail']){
  const nextWorld={gateOpen:false,adventure:{boss:null,arcade:{kind,started:true,done:false}}};
  for(const role of [0,1])assert.ok(GameHints.hint(g.level,nextWorld,role,2).length>30);
 }
 assert.match(GameHints.hint(g.level,{gateOpen:true},0,2),/порталу/);
});
test('hint engine is side effect-free on stage and snapshot',()=>{
 const g=createGame();initStage(g,76);
 const before=JSON.stringify({stage:g.level,world:snapshot(g,connected).world});
 const world=snapshot(g,connected).world;
 for(let i=0;i<5;i++)GameHints.hint(g.level,world,i%2,i%2+1);
 assert.equal(JSON.stringify({stage:g.level,world:snapshot(g,connected).world}),before);
});

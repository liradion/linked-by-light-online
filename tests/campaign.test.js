'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {stages,GROUND,ACTS}=require('../shared/stages');
const {createGame,initStage,tick,snapshot,bridgeActive}=require('../game-core');
const online=[true,true];
function onFloor(stage,x){
  return stage.floor.some(([left,right])=>x>=left&&x<=right);
}
test('exactly 99 reproducible levels, 11 acts, unique names',()=>{
  assert.equal(stages.length,99);assert.equal(ACTS.length,11);
  assert.equal(new Set(stages.map(s=>s.title)).size,99);
  stages.forEach((s,i)=>{
    assert.equal(s.act,Math.floor(i/9)+1);
    assert.ok(s.width>1200);
    assert.ok(s.hint?.length>5);
  });
});
test('every route has accessible players, puzzle nodes and portal',()=>{
  for(const [i,s] of stages.entries()){
    for(const x of s.spawn)assert.ok(onFloor(s,x+15),`stage ${i+1}: spawn on pit`);
    for(const pad of s.pads)assert.ok(onFloor(s,pad.x+pad.w/2),`stage ${i+1}: plate on pit`);
    for(const crystal of s.crystals)assert.ok(onFloor(s,crystal.x),`stage ${i+1}: crystal on pit`);
    for(const wall of s.walls)assert.ok(onFloor(s,wall.x),`stage ${i+1}: wall on pit`);
    for(const spike of s.hazards)assert.ok(onFloor(s,spike.x+spike.w/2),`stage ${i+1}: spike on pit`);
    assert.ok(onFloor(s,s.portal),`stage ${i+1}: portal on pit`);
    const lastDevice=Math.max(0,...s.pads.map(p=>p.x+p.w),...s.crystals.map(c=>c.x),...s.walls.map(w=>w.x+w.w));
    assert.ok(s.gates[0].x>lastDevice,`stage ${i+1}: exit gate before puzzle`);
    for(let n=0;n<s.floor.length-1;n++){
      const end=s.floor[n][1],start=s.floor[n+1][0];
      const bridged=s.bridges.some(b=>b.x<=end&&b.x+b.w>=start);
      // Full jump travels about 200 world units at speed 273 (0.75 s flight).
      assert.ok(start-end<=175||bridged,`stage ${i+1}: inaccessible gap`);
    }
  }
});
test('all 99 cooperative objective chains can open the exit',()=>{
  for(let i=0;i<stages.length;i++){
    const game=createGame();initStage(game,i);game.phase='playing';
    for(const wall of game.level.walls)wall.broken=true;
    if(game.level.bridgeTrigger==='pad-crystal'){
      const plate=game.level.pads[0];
      game.players[0].x=plate.x+plate.w/2-15;
      game.players[0].y=GROUND-43;
      for(let f=0;f<20;f++)tick(game,online);
      assert.equal(bridgeActive(game),true,`stage ${i+1}: Spark plate must power bridge`);
    }
    for(const crystal of game.level.crystals)crystal.on=true;
    if(game.level.puzzle?.pads){
      for(const plate of game.level.pads){
        const p=game.players[plate.type];
        p.x=plate.x+plate.w/2-15;p.y=GROUND-43;
        p.vx=0;p.vy=0;p.grounded=true;
      }
      for(let f=0;f<20;f++)tick(game,online);
    }
    for(let f=0;f<20;f++)tick(game,online);
    assert.equal(game.level.gateOpen,true,`stage ${i+1} should open gate`);
    if(game.level.bridges.length&&game.level.bridgeTrigger!=='none')
      assert.equal(bridgeActive(game),true,`stage ${i+1}: required bridge must stay active`);
    assert.equal(snapshot(game,online).stage,i);
  }
});
test('level 99 ends in victory for both players, not a missing stage',()=>{
  const g=createGame();initStage(g,98);g.phase='playing';g.level.gateOpen=true;
  for(const p of g.players){p.x=g.level.portal-15;p.y=GROUND-43;p.vx=0;p.vy=0;p.grounded=true;}
  for(let i=0;i<120;i++)tick(g,online);
  assert.equal(g.phase,'win');assert.equal(g.stage,98);
});
test('simulation still pauses when remote player is disconnected',()=>{
  const g=createGame();initStage(g,65);g.phase='playing';
  const x=g.players[0].x;
  g.input[0].right=true;
  for(let i=0;i<40;i++)tick(g,[true,false]);
  assert.equal(g.players[0].x,x);
});

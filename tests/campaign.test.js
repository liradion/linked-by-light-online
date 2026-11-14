'use strict';
const test=require('node:test');const assert=require('node:assert/strict');
const {stages,GROUND,ACTS}=require('../shared/stages');
const {createGame,initStage,tick,snapshot,bridgeActive}=require('../game-core');
const connected=[true,true];
function onFloor(stage,x){return stage.floor.some(([a,b])=>x>=a&&x<=b);}
test('99 deterministic missions, 11 acts and 99 distinct titles',()=>{
 assert.equal(stages.length,99);assert.equal(ACTS.length,11);
 assert.equal(new Set(stages.map(s=>s.title)).size,99);
 for(const [i,s] of stages.entries()){
  assert.equal(s.act,Math.floor(i/9)+1);
  assert.ok(s.width>1200);assert.ok(s.signature?.hint.length>10);
 }
});
test('all levels have walkable routes, usable plates and reachable portals',()=>{
 for(const [i,l] of stages.entries()){
  for(const x of l.spawn)assert.ok(onFloor(l,x+15),`spawn level ${i+1}`);
  for(const pad of l.pads)assert.ok(onFloor(l,pad.x+pad.w/2),`plate level ${i+1}`);
  for(const c of l.crystals)assert.ok(onFloor(l,c.x),`crystal level ${i+1}`);
  assert.ok(onFloor(l,l.portal),`portal level ${i+1}`);
  const last=Math.max(0,...l.pads.map(p=>p.x+p.w),...l.crystals.map(c=>c.x),...l.walls.map(w=>w.x+w.w));
  assert.ok(l.gates[0].x>last,`exit must be after puzzle ${i+1}`);
  for(let k=0;k<l.floor.length-1;k++){
   const end=l.floor[k][1],start=l.floor[k+1][0];
   assert.ok(start-end<=175||l.bridges.some(b=>b.x<=end&&b.x+b.w>=start),`gap ${i+1}`);
  }
 }
});
test('normal switches must combine with the world-specific objective',()=>{
 for(let i=0;i<99;i++){
  const g=createGame();initStage(g,i);g.phase='playing';
  for(const wall of g.level.walls)wall.broken=true;
  for(const crystal of g.level.crystals)crystal.on=true;
  for(const pad of g.level.pads){const p=g.players[pad.type];p.x=pad.x+pad.w/2-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;}
  for(let j=0;j<22;j++)tick(g,connected);
  assert.equal(g.level.gateOpen,false,`level ${i+1} should require signature too`);
  g.level.signature.done=true;
  if(g.adventure.boss)g.adventure.boss.hp=0;
  if(g.adventure.arcade)g.adventure.arcade.done=true;
  for(let j=0;j<16;j++)tick(g,connected);
  assert.equal(g.level.gateOpen,true,`level ${i+1} opens after signature`);
 }
});
test('game transitions from a resumed stage to its successor',()=>{
 const g=createGame();initStage(g,61);g.phase='playing';g.level.gateOpen=true;
 for(const p of g.players){p.x=g.level.portal-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;}
 for(let n=0;n<125;n++)tick(g,connected);
 assert.equal(g.stage,62);assert.equal(g.phase,'playing');
});
test('99th stage completes with the same victory for both players',()=>{
 const g=createGame();initStage(g,98);g.phase='playing';g.level.gateOpen=true;
 for(const p of g.players){p.x=g.level.portal-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;}
 for(let n=0;n<125;n++)tick(g,connected);
 assert.equal(g.stage,98);assert.equal(g.phase,'win');
});
test('a disconnected partner freezes the simulation without losing room state',()=>{
 const g=createGame();initStage(g,45);g.phase='playing';
 const before=snapshot(g,connected).players;const elapsed=g.level.signature.elapsed;
 g.input[0].right=true;
 for(let n=0;n<40;n++)tick(g,[true,false]);
 assert.deepEqual(snapshot(g,[true,false]).players,before);
 assert.equal(g.level.signature.elapsed,elapsed);
});
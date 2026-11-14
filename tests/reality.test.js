'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {GROUND,stages}=require('../shared/stages');
const game=require('../game-core');
const reality=require('../reality-core');
const {geometry,integrate}=require('../public/reconciliation');
const ONLINE=[true,true];
const make=i=>{const g=game.createGame();game.initStage(g,i);g.phase='playing';return g;};
function at(g,role,a){
 const p=g.players[role];p.x=a.x-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;p.cool=0;return p;
}
function ability(g,role,seq=1){
 game.updateInput(g,role,{abilitySeq:seq});game.tick(g,ONLINE);
}
function tick(g,count){for(let i=0;i<count;i++)game.tick(g,ONLINE);}
test('thirty campaign stages introduce three deterministic dual-reality modes',()=>{
 const chosen=stages.map((s,i)=>({s,i})).filter(x=>x.s.reality);
 assert.equal(chosen.length,30);
 assert.deepEqual(new Set(chosen.map(x=>x.s.reality.kind)),new Set(['mirror','chronicle','gravity']));
 for(const {s,i} of chosen){
  assert.ok(i>=9&&[2,4,6].includes(i%9));
  const r=s.reality;assert.equal(r.anchors.length,2);
  for(const a of r.anchors){
   assert.ok(s.floor.some(([x,y])=>a.x>=x+30&&a.x<=y-30),'anchor over pit '+i);
   assert.ok(s.hazards.every(h=>a.x<h.x-20||a.x>h.x+h.w+20),'anchor overlaps hazard '+i);
  }
  if(r.kind==='gravity'){
   assert.ok(s.floor.some(([a,b])=>r.core.x>=a+30&&r.core.x<=b-30),'core over pit '+i);
  }
 }
 assert.equal(stages.slice(0,9).some(x=>x.reality),false);
});
test('mirror platforms only solid to their owner and each hero must trigger their own anchor',()=>{
 const g=make(11),r=g.level.reality;assert.equal(r.kind,'mirror');
 assert.deepEqual(reality.platforms(g,0),[]);assert.deepEqual(reality.platforms(g,1),[]);
 at(g,0,r.anchors[0]);ability(g,0,1);
 assert.equal(r.anchors[0].active,true);assert.equal(r.done,false);
 assert.equal(reality.platforms(g,0).length,1);assert.equal(reality.platforms(g,1).length,0);
 const world=game.snapshot(g,ONLINE).world;
 assert.ok(geometry(g.level,world,0).some(x=>x.x===r.platforms[0].x));
 assert.ok(!geometry(g.level,world,1).some(x=>x.x===r.platforms[0].x&&x.y===r.platforms[0].y));
 at(g,1,r.anchors[1]);ability(g,1,1);
 assert.equal(r.done,true);
 assert.equal(game.snapshot(g,ONLINE).world.reality.done,true);
});
test('chronicle needs both roles in the right order within 12 seconds',()=>{
 const g=make(13),r=g.level.reality;assert.equal(r.kind,'chronicle');
 at(g,1,r.anchors[1]);ability(g,1,1);assert.equal(r.done,false);
 at(g,0,r.anchors[0]);ability(g,0,1);
 assert.ok(r.window>0);
 for(let i=0;i<730;i++)game.tick(g,ONLINE);
 assert.equal(r.window,0);assert.equal(r.done,false);
 at(g,1,r.anchors[1]);ability(g,1,2);assert.equal(r.done,false);
 at(g,0,r.anchors[0]);ability(g,0,2);
 at(g,1,r.anchors[1]);ability(g,1,3);
 assert.equal(r.done,true);assert.equal(r.anchors.every(a=>a.active),true);
});
test('antigravity requires both pads and both characters reaching elevated core',()=>{
 const g=make(15),r=g.level.reality;assert.equal(r.kind,'gravity');
 at(g,0,r.anchors[0]);tick(g,45);
 assert.equal(r.gravityTimer,0,'solo activation forbidden');
 at(g,1,r.anchors[1]);tick(g,45);
 assert.ok(r.gravityTimer>12,'both roles charged anti-gravity');
 const core=r.core;
 // Check that the force genuinely changes the player's trajectory.
 const p={x:core.x-15,y:GROUND-43,w:30,h:43,vx:0,vy:-486,grounded:false,type:0};
 const low=integrate(p,{},[],g.level.width,1/60,480);
 const normal=integrate(p,{},[],g.level.width,1/60,1300);
 assert.ok(low.vy<normal.vy);
 for(let role=0;role<2;role++){
  const q=g.players[role];q.x=core.x-15;q.y=core.y-22;q.vx=q.vy=0;q.grounded=false;
 }
 tick(g,2);assert.equal(r.done,true);assert.deepEqual(r.touched,[true,true]);
});
test('gate remains closed until reality AND normal world puzzles are solved',()=>{
 const g=make(11),r=g.level.reality;g.level.signature.done=true;
 for(const wall of g.level.walls)wall.broken=true;
 for(const crystal of g.level.crystals)crystal.on=true;
 for(const pad of g.level.pads)pad.pressed=true;
 g.level.padLatched=true;if(g.adventure.boss)g.adventure.boss.hp=0;
 if(g.adventure.arcade)g.adventure.arcade.done=true;
 tick(g,2);assert.equal(g.level.gateOpen,false);
 r.done=true;tick(g,2);assert.equal(g.level.gateOpen,true);
});
test('reality timers and movement stop while partner disconnected',()=>{
 const g=make(13),r=g.level.reality;
 at(g,0,r.anchors[0]);ability(g,0,1);const before=r.window;
 for(let i=0;i<500;i++)game.tick(g,[true,false]);
 assert.equal(r.window,before);
 assert.equal(game.snapshot(g,[true,false]).world.reality.window,Math.ceil(before*10)/10);
});

test('all ten antigravity cores are reachable by an actual boosted jump',()=>{
 for(let i=0;i<stages.length;i++){
  if(stages[i].reality?.kind!=='gravity')continue;
  const g=make(i),r=g.level.reality; r.gravityTimer=14;
  const p=g.players[0];p.x=r.core.x-15;p.y=GROUND-43;p.vx=p.vy=0;p.grounded=true;
  g.players[1].x=r.anchors[1].x-15;g.players[1].y=GROUND-43;
  g.input[0].jumpQueued=true;
  for(let t=0;t<130&&!r.touched[0];t++)game.tick(g,ONLINE);
  assert.equal(r.touched[0],true,'boosted jump could not reach core on level '+(i+1));
 }
});
